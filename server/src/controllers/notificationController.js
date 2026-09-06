const pool = require('../config/db');

const getMyNotifications = async (req, res) => {
  try {
    const [notifications] = await pool.query(
    `SELECT
        tn.notif_id,
        tn.ticket_id,
        tn.org_id,
        tn.distance_km,
        tn.status,
        tn.notified_at,
        tn.responded_at,
        t.pincode,
        t.expected_patient_count,
        t.health_focus_area,
        t.preferred_date_from,
        t.preferred_date_to,
        t.urgency,
        t.village_head_consent,
        t.venue_available,
        t.venue_type,
        t.local_contact_name,
        t.local_contact_phone,
        o.name AS organization_name,
        o.type AS organization_type
    FROM ticket_notifications tn
    INNER JOIN tickets t
        ON t.ticket_id = tn.ticket_id
    INNER JOIN organizations o
        ON o.org_id = tn.org_id
    WHERE o.org_admin_id = ?
        AND tn.status = 'notified'
    ORDER BY tn.notified_at DESC`,
    [req.user.user_id]
    );

    res.json({
      success: true,
      notifications
    });
  } catch (error) {
    console.error('Notification fetch error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications'
    });
  }
};

module.exports = {
  getMyNotifications
};