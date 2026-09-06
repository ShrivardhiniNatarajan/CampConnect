const pool = require('../config/db');

const acceptNotification = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const orgAdminId = req.user.user_id;

    // Find the notification and verify that it belongs
    // to the organization controlled by this org_admin.
    const [notifications] = await connection.query(
      `SELECT
        tn.notif_id,
        tn.ticket_id,
        tn.org_id,
        tn.status
       FROM ticket_notifications tn
       INNER JOIN organizations o
         ON o.org_id = tn.org_id
       WHERE tn.notif_id = ?
         AND o.org_admin_id = ?
       FOR UPDATE`,
      [id, orgAdminId]
    );

    if (notifications.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: 'Notification not found for this organization'
      });
    }

    const notification = notifications[0];

    // Critical concurrency lock:
    // only one organization can successfully accept a matched ticket.
    const [tickets] = await connection.query(
      `SELECT
        ticket_id,
        preferred_date_from,
        preferred_date_to,
        status
       FROM tickets
       WHERE ticket_id = ?
       FOR UPDATE`,
      [notification.ticket_id]
    );

    if (tickets.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    const ticket = tickets[0];

    if (ticket.status !== 'matched') {
      await connection.rollback();

      return res.status(409).json({
        success: false,
        message: 'Ticket is no longer available for acceptance'
      });
    }

    if (notification.status !== 'notified') {
      await connection.rollback();

      return res.status(409).json({
        success: false,
        message: 'This notification is no longer available'
      });
    }

    // Accept the winning notification.
    await connection.query(
      `UPDATE ticket_notifications
       SET status = 'accepted',
           responded_at = CURRENT_TIMESTAMP
       WHERE notif_id = ?`,
      [notification.notif_id]
    );

    // Expire all other pending notifications.
    await connection.query(
      `UPDATE ticket_notifications
       SET status = 'expired',
           responded_at = CURRENT_TIMESTAMP
       WHERE ticket_id = ?
         AND notif_id <> ?
         AND status = 'notified'`,
      [notification.ticket_id, notification.notif_id]
    );

    // Mark the ticket accepted.
    await connection.query(
      `UPDATE tickets
       SET status = 'accepted'
       WHERE ticket_id = ?`,
      [notification.ticket_id]
    );

    // Create the camp.
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
        notification.ticket_id,
        notification.org_id,
        ticket.preferred_date_from,
        ticket.preferred_date_to
      ]
    );

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: 'Notification accepted and camp created successfully',
      camp: {
        camp_id: campResult.insertId,
        ticket_id: notification.ticket_id,
        org_id: notification.org_id,
        start_date: ticket.preferred_date_from,
        end_date: ticket.preferred_date_to,
        status: 'planned'
      }
    });
  } catch (error) {
    await connection.rollback();

    console.error('Notification acceptance error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Notification acceptance failed'
    });
  } finally {
    connection.release();
  }
};

const rejectNotification = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const orgAdminId = req.user.user_id;

    // Find and lock the notification belonging to this organization.
    const [notifications] = await connection.query(
      `SELECT
        tn.notif_id,
        tn.ticket_id,
        tn.status
       FROM ticket_notifications tn
       INNER JOIN organizations o
         ON o.org_id = tn.org_id
       WHERE tn.notif_id = ?
         AND o.org_admin_id = ?
       FOR UPDATE`,
      [id, orgAdminId]
    );

    if (notifications.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: 'Notification not found for this organization'
      });
    }

    const notification = notifications[0];

    // Lock the ticket before changing notification/ticket state.
    const [tickets] = await connection.query(
      `SELECT ticket_id, status
       FROM tickets
       WHERE ticket_id = ?
       FOR UPDATE`,
      [notification.ticket_id]
    );

    if (tickets.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    const ticket = tickets[0];

    if (ticket.status !== 'matched') {
      await connection.rollback();

      return res.status(409).json({
        success: false,
        message: 'Ticket is no longer available for rejection'
      });
    }

    if (notification.status !== 'notified') {
      await connection.rollback();

      return res.status(409).json({
        success: false,
        message: 'This notification is no longer available'
      });
    }

    await connection.query(
      `UPDATE ticket_notifications
       SET status = 'rejected',
           responded_at = CURRENT_TIMESTAMP
       WHERE notif_id = ?`,
      [notification.notif_id]
    );

    // If no organizations remain to respond, mark the ticket
    // as rejected_all.
    const [remainingNotifications] = await connection.query(
      `SELECT notif_id
       FROM ticket_notifications
       WHERE ticket_id = ?
         AND status = 'notified'
       LIMIT 1`,
      [notification.ticket_id]
    );

    if (remainingNotifications.length === 0) {
      await connection.query(
        `UPDATE tickets
         SET status = 'rejected_all'
         WHERE ticket_id = ?`,
        [notification.ticket_id]
      );
    }

    await connection.commit();

    return res.json({
      success: true,
      message: 'Notification rejected successfully'
    });
  } catch (error) {
    await connection.rollback();

    console.error('Notification rejection error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Notification rejection failed'
    });
  } finally {
    connection.release();
  }
};

module.exports = {
  acceptNotification,
  rejectNotification
};