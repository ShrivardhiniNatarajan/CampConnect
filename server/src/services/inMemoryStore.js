const bcrypt = require('bcrypt');

// In-memory fallback stores for offline/development mode when MySQL is on a remote machine
const inMemoryUsers = new Map();
const inMemoryOrganizations = [];
const inMemoryCompanies = [];
const inMemoryTickets = [];
const inMemoryNotifications = [];
const inMemoryCamps = [];
const inMemoryFunding = [];
const inMemoryReports = [];

// Seed pre-defined testing accounts for each role and initial active data
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

  // Seed demo organization (Govt Hospital Vellore)
  inMemoryOrganizations.push({
    org_id: 1,
    org_admin_id: 2,
    name: 'Government Hospital Vellore',
    type: 'Hospital',
    latitude: 12.9165,
    longitude: 79.1325,
    pincode: '632001',
    specialization: 'General Health, Ophthalmology, Pediatrics',
    capacity: 500,
    created_at: new Date('2026-09-01T00:00:00Z')
  });

  // Seed demo CSR sponsor company (Tata Community Initiatives Trust)
  inMemoryCompanies.push({
    company_id: 1,
    csr_admin_id: 3,
    name: 'Tata Community Initiatives Trust',
    industry: 'Healthcare & Rural Development',
    csr_budget_total: 10000000.00,
    csr_budget_committed: 175000.00,
    created_at: new Date('2026-09-01T00:00:00Z')
  });

  // Seed tickets across the camp lifecycle so every role has active demo data:
  // 1. Ticket 101: Open & Matched (Notified to Hospital Admin, waiting for acceptance)
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
      trust_analysis: {
        score: 95,
        trust_level: 'High Credibility',
        recommendation: 'Excellent preparation with verified Panchayat consent and school venue.'
      }
    },
    status: 'matched',
    created_at: new Date('2026-10-08T10:00:00Z')
  });

  // Notification for Ticket 101 -> Org 1
  inMemoryNotifications.push({
    notif_id: 1,
    ticket_id: 101,
    org_id: 1,
    distance_km: 3.2,
    status: 'notified',
    notified_at: new Date('2026-10-08T10:05:00Z'),
    responded_at: null
  });

  // 2. Ticket 102: Accepted (Camp 201 planned, awaiting CSR funding)
  inMemoryTickets.push({
    ticket_id: 102,
    social_worker_id: 1,
    latitude: 12.9300,
    longitude: 79.1400,
    pincode: '632001',
    expected_patient_count: 200,
    health_focus_area: 'Pediatric & Maternal Care',
    preferred_date_from: '2026-10-25',
    preferred_date_to: '2026-10-27',
    urgency: 'high',
    village_head_consent: 'confirmed',
    venue_available: true,
    venue_type: 'community_hall',
    local_contact_name: 'Anitha Devi',
    local_contact_phone: '9876543210',
    electricity_available: true,
    water_available: true,
    local_volunteer_count: 8,
    additional_details: {
      trust_score: 90,
      trust_level: 'High Credibility',
      trust_analysis: { score: 90, trust_level: 'High Credibility' }
    },
    status: 'accepted',
    created_at: new Date('2026-10-06T09:00:00Z')
  });

  inMemoryNotifications.push({
    notif_id: 2,
    ticket_id: 102,
    org_id: 1,
    distance_km: 4.1,
    status: 'accepted',
    notified_at: new Date('2026-10-06T09:05:00Z'),
    responded_at: new Date('2026-10-06T10:00:00Z')
  });

  inMemoryCamps.push({
    camp_id: 201,
    ticket_id: 102,
    org_id: 1,
    start_date: '2026-10-25',
    end_date: '2026-10-27',
    status: 'planned',
    created_at: new Date('2026-10-06T10:00:00Z')
  });

  // 3. Ticket 103: Funded (Camp 202 completed & post-camp report submitted, pending coordinator verification)
  inMemoryTickets.push({
    ticket_id: 103,
    social_worker_id: 1,
    latitude: 12.9200,
    longitude: 79.1300,
    pincode: '632001',
    expected_patient_count: 120,
    health_focus_area: 'Dental & Diabetes Screening',
    preferred_date_from: '2026-10-18',
    preferred_date_to: '2026-10-20',
    urgency: 'medium',
    village_head_consent: 'confirmed',
    venue_available: true,
    venue_type: 'school',
    local_contact_name: 'Ravi Verma',
    local_contact_phone: '9876543210',
    electricity_available: true,
    water_available: true,
    local_volunteer_count: 5,
    additional_details: {
      trust_score: 85,
      trust_level: 'High Credibility',
      trust_analysis: { score: 85, trust_level: 'High Credibility' }
    },
    status: 'funded',
    created_at: new Date('2026-10-04T08:00:00Z')
  });

  inMemoryNotifications.push({
    notif_id: 3,
    ticket_id: 103,
    org_id: 1,
    distance_km: 2.8,
    status: 'accepted',
    notified_at: new Date('2026-10-04T08:05:00Z'),
    responded_at: new Date('2026-10-04T09:00:00Z')
  });

  inMemoryCamps.push({
    camp_id: 202,
    ticket_id: 103,
    org_id: 1,
    start_date: '2026-10-18',
    end_date: '2026-10-20',
    status: 'planned',
    created_at: new Date('2026-10-04T09:00:00Z')
  });

  inMemoryFunding.push({
    funding_id: 401,
    company_id: 1,
    camp_id: 202,
    amount_committed: 75000.00,
    status: 'committed',
    committed_at: new Date('2026-10-05T11:00:00Z')
  });

  inMemoryReports.push({
    report_id: 301,
    camp_id: 202,
    submitted_by: 2,
    patients_served_count: 135,
    summary_notes: 'Successfully conducted dental and diabetes screening camp with active participation from villagers.',
    proof_document_url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=600&q=80',
    verified: false,
    verified_by: null,
    verified_at: null,
    submitted_at: new Date('2026-10-08T14:30:00Z')
  });

  // 4. Ticket 100: Historical Completed & Verified Camp
  inMemoryTickets.push({
    ticket_id: 100,
    social_worker_id: 1,
    latitude: 12.9150,
    longitude: 79.1250,
    pincode: '632001',
    expected_patient_count: 180,
    health_focus_area: 'Geriatric Orthopedic Care',
    preferred_date_from: '2026-09-10',
    preferred_date_to: '2026-09-12',
    urgency: 'medium',
    village_head_consent: 'confirmed',
    venue_available: true,
    venue_type: 'community_hall',
    local_contact_name: 'Murugan',
    local_contact_phone: '9876543210',
    electricity_available: true,
    water_available: true,
    local_volunteer_count: 7,
    additional_details: {
      trust_score: 88,
      trust_level: 'High Credibility',
      trust_analysis: { score: 88, trust_level: 'High Credibility' }
    },
    status: 'completed',
    created_at: new Date('2026-09-01T08:00:00Z')
  });

  inMemoryCamps.push({
    camp_id: 200,
    ticket_id: 100,
    org_id: 1,
    start_date: '2026-09-10',
    end_date: '2026-09-12',
    status: 'completed',
    created_at: new Date('2026-09-02T10:00:00Z')
  });

  inMemoryFunding.push({
    funding_id: 400,
    company_id: 1,
    camp_id: 200,
    amount_committed: 100000.00,
    status: 'utilized',
    committed_at: new Date('2026-09-03T11:00:00Z'),
    utilized_at: new Date('2026-09-15T16:00:00Z')
  });

  inMemoryReports.push({
    report_id: 300,
    camp_id: 200,
    submitted_by: 2,
    patients_served_count: 185,
    summary_notes: 'Completed orthopedic camp with excellent community feedback and doctor participation.',
    proof_document_url: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80',
    verified: true,
    verified_by: 4,
    verified_at: new Date('2026-09-15T16:00:00Z'),
    submitted_at: new Date('2026-09-13T12:00:00Z')
  });
};

