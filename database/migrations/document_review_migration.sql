-- =============================================================================
-- SIRAssist – Migration: Document Upload, Review, Versioning & Notifications
-- Run AFTER the original schema.sql (safe – does NOT drop existing tables).
-- =============================================================================
USE sirassist_db;

-- ─────────────────────────────────────────────────────────────────────────────
-- Extend Notification table with document/review links (safe ADD COLUMN)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE Notification
  ADD COLUMN IF NOT EXISTS title VARCHAR(200) NULL AFTER notification_id,
  ADD COLUMN IF NOT EXISTS document_id INT NULL AFTER request_id,
  ADD COLUMN IF NOT EXISTS review_id   INT NULL AFTER document_id;

-- ─────────────────────────────────────────────────────────────────────────────
-- Extend Document table: add review workflow columns
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE Document
  ADD COLUMN IF NOT EXISTS request_id          INT NULL AFTER citizen_id,
  ADD COLUMN IF NOT EXISTS current_version     INT NOT NULL DEFAULT 1 AFTER document_type,
  ADD COLUMN IF NOT EXISTS file_review_status  ENUM(
    'Pending Review',
    'Under Review',
    'Reviewed – No Issues Found',
    'Correction Required',
    'Additional Document Requested',
    'Unable to Review'
  ) NOT NULL DEFAULT 'Pending Review' AFTER current_version,
  ADD COLUMN IF NOT EXISTS description TEXT NULL AFTER file_review_status;

-- FK for Document.request_id → Verification_Request
-- Only add if not already there
SET @fk_exists = (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = 'sirassist_db'
    AND TABLE_NAME   = 'Document'
    AND CONSTRAINT_NAME = 'fk_doc_request'
);
SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE Document ADD CONSTRAINT fk_doc_request FOREIGN KEY (request_id) REFERENCES Verification_Request(request_id) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ─────────────────────────────────────────────────────────────────────────────
-- New Table: Document_Version  (actual file storage reference per upload)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS Document_Version (
  version_id       INT AUTO_INCREMENT PRIMARY KEY,
  document_id      INT NOT NULL,
  version_number   INT NOT NULL DEFAULT 1,
  storage_key      VARCHAR(500) NOT NULL COMMENT 'Server-side path relative to uploads dir',
  original_filename VARCHAR(255) NOT NULL,
  mime_type        VARCHAR(100) NOT NULL,
  file_size_bytes  INT NOT NULL,
  uploaded_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  uploaded_by      INT NOT NULL COMMENT 'FK → User_Account.user_id',
  CONSTRAINT fk_dv_document FOREIGN KEY (document_id) REFERENCES Document(document_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_dv_uploader FOREIGN KEY (uploaded_by) REFERENCES User_Account(user_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT uq_doc_version  UNIQUE (document_id, version_number),
  INDEX idx_dv_document (document_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─────────────────────────────────────────────────────────────────────────────
-- New Table: Document_Review  (one review per version, by assigned volunteer)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS Document_Review (
  review_id                   INT AUTO_INCREMENT PRIMARY KEY,
  version_id                  INT NOT NULL,
  volunteer_id                INT NOT NULL,
  review_decision             ENUM(
    'Reviewed – No Issues Found',
    'Correction Required',
    'Additional Document Requested',
    'Unable to Review'
  ) NOT NULL,
  issue_category              ENUM(
    'Blurry or unreadable document',
    'Incomplete document',
    'Incorrect document type',
    'Missing page',
    'File cannot be opened',
    'Other issue',
    'N/A'
  ) NOT NULL DEFAULT 'N/A',
  feedback_message            TEXT NULL,
  additional_document_request TEXT NULL,
  reviewed_at                 TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_dr_version   FOREIGN KEY (version_id)   REFERENCES Document_Version(version_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_dr_volunteer FOREIGN KEY (volunteer_id) REFERENCES Volunteer(volunteer_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT uq_review_version UNIQUE (version_id)      COMMENT 'One review per document version',
  INDEX idx_dr_volunteer (volunteer_id),
  INDEX idx_dr_version   (version_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─────────────────────────────────────────────────────────────────────────────
-- New Table: Volunteer_Assignment  (explicit doc-review assignment)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS Volunteer_Assignment (
  assignment_id  INT AUTO_INCREMENT PRIMARY KEY,
  document_id    INT NOT NULL,
  volunteer_id   INT NOT NULL,
  assigned_by    INT NOT NULL COMMENT 'FK → User_Account.user_id (admin)',
  assigned_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status         ENUM('Active','Completed','Cancelled') NOT NULL DEFAULT 'Active',
  CONSTRAINT fk_va_document  FOREIGN KEY (document_id)  REFERENCES Document(document_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_va_volunteer FOREIGN KEY (volunteer_id) REFERENCES Volunteer(volunteer_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_va_admin     FOREIGN KEY (assigned_by)  REFERENCES User_Account(user_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX idx_va_document  (document_id),
  INDEX idx_va_volunteer (volunteer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─────────────────────────────────────────────────────────────────────────────
-- Add FK on Notification.document_id  (safe – only if not present)
-- ─────────────────────────────────────────────────────────────────────────────
SET @fk2 = (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = 'sirassist_db'
    AND TABLE_NAME   = 'Notification'
    AND CONSTRAINT_NAME = 'fk_notif_document'
);
SET @sql2 = IF(@fk2 = 0,
  'ALTER TABLE Notification ADD CONSTRAINT fk_notif_document FOREIGN KEY (document_id) REFERENCES Document(document_id) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT 1'
);
PREPARE stmt2 FROM @sql2; EXECUTE stmt2; DEALLOCATE PREPARE stmt2;

-- ─────────────────────────────────────────────────────────────────────────────
-- Useful composite indexes
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_doc_citizen_status ON Document(citizen_id, file_review_status);
CREATE INDEX IF NOT EXISTS idx_notif_citizen      ON Notification(citizen_id, read_status);

-- ─────────────────────────────────────────────────────────────────────────────
-- Seed: Demo volunteer assignment for testing (only if no assignment exists)
-- ─────────────────────────────────────────────────────────────────────────────
-- (Assignments are created via the Admin API in production)

SELECT 'Migration complete. New tables: Document_Version, Document_Review, Volunteer_Assignment.' AS status;
