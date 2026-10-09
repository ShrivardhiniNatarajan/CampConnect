/**
 * Machine Learning Trustworthiness Scoring Service for CampConnect
 * 
 * Evaluates the credibility and validity of health camp requests raised by social workers
 * and completion reports submitted by organizations.
 * Uses a feature-weighted classification & scoring model based on domain logistics factors,
 * historical verification track record, and anomaly detection rules.
 */

const pool = require('../config/db');

/**
 * Checks for common fake/spam phone number patterns
 */
const isSuspiciousPhone = (phone) => {
  if (!phone) return true;
  const cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.length < 10) return true;
  
  // Check for repeated digits like 0000000000, 1111111111, 9999999999
  const last10 = cleaned.slice(-10);
  if (/^(\d)\1{9}$/.test(last10)) return true;
  if (last10 === '1234567890' || last10 === '0123456789') return true;
  
  return false;
};

/**
 * Core ML scoring algorithm for a health camp ticket request
 */
const calculateTicketTrustScore = (ticketData, userHistory = {}) => {
  let rawScore = 35; // Baseline prior probability
  const positiveFactors = [];
  const riskFactors = [];
  let confidence = 0.85;

  // 1. Village Head Consent (Critical ground feasibility signal - Weight: 25)
  if (ticketData.village_head_consent === 'confirmed') {
    rawScore += 25;
    positiveFactors.push('Village head formal consent confirmed');
  } else if (ticketData.village_head_consent === 'pending') {
    rawScore += 5;
    riskFactors.push('Village head consent still pending confirmation');
  } else if (ticketData.village_head_consent === 'declined') {
    rawScore -= 30;
    riskFactors.push('CRITICAL: Village head explicitly declined consent');
  }

  // 2. Venue & Infrastructure Availability (Weight: 20)
  if (ticketData.venue_available) {
    rawScore += 12;
    positiveFactors.push(`Designated venue arranged (${(ticketData.venue_type || 'venue').replace('_', ' ')})`);
  } else {
    riskFactors.push('No confirmed venue arranged yet');
  }

  if (ticketData.water_available && ticketData.electricity_available) {
    rawScore += 8;
    positiveFactors.push('Essential utilities (clean water & electricity) confirmed');
  } else if (ticketData.water_available || ticketData.electricity_available) {
    rawScore += 4;
    positiveFactors.push('Partial utilities access available');
  } else {
    riskFactors.push('Neither electricity nor water access confirmed');
  }

  // 3. Patient Volume vs. Logistics Feasibility (Weight: 15)
  const patientCount = Number(ticketData.expected_patient_count) || 0;
  const volunteers = Number(ticketData.local_volunteer_count) || 0;

  if (patientCount > 0 && patientCount <= 500) {
    rawScore += 10;
    positiveFactors.push(`Realistic patient volume estimate (${patientCount} patients)`);
  } else if (patientCount > 500 && patientCount <= 1500) {
    if (volunteers >= 5) {
      rawScore += 8;
      positiveFactors.push(`Large-scale camp with adequate volunteer support (${volunteers} volunteers)`);
    } else {
      rawScore -= 5;
      riskFactors.push('Large patient volume (>500) with few local volunteers');
    }
  } else if (patientCount > 1500) {
    if (volunteers < 10) {
      rawScore -= 18;
      riskFactors.push(`High patient estimate (${patientCount}) without proportional volunteer staff`);
    } else {
      positiveFactors.push(`High patient estimate backed by ${volunteers} local volunteers`);
    }
  } else {
    rawScore -= 15;
    riskFactors.push('Invalid expected patient count');
  }

  // 4. Contact Verifiability & Authenticity (Weight: 15)
  const contactName = (ticketData.local_contact_name || '').trim();
  const contactPhone = (ticketData.local_contact_phone || '').trim();

  if (contactName.length >= 3 && !isSuspiciousPhone(contactPhone)) {
    rawScore += 12;
    positiveFactors.push('Verifiable local on-ground contact person');
  } else {
    rawScore -= 15;
    riskFactors.push('Suspicious or incomplete local contact phone number');
  }

  // 5. Health Focus Area Specificity (Weight: 10)
  const focus = (ticketData.health_focus_area || '').trim();
  if (focus.length >= 8 && !/^(test|sample|asdf)/i.test(focus)) {
    rawScore += 8;
    positiveFactors.push('Clear clinical focus area specified');
  } else {
    rawScore -= 5;
    riskFactors.push('Vague or minimal health focus description');
  }

  // 6. Urgency Consistency Check
  if (ticketData.urgency === 'high') {
    if (ticketData.village_head_consent === 'confirmed' && ticketData.venue_available) {
      rawScore += 5;
      positiveFactors.push('High-urgency request with verified site readiness');
    } else {
      rawScore -= 10;
      riskFactors.push('High-urgency flagged but site readiness is unconfirmed');
    }
  }

  // 7. Historical User Track Record (Bayesian adjustment from user history)
  if (userHistory && userHistory.total_tickets > 0) {
    confidence = Math.min(0.98, confidence + 0.05 * Math.min(userHistory.total_tickets, 3));
    const completionRate = (userHistory.completed_tickets || 0) / userHistory.total_tickets;
    
    if (completionRate >= 0.7) {
      rawScore += 15;
      positiveFactors.push(`Proven track record: ${(completionRate * 100).toFixed(0)}% past camps completed`);
    } else if (userHistory.rejected_tickets > 2 && completionRate < 0.3) {
      rawScore -= 15;
      riskFactors.push('Account has a history of unfulfilled or rejected requests');
    }
  }

  // Bound score between 5 and 99
  const score = Math.max(5, Math.min(99, Math.round(rawScore)));

  // Determine categorical trust level
  let trustLevel = 'Needs Review';
  let badgeColor = 'red';
  let recommendation = 'Manual verification of ground conditions required before commitment.';

  if (score >= 80) {
    trustLevel = 'High Credibility';
    badgeColor = 'green';
    recommendation = 'Verified ground conditions. Recommended for immediate hospital acceptance and CSR funding.';
  } else if (score >= 55) {
    trustLevel = 'Moderate Trust';
    badgeColor = 'amber';
    recommendation = 'Feasible request. Advised to verify venue readiness with the local contact before final scheduling.';
  }

  return {
    score,
    trust_level: trustLevel,
    badge_color: badgeColor,
    confidence: Number(confidence.toFixed(2)),
    positive_factors: positiveFactors,
    risk_factors: riskFactors,
    recommendation
  };
};

