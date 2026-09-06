const pool = require('../config/db');

const acceptTicket = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { ticketId } = req.params;
    const orgAdminId = req.user.user_id;

    /*
     * Find the organization belonging to this org_admin.
     */
    const [organizations] = await connection.query(
      `SELECT org_id
       FROM organizations
       WHERE org_admin_id = ?
       FOR UPDATE`,
      [orgAdminId]
    );

    if (organizations.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: 'Organization not found for this org_admin'
      });
    }

    const orgId = organizations[0].org_id;

    /*
     * Lock the ticket row.
     *
     * This is the critical concurrency-control step.
     */
    const [tickets] = await connection.query(
      `SELECT
        ticket_id,
        preferred_date_from,
        preferred_date_to,
        status
       FROM tickets
       WHERE ticket_id = ?
       FOR UPDATE`,
      [ticketId]
    );

    if (tickets.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    const ticket = tickets[0];

    /*
     * Only a matched ticket can be accepted.
     *
     * If another organization already accepted it,
     * the status will no longer be "matched".
     */
    if (ticket.status !== 'matched') {
      await connection.rollback();

      return res.status(409).json({
        success: false,
        message: 'Ticket is no longer available for acceptance'
      });
    }

    /*
     * Verify that this organization was actually notified.
     */
    const [notifications] = await connection.query(
      `SELECT
        notif_id,
        status
       FROM ticket_notifications
       WHERE ticket_id = ?
         AND org_id = ?
       FOR UPDATE`,
      [ticketId, orgId]
    );

    if (notifications.length === 0) {
      await connection.rollback();

      return res.status(403).json({
        success: false,
        message: 'This organization was not notified for this ticket'
      });
    }

    if (notifications[0].status !== 'notified') {
      await connection.rollback();

      return res.status(409).json({
        success: false,
        message: 'This ticket notification is no longer available'
      });
    }

    /*
     * Accept this organization's notification.
     */
    await connection.query(
      `UPDATE ticket_notifications
       SET status = 'accepted',
           responded_at = CURRENT_TIMESTAMP
       WHERE notif_id = ?`,
      [notifications[0].notif_id]
    );

    /*
     * Expire all competing organization notifications.
     */
    await connection.query(
      `UPDATE ticket_notifications
       SET status = 'expired',
           responded_at = CURRENT_TIMESTAMP
       WHERE ticket_id = ?
         AND notif_id <> ?
         AND status = 'notified'`,
      [ticketId, notifications[0].notif_id]
    );

    /*
     * Mark the ticket as accepted.
     */
    await connection.query(
      `UPDATE tickets
       SET status = 'accepted'
       WHERE ticket_id = ?`,
      [ticketId]
    );

    /*
     * Create the camp using the ticket's preferred date range.
     */
    const [campResult] = await connection.query(
      `INSERT INTO camps
        (
          ticket_id,
          org_id,
          start_date,
          end_date,
          status
        )
       VALUES (?, ?, ?, ?, 'planned')`,
      [
        ticketId,
        orgId,
        ticket.preferred_date_from,
        ticket.preferred_date_to
      ]
    );

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Ticket accepted and camp created successfully',
      camp: {
        camp_id: campResult.insertId,
        ticket_id: Number(ticketId),
        org_id: orgId,
        start_date: ticket.preferred_date_from,
        end_date: ticket.preferred_date_to,
        status: 'planned'
      }
    });
  } catch (error) {
    await connection.rollback();

    console.error('Ticket acceptance error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Ticket acceptance failed'
    });
  } finally {
    connection.release();
  }
};

module.exports = {
  acceptTicket
};