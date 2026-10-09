const bcrypt = require('bcrypt');
const pool = require('../config/db');
const { isDbOffline } = require('../utils/dbFallback');

/**
 * Initializes and validates demo data when connecting to MySQL on the target machine.
 * If MySQL is offline, catches gracefully without halting the application.
 */
const initDbSeed = async () => {
  try {
    // 1. Check database connectivity
    await pool.query('SELECT 1');
    console.log('[CampConnect] MySQL database connection established.');

    const defaultHash = await bcrypt.hash('password123', 10);

    // 2. Ensure pincode_lookup is seeded
    try {
      const [pincodes] = await pool.query('SELECT COUNT(*) AS count FROM pincode_lookup');
      if (pincodes[0].count === 0) {
        await pool.query(`
          INSERT INTO pincode_lookup (pincode, latitude, longitude, district, state) VALUES
          ('600001', 13.082700, 80.270700, 'Chennai', 'Tamil Nadu'),
          ('632001', 12.916500, 79.132500, 'Vellore', 'Tamil Nadu'),
          ('600020', 13.033900, 80.261900, 'Chennai', 'Tamil Nadu'),
          ('560001', 12.971600, 77.594600, 'Bengaluru Urban', 'Karnataka'),
          ('560034', 12.927900, 77.627100, 'Bengaluru Urban', 'Karnataka'),
          ('400001', 18.938800, 72.835400, 'Mumbai City', 'Maharashtra'),
          ('400050', 19.059600, 72.829500, 'Mumbai Suburban', 'Maharashtra'),
          ('110001', 28.632800, 77.219700, 'New Delhi', 'Delhi'),
          ('110016', 28.548800, 77.194700, 'South Delhi', 'Delhi'),
          ('500001', 17.385000, 78.486700, 'Hyderabad', 'Telangana'),
          ('500032', 17.440100, 78.348900, 'Rangareddy', 'Telangana'),
          ('700001', 22.572600, 88.363900, 'Kolkata', 'West Bengal'),
          ('700091', 22.586700, 88.417100, 'North 24 Parganas', 'West Bengal'),
          ('411001', 18.520400, 73.856700, 'Pune', 'Maharashtra'),
          ('380001', 23.022500, 72.571400, 'Ahmedabad', 'Gujarat'),
          ('302001', 26.912400, 75.787300, 'Jaipur', 'Rajasthan')
        `);
        console.log('[CampConnect] Seeded pincode_lookup records.');
      }
    } catch (e) {
      // Table might not exist yet if migrations haven't run
    }

    // 3. Ensure demo users exist in MySQL
    const demoUsers = [
      { phone: '9876543210', name: 'Ramesh Kumar (Social Worker)', role: 'social_worker', email: 'worker@campconnect.org' },
      { phone: '9876543220', name: 'Dr. Priya (Govt Hospital Vellore)', role: 'org_admin', email: 'hospital@campconnect.org' },
      { phone: '9876543230', name: 'CSR Admin (Tata Foundation)', role: 'csr_admin', email: 'csr@campconnect.org' },
      { phone: '9876543240', name: 'District Health Coordinator', role: 'coordinator', email: 'coord@campconnect.org' }
    ];

    let socialWorkerId = null;
    let orgAdminId = null;
    let csrAdminId = null;
    let coordId = null;

    for (const u of demoUsers) {
      const [existing] = await pool.query('SELECT user_id, role FROM users WHERE phone = ?', [u.phone]);
      let uid;
      if (existing.length === 0) {
        const [insertRes] = await pool.query(
          'INSERT INTO users (name, phone, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
          [u.name, u.phone, u.email, defaultHash, u.role]
        );
        uid = insertRes.insertId;
      } else {
        uid = existing[0].user_id;
      }

      if (u.role === 'social_worker') socialWorkerId = uid;
      if (u.role === 'org_admin') orgAdminId = uid;
      if (u.role === 'csr_admin') csrAdminId = uid;
      if (u.role === 'coordinator') coordId = uid;
    }

    // 4. Ensure demo organization exists for Hospital Admin
    let orgId = null;
    if (orgAdminId) {
      const [existingOrg] = await pool.query('SELECT org_id FROM organizations WHERE org_admin_id = ?', [orgAdminId]);
      if (existingOrg.length === 0) {
        const [orgRes] = await pool.query(
          `INSERT INTO organizations (org_admin_id, name, type, location, pincode, specialization, capacity)
           VALUES (?, 'Government Hospital Vellore', 'Hospital', ST_SRID(POINT(79.1325, 12.9165), 4326), '632001', 'General Health, Ophthalmology, Pediatrics', 500)`,
          [orgAdminId]
        );
        orgId = orgRes.insertId;
      } else {
        orgId = existingOrg[0].org_id;
      }
    }

    // 5. Ensure demo company exists for CSR Admin
    let companyId = null;
    if (csrAdminId) {
      const [existingComp] = await pool.query('SELECT company_id FROM companies WHERE csr_admin_id = ?', [csrAdminId]);
      if (existingComp.length === 0) {
        const [compRes] = await pool.query(
          `INSERT INTO companies (csr_admin_id, name, industry, csr_budget_total, csr_budget_committed)
           VALUES (?, 'Tata Community Initiatives Trust', 'Healthcare & Rural Development', 10000000.00, 175000.00)`,
          [csrAdminId]
        );
        companyId = compRes.insertId;
      } else {
        companyId = existingComp[0].company_id;
      }
    }

    console.log('[CampConnect] MySQL seed accounts and entities ready.');
  } catch (error) {
    if (isDbOffline(error)) {
      console.log('[CampConnect] MySQL is offline on this machine. Running in zero-database in-memory mode with full fallback for all roles.');
    } else {
      console.warn('[CampConnect] DB initialization note:', error.message);
    }
  }
};

module.exports = {
  initDbSeed
};