initDemoAccounts();

// ============================================
// Helper Methods for In-Memory Fallback
// ============================================

/**
 * When a social worker creates a new ticket offline, notify nearby demo organization
 */
const createInMemoryNotificationForTicket = (ticket) => {
  const notifId = inMemoryNotifications.length + 1;
  const newNotif = {
    notif_id: notifId,
    ticket_id: ticket.ticket_id,
    org_id: 1, // Default demo hospital
    distance_km: 3.5,
    status: 'notified',
    notified_at: new Date(),
    responded_at: null
  };
  inMemoryNotifications.unshift(newNotif);
  return newNotif;
};

/**
 * Org admin accepts incoming notification
 */
const acceptInMemoryNotification = (notifId, orgAdminId) => {
  const notif = inMemoryNotifications.find(n => String(n.notif_id) === String(notifId));
  if (!notif) {
    const error = new Error('Notification not found');
    error.status = 404;
    throw error;
  }

  if (notif.status !== 'notified') {
    const error = new Error('Notification is no longer available');
    error.status = 409;
    throw error;
  }

  const ticket = inMemoryTickets.find(t => String(t.ticket_id) === String(notif.ticket_id));
  if (!ticket || ticket.status !== 'matched') {
    const error = new Error('Ticket is no longer available for acceptance');
    error.status = 409;
    throw error;
  }

  // Update notification
  notif.status = 'accepted';
  notif.responded_at = new Date();

  // Expire other notifications for this ticket
  inMemoryNotifications.forEach(n => {
    if (n.ticket_id === notif.ticket_id && n.notif_id !== notif.notif_id && n.status === 'notified') {
      n.status = 'expired';
      n.responded_at = new Date();
    }
  });

  // Mark ticket accepted
  ticket.status = 'accepted';

  // Create camp in planned state
  const campId = inMemoryCamps.length + 201;
  const newCamp = {
    camp_id: campId,
    ticket_id: ticket.ticket_id,
    org_id: notif.org_id,
    start_date: ticket.preferred_date_from,
    end_date: ticket.preferred_date_to,
    status: 'planned',
    created_at: new Date()
  };
  inMemoryCamps.unshift(newCamp);

  return newCamp;
};

