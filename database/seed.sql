-- =============================================================================
-- SIRAssist – Realistic Fictional Seed Data
-- Database: sirassist_db
-- Note: All passwords are set to 'password123' (bcrypt hash: $2a$10$7R9rG0M5s1mC7fV8TzQ.uO1dK4rZ3eH7iB2wN6xP8qR0sT2uV4wX6)
-- Admin Username: admin | Password: password123
-- =============================================================================

USE sirassist_db;

-- 1. Insert Addresses (10 Records)
INSERT INTO Address (address_id, house_number, street, village, taluk, district, state, pin_code) VALUES
(1, '#45, 2nd Main', 'Vijayanagar', 'Bengaluru Urban', 'Bengaluru South', 'Bengaluru', 'Karnataka', '560040'),
(2, '#102, Green Glen Layout', 'Bellandur', 'Bengaluru Urban', 'Bengaluru East', 'Bengaluru', 'Karnataka', '560103'),
(3, '#12, Church Street', 'Shanthi Nagar', 'Bengaluru Urban', 'Bengaluru Central', 'Bengaluru', 'Karnataka', '560001'),
(4, '#88, Gandhi Bazaar', 'Basavanagudi', 'Bengaluru Urban', 'Bengaluru South', 'Bengaluru', 'Karnataka', '560004'),
(5, '#301, Lakeview Apts', 'Hebbal', 'Bengaluru Urban', 'Bengaluru North', 'Bengaluru', 'Karnataka', '560024'),
(6, '#14/B, Railway Station Road', 'Mandya Town', 'Mandya', 'Mandya', 'Mandya', 'Karnataka', '571401'),
(7, '#77, Kuvempu Nagar', 'Mysuru South', 'Mysuru', 'Mysuru', 'Mysuru', 'Karnataka', '570023'),
(8, '#5, Temple Street', 'Udupi Town', 'Udupi', 'Udupi', 'Udupi', 'Karnataka', '576101'),
(9, '#209, MG Road', 'Hubballi Central', 'Hubballi', 'Hubballi', 'Dharwad', 'Karnataka', '580020'),
(10, '#55, Fort Area', 'Belagavi City', 'Belagavi', 'Belagavi', 'Belagavi', 'Karnataka', '590001');

-- 2. Insert Areas (5 Records)
INSERT INTO Area (area_id, name, taluk, district, state, pin_code) VALUES
(1, 'Bengaluru South Zone', 'Bengaluru South', 'Bengaluru', 'Karnataka', '560040'),
(2, 'Bengaluru East Tech Zone', 'Bengaluru East', 'Bengaluru', 'Karnataka', '560103'),
(3, 'Bengaluru North Zone', 'Bengaluru North', 'Bengaluru', 'Karnataka', '560024'),
(4, 'Mysuru City Central', 'Mysuru', 'Mysuru', 'Karnataka', '570023'),
(5, 'Mandya Rural Zone', 'Mandya', 'Mandya', 'Karnataka', '571401');

-- 3. Insert Constituencies (5 Records)
INSERT INTO Constituency (constituency_id, name, district, state) VALUES
(1, '168-Vijayanagar Assembly', 'Bengaluru', 'Karnataka'),
(2, '174-Mahadevapura Assembly', 'Bengaluru', 'Karnataka'),
(3, '160-Sarvagnanagar Assembly', 'Bengaluru', 'Karnataka'),
(4, '216-Mysuru Urban Assembly', 'Mysuru', 'Karnataka'),
(5, '189-Mandya Rural Assembly', 'Mandya', 'Karnataka');

-- 4. Insert Polling Stations (8 Records)
INSERT INTO Polling_Station (polling_station_id, station_name, address_id, constituency_id) VALUES
(1, 'Govt Primary School Room 1, Vijayanagar', 1, 1),
(2, 'St. John High School Auditorium, Vijayanagar', 1, 1),
(3, 'Govt Composite PU College, Bellandur', 2, 2),
(4, 'BBMP Community Hall, Mahadevapura', 2, 2),
(5, 'National High School Hall, Basavanagudi', 4, 3),
(6, 'Govt Model Higher Primary School, Hebbal', 5, 3),
(7, 'Town Hall PU College, Mysuru', 7, 4),
(8, 'Rural Farmers Co-op Hall, Mandya', 6, 5);

