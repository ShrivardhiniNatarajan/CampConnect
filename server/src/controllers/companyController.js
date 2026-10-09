const pool = require('../config/db');
const { inMemoryCompanies } = require('../services/inMemoryStore');
const { isDbOffline } = require('../utils/dbFallback');

const createCompany = async (req, res) => {
  try {
    const {
      name,
      industry,
      csr_budget_total
    } = req.body;

    if (!name || csr_budget_total === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Name and CSR budget total are required'
      });
    }

    const budgetTotal = Number(csr_budget_total);

    if (!Number.isFinite(budgetTotal) || budgetTotal < 0) {
      return res.status(400).json({
        success: false,
        message: 'CSR budget total must be a non-negative number'
      });
    }

    let companyId;
    try {
      // One csr_admin can be linked to only one company.
      const [existingCompany] = await pool.query(
        'SELECT company_id FROM companies WHERE csr_admin_id = ?',
        [req.user.user_id]
      );

      if (existingCompany.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'This csr_admin already has a company'
        });
      }

      const [result] = await pool.query(
        `INSERT INTO companies
          (
            csr_admin_id,
            name,
            industry,
            csr_budget_total,
            csr_budget_committed
          )
         VALUES (?, ?, ?, ?, 0)`,
        [
          req.user.user_id,
          name,
          industry || null,
          budgetTotal
        ]
      );
      companyId = result.insertId;
    } catch (dbErr) {
      if (!isDbOffline(dbErr)) throw dbErr;

      const existingMemComp = inMemoryCompanies.find(c => c.csr_admin_id === req.user.user_id);
      if (existingMemComp) {
        return res.status(409).json({
          success: false,
          message: 'This csr_admin already has a company'
        });
      }

      companyId = inMemoryCompanies.length + 1;
      inMemoryCompanies.push({
        company_id: companyId,
        csr_admin_id: req.user.user_id,
        name,
        industry: industry || null,
        csr_budget_total: budgetTotal,
        csr_budget_committed: 0,
        created_at: new Date()
      });
    }

    res.status(201).json({
      success: true,
      message: 'Company registered successfully',
      company: {
        company_id: companyId,
        csr_admin_id: req.user.user_id,
        name,
        industry: industry || null,
        csr_budget_total: budgetTotal,
        csr_budget_committed: 0
      }
    });
  } catch (error) {
    console.error('Company creation error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Company registration failed'
    });
  }
};

const getCompany = async (req, res) => {
  try {
    const { id } = req.params;

    try {
      const [companies] = await pool.query(
        `SELECT
          company_id,
          csr_admin_id,
          name,
          industry,
          csr_budget_total,
          csr_budget_committed,
          created_at
         FROM companies
         WHERE company_id = ?`,
        [id]
      );

      if (companies.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Company not found'
        });
      }

      return res.json({
        success: true,
        company: companies[0]
      });
    } catch (dbErr) {
      if (!isDbOffline(dbErr)) throw dbErr;

      const comp = inMemoryCompanies.find(c => String(c.company_id) === String(id));
      if (!comp) {
        return res.status(404).json({
          success: false,
          message: 'Company not found'
        });
      }

      return res.json({
        success: true,
        company: comp
      });
    }
  } catch (error) {
    console.error('Company fetch error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch company'
    });
  }
};

module.exports = {
  createCompany,
  getCompany
};