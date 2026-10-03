-- =============================================================================
-- SIRAssist – Citizen Assistance and Verification Management System
-- Database Schema (MySQL 8.0+)
-- Academic Project Disclaimer: Not an official government/EC database.
-- =============================================================================

CREATE DATABASE IF NOT EXISTS sirassist_db;
USE sirassist_db;

-- Drop tables in reverse order of foreign key dependencies
DROP TABLE IF EXISTS Notification;
DROP TABLE IF EXISTS Assistance_Request;
DROP TABLE IF EXISTS Status_History;
DROP TABLE IF EXISTS Request_Document;
DROP TABLE IF EXISTS Verification_Request;
DROP TABLE IF EXISTS Document;
DROP TABLE IF EXISTS Document_Requirement;
DROP TABLE IF EXISTS Voter_Record;
DROP TABLE IF EXISTS Polling_Station;
DROP TABLE IF EXISTS Constituency;
DROP TABLE IF EXISTS User_Account;
DROP TABLE IF EXISTS Volunteer;
DROP TABLE IF EXISTS Area;
DROP TABLE IF EXISTS Citizen;
DROP TABLE IF EXISTS Address;

-- 1. Address Entity
CREATE TABLE Address (
    address_id INT AUTO_INCREMENT PRIMARY KEY,
    house_number VARCHAR(50) NOT NULL,
    street VARCHAR(150) NOT NULL,
    village VARCHAR(100) NOT NULL,
    taluk VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL DEFAULT 'Karnataka',
    pin_code VARCHAR(10) NOT NULL,
    CONSTRAINT chk_pincode CHECK (CHAR_LENGTH(pin_code) = 6 AND pin_code REGEXP '^[0-9]+$')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Area Entity
CREATE TABLE Area (
    area_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    taluk VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL DEFAULT 'Karnataka',
    pin_code VARCHAR(10) NOT NULL,
    CONSTRAINT uq_area_name_pin UNIQUE (name, pin_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Citizen Entity
CREATE TABLE Citizen (
    citizen_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender ENUM('Male', 'Female', 'Other', 'Prefer not to say') DEFAULT 'Prefer not to say',
    mobile VARCHAR(15) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    address_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_citizen_address FOREIGN KEY (address_id) REFERENCES Address(address_id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Volunteer Entity
CREATE TABLE Volunteer (
    volunteer_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    mobile VARCHAR(15) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    area_id INT NULL,
    availability ENUM('Available', 'Busy', 'Unavailable') DEFAULT 'Available',
    skills VARCHAR(255) NOT NULL DEFAULT 'Digital Assistance, Form Filling',
    verification_status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Approved',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_volunteer_area FOREIGN KEY (area_id) REFERENCES Area(area_id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. User_Account Entity (Authentication & Role Management)
CREATE TABLE User_Account (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('CITIZEN', 'VOLUNTEER', 'ADMIN') NOT NULL DEFAULT 'CITIZEN',
    citizen_id INT NULL UNIQUE,
    volunteer_id INT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN DEFAULT TRUE,
    CONSTRAINT fk_user_citizen FOREIGN KEY (citizen_id) REFERENCES Citizen(citizen_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_user_volunteer FOREIGN KEY (volunteer_id) REFERENCES Volunteer(volunteer_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Constituency Entity
CREATE TABLE Constituency (
    constituency_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    district VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL DEFAULT 'Karnataka'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Polling_Station Entity
CREATE TABLE Polling_Station (
    polling_station_id INT AUTO_INCREMENT PRIMARY KEY,
    station_name VARCHAR(150) NOT NULL,
    address_id INT NULL,
    constituency_id INT NOT NULL,
    CONSTRAINT fk_polling_address FOREIGN KEY (address_id) REFERENCES Address(address_id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_polling_constituency FOREIGN KEY (constituency_id) REFERENCES Constituency(constituency_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Voter_Record Entity (Reference Academic Representation)
CREATE TABLE Voter_Record (
    voter_id INT AUTO_INCREMENT PRIMARY KEY,
    citizen_id INT NOT NULL,
    epic_reference VARCHAR(50) NOT NULL UNIQUE,
    constituency_id INT NOT NULL,
    polling_station_id INT NOT NULL,
    record_status ENUM('Verified', 'Pending_Update', 'Under_Review', 'Details_Mismatch') DEFAULT 'Verified',
    last_checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_voter_citizen FOREIGN KEY (citizen_id) REFERENCES Citizen(citizen_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_voter_constituency FOREIGN KEY (constituency_id) REFERENCES Constituency(constituency_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_voter_station FOREIGN KEY (polling_station_id) REFERENCES Polling_Station(polling_station_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. Document_Requirement Entity
CREATE TABLE Document_Requirement (
    requirement_id INT AUTO_INCREMENT PRIMARY KEY,
    request_type VARCHAR(100) NOT NULL,
    document_type VARCHAR(100) NOT NULL,
    mandatory BOOLEAN DEFAULT TRUE,
    description TEXT,
    source_reference VARCHAR(255) DEFAULT 'ECI Academic Guidelines Checklist 2026',
    active BOOLEAN DEFAULT TRUE,
    CONSTRAINT uq_req_type_doc UNIQUE (request_type, document_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. Document Entity
CREATE TABLE Document (
    document_id INT AUTO_INCREMENT PRIMARY KEY,
    citizen_id INT NOT NULL,
    document_type VARCHAR(100) NOT NULL,
    document_reference_masked VARCHAR(100) NOT NULL,
    issue_date DATE NOT NULL,
    verification_status ENUM('Pending', 'Verified', 'Rejected') DEFAULT 'Pending',
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_document_citizen FOREIGN KEY (citizen_id) REFERENCES Citizen(citizen_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 11. Verification_Request Entity
CREATE TABLE Verification_Request (
    request_id INT AUTO_INCREMENT PRIMARY KEY,
    citizen_id INT NOT NULL,
    voter_id INT NULL,
    request_type ENUM('Record Verification', 'Correction Assistance', 'Document Clarification', 'Missing Record Assistance', 'General Assistance') NOT NULL,
    submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    current_status ENUM('DRAFT', 'SUBMITTED', 'DOCUMENTS_PENDING', 'DOCUMENTS_SUBMITTED', 'UNDER_REVIEW', 'RESOLVED', 'CANCELLED') DEFAULT 'SUBMITTED',
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_req_citizen FOREIGN KEY (citizen_id) REFERENCES Citizen(citizen_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_req_voter FOREIGN KEY (voter_id) REFERENCES Voter_Record(voter_id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 12. Request_Document Entity (Junction Table M:N)
CREATE TABLE Request_Document (
    request_id INT NOT NULL,
    document_id INT NOT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (request_id, document_id),
    CONSTRAINT fk_rd_request FOREIGN KEY (request_id) REFERENCES Verification_Request(request_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_rd_document FOREIGN KEY (document_id) REFERENCES Document(document_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 13. Status_History Entity
CREATE TABLE Status_History (
    history_id INT AUTO_INCREMENT PRIMARY KEY,
    request_id INT NOT NULL,
    old_status VARCHAR(50) NOT NULL,
    new_status VARCHAR(50) NOT NULL,
    changed_by VARCHAR(100) NOT NULL DEFAULT 'System / Admin',
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    remarks TEXT,
    CONSTRAINT fk_sh_request FOREIGN KEY (request_id) REFERENCES Verification_Request(request_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 14. Assistance_Request Entity
CREATE TABLE Assistance_Request (
    assistance_id INT AUTO_INCREMENT PRIMARY KEY,
    citizen_id INT NOT NULL,
    volunteer_id INT NULL,
    request_type VARCHAR(100) NOT NULL,
    request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED') DEFAULT 'PENDING',
    priority ENUM('Low', 'Medium', 'High') DEFAULT 'Medium',
    notes TEXT,
    assigned_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    CONSTRAINT fk_ar_citizen FOREIGN KEY (citizen_id) REFERENCES Citizen(citizen_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_ar_volunteer FOREIGN KEY (volunteer_id) REFERENCES Volunteer(volunteer_id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 15. Notification Entity
CREATE TABLE Notification (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    citizen_id INT NOT NULL,
    request_id INT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_status BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_notif_citizen FOREIGN KEY (citizen_id) REFERENCES Citizen(citizen_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_notif_request FOREIGN KEY (request_id) REFERENCES Verification_Request(request_id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================================================
-- INDEXES FOR QUERY OPTIMIZATION
-- =============================================================================
CREATE INDEX idx_citizen_email ON Citizen(email);
CREATE INDEX idx_citizen_mobile ON Citizen(mobile);
CREATE INDEX idx_user_username ON User_Account(username);
CREATE INDEX idx_voter_epic ON Voter_Record(epic_reference);
CREATE INDEX idx_req_status ON Verification_Request(current_status);
CREATE INDEX idx_req_citizen ON Verification_Request(citizen_id);
CREATE INDEX idx_req_voter ON Verification_Request(voter_id);
CREATE INDEX idx_volunteer_area ON Volunteer(area_id);
CREATE INDEX idx_volunteer_availability ON Volunteer(availability);
CREATE INDEX idx_assistance_status ON Assistance_Request(status);