-- 5. Insert Citizens (20 Records)
INSERT INTO Citizen (citizen_id, name, date_of_birth, gender, mobile, email, address_id, created_at) VALUES
(1, 'Ramesh Kumar', '1965-04-12', 'Male', '9845012345', 'ramesh.k@example.com', 1, '2026-01-10 09:00:00'),
(2, 'Sunitha Rao', '1972-08-25', 'Female', '9845023456', 'sunitha.rao@example.com', 1, '2026-01-12 10:30:00'),
(3, 'Ananth Padmanabha', '1950-11-05', 'Male', '9845034567', 'ananth.p@example.com', 2, '2026-01-15 11:15:00'),
(4, 'Lakshmi Devi', '1958-03-30', 'Female', '9845045678', 'lakshmi.d@example.com', 2, '2026-01-18 14:20:00'),
(5, 'Vikram Sharma', '1990-07-19', 'Male', '9845056789', 'vikram.s@example.com', 3, '2026-01-20 16:45:00'),
(6, 'Priya Nair', '1995-12-01', 'Female', '9845067890', 'priya.nair@example.com', 3, '2026-01-22 09:30:00'),
(7, 'Suresh Gowda', '1968-01-14', 'Male', '9845078901', 'suresh.g@example.com', 4, '2026-01-25 10:00:00'),
(8, 'Kavitha Hegde', '1982-05-18', 'Female', '9845089012', 'kavitha.h@example.com', 4, '2026-01-28 11:40:00'),
(9, 'Basavaraj Patil', '1978-09-09', 'Male', '9845090123', 'basavaraj.p@example.com', 5, '2026-02-01 12:10:00'),
(10, 'Deepa Kulkarni', '1988-06-22', 'Female', '9845101234', 'deepa.k@example.com', 5, '2026-02-03 15:30:00'),
(11, 'Manjunath Swamy', '1955-02-14', 'Male', '9845112345', 'manju.swamy@example.com', 6, '2026-02-05 08:50:00'),
(12, 'Sujatha Bhat', '1962-10-10', 'Female', '9845123456', 'sujatha.b@example.com', 6, '2026-02-08 09:40:00'),
(13, 'Ganesh Prasad', '1984-11-28', 'Male', '9845134567', 'ganesh.p@example.com', 7, '2026-02-10 14:00:00'),
(14, 'Shalini Shenoy', '1992-04-03', 'Female', '9845145678', 'shalini.s@example.com', 7, '2026-02-12 16:10:00'),
(15, 'Narayana Murthy', '1948-08-20', 'Male', '9845156789', 'narayana.m@example.com', 8, '2026-02-15 10:20:00'),
(16, 'Radha Shenoy', '1952-12-15', 'Female', '9845167890', 'radha.s@example.com', 8, '2026-02-18 11:30:00'),
(17, 'Chandrashekar B', '1970-03-05', 'Male', '9845178901', 'chandra.b@example.com', 9, '2026-02-20 13:45:00'),
(18, 'Meenakshi Iyer', '1985-07-07', 'Female', '9845189012', 'meena.i@example.com', 9, '2026-02-22 15:00:00'),
(19, 'Pradeep Kumar', '1998-09-30', 'Male', '9845190123', 'pradeep.k@example.com', 10, '2026-02-25 09:15:00'),
(20, 'Bhavana Shetty', '2001-01-12', 'Female', '9845201234', 'bhavana.s@example.com', 10, '2026-02-28 10:50:00');

-- 6. Insert Volunteers (10 Records)
INSERT INTO Volunteer (volunteer_id, name, mobile, email, area_id, availability, skills, verification_status, created_at) VALUES
(1, 'Arjun Reddy', '9900100001', 'arjun.v@example.com', 1, 'Available', 'Form Filling, Senior Citizen Support', 'Approved', '2026-01-05 10:00:00'),
(2, 'Divya Murthy', '9900100002', 'divya.v@example.com', 1, 'Available', 'Digital Assistance, Document Check', 'Approved', '2026-01-05 11:00:00'),
(3, 'Kiran Kumar', '9900100003', 'kiran.v@example.com', 2, 'Available', 'Digital Guidance, Portal Help', 'Approved', '2026-01-06 09:30:00'),
(4, 'Sneha Deshmukh', '9900100004', 'sneha.v@example.com', 2, 'Busy', 'Language Translation, Form Filling', 'Approved', '2026-01-06 14:00:00'),
(5, 'Praveen Naik', '9900100005', 'praveen.v@example.com', 3, 'Available', 'Home Visit Support, Verification Help', 'Approved', '2026-01-07 10:15:00'),
(6, 'Aishwarya Raj', '9900100006', 'aishwarya.v@example.com', 3, 'Available', 'Senior Citizen Support, Digital Assistance', 'Approved', '2026-01-08 12:00:00'),
(7, 'Mahesh Gowda', '9900100007', 'mahesh.v@example.com', 4, 'Available', 'Local Language Help, Document Scanning', 'Approved', '2026-01-10 15:30:00'),
(8, 'Swathi Hegde', '9900100008', 'swathi.v@example.com', 4, 'Busy', 'General Guidance, Form Review', 'Approved', '2026-01-12 09:00:00'),
(9, 'Raghavendra K', '9900100009', 'raghu.v@example.com', 5, 'Available', 'Rural Doorstep Assistance, Form Filling', 'Approved', '2026-01-15 11:45:00'),
(10, 'Nisha Shetty', '9900100010', 'nisha.v@example.com', 5, 'Unavailable', 'Form Review, Document Check', 'Pending', '2026-01-18 16:20:00');

-- 7. Insert User Accounts (Admin, Volunteers, Citizens)
-- Default bcrypt hash for 'password123': $2a$10$7R9rG0M5s1mC7fV8TzQ.uO1dK4rZ3eH7iB2wN6xP8qR0sT2uV4wX6
INSERT INTO User_Account (user_id, username, email, password_hash, role, citizen_id, volunteer_id, created_at, active) VALUES
(1, 'admin', 'admin@sirassist.org', '$2a$10$7R9rG0M5s1mC7fV8TzQ.uO1dK4rZ3eH7iB2wN6xP8qR0sT2uV4wX6', 'ADMIN', NULL, NULL, '2026-01-01 00:00:00', 1),
(2, 'vol_arjun', 'arjun.v@example.com', '$2a$10$7R9rG0M5s1mC7fV8TzQ.uO1dK4rZ3eH7iB2wN6xP8qR0sT2uV4wX6', 'VOLUNTEER', NULL, 1, '2026-01-05 10:00:00', 1),
(3, 'vol_divya', 'divya.v@example.com', '$2a$10$7R9rG0M5s1mC7fV8TzQ.uO1dK4rZ3eH7iB2wN6xP8qR0sT2uV4wX6', 'VOLUNTEER', NULL, 2, '2026-01-05 11:00:00', 1),
(4, 'ramesh_k', 'ramesh.k@example.com', '$2a$10$7R9rG0M5s1mC7fV8TzQ.uO1dK4rZ3eH7iB2wN6xP8qR0sT2uV4wX6', 'CITIZEN', 1, NULL, '2026-01-10 09:00:00', 1),
(5, 'sunitha_r', 'sunitha.rao@example.com', '$2a$10$7R9rG0M5s1mC7fV8TzQ.uO1dK4rZ3eH7iB2wN6xP8qR0sT2uV4wX6', 'CITIZEN', 2, NULL, '2026-01-12 10:30:00', 1),
(6, 'ananth_p', 'ananth.p@example.com', '$2a$10$7R9rG0M5s1mC7fV8TzQ.uO1dK4rZ3eH7iB2wN6xP8qR0sT2uV4wX6', 'CITIZEN', 3, NULL, '2026-01-15 11:15:00', 1),
(7, 'lakshmi_d', 'lakshmi.d@example.com', '$2a$10$7R9rG0M5s1mC7fV8TzQ.uO1dK4rZ3eH7iB2wN6xP8qR0sT2uV4wX6', 'CITIZEN', 4, NULL, '2026-01-18 14:20:00', 1),
(8, 'vikram_s', 'vikram.s@example.com', '$2a$10$7R9rG0M5s1mC7fV8TzQ.uO1dK4rZ3eH7iB2wN6xP8qR0sT2uV4wX6', 'CITIZEN', 5, NULL, '2026-01-20 16:45:00', 1);

