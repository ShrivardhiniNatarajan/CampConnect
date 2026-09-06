const pool = require('../config/db');
const {
  findAndNotifyNearbyOrganizations
} = require('../services/ticketMatchingService');

const VALID_URGENCY = ['low', 'medium', 'high'];

const VALID_CONSENT = ['pending', 'confirmed', 'declined'];

const VALID_VENUE_TYPES = [
  'community_hall',
  'school',
  'temple',
  'open_ground',
  'other'
];

const createTicket = async (req, res) => {
  try {
    const {
      latitude,
      longitude,
      pincode,
      expected_patient_count,
      health_focus_area,
      preferred_date_from,
      preferred_date_to,
      urgency,
      village_head_consent,
      venue_available,
      venue_type,
      local_contact_name,
      local_contact_phone,
      electricity_available,
      water_available,
      local_volunteer_count,
      additional_details
    } = req.body;

    if (
      latitude === undefined ||
      longitude === undefined ||
      !pincode ||
      expected_patient_count === undefined ||
      !health_focus_area ||
      !preferred_date_from ||
      !preferred_date_to ||
      !local_contact_name ||
      !local_contact_phone
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Latitude, longitude, pincode, patient count, health focus area, preferred dates, local contact name and phone are required'
      });
    }

    const lat = Number(latitude);
    const lon = Number(longitude);
    const patientCount = Number(expected_patient_count);
    const volunteerCount =
      local_volunteer_count === undefined
        ? 0
        : Number(local_volunteer_count);

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

    if (!Number.isInteger(patientCount) || patientCount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Expected patient count must be a positive integer'
      });
    }

    if (!Number.isInteger(volunteerCount) || volunteerCount < 0) {
      return res.status(400).json({
        success: false,
        message: 'Local volunteer count must be a non-negative integer'
      });
    }

    const ticketUrgency = urgency || 'medium';

    if (!VALID_URGENCY.includes(ticketUrgency)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid urgency'
      });
    }

    const consent = village_head_consent || 'pending';

    if (!VALID_CONSENT.includes(consent)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid village head consent status'
      });
    }

    const venue = venue_available === undefined
      ? false
      : Boolean(venue_available);

    if (venue && !venue_type) {
      return res.status(400).json({
        success: false,
        message: 'Venue type is required when venue is available'
      });
    }

    if (venue_type && !VALID_VENUE_TYPES.includes(venue_type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid venue type'
      });
    }

    if (preferred_date_from > preferred_date_to) {
      return res.status(400).json({
        success: false,
        message: 'Preferred start date cannot be after end date'
      });
    }

    const [result] = await pool.query(
      `INSERT INTO tickets
        (
          social_worker_id,
          gps_location,
          pincode,
          expected_patient_count,
          health_focus_area,
          preferred_date_from,
          preferred_date_to,
          urgency,
          village_head_consent,
          venue_available,
          venue_type,
          local_contact_name,
          local_contact_phone,
          electricity_available,
          water_available,
          local_volunteer_count,
          additional_details
        )
       VALUES
        (
          ?,
          ST_SRID(POINT(?, ?), 4326),
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?
        )`,
      [
        req.user.user_id,
        lon,
        lat,
        pincode,
        patientCount,
        health_focus_area,
        preferred_date_from,
        preferred_date_to,
        ticketUrgency,
        consent,
        venue,
        venue ? venue_type : null,
        local_contact_name,
        local_contact_phone,
        electricity_available === undefined
          ? false
          : Boolean(electricity_available),
        water_available === undefined
          ? false
          : Boolean(water_available),
        volunteerCount,
         additional_details
        ? JSON.stringify(additional_details)
        : null
      ]
    );

    const matchingResult =
    await findAndNotifyNearbyOrganizations(result.insertId);

    res.status(201).json({
    success: true,
    message: matchingResult.matched
        ? 'Ticket created and nearby organizations notified'
        : 'Ticket created, but no nearby organizations were found',
    ticket: {
        ticket_id: result.insertId,
        social_worker_id: req.user.user_id,
        latitude: lat,
        longitude: lon,
        pincode,
        expected_patient_count: patientCount,
        health_focus_area,
        preferred_date_from,
        preferred_date_to,
        urgency: ticketUrgency,
        village_head_consent: consent,
        venue_available: venue,
        venue_type: venue ? venue_type : null,
        local_contact_name,
        local_contact_phone,
        electricity_available:
        electricity_available === undefined
            ? false
            : Boolean(electricity_available),
        water_available:
        water_available === undefined
            ? false
            : Boolean(water_available),
        local_volunteer_count: volunteerCount,
        additional_details: additional_details || null,
        status: matchingResult.matched ? 'matched' : 'open',
        matched_organizations: matchingResult.organizations
    }
    });
  } catch (error) {
    console.error('Ticket creation error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Ticket creation failed'
    });
  }
};

module.exports = {
  createTicket
};