/**
 * Org admin rejects notification
 */
const rejectInMemoryNotification = (notifId, orgAdminId) => {
  const notif = inMemoryNotifications.find(n => String(n.notif_id) === String(notifId));
  if (!notif) {
    const error = new Error('Notification not found');
    error.status = 404;
    throw error;
  }

  notif.status = 'rejected';
  notif.responded_at = new Date();

  const remaining = inMemoryNotifications.filter(
    n => n.ticket_id === notif.ticket_id && n.status === 'notified'
  );

  if (remaining.length === 0) {
    const ticket = inMemoryTickets.find(t => String(t.ticket_id) === String(notif.ticket_id));
    if (ticket) ticket.status = 'rejected_all';
  }

  return true;
};

/**
 * Get fundable camps (planned status, unfunded)
 */
const getInMemoryFundableCamps = () => {
  const fundedCampIds = new Set(
    inMemoryFunding
      .filter(f => f.status === 'committed' || f.status === 'utilized')
      .map(f => f.camp_id)
  );

  return inMemoryCamps
    .filter(c => c.status === 'planned' && !fundedCampIds.has(c.camp_id))
    .map(c => {
      const ticket = inMemoryTickets.find(t => t.ticket_id === c.ticket_id) || {};
      const org = inMemoryOrganizations.find(o => o.org_id === c.org_id) || {
        name: 'Government Hospital Vellore',
        type: 'Hospital'
      };
      return {
        camp_id: c.camp_id,
        ticket_id: c.ticket_id,
        org_id: c.org_id,
        start_date: c.start_date,
        end_date: c.end_date,
        camp_status: c.status,
        organization_name: org.name,
        organization_type: org.type,
        pincode: ticket.pincode,
        expected_patient_count: ticket.expected_patient_count,
        health_focus_area: ticket.health_focus_area,
        preferred_date_from: ticket.preferred_date_from,
        preferred_date_to: ticket.preferred_date_to,
        urgency: ticket.urgency
      };
    })
    .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
};

/**
 * CSR Admin commits funding
 */