-- 8. Insert Voter Records (15 Sample Records)
INSERT INTO Voter_Record (voter_id, citizen_id, epic_reference, constituency_id, polling_station_id, record_status, last_checked_at) VALUES
(1, 1, 'KA/01/168/XXXX01', 1, 1, 'Verified', '2026-02-01 10:00:00'),
(2, 2, 'KA/01/168/XXXX02', 1, 2, 'Verified', '2026-02-02 11:00:00'),
(3, 3, 'KA/01/174/XXXX03', 2, 3, 'Pending_Update', '2026-02-05 14:30:00'),
(4, 4, 'KA/01/174/XXXX04', 2, 4, 'Details_Mismatch', '2026-02-06 09:15:00'),
(5, 5, 'KA/01/160/XXXX05', 3, 5, 'Verified', '2026-02-08 16:00:00'),
(6, 6, 'KA/01/160/XXXX06', 3, 5, 'Verified', '2026-02-10 12:20:00'),
(7, 7, 'KA/01/160/XXXX07', 3, 6, 'Under_Review', '2026-02-12 10:10:00'),
(8, 8, 'KA/01/160/XXXX08', 3, 6, 'Verified', '2026-02-14 15:45:00'),
(9, 9, 'KA/01/160/XXXX09', 3, 6, 'Verified', '2026-02-15 09:00:00'),
(10, 10, 'KA/01/160/XXXX10', 3, 6, 'Verified', '2026-02-18 11:30:00'),
(11, 11, 'KA/05/189/XXXX11', 5, 8, 'Pending_Update', '2026-02-20 14:00:00'),
(12, 12, 'KA/05/189/XXXX12', 5, 8, 'Verified', '2026-02-22 10:50:00'),
(13, 13, 'KA/04/216/XXXX13', 4, 7, 'Verified', '2026-02-25 16:15:00'),
(14, 14, 'KA/04/216/XXXX14', 4, 7, 'Details_Mismatch', '2026-02-26 09:40:00'),
(15, 15, 'KA/04/216/XXXX15', 4, 7, 'Verified', '2026-02-28 13:00:00');

-- 9. Insert Document Requirements (Configurable Rules)
INSERT INTO Document_Requirement (requirement_id, request_type, document_type, mandatory, description, source_reference, active) VALUES
(1, 'Record Verification', 'Aadhaar (Masked)', 1, 'Proof of identity and residential verification', 'ECI Revision Manual 2026 - Sec 4.1', 1),
(2, 'Record Verification', 'Voter ID', 1, 'Reference reference of current EPIC card', 'ECI Revision Manual 2026 - Sec 4.2', 1),
(3, 'Record Verification', 'Utility Bill', 0, 'Recent electricity/water bill for address proof', 'ECI Revision Manual 2026 - Sec 4.3', 1),
(4, 'Correction Assistance', 'Aadhaar (Masked)', 1, 'Proof of correct name/DOB', 'ECI Revision Manual 2026 - Sec 5.1', 1),
(5, 'Correction Assistance', 'Birth Certificate', 0, 'Secondary age proof for correction', 'ECI Revision Manual 2026 - Sec 5.2', 1),
(6, 'Correction Assistance', 'Voter ID', 1, 'Existing voter record to be updated', 'ECI Revision Manual 2026 - Sec 5.3', 1),
(7, 'Document Clarification', 'Bank Passbook', 1, 'Bank account statement with photo proof', 'ECI Revision Manual 2026 - Sec 6.1', 1),
(8, 'Missing Record Assistance', 'Ration Card', 1, 'Family record reference document', 'ECI Revision Manual 2026 - Sec 7.1', 1),
(9, 'Missing Record Assistance', 'Aadhaar (Masked)', 1, 'Identity card for new record creation', 'ECI Revision Manual 2026 - Sec 7.2', 1);

