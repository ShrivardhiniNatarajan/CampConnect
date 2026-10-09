const bcrypt = require('bcrypt');

// In-memory fallback stores for offline/development mode when MySQL is on a remote machine
const inMemoryUsers = new Map();
const inMemoryTickets = [];

// Seed pre-defined testing accounts for each role
const initDemoAccounts = async () => {
  const defaultHash = await bcrypt.hash('password123', 10);

  const demoAccounts = [
    { phone: '9876543210', name: 'Ramesh Kumar (Social Worker)', role: 'social_worker', email: 'worker@campconnect.org' },
    { phone: '9876543220', name: 'Dr. Priya (Govt Hospital Vellore)', role: 'org_admin', email: 'hospital@campconnect.org' },
    { phone: '9876543230', name: 'CSR Admin (Tata Foundation)', role: 'csr_admin', email: 'csr@campconnect.org' },
    { phone: '9876543240', name: 'District Health Coordinator', role: 'coordinator', email: 'coord@campconnect.org' }
  ];

  demoAccounts.forEach((acc, idx) => {
    inMemoryUsers.set(acc.phone, {
      user_id: idx + 1,
      name: acc.name,
      phone: acc.phone,
      email: acc.email,
      password_hash: defaultHash,
      role: acc.role
    });
  });

  // Seed sample tickets with ML trust scores
  inMemoryTickets.push({
    ticket_id: 101,
    social_worker_id: 1,
    latitude: 12.9249,
    longitude: 79.1378,
    pincode: '632001',
    expected_patient_count: 150,
    health_focus_area: 'General Health & Eye Checkup',
    preferred_date_from: '2026-10-15',
    preferred_date_to: '2026-10-17',
    urgency: 'high',
    village_head_consent: 'confirmed',
    venue_available: true,
    venue_type: 'school',
    local_contact_name: 'Panchayat President',
    local_contact_phone: '9876543210',
    electricity_available: true,
    water_available: true,
    local_volunteer_count: 6,
    additional_details: {
      trust_score: 95,
      trust_level: 'High Credibility',
      trust_analysis: { score: 95, trust_level: 'High Credibility' }
    },
    status: 'matched',
    created_at: new Date()
  });
};

initDemoAccounts();

module.exports = {
  inMemoryUsers,
  inMemoryTickets
};
