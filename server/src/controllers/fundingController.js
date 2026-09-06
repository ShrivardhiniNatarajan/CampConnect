const pool = require('../config/db');

const commitFunding = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { company_id, camp_id, amount } = req.body;

    // Basic input validation
    if (!company_id || !camp_id || amount === undefined) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: 'company_id, camp_id and amount are required'
      });
    }

    const fundingAmount = Number(amount);

    if (!Number.isFinite(fundingAmount) || fundingAmount <= 0) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: 'Funding amount must be greater than 0'
      });
    }

    // Verify that the company belongs to the logged-in CSR admin
    const [companies] = await connection.query(
      `SELECT
        company_id,
        csr_budget_total,
        csr_budget_committed
       FROM companies
       WHERE company_id = ?
         AND csr_admin_id = ?
       FOR UPDATE`,
      [company_id, req.user.user_id]
    );

    if (companies.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: 'Company not found for this CSR admin'
      });
    }

    const company = companies[0];

    // Verify that the camp is accepted/planned and currently unfunded
    const [camps] = await connection.query(
      `SELECT
        c.camp_id,
        c.ticket_id,
        c.status AS camp_status,
        t.status AS ticket_status
       FROM camps c
       INNER JOIN tickets t
         ON t.ticket_id = c.ticket_id
       LEFT JOIN camp_funding cf
         ON cf.camp_id = c.camp_id
        AND cf.status IN ('committed', 'utilized')
       WHERE c.camp_id = ?
         AND c.status = 'planned'
         AND t.status = 'accepted'
         AND cf.funding_id IS NULL
       FOR UPDATE`,
      [camp_id]
    );

    if (camps.length === 0) {
      await connection.rollback();

      return res.status(409).json({
        success: false,
        message: 'Camp is not eligible for funding'
      });
    }

    // Critical budget check
    const availableBudget =
      Number(company.csr_budget_total) -
      Number(company.csr_budget_committed);

    if (Number(company.csr_budget_committed) + fundingAmount >
        Number(company.csr_budget_total)) {
      await connection.rollback();

      return res.status(409).json({
        success: false,
        message: 'Funding exceeds available CSR budget',
        available_budget: availableBudget
      });
    }

    // Create funding record
    const [fundingResult] = await connection.query(
      `INSERT INTO camp_funding
        (company_id, camp_id, amount_committed, status)
       VALUES (?, ?, ?, 'committed')`,
      [company_id, camp_id, fundingAmount]
    );

    // Update company committed budget
    await connection.query(
      `UPDATE companies
       SET csr_budget_committed = csr_budget_committed + ?
       WHERE company_id = ?`,
      [fundingAmount, company_id]
    );

    // Funding makes the ticket funded
    await connection.query(
      `UPDATE tickets t
       INNER JOIN camps c
         ON c.ticket_id = t.ticket_id
       SET t.status = 'funded'
       WHERE c.camp_id = ?`,
      [camp_id]
    );

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Funding committed successfully',
      funding: {
        funding_id: fundingResult.insertId,
        company_id: Number(company_id),
        camp_id: Number(camp_id),
        amount_committed: fundingAmount,
        status: 'committed'
      },
      company: {
        csr_budget_total: Number(company.csr_budget_total),
        csr_budget_committed:
          Number(company.csr_budget_committed) + fundingAmount,
        remaining_budget: availableBudget - fundingAmount
      }
    });
  } catch (error) {
    await connection.rollback();

    console.error('Funding transaction error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Funding transaction failed'
    });
  } finally {
    connection.release();
  }
};

const getMyFunding = async (req, res) => {
  try {
    const [funding] = await pool.query(
      `SELECT
        cf.funding_id,
        cf.company_id,
        cf.camp_id,
        cf.amount_committed,
        cf.status,
        cf.committed_at,
        cf.utilized_at,
        c.name AS company_name,
        camp.start_date,
        camp.end_date,
        o.name AS organization_name
       FROM camp_funding cf
       INNER JOIN companies c
         ON c.company_id = cf.company_id
       INNER JOIN camps camp
         ON camp.camp_id = cf.camp_id
       INNER JOIN organizations o
         ON o.org_id = camp.org_id
       WHERE c.csr_admin_id = ?
       ORDER BY cf.committed_at DESC`,
      [req.user.user_id]
    );

    res.json({
      success: true,
      funding
    });
  } catch (error) {
    console.error('Funding history error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch funding history'
    });
  }
};

module.exports = {
  commitFunding,
  getMyFunding
};