-- 10. Insert Documents (30 Sample Document Records)
INSERT INTO Document (document_id, citizen_id, document_type, document_reference_masked, issue_date, verification_status, uploaded_at) VALUES
(1, 1, 'Aadhaar (Masked)', 'XXXX-XXXX-1234', '2018-05-10', 'Verified', '2026-01-11 10:00:00'),
(2, 1, 'Voter ID', 'KA/01/168/XXXX01', '2015-03-15', 'Verified', '2026-01-11 10:05:00'),
(3, 1, 'Utility Bill', 'BESCOM-9876XXXX', '2025-12-01', 'Verified', '2026-01-11 10:10:00'),
(4, 2, 'Aadhaar (Masked)', 'XXXX-XXXX-2345', '2019-08-20', 'Verified', '2026-01-13 11:00:00'),
(5, 2, 'Voter ID', 'KA/01/168/XXXX02', '2016-01-10', 'Verified', '2026-01-13 11:15:00'),
(6, 3, 'Aadhaar (Masked)', 'XXXX-XXXX-3456', '2017-02-11', 'Pending', '2026-01-16 09:30:00'),
(7, 3, 'Voter ID', 'KA/01/174/XXXX03', '2010-09-09', 'Verified', '2026-01-16 09:40:00'),
(8, 4, 'Aadhaar (Masked)', 'XXXX-XXXX-4567', '2020-11-04', 'Rejected', '2026-01-19 15:00:00'),
(9, 4, 'Ration Card', 'RC-9988XXXX', '2014-06-30', 'Pending', '2026-01-19 15:20:00'),
(10, 5, 'Aadhaar (Masked)', 'XXXX-XXXX-5678', '2021-01-15', 'Verified', '2026-01-21 17:00:00'),
(11, 5, 'Voter ID', 'KA/01/160/XXXX05', '2022-04-12', 'Verified', '2026-01-21 17:10:00'),
(12, 6, 'Aadhaar (Masked)', 'XXXX-XXXX-6789', '2022-07-22', 'Verified', '2026-01-23 10:00:00'),
(13, 7, 'Aadhaar (Masked)', 'XXXX-XXXX-7890', '2016-04-18', 'Verified', '2026-01-26 11:00:00'),
(14, 7, 'Voter ID', 'KA/01/160/XXXX07', '2012-08-08', 'Pending', '2026-01-26 11:30:00'),
(15, 8, 'Aadhaar (Masked)', 'XXXX-XXXX-8901', '2019-10-10', 'Verified', '2026-01-29 14:00:00'),
(16, 9, 'Aadhaar (Masked)', 'XXXX-XXXX-9012', '2018-12-05', 'Verified', '2026-02-02 09:00:00'),
(17, 9, 'Voter ID', 'KA/01/160/XXXX09', '2015-05-05', 'Verified', '2026-02-02 09:15:00'),
(18, 10, 'Aadhaar (Masked)', 'XXXX-XXXX-0123', '2020-03-30', 'Verified', '2026-02-04 16:00:00'),
(19, 11, 'Aadhaar (Masked)', 'XXXX-XXXX-1122', '2015-01-01', 'Pending', '2026-02-06 10:00:00'),
(20, 12, 'Aadhaar (Masked)', 'XXXX-XXXX-2233', '2017-06-06', 'Verified', '2026-02-09 11:00:00'),
(21, 13, 'Aadhaar (Masked)', 'XXXX-XXXX-3344', '2019-09-09', 'Verified', '2026-02-11 15:00:00'),
(22, 14, 'Aadhaar (Masked)', 'XXXX-XXXX-4455', '2021-02-02', 'Pending', '2026-02-13 17:00:00'),
(23, 15, 'Aadhaar (Masked)', 'XXXX-XXXX-5566', '2014-04-04', 'Verified', '2026-02-16 11:00:00'),
(24, 16, 'Aadhaar (Masked)', 'XXXX-XXXX-6677', '2016-08-08', 'Verified', '2026-02-19 12:00:00'),
(25, 17, 'Aadhaar (Masked)', 'XXXX-XXXX-7788', '2018-10-10', 'Verified', '2026-02-21 14:00:00'),
(26, 18, 'Aadhaar (Masked)', 'XXXX-XXXX-8899', '2020-12-12', 'Verified', '2026-02-23 16:00:00'),
(27, 19, 'Aadhaar (Masked)', 'XXXX-XXXX-9900', '2023-01-01', 'Verified', '2026-02-26 10:00:00'),
(28, 20, 'Aadhaar (Masked)', 'XXXX-XXXX-0011', '2023-05-05', 'Verified', '2026-02-28 11:30:00'),
(29, 3, 'Bank Passbook', 'SBIN000XXXX', '2022-01-10', 'Verified', '2026-03-01 09:00:00'),
(30, 4, 'Birth Certificate', 'BC-2025-XXXX', '2024-03-03', 'Verified', '2026-03-02 10:00:00');

