-- =============================================================================
-- SIRAssist – Migration: Allow NULL for Volunteer_Assignment.assigned_by
-- Adds assignment_method ('AUTO', 'MANUAL') to distinguish automatic vs manual assignments
-- Safely modifies Document.file_review_status to include 'Pending Assignment'
-- Preserves all existing FK constraints and data.
-- =============================================================================
USE sirassist_db;

-- 1. Modify assigned_by to allow NULL (foreign key fk_va_admin is preserved)
ALTER TABLE Volunteer_Assignment
  MODIFY COLUMN assigned_by INT NULL;

-- 2. Add assignment_method column if not present
SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = 'sirassist_db'
    AND TABLE_NAME   = 'Volunteer_Assignment'
    AND COLUMN_NAME  = 'assignment_method'
);
SET @sql_method = IF(@col_exists = 0,
  "ALTER TABLE Volunteer_Assignment ADD COLUMN assignment_method ENUM('AUTO', 'MANUAL') NOT NULL DEFAULT 'MANUAL' AFTER status",
  'SELECT 1'
);
PREPARE stmt_method FROM @sql_method; EXECUTE stmt_method; DEALLOCATE PREPARE stmt_method;

-- 3. Extend Document.file_review_status to include 'Pending Assignment'
ALTER TABLE Document
  MODIFY COLUMN file_review_status ENUM(
    'Pending Assignment',
    'Pending Review',
    'Under Review',
    'Reviewed – No Issues Found',
    'Correction Required',
    'Additional Document Requested',
    'Unable to Review'
  ) NOT NULL DEFAULT 'Pending Review';
