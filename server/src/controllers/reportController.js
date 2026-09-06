const pool = require('../config/db');

const submitReport = async (req, res) => {
  try {
    const { id } = req.params;
    const orgAdminId = req.user.user_id;

    const {
      patients_served_count,
      summary_notes,
      proof_document_url
    } = req.body;

    // Basic validation
    if (patients_served_count === undefined) {
      return res.status(400).json({
        success: false,
        message: 'patients_served_count is required'
      });
    }

    const patientsServed = Number(patients_served_count);

    if (!Number.isInteger(patientsServed) || patientsServed < 0) {
      return res.status(400).json({
        success: false,
        message: 'patients_served_count must be a non-negative integer'
      });
    }

    // Verify that the camp belongs to this organization's admin
    const [camps] = await pool.query(
      `SELECT
        c.camp_id,
        c.org_id,
        c.status,
        o.org_admin_id
       FROM camps c
       INNER JOIN organizations o
         ON o.org_id = c.org_id
       WHERE c.camp_id = ?
         AND o.org_admin_id = ?`,
      [id, orgAdminId]
    );

    if (camps.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Camp not found for this organization'
      });
    }

    const camp = camps[0];

    if (camp.status !== 'planned' && camp.status !== 'ongoing') {
      return res.status(409).json({
        success: false,
        message: 'Report cannot be submitted for this camp'
      });
    }

    // Prevent submitting a second report for the same camp
    const [existingReports] = await pool.query(
      `SELECT report_id
       FROM camp_reports
       WHERE camp_id = ?`,
      [id]
    );

    if (existingReports.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'A report has already been submitted for this camp'
      });
    }

    const [result] = await pool.query(
      `INSERT INTO camp_reports
        (
          camp_id,
          submitted_by,
          patients_served_count,
          summary_notes,
          proof_document_url
        )
       VALUES (?, ?, ?, ?, ?)`,
      [
        id,
        orgAdminId,
        patientsServed,
        summary_notes || null,
        proof_document_url || null
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Camp report submitted successfully',
      report: {
        report_id: result.insertId,
        camp_id: Number(id),
        submitted_by: orgAdminId,
        patients_served_count: patientsServed,
        summary_notes: summary_notes || null,
        proof_document_url: proof_document_url || null,
        verified: false
      }
    });
  } catch (error) {
    console.error('Report submission error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Failed to submit camp report'
    });
  }
};

const getPendingReports = async (req, res) => {
  try {
    const [reports] = await pool.query(
      `SELECT
        cr.report_id,
        cr.camp_id,
        cr.submitted_by,
        cr.patients_served_count,
        cr.summary_notes,
        cr.proof_document_url,
        cr.verified,
        cr.submitted_at,

        c.ticket_id,
        c.org_id,
        c.start_date,
        c.end_date,
        c.status AS camp_status,

        o.name AS organization_name,
        o.type AS organization_type,

        u.name AS submitted_by_name,
        u.phone AS submitted_by_phone
       FROM camp_reports cr
       INNER JOIN camps c
         ON c.camp_id = cr.camp_id
       INNER JOIN organizations o
         ON o.org_id = c.org_id
       INNER JOIN users u
         ON u.user_id = cr.submitted_by
       WHERE cr.verified = FALSE
       ORDER BY cr.submitted_at ASC`
    );

    res.json({
      success: true,
      reports
    });
  } catch (error) {
    console.error('Pending reports fetch error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending reports'
    });
  }
};

const verifyReport = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const coordinatorId = req.user.user_id;

    // Lock the report so it cannot be verified twice concurrently.
    const [reports] = await connection.query(
      `SELECT
        cr.report_id,
        cr.camp_id,
        cr.verified
       FROM camp_reports cr
       WHERE cr.report_id = ?
       FOR UPDATE`,
      [id]
    );

    if (reports.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    const report = reports[0];

    if (report.verified) {
      await connection.rollback();

      return res.status(409).json({
        success: false,
        message: 'Report has already been verified'
      });
    }

    // Lock the camp.
    const [camps] = await connection.query(
      `SELECT
        camp_id,
        ticket_id,
        status
       FROM camps
       WHERE camp_id = ?
       FOR UPDATE`,
      [report.camp_id]
    );

    if (camps.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: 'Camp not found'
      });
    }

    const camp = camps[0];

    // Lock associated funding record(s), if any.
    const [fundingRows] = await connection.query(
      `SELECT
        funding_id,
        company_id,
        amount_committed,
        status
       FROM camp_funding
       WHERE camp_id = ?
       FOR UPDATE`,
      [report.camp_id]
    );

    // Verify the report.
    await connection.query(
      `UPDATE camp_reports
       SET verified = TRUE,
           verified_by = ?,
           verified_at = CURRENT_TIMESTAMP
       WHERE report_id = ?`,
      [coordinatorId, id]
    );

    // Mark committed funding as utilized.
    if (fundingRows.length > 0) {
      await connection.query(
        `UPDATE camp_funding
         SET status = 'utilized',
             utilized_at = CURRENT_TIMESTAMP
         WHERE camp_id = ?
           AND status = 'committed'`,
        [report.camp_id]
      );
    }

    // Complete the camp.
    await connection.query(
      `UPDATE camps
       SET status = 'completed'
       WHERE camp_id = ?`,
      [report.camp_id]
    );

    // Complete the original ticket.
    await connection.query(
      `UPDATE tickets
       SET status = 'completed'
       WHERE ticket_id = ?`,
      [camp.ticket_id]
    );

    await connection.commit();

    return res.json({
      success: true,
      message: 'Report verified and camp workflow completed successfully',
      report: {
        report_id: Number(id),
        camp_id: camp.camp_id,
        verified: true,
        verified_by: coordinatorId
      },
      camp: {
        camp_id: camp.camp_id,
        status: 'completed'
      },
      ticket: {
        ticket_id: camp.ticket_id,
        status: 'completed'
      },
      funding: {
        funding_records_updated: fundingRows.length,
        status: fundingRows.length > 0 ? 'utilized' : 'not_applicable'
      }
    });
  } catch (error) {
    await connection.rollback();

    console.error('Report verification error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Report verification failed'
    });
  } finally {
    connection.release();
  }
};

module.exports = {
  submitReport,
  getPendingReports,
  verifyReport
};