-- 11. Insert Verification Requests (30 Sample Records)
INSERT INTO Verification_Request (request_id, citizen_id, voter_id, request_type, submission_date, current_status, remarks, created_at) VALUES
(1, 1, 1, 'Record Verification', '2026-01-12 10:00:00', 'RESOLVED', 'All documents verified against sample checklist', '2026-01-12 10:00:00'),
(2, 2, 2, 'Record Verification', '2026-01-14 11:30:00', 'RESOLVED', 'Record verified cleanly', '2026-01-14 11:30:00'),
(3, 3, 3, 'Correction Assistance', '2026-01-17 10:15:00', 'DOCUMENTS_PENDING', 'Awaiting clear age proof document', '2026-01-17 10:15:00'),
(4, 4, 4, 'Correction Assistance', '2026-01-20 15:30:00', 'UNDER_REVIEW', 'Address mismatch reported in record', '2026-01-20 15:30:00'),
(5, 5, 5, 'Record Verification', '2026-01-22 17:30:00', 'RESOLVED', 'Checklist items complete', '2026-01-22 17:30:00'),
(6, 6, 6, 'General Assistance', '2026-01-24 11:00:00', 'DOCUMENTS_SUBMITTED', 'Submitted initial set of records', '2026-01-24 11:00:00'),
(7, 7, 7, 'Record Verification', '2026-01-27 12:00:00', 'UNDER_REVIEW', 'Reviewing polling station allocation', '2026-01-27 12:00:00'),
(8, 8, 8, 'Record Verification', '2026-01-30 14:30:00', 'SUBMITTED', 'New request logged by citizen', '2026-01-30 14:30:00'),
(9, 9, 9, 'Record Verification', '2026-02-03 10:00:00', 'RESOLVED', 'Checklist complete and clear', '2026-02-03 10:00:00'),
(10, 10, 10, 'Document Clarification', '2026-02-05 16:30:00', 'UNDER_REVIEW', 'Clarifying passbook entry', '2026-02-05 16:30:00'),
(11, 11, 11, 'Missing Record Assistance', '2026-02-07 10:30:00', 'DOCUMENTS_PENDING', 'Missing ration card copy', '2026-02-07 10:30:00'),
(12, 12, 12, 'Record Verification', '2026-02-10 11:45:00', 'RESOLVED', 'Verified successfully', '2026-02-10 11:45:00'),
(13, 13, 13, 'Correction Assistance', '2026-02-12 15:15:00', 'SUBMITTED', 'Spelling correction request', '2026-02-12 15:15:00'),
(14, 14, 14, 'Correction Assistance', '2026-02-14 17:30:00', 'UNDER_REVIEW', 'Updating surname mismatch', '2026-02-14 17:30:00'),
(15, 15, 15, 'Record Verification', '2026-02-17 11:20:00', 'RESOLVED', 'Completed', '2026-02-17 11:20:00'),
(16, 16, NULL, 'Missing Record Assistance', '2026-02-20 12:40:00', 'DOCUMENTS_SUBMITTED', 'No prior EPIC found, submitting proof', '2026-02-20 12:40:00'),
(17, 17, NULL, 'General Assistance', '2026-02-22 14:50:00', 'SUBMITTED', 'Guidance needed on procedure', '2026-02-22 14:50:00'),
(18, 18, NULL, 'Record Verification', '2026-02-24 16:10:00', 'SUBMITTED', 'Newly submitted request', '2026-02-24 16:10:00'),
(19, 19, NULL, 'Missing Record Assistance', '2026-02-27 10:00:00', 'DOCUMENTS_PENDING', 'Aadhaar uploaded, missing ration card', '2026-02-27 10:00:00'),
(20, 20, NULL, 'General Assistance', '2026-03-01 11:30:00', 'SUBMITTED', 'First-time voter query', '2026-03-01 11:30:00'),
(21, 1, 1, 'Correction Assistance', '2026-03-02 09:00:00', 'SUBMITTED', 'House number update request', '2026-03-02 09:00:00'),
(22, 2, 2, 'Document Clarification', '2026-03-02 10:00:00', 'UNDER_REVIEW', 'Additional proof verification', '2026-03-02 10:00:00'),
(23, 3, 3, 'General Assistance', '2026-03-02 11:00:00', 'RESOLVED', 'Senior citizen help completed', '2026-03-02 11:00:00'),
(24, 4, 4, 'Missing Record Assistance', '2026-03-02 12:00:00', 'DOCUMENTS_PENDING', 'Missing required documents', '2026-03-02 12:00:00'),
(25, 5, 5, 'Correction Assistance', '2026-03-02 14:00:00', 'DOCUMENTS_SUBMITTED', 'Documents uploaded', '2026-03-02 14:00:00'),
(26, 6, 6, 'Record Verification', '2026-03-02 15:00:00', 'RESOLVED', 'Verified checklist', '2026-03-02 15:00:00'),
(27, 7, 7, 'Correction Assistance', '2026-03-02 16:00:00', 'CANCELLED', 'Request withdrawn by user', '2026-03-02 16:00:00'),
(28, 8, 8, 'General Assistance', '2026-03-03 09:30:00', 'SUBMITTED', 'General guidance requested', '2026-03-03 09:30:00'),
(29, 9, 9, 'Correction Assistance', '2026-03-03 10:45:00', 'UNDER_REVIEW', 'Under admin review', '2026-03-03 10:45:00'),
(30, 10, 10, 'Record Verification', '2026-03-03 11:50:00', 'RESOLVED', 'All details validated', '2026-03-03 11:50:00');

-- 12. Insert Request_Document Junction Records
INSERT INTO Request_Document (request_id, document_id, submitted_at) VALUES
(1, 1, '2026-01-12 10:00:00'),
(1, 2, '2026-01-12 10:00:00'),
(1, 3, '2026-01-12 10:00:00'),
(2, 4, '2026-01-14 11:30:00'),
(2, 5, '2026-01-14 11:30:00'),
(3, 6, '2026-01-17 10:15:00'),
(3, 7, '2026-01-17 10:15:00'),
(4, 8, '2026-01-20 15:30:00'),
(4, 9, '2026-01-20 15:30:00'),
(5, 10, '2026-01-22 17:30:00'),
(5, 11, '2026-01-22 17:30:00'),
(6, 12, '2026-01-24 11:00:00'),
(7, 13, '2026-01-27 12:00:00'),
(7, 14, '2026-01-27 12:00:00'),
(9, 16, '2026-02-03 10:00:00'),
(9, 17, '2026-02-03 10:00:00'),
(10, 18, '2026-02-05 16:30:00'),
(10, 29, '2026-03-01 09:00:00'),
(12, 20, '2026-02-10 11:45:00'),
(15, 23, '2026-02-17 11:20:00');

