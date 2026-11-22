-- =============================================================================
-- SIRAssist – Component 8 Database Constraints & Enhancements Migration
-- Department of CSE (AI & ML), RV College of Engineering
-- =============================================================================

USE sirassist_db;

-- 1. Add Unique Constraint on Document table to prevent duplicate identity entries per citizen
-- Prevents duplicate documents at the relational storage level even if API validation is bypassed
ALTER TABLE Document
ADD CONSTRAINT uq_citizen_doc UNIQUE (citizen_id, document_type, document_reference_masked);

-- 2. Verify and enforce CHECK constraint on mobile number formatting in Citizen table
-- Ensures citizen mobile contains valid 10 digits
ALTER TABLE Citizen
ADD CONSTRAINT chk_citizen_mobile CHECK (CHAR_LENGTH(mobile) = 10 AND mobile REGEXP '^[6-9][0-9]{9}$');

-- 3. Verify and enforce CHECK constraint on Volunteer mobile
ALTER TABLE Volunteer
ADD CONSTRAINT chk_volunteer_mobile CHECK (CHAR_LENGTH(mobile) = 10 AND mobile REGEXP '^[6-9][0-9]{9}$');

-- Rollback instructions:
-- ALTER TABLE Document DROP INDEX uq_citizen_doc;
-- ALTER TABLE Citizen DROP CHECK chk_citizen_mobile;
-- ALTER TABLE Volunteer DROP CHECK chk_volunteer_mobile;
