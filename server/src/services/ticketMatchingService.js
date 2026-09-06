const pool = require('../config/db');

const MATCHING_RADIUS_KM = 50;

const findAndNotifyNearbyOrganizations = async (ticketId) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [organizations] = await connection.query(
      `SELECT
        o.org_id,
        ST_Distance_Sphere(
          o.location,
          t.gps_location
        ) / 1000 AS distance_km
       FROM organizations o
       INNER JOIN tickets t
         ON t.ticket_id = ?
       WHERE ST_Distance_Sphere(
         o.location,
         t.gps_location
       ) / 1000 <= ?
       ORDER BY distance_km ASC`,
      [ticketId, MATCHING_RADIUS_KM]
    );

    const notifiedOrganizations = [];

    for (const organization of organizations) {
      const [existingNotification] = await connection.query(
        `SELECT notif_id
         FROM ticket_notifications
         WHERE ticket_id = ?
           AND org_id = ?`,
        [ticketId, organization.org_id]
      );

      if (existingNotification.length > 0) {
        continue;
      }

      await connection.query(
        `INSERT INTO ticket_notifications
          (
            ticket_id,
            org_id,
            distance_km,
            status
          )
         VALUES (?, ?, ?, 'notified')`,
        [
          ticketId,
          organization.org_id,
          Number(organization.distance_km.toFixed(2))
        ]
      );

      notifiedOrganizations.push({
        org_id: organization.org_id,
        distance_km: Number(organization.distance_km.toFixed(2))
      });
    }

    if (notifiedOrganizations.length > 0) {
      await connection.query(
        `UPDATE tickets
         SET status = 'matched'
         WHERE ticket_id = ?
           AND status = 'open'`,
        [ticketId]
      );
    }

    await connection.commit();

    return {
      matched: notifiedOrganizations.length > 0,
      organizations: notifiedOrganizations
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  findAndNotifyNearbyOrganizations
};