-- 13. Insert Assistance Requests (20 Records)
INSERT INTO Assistance_Request (assistance_id, citizen_id, volunteer_id, request_type, request_date, status, priority, notes, assigned_at, completed_at) VALUES
(1, 3, 1, 'Digital Assistance', '2026-01-16 11:00:00', 'COMPLETED', 'High', 'Elderly citizen requires help filling Form 8 checklist', '2026-01-16 12:00:00', '2026-01-17 15:00:00'),
(2, 4, 1, 'Doorstep Visit', '2026-01-19 14:00:00', 'COMPLETED', 'High', 'Need home visit for document scanning support', '2026-01-19 15:30:00', '2026-01-21 16:00:00'),
(3, 7, 2, 'Form Review', '2026-01-26 10:00:00', 'ASSIGNED', 'Medium', 'Review supporting documents before online submission', '2026-01-26 11:00:00', NULL),
(4, 11, 9, 'Rural Doorstep Help', '2026-02-06 09:00:00', 'COMPLETED', 'High', 'Assistance for senior citizen in Mandya', '2026-02-06 09:30:00', '2026-02-07 11:00:00'),
(5, 15, 7, 'Document Scan', '2026-02-16 10:00:00', 'COMPLETED', 'Low', 'Assistance with scanning bank passbook', '2026-02-16 10:30:00', '2026-02-16 14:00:00'),
(6, 16, 8, 'Language Help', '2026-02-19 11:00:00', 'IN_PROGRESS', 'Medium', 'Kannada to English translation guidance', '2026-02-19 11:45:00', NULL),
(7, 2, NULL, 'Digital Assistance', '2026-02-20 15:00:00', 'PENDING', 'Medium', 'General guidance on checklist requirements', NULL, NULL),
(8, 5, 3, 'Form Filling', '2026-02-22 16:00:00', 'COMPLETED', 'Low', 'Guidance on online upload process', '2026-02-22 16:30:00', '2026-02-23 10:00:00'),
(9, 8, NULL, 'Doorstep Visit', '2026-02-25 10:00:00', 'PENDING', 'High', 'Senior citizen unable to travel to center', NULL, NULL),
(10, 10, 5, 'Document Check', '2026-02-27 12:00:00', 'IN_PROGRESS', 'Medium', 'Verification of utility bill address mismatch', '2026-02-27 14:00:00', NULL),
(11, 12, NULL, 'Digital Assistance', '2026-03-01 09:00:00', 'PENDING', 'Low', 'Help with password reset and dashboard viewing', NULL, NULL),
(12, 13, 7, 'Form Review', '2026-03-01 10:30:00', 'ASSIGNED', 'Medium', 'Reviewing spelling correction application', '2026-03-01 11:00:00', NULL),
(13, 14, NULL, 'Doorstep Visit', '2026-03-01 14:00:00', 'PENDING', 'High', 'Assistance needed for physical record review', NULL, NULL),
(14, 17, 9, 'Rural Doorstep Help', '2026-03-02 09:30:00', 'IN_PROGRESS', 'Medium', 'Village outreach assistance', '2026-03-02 10:00:00', NULL),
(15, 18, NULL, 'Digital Assistance', '2026-03-02 11:15:00', 'PENDING', 'Low', 'Checking online checklist status', NULL, NULL),
(16, 19, NULL, 'Form Filling', '2026-03-02 13:00:00', 'PENDING', 'High', 'Missing document guidance', NULL, NULL),
(17, 20, NULL, 'Language Help', '2026-03-02 15:30:00', 'PENDING', 'Medium', 'First time voter procedural guidance', NULL, NULL),
(18, 1, 1, 'Form Review', '2026-03-02 16:45:00', 'COMPLETED', 'Low', 'Re-checking modified details', '2026-03-02 17:00:00', '2026-03-03 09:00:00'),
(19, 6, 5, 'Document Scan', '2026-03-03 08:30:00', 'ASSIGNED', 'Medium', 'Scanning supporting utility bills', '2026-03-03 09:00:00', NULL),
(20, 9, NULL, 'Digital Assistance', '2026-03-03 10:00:00', 'PENDING', 'Low', 'General academic portal walk-through', NULL, NULL);

