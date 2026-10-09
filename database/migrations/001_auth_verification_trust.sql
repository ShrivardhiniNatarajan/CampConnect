-- Migration for an existing campconnect database (MySQL 8.0+).
-- Adds OTP phone verification, admin approval flags and trust-score storage.
-- Existing users/orgs/companies are grandfathered in as verified/approved.
USE campconnect;

ALTER TABLE users
  MODIFY role ENUM('social_worker','org_admin','csr_admin','coordinator','admin') NOT NULL,
  ADD COLUMN phone_verified BOOLEAN NOT NULL DEFAULT FALSE AFTER role,
  ADD COLUMN account_status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending' AFTER phone_verified,
  ADD COLUMN trust_score DECIMAL(5,2) NULL,
  ADD COLUMN trust_details JSON NULL,
  ADD COLUMN trust_updated_at TIMESTAMP NULL;

UPDATE users SET phone_verified = TRUE, account_status = 'approved';

ALTER TABLE organizations
  ADD COLUMN verified BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN verified_by INT NULL,
  ADD COLUMN verified_at TIMESTAMP NULL;
UPDATE organizations SET verified = TRUE, verified_at = CURRENT_TIMESTAMP;

ALTER TABLE companies
  ADD COLUMN verified BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN verified_by INT NULL,
  ADD COLUMN verified_at TIMESTAMP NULL;
UPDATE companies SET verified = TRUE, verified_at = CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS otp_codes (
  otp_id      INT AUTO_INCREMENT PRIMARY KEY,
  phone       VARCHAR(15) NOT NULL,
  code_hash   VARCHAR(255) NOT NULL,
  expires_at  TIMESTAMP NOT NULL,
  attempts    INT NOT NULL DEFAULT 0,
  consumed    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_otp_phone (phone, created_at)
) ENGINE=InnoDB;