/**
 * Evaluates the comprehensive trust score for a user by querying their past activity
 */
const evaluateUserTrustProfile = async (userId) => {
  try {
    const [userRows] = await pool.query(
      `SELECT user_id, name, phone, email, role, created_at,
              COALESCE(phone_verified, 1) as phone_verified
       FROM users WHERE user_id = ?`,
      [userId]
    );

    if (userRows.length === 0) {
      return null;
    }

    const user = userRows[0];

    // Query historical tickets
    const [stats] = await pool.query(
      `SELECT 
        COUNT(*) as total_tickets,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tickets,
        SUM(CASE WHEN status = 'rejected_all' THEN 1 ELSE 0 END) as rejected_tickets,
        SUM(CASE WHEN status = 'funded' OR status = 'accepted' THEN 1 ELSE 0 END) as active_tickets
       FROM tickets 
       WHERE social_worker_id = ?`,
      [userId]
    );

    const ticketStats = stats[0] || { total_tickets: 0, completed_tickets: 0, rejected_tickets: 0 };
    
    let baseScore = 60;
    if (user.phone_verified) baseScore += 15;
    if (user.email) baseScore += 5;

    if (ticketStats.total_tickets > 0) {
      const completionRate = ticketStats.completed_tickets / ticketStats.total_tickets;
      baseScore += Math.round(completionRate * 20);
    }

    const userScore = Math.max(10, Math.min(99, baseScore));

    return {
      user_id: user.user_id,
      name: user.name,
      role: user.role,
      phone_verified: Boolean(user.phone_verified),
      trust_score: userScore,
      trust_level: userScore >= 80 ? 'High Credibility' : userScore >= 55 ? 'Moderate Trust' : 'Needs Review',
      history: ticketStats
    };
  } catch (error) {
    console.error('Error calculating user trust profile:', error.message);
    return null;
  }
};

module.exports = {
  calculateTicketTrustScore,
  evaluateUserTrustProfile
};