const commitInMemoryFunding = (companyId, campId, amount, csrAdminId) => {
  const fundingAmount = Number(amount);
  const company = inMemoryCompanies.find(c => c.csr_admin_id === csrAdminId || String(c.company_id) === String(companyId)) || inMemoryCompanies[0];

  if (!company) {
    const error = new Error('Company not found for this CSR admin');
    error.status = 404;
    throw error;
  }

  const camp = inMemoryCamps.find(c => String(c.camp_id) === String(campId));
  if (!camp || camp.status !== 'planned') {
    const error = new Error('Camp is not eligible for funding');
    error.status = 409;
    throw error;
  }

  const alreadyFunded = inMemoryFunding.some(
    f => f.camp_id === camp.camp_id && (f.status === 'committed' || f.status === 'utilized')
  );
  if (alreadyFunded) {
    const error = new Error('Camp is already funded');
    error.status = 409;
    throw error;
  }

  const availableBudget = Number(company.csr_budget_total) - Number(company.csr_budget_committed);
  if (fundingAmount > availableBudget) {
    const error = new Error('Funding exceeds available CSR budget');
    error.status = 409;
    throw error;
  }

  const fundingId = inMemoryFunding.length + 401;
  const newFunding = {
    funding_id: fundingId,
    company_id: company.company_id,
    camp_id: camp.camp_id,
    amount_committed: fundingAmount,
    status: 'committed',
    committed_at: new Date(),
    utilized_at: null
  };
  inMemoryFunding.unshift(newFunding);

  company.csr_budget_committed += fundingAmount;

  const ticket = inMemoryTickets.find(t => t.ticket_id === camp.ticket_id);
  if (ticket) {
    ticket.status = 'funded';
  }

  return {
    funding: newFunding,
    company: {
      csr_budget_total: company.csr_budget_total,
      csr_budget_committed: company.csr_budget_committed,
      remaining_budget: company.csr_budget_total - company.csr_budget_committed
    }
  };
};

/**
 * Get funding history for CSR admin
 */
const getInMemoryFundingHistory = (csrAdminId) => {
  const myCompanies = inMemoryCompanies.filter(c => c.csr_admin_id === csrAdminId);
  const companyIds = new Set(myCompanies.map(c => c.company_id));

  // If none found for this specific ID, show all demo funding
  const targetFunding = companyIds.size > 0
    ? inMemoryFunding.filter(f => companyIds.has(f.company_id))
    : inMemoryFunding;

  return targetFunding.map(f => {
    const camp = inMemoryCamps.find(c => c.camp_id === f.camp_id) || {};
    const company = inMemoryCompanies.find(c => c.company_id === f.company_id) || { name: 'Tata Foundation' };
    const org = inMemoryOrganizations.find(o => o.org_id === camp.org_id) || { name: 'Government Hospital Vellore' };

    return {
      funding_id: f.funding_id,
      company_id: f.company_id,
      camp_id: f.camp_id,
      amount_committed: f.amount_committed,
      status: f.status,
      committed_at: f.committed_at,
      utilized_at: f.utilized_at,
      company_name: company.name,
      start_date: camp.start_date,
      end_date: camp.end_date,
      organization_name: org.name
    };
  }).sort((a, b) => new Date(b.committed_at) - new Date(a.committed_at));
};

/**
 * Get org camps with report status for Org Admin
 */
const getInMemoryOrgCamps = (orgAdminId) => {
  return inMemoryCamps.map(c => {
    const ticket = inMemoryTickets.find(t => t.ticket_id === c.ticket_id) || {};
    const report = inMemoryReports.find(r => r.camp_id === c.camp_id) || null;

    return {
      camp_id: c.camp_id,
      ticket_id: c.ticket_id,
      start_date: c.start_date,
      end_date: c.end_date,
      camp_status: c.status,
      health_focus_area: ticket.health_focus_area || 'General Health',
      expected_patient_count: ticket.expected_patient_count || 100,
      pincode: ticket.pincode || '632001',
      ticket_status: ticket.status || 'open',
      report_id: report ? report.report_id : null,
      verified: report ? report.verified : false,
      reported_patients: report ? report.patients_served_count : null,
      proof_document_url: report ? report.proof_document_url : null
    };
  }).sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
};

/**
 * Org Admin submits post-camp report
 */
const submitInMemoryReport = (campId, orgAdminId, patientsServed, notes, proofUrl) => {
  const camp = inMemoryCamps.find(c => String(c.camp_id) === String(campId));
  if (!camp) {
    const error = new Error('Camp not found for this organization');
    error.status = 404;
    throw error;
  }

  const existingReport = inMemoryReports.find(r => String(r.camp_id) === String(campId));
  if (existingReport) {
    const error = new Error('A report has already been submitted for this camp');
    error.status = 409;
    throw error;
  }

  const reportId = inMemoryReports.length + 301;
  const newReport = {
    report_id: reportId,
    camp_id: Number(campId),
    submitted_by: orgAdminId,
    patients_served_count: Number(patientsServed),
    summary_notes: notes || null,
    proof_document_url: proofUrl || null,
    verified: false,
    verified_by: null,
    verified_at: null,
    submitted_at: new Date()
  };
  inMemoryReports.unshift(newReport);

  return newReport;
};

