-- ============================================
-- CampConnect Database Schema
-- MySQL 8.0+
-- ============================================

USE campconnect;

-- ============================================
-- 1. USERS
-- ============================================
CREATE TABLE users (
  user_id        INT AUTO_INCREMENT PRIMARY KEY,
  name           VARCHAR(100) NOT NULL,
  phone          VARCHAR(15) NOT NULL UNIQUE,
  email          VARCHAR(100) UNIQUE,
  password_hash  VARCHAR(255) NOT NULL,
  role           ENUM('social_worker','org_admin','csr_admin','coordinator') NOT NULL,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================
-- 2. ORGANIZATIONS
-- ============================================
CREATE TABLE organizations (
  org_id          INT AUTO_INCREMENT PRIMARY KEY,
  org_admin_id    INT NOT NULL,
  name            VARCHAR(150) NOT NULL,
  type            ENUM('NGO','Hospital') NOT NULL,
  location        POINT NOT NULL SRID 4326,
  pincode         VARCHAR(10) NOT NULL,
  specialization  VARCHAR(150),
  capacity        INT DEFAULT 0,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (org_admin_id) REFERENCES users(user_id),
  SPATIAL INDEX (location)
) ENGINE=InnoDB;

-- ============================================
-- 3. PINCODE_LOOKUP
-- ============================================
CREATE TABLE pincode_lookup (
  pincode    VARCHAR(10) PRIMARY KEY,
  latitude   DECIMAL(9,6) NOT NULL,
  longitude  DECIMAL(9,6) NOT NULL,
  district   VARCHAR(100),
  state      VARCHAR(100)
) ENGINE=InnoDB;

-- ============================================
-- 4. TICKETS
-- ============================================
CREATE TABLE tickets (
  ticket_id             INT AUTO_INCREMENT PRIMARY KEY,
  social_worker_id      INT NOT NULL,
  gps_location          POINT NOT NULL SRID 4326,
  pincode               VARCHAR(10) NOT NULL,
  expected_patient_count INT NOT NULL,
  health_focus_area     VARCHAR(150) NOT NULL,
  preferred_date_from   DATE NOT NULL,
  preferred_date_to     DATE NOT NULL,
  urgency               ENUM('low','medium','high') NOT NULL DEFAULT 'medium',
  village_head_consent  ENUM('pending','confirmed','declined') NOT NULL DEFAULT 'pending',
  venue_available       BOOLEAN NOT NULL DEFAULT FALSE,
  venue_type            ENUM('community_hall','school','temple','open_ground','other'),
  local_contact_name    VARCHAR(100) NOT NULL,
  local_contact_phone   VARCHAR(15) NOT NULL,
  electricity_available BOOLEAN DEFAULT FALSE,
  water_available       BOOLEAN DEFAULT FALSE,
  local_volunteer_count INT DEFAULT 0,
  additional_details    JSON,
  status                ENUM('open','matched','accepted','funded','completed','rejected_all')
                         NOT NULL DEFAULT 'open',
  created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (social_worker_id) REFERENCES users(user_id),
  SPATIAL INDEX (gps_location)
) ENGINE=InnoDB;

-- ============================================
-- 5. TICKET_NOTIFICATIONS
-- ============================================
CREATE TABLE ticket_notifications (
  notif_id      INT AUTO_INCREMENT PRIMARY KEY,
  ticket_id     INT NOT NULL,
  org_id        INT NOT NULL,
  distance_km   DECIMAL(6,2) NOT NULL,
  status        ENUM('notified','accepted','rejected','expired') NOT NULL DEFAULT 'notified',
  notified_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  responded_at  TIMESTAMP NULL,
  FOREIGN KEY (ticket_id) REFERENCES tickets(ticket_id),
  FOREIGN KEY (org_id) REFERENCES organizations(org_id),
  UNIQUE KEY unique_ticket_org (ticket_id, org_id)
) ENGINE=InnoDB;

-- ============================================
-- 6. CAMPS
-- ============================================
CREATE TABLE camps (
  camp_id     INT AUTO_INCREMENT PRIMARY KEY,
  ticket_id   INT NOT NULL UNIQUE,
  org_id      INT NOT NULL,
  start_date  DATE NOT NULL,
  end_date    DATE NOT NULL,
  status      ENUM('planned','ongoing','completed','cancelled') NOT NULL DEFAULT 'planned',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES tickets(ticket_id),
  FOREIGN KEY (org_id) REFERENCES organizations(org_id)
) ENGINE=InnoDB;

-- ============================================
-- 7. COMPANIES
-- ============================================
CREATE TABLE companies (
  company_id            INT AUTO_INCREMENT PRIMARY KEY,
  csr_admin_id          INT NOT NULL,
  name                  VARCHAR(150) NOT NULL,
  industry              VARCHAR(100),
  csr_budget_total      DECIMAL(12,2) NOT NULL DEFAULT 0,
  csr_budget_committed  DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (csr_admin_id) REFERENCES users(user_id),
  CHECK (csr_budget_committed <= csr_budget_total)
) ENGINE=InnoDB;

-- ============================================
-- 8. CAMP_FUNDING
-- ============================================
CREATE TABLE camp_funding (
  funding_id        INT AUTO_INCREMENT PRIMARY KEY,
  company_id        INT NOT NULL,
  camp_id           INT NOT NULL,
  amount_committed  DECIMAL(12,2) NOT NULL,
  status            ENUM('committed','utilized','cancelled') NOT NULL DEFAULT 'committed',
  committed_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  utilized_at       TIMESTAMP NULL,
  FOREIGN KEY (company_id) REFERENCES companies(company_id),
  FOREIGN KEY (camp_id) REFERENCES camps(camp_id)
) ENGINE=InnoDB;

-- ============================================
-- 9. CAMP_REPORTS
-- ============================================
CREATE TABLE camp_reports (
  report_id             INT AUTO_INCREMENT PRIMARY KEY,
  camp_id               INT NOT NULL UNIQUE,
  submitted_by          INT NOT NULL,
  patients_served_count INT NOT NULL,
  summary_notes         TEXT,
  proof_document_url    VARCHAR(500),
  verified              BOOLEAN NOT NULL DEFAULT FALSE,
  verified_by           INT NULL,
  verified_at           TIMESTAMP NULL,
  submitted_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (camp_id) REFERENCES camps(camp_id),
  FOREIGN KEY (submitted_by) REFERENCES users(user_id),
  FOREIGN KEY (verified_by) REFERENCES users(user_id)
) ENGINE=InnoDB;