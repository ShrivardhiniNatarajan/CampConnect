const pool = require('../config/db');
const {
  inMemoryCamps,
  inMemoryTickets,
  inMemoryOrganizations,
  getInMemoryFundableCamps,
  getInMemoryOrgCamps
} = require('../services/inMemoryStore');
const { isDbOffline } = require('../utils/dbFallback');

const getFundableCamps = async (req, res) => {
  try {
    const [camps] = await pool.query(
      `SELECT
        c.camp_id,
        c.ticket_id,
        c.org_id,
        c.start_date,
        c.end_date,
        c.status AS camp_status,
        o.name AS organization_name,
        o.type AS organization_type,
        t.pincode,
        t.expected_patient_count,
        t.health_focus_area,
        t.preferred_date_from,
        t.preferred_date_to,
        t.urgency
       FROM camps c
       INNER JOIN organizations o
         ON o.org_id = c.org_id
       INNER JOIN tickets t
         ON t.ticket_id = c.ticket_id
       LEFT JOIN camp_funding cf
         ON cf.camp_id = c.camp_id
        AND cf.status IN ('committed', 'utilized')
       WHERE c.status = 'planned'
         AND cf.funding_id IS NULL
       ORDER BY c.start_date ASC, c.created_at ASC`
    );

    res.json({
      success: true,
      camps
    });
  } catch (error) {
    if (isDbOffline(error)) {
      const camps = getInMemoryFundableCamps();
      return res.json({
        success: true,
        camps
      });
    }

    console.error('Fundable camps fetch error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch fundable camps'
    });
  }
};

const getCampById = async (req, res) => {
  try {
    const { id } = req.params;

    const [camps] = await pool.query(
      `SELECT
        c.camp_id,
        c.ticket_id,
        c.org_id,
        c.start_date,
        c.end_date,
        c.status AS camp_status,
        c.created_at,
        o.name AS organization_name,
        o.type AS organization_type,
        t.pincode,
        t.expected_patient_count,
        t.health_focus_area,
        t.preferred_date_from,
        t.preferred_date_to,
        t.urgency,
        t.status AS ticket_status
       FROM camps c
       INNER JOIN organizations o
         ON o.org_id = c.org_id
       INNER JOIN tickets t
         ON t.ticket_id = c.ticket_id
       WHERE c.camp_id = ?`,
      [id]
    );

    if (camps.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Camp not found'
      });
    }

    res.json({
      success: true,
      camp: camps[0]
    });
  } catch (error) {
    if (isDbOffline(error)) {
      const camp = inMemoryCamps.find(c => String(c.camp_id) === String(req.params.id));
      if (!camp) {
        return res.status(404).json({
          success: false,
          message: 'Camp not found'
        });
      }

      const ticket = inMemoryTickets.find(t => t.ticket_id === camp.ticket_id) || {};
      const org = inMemoryOrganizations.find(o => o.org_id === camp.org_id) || {
        name: 'Government Hospital Vellore',
        type: 'Hospital'
      };

      return res.json({
        success: true,
        camp: {
          camp_id: camp.camp_id,
          ticket_id: camp.ticket_id,
          org_id: camp.org_id,
          start_date: camp.start_date,
          end_date: camp.end_date,
          camp_status: camp.status,
          created_at: camp.created_at,
          organization_name: org.name,
          organization_type: org.type,
          pincode: ticket.pincode,
          expected_patient_count: ticket.expected_patient_count,
          health_focus_area: ticket.health_focus_area,
          preferred_date_from: ticket.preferred_date_from,
          preferred_date_to: ticket.preferred_date_to,
          urgency: ticket.urgency,
          ticket_status: ticket.status
        }
      });
    }

    console.error('Camp fetch error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch camp'
    });
  }
};

const getMyCamps = async (req, res) => {
  try {
    const [camps] = await pool.query(
      `SELECT
        c.camp_id,
        c.ticket_id,
        c.start_date,
        c.end_date,
        c.status AS camp_status,
        t.health_focus_area,
        t.expected_patient_count,
        t.pincode,
        t.status AS ticket_status,
        cr.report_id,
        cr.verified,
        cr.patients_served_count AS reported_patients,
        cr.proof_document_url
       FROM camps c
       INNER JOIN organizations o
         ON o.org_id = c.org_id
       INNER JOIN tickets t
         ON t.ticket_id = c.ticket_id
       LEFT JOIN camp_reports cr
         ON cr.camp_id = c.camp_id
       WHERE o.org_admin_id = ?
       ORDER BY c.created_at DESC`,
      [req.user.user_id]
    );

    res.json({ success: true, camps });
  } catch (error) {
    if (isDbOffline(error)) {
      const camps = getInMemoryOrgCamps(req.user.user_id);
      return res.json({ success: true, camps });
    }

    console.error('My camps fetch error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch your camps' });
  }
};

module.exports = {
  getMyCamps,
  getFundableCamps,
  getCampById
};
