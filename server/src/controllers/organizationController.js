const pool = require('../config/db');

const createOrganization = async (req, res) => {
  try {
    const {
      name,
      type,
      latitude,
      longitude,
      pincode,
      specialization,
      capacity
    } = req.body;

    if (
      !name ||
      !type ||
      latitude === undefined ||
      longitude === undefined ||
      !pincode
    ) {
      return res.status(400).json({
        success: false,
        message: 'Name, type, latitude, longitude and pincode are required'
      });
    }

    if (!['NGO', 'Hospital'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type must be NGO or Hospital'
      });
    }

    const lat = Number(latitude);
    const lon = Number(longitude);

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lon) ||
      lat < -90 ||
      lat > 90 ||
      lon < -180 ||
      lon > 180
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid latitude or longitude'
      });
    }

    const organizationCapacity =
      capacity === undefined ? 0 : Number(capacity);

    if (
      !Number.isInteger(organizationCapacity) ||
      organizationCapacity < 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'Capacity must be a non-negative integer'
      });
    }

    // One org_admin can be linked to only one organization.
    const [existingOrg] = await pool.query(
      'SELECT org_id FROM organizations WHERE org_admin_id = ?',
      [req.user.user_id]
    );

    if (existingOrg.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'This org_admin already has an organization'
      });
    }

    const [result] = await pool.query(
      `INSERT INTO organizations
        (
          org_admin_id,
          name,
          type,
          location,
          pincode,
          specialization,
          capacity
        )
       VALUES (?, ?, ?, ST_SRID(POINT(?, ?), 4326), ?, ?, ?)`,
      [
        req.user.user_id,
        name,
        type,
        lon,
        lat,
        pincode,
        specialization || null,
        organizationCapacity
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Organization registered successfully',
      organization: {
        org_id: result.insertId,
        org_admin_id: req.user.user_id,
        name,
        type,
        latitude: lat,
        longitude: lon,
        pincode,
        specialization: specialization || null,
        capacity: organizationCapacity
      }
    });
  } catch (error) {
    console.error('Organization creation error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Organization registration failed'
    });
  }
};

const getOrganization = async (req, res) => {
  try {
    const { id } = req.params;

    const [organizations] = await pool.query(
      `SELECT
        org_id,
        org_admin_id,
        name,
        type,
        ST_Y(location) AS latitude,
        ST_X(location) AS longitude,
        pincode,
        specialization,
        capacity,
        created_at
       FROM organizations
       WHERE org_id = ?`,
      [id]
    );

    if (organizations.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    res.json({
      success: true,
      organization: organizations[0]
    });
  } catch (error) {
    console.error('Organization fetch error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch organization'
    });
  }
};

module.exports = {
  createOrganization,
  getOrganization
};