-- 14. Insert Status History Records (50 Sample History Logs)
INSERT INTO Status_History (history_id, request_id, old_status, new_status, changed_by, changed_at, remarks) VALUES
(1, 1, 'DRAFT', 'SUBMITTED', 'Citizen Ramesh Kumar', '2026-01-12 10:00:00', 'Initial submission of record verification request'),
(2, 1, 'SUBMITTED', 'UNDER_REVIEW', 'Admin User', '2026-01-12 14:00:00', 'Request picked up for document audit'),
(3, 1, 'UNDER_REVIEW', 'RESOLVED', 'Admin User', '2026-01-13 16:00:00', 'All required documents verified cleanly'),
(4, 2, 'DRAFT', 'SUBMITTED', 'Citizen Sunitha Rao', '2026-01-14 11:30:00', 'Submitted verification checklist request'),
(5, 2, 'SUBMITTED', 'UNDER_REVIEW', 'Admin User', '2026-01-15 09:00:00', 'Moved to review phase'),
(6, 2, 'UNDER_REVIEW', 'RESOLVED', 'Admin User', '2026-01-16 11:00:00', 'Record matched with academic reference'),
(7, 3, 'DRAFT', 'SUBMITTED', 'Citizen Ananth P', '2026-01-17 10:15:00', 'Correction request created'),
(8, 3, 'SUBMITTED', 'DOCUMENTS_PENDING', 'Admin User', '2026-01-18 10:00:00', 'Age proof document missing from checklist'),
(9, 4, 'DRAFT', 'SUBMITTED', 'Citizen Lakshmi Devi', '2026-01-20 15:30:00', 'Correction assistance requested'),
(10, 4, 'SUBMITTED', 'UNDER_REVIEW', 'Admin User', '2026-01-21 14:00:00', 'Evaluating address details'),
(11, 5, 'DRAFT', 'SUBMITTED', 'Citizen Vikram Sharma', '2026-01-22 17:30:00', 'Request submitted'),
(12, 5, 'SUBMITTED', 'RESOLVED', 'Admin User', '2026-01-23 12:00:00', 'Checklist items completely satisfied'),
(13, 6, 'DRAFT', 'SUBMITTED', 'Citizen Priya Nair', '2026-01-24 11:00:00', 'Created assistance request'),
(14, 6, 'SUBMITTED', 'DOCUMENTS_SUBMITTED', 'Citizen Priya Nair', '2026-01-25 10:00:00', 'Uploaded identity documents'),
(15, 7, 'DRAFT', 'SUBMITTED', 'Citizen Suresh Gowda', '2026-01-27 12:00:00', 'Record verification initiated'),
(16, 7, 'SUBMITTED', 'UNDER_REVIEW', 'Admin User', '2026-01-28 15:00:00', 'Reviewing polling station mapping'),
(17, 8, 'DRAFT', 'SUBMITTED', 'Citizen Kavitha Hegde', '2026-01-30 14:30:00', 'New request created'),
(18, 9, 'DRAFT', 'SUBMITTED', 'Citizen Basavaraj Patil', '2026-02-03 10:00:00', 'Submitted verification request'),
(19, 9, 'SUBMITTED', 'UNDER_REVIEW', 'Admin User', '2026-02-03 14:00:00', 'Under review'),
(20, 9, 'UNDER_REVIEW', 'RESOLVED', 'Admin User', '2026-02-04 10:00:00', 'Resolved'),
(21, 10, 'DRAFT', 'SUBMITTED', 'Citizen Deepa Kulkarni', '2026-02-05 16:30:00', 'Document clarification requested'),
(22, 10, 'SUBMITTED', 'UNDER_REVIEW', 'Admin User', '2026-02-06 11:00:00', 'Clarifying passbook copy'),
(23, 11, 'DRAFT', 'SUBMITTED', 'Citizen Manjunath Swamy', '2026-02-07 10:30:00', 'Missing record assistance'),
(24, 11, 'SUBMITTED', 'DOCUMENTS_PENDING', 'Admin User', '2026-02-08 09:00:00', 'Ration card pending'),
(25, 12, 'DRAFT', 'SUBMITTED', 'Citizen Sujatha Bhat', '2026-02-10 11:45:00', 'Verification request'),
(26, 12, 'SUBMITTED', 'RESOLVED', 'Admin User', '2026-02-11 10:00:00', 'Verified'),
(27, 13, 'DRAFT', 'SUBMITTED', 'Citizen Ganesh Prasad', '2026-02-12 15:15:00', 'Correction assistance'),
(28, 14, 'DRAFT', 'SUBMITTED', 'Citizen Shalini Shenoy', '2026-02-14 17:30:00', 'Correction request'),
(29, 14, 'SUBMITTED', 'UNDER_REVIEW', 'Admin User', '2026-02-15 11:00:00', 'Under review'),
(30, 15, 'DRAFT', 'SUBMITTED', 'Citizen Narayana Murthy', '2026-02-17 11:20:00', 'Record verification'),
(31, 15, 'SUBMITTED', 'RESOLVED', 'Admin User', '2026-02-18 10:00:00', 'Resolved'),
(32, 16, 'DRAFT', 'SUBMITTED', 'Citizen Radha Shenoy', '2026-02-20 12:40:00', 'Missing record request'),
(33, 16, 'SUBMITTED', 'DOCUMENTS_SUBMITTED', 'Citizen Radha Shenoy', '2026-02-21 14:00:00', 'Uploaded Aadhaar'),
(34, 17, 'DRAFT', 'SUBMITTED', 'Citizen Chandrashekar B', '2026-02-22 14:50:00', 'General assistance'),
(35, 18, 'DRAFT', 'SUBMITTED', 'Citizen Meenakshi Iyer', '2026-02-24 16:10:00', 'Verification request'),
(36, 19, 'DRAFT', 'SUBMITTED', 'Citizen Pradeep Kumar', '2026-02-27 10:00:00', 'Missing record request'),
(37, 19, 'SUBMITTED', 'DOCUMENTS_PENDING', 'Admin User', '2026-02-28 09:00:00', 'Ration card copy required'),
(38, 20, 'DRAFT', 'SUBMITTED', 'Citizen Bhavana Shetty', '2026-03-01 11:30:00', 'General assistance'),
(39, 21, 'DRAFT', 'SUBMITTED', 'Citizen Ramesh Kumar', '2026-03-02 09:00:00', 'Address update submission'),
(40, 22, 'DRAFT', 'SUBMITTED', 'Citizen Sunitha Rao', '2026-03-02 10:00:00', 'Clarification submitted'),
(41, 22, 'SUBMITTED', 'UNDER_REVIEW', 'Admin User', '2026-03-02 14:00:00', 'Under review'),
(42, 23, 'DRAFT', 'SUBMITTED', 'Citizen Ananth P', '2026-03-02 11:00:00', 'General assistance'),
(43, 23, 'SUBMITTED', 'RESOLVED', 'Admin User', '2026-03-02 16:00:00', 'Resolved'),
(44, 24, 'DRAFT', 'SUBMITTED', 'Citizen Lakshmi Devi', '2026-03-02 12:00:00', 'Missing record assistance'),
(45, 24, 'SUBMITTED', 'DOCUMENTS_PENDING', 'Admin User', '2026-03-02 13:00:00', 'Documents pending'),
(46, 25, 'DRAFT', 'SUBMITTED', 'Citizen Vikram Sharma', '2026-03-02 14:00:00', 'Correction request'),
(47, 25, 'SUBMITTED', 'DOCUMENTS_SUBMITTED', 'Citizen Vikram Sharma', '2026-03-02 15:00:00', 'Documents attached'),
(48, 26, 'DRAFT', 'SUBMITTED', 'Citizen Priya Nair', '2026-03-02 15:00:00', 'Verification request'),
(49, 26, 'SUBMITTED', 'RESOLVED', 'Admin User', '2026-03-02 17:00:00', 'Resolved'),
(50, 27, 'DRAFT', 'SUBMITTED', 'Citizen Suresh Gowda', '2026-03-02 16:00:00', 'Cancelled request');