/**
 * Coordinator gets pending reports
 */
const getInMemoryPendingReports = () => {
  return inMemoryReports
    .filter(r => !r.verified)
    .map(r => {
      const camp = inMemoryCamps.find(c => c.camp_id === r.camp_id) || {};
      const ticket = inMemoryTickets.find(t => t.ticket_id === camp.ticket_id) || {};
      const org = inMemoryOrganizations.find(o => o.org_id === camp.org_id) || {
        name: 'Government Hospital Vellore',
        type: 'Hospital'
      };
      const user = Array.from(inMemoryUsers.values()).find(u => u.user_id === r.submitted_by) || {
        name: 'Dr. Priya',
        phone: '9876543220'
      };

      return {
        report_id: r.report_id,
        camp_id: r.camp_id,
        submitted_by: r.submitted_by,
        patients_served_count: r.patients_served_count,
        summary_notes: r.summary_notes,
        proof_document_url: r.proof_document_url,
        verified: r.verified,
        submitted_at: r.submitted_at,
        ticket_id: camp.ticket_id,
        org_id: camp.org_id,
        start_date: camp.start_date,
        end_date: camp.end_date,
        camp_status: camp.status,
        organization_name: org.name,
        organization_type: org.type,
        expected_patient_count: ticket.expected_patient_count || 100,
        submitted_by_name: user.name,
        submitted_by_phone: user.phone
      };
    })
    .sort((a, b) => new Date(a.submitted_at) - new Date(b.submitted_at));
};

/**
 * Coordinator verifies report
 */
const verifyInMemoryReport = (reportId, coordinatorId) => {
  const report = inMemoryReports.find(r => String(r.report_id) === String(reportId));
  if (!report) {
    const error = new Error('Report not found');
    error.status = 404;
    throw error;
  }

  if (report.verified) {
    const error = new Error('Report has already been verified');
    error.status = 409;
    throw error;
  }

  report.verified = true;
  report.verified_by = coordinatorId;
  report.verified_at = new Date();

  const camp = inMemoryCamps.find(c => c.camp_id === report.camp_id);
  if (camp) {
    camp.status = 'completed';
    const ticket = inMemoryTickets.find(t => t.ticket_id === camp.ticket_id);
    if (ticket) ticket.status = 'completed';
  }

  const funding = inMemoryFunding.find(f => f.camp_id === report.camp_id && f.status === 'committed');
  if (funding) {
    funding.status = 'utilized';
    funding.utilized_at = new Date();
  }

  return {
    report,
    camp,
    funding
  };
};

/**
 * Coordinator gets verified reports history
 */
const getInMemoryVerifiedReports = (coordinatorId) => {
  return inMemoryReports
    .filter(r => r.verified)
    .map(r => {
      const camp = inMemoryCamps.find(c => c.camp_id === r.camp_id) || {};
      const org = inMemoryOrganizations.find(o => o.org_id === camp.org_id) || {
        name: 'Government Hospital Vellore'
      };

      return {
        report_id: r.report_id,
        camp_id: r.camp_id,
        patients_served_count: r.patients_served_count,
        summary_notes: r.summary_notes,
        proof_document_url: r.proof_document_url,
        verified_at: r.verified_at,
        ticket_id: camp.ticket_id,
        organization_name: org.name
      };
    })
    .sort((a, b) => new Date(b.verified_at) - new Date(a.verified_at));
};

module.exports = {
  inMemoryUsers,
  inMemoryOrganizations,
  inMemoryCompanies,
  inMemoryTickets,
  inMemoryNotifications,
  inMemoryCamps,
  inMemoryFunding,
  inMemoryReports,
  createInMemoryNotificationForTicket,
  acceptInMemoryNotification,
  rejectInMemoryNotification,
  getInMemoryFundableCamps,
  commitInMemoryFunding,
  getInMemoryFundingHistory,
  getInMemoryOrgCamps,
  submitInMemoryReport,
  getInMemoryPendingReports,
  verifyInMemoryReport,
  getInMemoryVerifiedReports
};