-- 15. Insert Notification Records (40 Notifications)
INSERT INTO Notification (notification_id, citizen_id, request_id, message, created_at, read_status) VALUES
(1, 1, 1, 'Your verification request VR1001 status changed to UNDER_REVIEW.', '2026-01-12 14:00:00', 1),
(2, 1, 1, 'Your verification request VR1001 has been RESOLVED successfully.', '2026-01-13 16:00:00', 1),
(3, 2, 2, 'Your verification request VR1002 status changed to UNDER_REVIEW.', '2026-01-15 09:00:00', 1),
(4, 2, 2, 'Your verification request VR1002 has been RESOLVED.', '2026-01-16 11:00:00', 1),
(5, 3, 3, 'Your verification request VR1003 is currently DOCUMENTS_PENDING. Please upload age proof.', '2026-01-18 10:00:00', 0),
(6, 4, 4, 'Your verification request VR1004 is under review by administrator.', '2026-01-21 14:00:00', 0),
(7, 5, 5, 'Your verification request VR1005 has been RESOLVED.', '2026-01-23 12:00:00', 1),
(8, 6, 6, 'Status updated to DOCUMENTS_SUBMITTED for request VR1006.', '2026-01-25 10:00:00', 0),
(9, 7, 7, 'Your request VR1007 is under review.', '2026-01-28 15:00:00', 0),
(10, 8, 8, 'Verification request VR1008 successfully submitted.', '2026-01-30 14:30:00', 0),
(11, 9, 9, 'Your verification request VR1009 has been RESOLVED.', '2026-02-04 10:00:00', 1),
(12, 10, 10, 'Your request VR1010 status changed to UNDER_REVIEW.', '2026-02-06 11:00:00', 0),
(13, 11, 11, 'Request VR1011 requires additional documents (Ration Card).', '2026-02-08 09:00:00', 0),
(14, 12, 12, 'Your request VR1012 has been RESOLVED.', '2026-02-11 10:00:00', 1),
(15, 13, 13, 'Verification request VR1013 successfully submitted.', '2026-02-12 15:15:00', 0),
(16, 14, 14, 'Request VR1014 is under review.', '2026-02-15 11:00:00', 0),
(17, 15, 15, 'Your request VR1015 has been RESOLVED.', '2026-02-18 10:00:00', 1),
(18, 16, 16, 'Documents submitted for request VR1016.', '2026-02-21 14:00:00', 0),
(19, 17, 17, 'General assistance request VR1017 logged.', '2026-02-22 14:50:00', 0),
(20, 18, 18, 'Verification request VR1018 received.', '2026-02-24 16:10:00', 0),
(21, 19, 19, 'Request VR1019 needs missing document upload.', '2026-02-28 09:00:00', 0),
(22, 20, 20, 'Your request VR1020 has been received.', '2026-03-01 11:30:00', 0),
(23, 1, 21, 'Correction assistance request VR1021 created.', '2026-03-02 09:00:00', 0),
(24, 2, 22, 'Request VR1022 status updated to UNDER_REVIEW.', '2026-03-02 14:00:00', 0),
(25, 3, 23, 'Assistance request VR1023 RESOLVED.', '2026-03-02 16:00:00', 1),
(26, 4, 24, 'Request VR1024 status updated to DOCUMENTS_PENDING.', '2026-03-02 13:00:00', 0),
(27, 5, 25, 'Request VR1025 status updated to DOCUMENTS_SUBMITTED.', '2026-03-02 15:00:00', 0),
(28, 6, 26, 'Request VR1026 has been RESOLVED.', '2026-03-02 17:00:00', 1),
(29, 7, 27, 'Request VR1027 has been CANCELLED as requested.', '2026-03-02 16:00:00', 1),
(30, 8, 28, 'Request VR1028 submitted successfully.', '2026-03-03 09:30:00', 0),
(31, 9, 29, 'Request VR1029 is now UNDER_REVIEW.', '2026-03-03 10:45:00', 0),
(32, 10, 30, 'Request VR1030 has been RESOLVED.', '2026-03-03 11:50:00', 1),
(33, 3, NULL, 'Volunteer Arjun Reddy has been assigned to your assistance request AR1001.', '2026-01-16 12:00:00', 1),
(34, 4, NULL, 'Volunteer Arjun Reddy has been assigned to your assistance request AR1002.', '2026-01-19 15:30:00', 1),
(35, 7, NULL, 'Volunteer Divya Murthy assigned to assistance request AR1003.', '2026-01-26 11:00:00', 0),
(36, 11, NULL, 'Volunteer Raghavendra K assigned to assistance request AR1004.', '2026-02-06 09:30:00', 1),
(37, 15, NULL, 'Volunteer Mahesh Gowda assigned to assistance request AR1005.', '2026-02-16 10:30:00', 1),
(38, 16, NULL, 'Volunteer Swathi Hegde assigned to assistance request AR1006.', '2026-02-19 11:45:00', 0),
(39, 5, NULL, 'Volunteer Kiran Kumar assigned to assistance request AR1008.', '2026-02-22 16:30:00', 1),
(40, 10, NULL, 'Volunteer Praveen Naik assigned to assistance request AR1010.', '2026-02-27 14:00:00', 0);
