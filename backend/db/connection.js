const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

let pool = null;
let isRealMySQL = false;

// In-memory fallback mock dataset derived from seed.sql
const mockStore = {
  addresses: [
    { address_id: 1, house_number: '#45, 2nd Main', street: 'Vijayanagar', village: 'Bengaluru Urban', taluk: 'Bengaluru South', district: 'Bengaluru', state: 'Karnataka', pin_code: '560040' },
    { address_id: 2, house_number: '#102, Green Glen Layout', street: 'Bellandur', village: 'Bengaluru Urban', taluk: 'Bengaluru East', district: 'Bengaluru', state: 'Karnataka', pin_code: '560103' },
    { address_id: 3, house_number: '#12, Church Street', street: 'Shanthi Nagar', village: 'Bengaluru Urban', taluk: 'Bengaluru Central', district: 'Bengaluru', state: 'Karnataka', pin_code: '560001' },
    { address_id: 4, house_number: '#88, Gandhi Bazaar', street: 'Basavanagudi', village: 'Bengaluru Urban', taluk: 'Bengaluru South', district: 'Bengaluru', state: 'Karnataka', pin_code: '560004' },
    { address_id: 5, house_number: '#301, Lakeview Apts', street: 'Hebbal', village: 'Bengaluru Urban', taluk: 'Bengaluru North', district: 'Bengaluru', state: 'Karnataka', pin_code: '560024' }
  ],
  areas: [
    { area_id: 1, name: 'Bengaluru South Zone', taluk: 'Bengaluru South', district: 'Bengaluru', state: 'Karnataka', pin_code: '560040' },
    { area_id: 2, name: 'Bengaluru East Tech Zone', taluk: 'Bengaluru East', district: 'Bengaluru', state: 'Karnataka', pin_code: '560103' },
    { area_id: 3, name: 'Bengaluru North Zone', taluk: 'Bengaluru North', district: 'Bengaluru', state: 'Karnataka', pin_code: '560024' },
    { area_id: 4, name: 'Mysuru City Central', taluk: 'Mysuru', district: 'Mysuru', state: 'Karnataka', pin_code: '570023' },
    { area_id: 5, name: 'Mandya Rural Zone', taluk: 'Mandya', district: 'Mandya', state: 'Karnataka', pin_code: '571401' }
  ],
  constituencies: [
    { constituency_id: 1, name: '168-Vijayanagar Assembly', district: 'Bengaluru', state: 'Karnataka' },
    { constituency_id: 2, name: '174-Mahadevapura Assembly', district: 'Bengaluru', state: 'Karnataka' },
    { constituency_id: 3, name: '160-Sarvagnanagar Assembly', district: 'Bengaluru', state: 'Karnataka' },
    { constituency_id: 4, name: '216-Mysuru Urban Assembly', district: 'Mysuru', state: 'Karnataka' },
    { constituency_id: 5, name: '189-Mandya Rural Assembly', district: 'Mandya', state: 'Karnataka' }
  ],
  polling_stations: [
    { polling_station_id: 1, station_name: 'Govt Primary School Room 1, Vijayanagar', address_id: 1, constituency_id: 1 },
    { polling_station_id: 2, station_name: 'St. John High School Auditorium, Vijayanagar', address_id: 1, constituency_id: 1 },
    { polling_station_id: 3, station_name: 'Govt Composite PU College, Bellandur', address_id: 2, constituency_id: 2 },
    { polling_station_id: 4, station_name: 'BBMP Community Hall, Mahadevapura', address_id: 2, constituency_id: 2 }
  ],
  citizens: [
    { citizen_id: 1, name: 'Ramesh Kumar', date_of_birth: '1965-04-12', gender: 'Male', mobile: '9845012345', email: 'ramesh.k@example.com', address_id: 1, created_at: '2026-01-10 09:00:00' },
    { citizen_id: 2, name: 'Sunitha Rao', date_of_birth: '1972-08-25', gender: 'Female', mobile: '9845023456', email: 'sunitha.rao@example.com', address_id: 1, created_at: '2026-01-12 10:30:00' },
    { citizen_id: 3, name: 'Ananth Padmanabha', date_of_birth: '1950-11-05', gender: 'Male', mobile: '9845034567', email: 'ananth.p@example.com', address_id: 2, created_at: '2026-01-15 11:15:00' },
    { citizen_id: 4, name: 'Lakshmi Devi', date_of_birth: '1958-03-30', gender: 'Female', mobile: '9845045678', email: 'lakshmi.d@example.com', address_id: 2, created_at: '2026-01-18 14:20:00' },
    { citizen_id: 5, name: 'Vikram Sharma', date_of_birth: '1990-07-19', gender: 'Male', mobile: '9845056789', email: 'vikram.s@example.com', address_id: 3, created_at: '2026-01-20 16:45:00' }
  ],
  volunteers: [
    { volunteer_id: 1, name: 'Arjun Reddy', mobile: '9900100001', email: 'arjun.v@example.com', area_id: 1, availability: 'Available', skills: 'Form Filling, Senior Citizen Support', verification_status: 'Approved' },
    { volunteer_id: 2, name: 'Divya Murthy', mobile: '9900100002', email: 'divya.v@example.com', area_id: 1, availability: 'Available', skills: 'Digital Assistance, Document Check', verification_status: 'Approved' },
    { volunteer_id: 3, name: 'Kiran Kumar', mobile: '9900100003', email: 'kiran.v@example.com', area_id: 2, availability: 'Available', skills: 'Digital Guidance, Portal Help', verification_status: 'Approved' }
  ],
  user_accounts: [
    { user_id: 1, username: 'admin', email: 'admin@sirassist.org', password_hash: '$2a$10$7R9rG0M5s1mC7fV8TzQ.uO1dK4rZ3eH7iB2wN6xP8qR0sT2uV4wX6', role: 'ADMIN', citizen_id: null, volunteer_id: null, active: 1 },
    { user_id: 2, username: 'vol_arjun', email: 'arjun.v@example.com', password_hash: '$2a$10$7R9rG0M5s1mC7fV8TzQ.uO1dK4rZ3eH7iB2wN6xP8qR0sT2uV4wX6', role: 'VOLUNTEER', citizen_id: null, volunteer_id: 1, active: 1 },
    { user_id: 3, username: 'ramesh_k', email: 'ramesh.k@example.com', password_hash: '$2a$10$7R9rG0M5s1mC7fV8TzQ.uO1dK4rZ3eH7iB2wN6xP8qR0sT2uV4wX6', role: 'CITIZEN', citizen_id: 1, volunteer_id: null, active: 1 }
  ],
  voter_records: [
    { voter_id: 1, citizen_id: 1, epic_reference: 'KA/01/168/XXXX01', constituency_id: 1, polling_station_id: 1, record_status: 'Verified' },
    { voter_id: 2, citizen_id: 2, epic_reference: 'KA/01/168/XXXX02', constituency_id: 1, polling_station_id: 2, record_status: 'Verified' }
  ],
  document_requirements: [
    { requirement_id: 1, request_type: 'Record Verification', document_type: 'Aadhaar (Masked)', mandatory: 1, description: 'Proof of identity', active: 1 },
    { requirement_id: 2, request_type: 'Record Verification', document_type: 'Voter ID', mandatory: 1, description: 'Current EPIC card reference', active: 1 },
    { requirement_id: 3, request_type: 'Record Verification', document_type: 'Utility Bill', mandatory: 0, description: 'Address proof', active: 1 },
    { requirement_id: 4, request_type: 'Correction Assistance', document_type: 'Aadhaar (Masked)', mandatory: 1, description: 'Correct name/DOB proof', active: 1 },
    { requirement_id: 5, request_type: 'Correction Assistance', document_type: 'Voter ID', mandatory: 1, description: 'Voter ID to be updated', active: 1 }
  ],
  documents: [
    { document_id: 1, citizen_id: 1, document_type: 'Aadhaar (Masked)', document_reference_masked: 'XXXX-XXXX-1234', issue_date: '2018-05-10', verification_status: 'Verified' },
    { document_id: 2, citizen_id: 1, document_type: 'Voter ID', document_reference_masked: 'KA/01/168/XXXX01', issue_date: '2015-03-15', verification_status: 'Verified' },
    { document_id: 3, citizen_id: 1, document_type: 'Utility Bill', document_reference_masked: 'BESCOM-9876XXXX', issue_date: '2025-12-01', verification_status: 'Verified' },
    { document_id: 4, citizen_id: 2, document_type: 'Aadhaar (Masked)', document_reference_masked: 'XXXX-XXXX-2345', issue_date: '2019-08-20', verification_status: 'Verified' }
  ],
  verification_requests: [
    { request_id: 1, citizen_id: 1, voter_id: 1, request_type: 'Record Verification', submission_date: '2026-01-12 10:00:00', current_status: 'RESOLVED', remarks: 'Verified cleanly' },
    { request_id: 2, citizen_id: 2, voter_id: 2, request_type: 'Record Verification', submission_date: '2026-01-14 11:30:00', current_status: 'UNDER_REVIEW', remarks: 'Under admin review' },
    { request_id: 3, citizen_id: 3, voter_id: null, request_type: 'Correction Assistance', submission_date: '2026-01-17 10:15:00', current_status: 'DOCUMENTS_PENDING', remarks: 'Awaiting age proof' }
  ],
  request_documents: [
    { request_id: 1, document_id: 1, submitted_at: '2026-01-12 10:00:00' },
    { request_id: 1, document_id: 2, submitted_at: '2026-01-12 10:00:00' },
    { request_id: 1, document_id: 3, submitted_at: '2026-01-12 10:00:00' }
  ],
  status_histories: [
    { history_id: 1, request_id: 1, old_status: 'SUBMITTED', new_status: 'UNDER_REVIEW', changed_by: 'Admin', changed_at: '2026-01-12 14:00:00', remarks: 'Under review' },
    { history_id: 2, request_id: 1, old_status: 'UNDER_REVIEW', new_status: 'RESOLVED', changed_by: 'Admin', changed_at: '2026-01-13 16:00:00', remarks: 'All verified' }
  ],
  assistance_requests: [
    { assistance_id: 1, citizen_id: 3, volunteer_id: 1, request_type: 'Digital Assistance', request_date: '2026-01-16 11:00:00', status: 'COMPLETED', priority: 'High', notes: 'Elderly citizen help' },
    { assistance_id: 2, citizen_id: 2, volunteer_id: null, request_type: 'Digital Assistance', request_date: '2026-02-20 15:00:00', status: 'PENDING', priority: 'Medium', notes: 'General guidance' }
  ],
  notifications: [
    { notification_id: 1, citizen_id: 1, request_id: 1, message: 'Your request #1 status changed to RESOLVED.', created_at: '2026-01-13 16:00:00', read_status: 1 },
    { notification_id: 2, citizen_id: 3, request_id: 3, message: 'Your request #3 requires missing document upload.', created_at: '2026-01-18 10:00:00', read_status: 0 }
  ]
};

async function initDB() {
  try {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root',
      database: process.env.DB_NAME || 'sirassist_db',
      port: process.env.DB_PORT || 3306,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    // Test connection
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    isRealMySQL = true;
    console.log('✅ Connected to MySQL Database (sirassist_db)');
  } catch (err) {
    isRealMySQL = false;
    console.log('⚠️ MySQL connection not established. Operating in Academic In-Memory Mock Mode.');
  }
}

initDB();

// Unified query wrapper
async function query(sql, params = []) {
  if (isRealMySQL && pool) {
    try {
      const [rows] = await pool.query(sql, params);
      return rows;
    } catch (err) {
      console.error('MySQL Query Error:', err.message);
      throw err;
    }
  } else {
    // Return mock data fallback for testing when MySQL server is offline
    return executeMockQuery(sql, params);
  }
}

// Simple Mock SQL Processor for testing offline
function executeMockQuery(sql, params) {
  const cleanSql = sql.trim().toLowerCase();
  
  if (cleanSql.includes('from user_account')) {
    if (params[0]) {
      return mockStore.user_accounts.filter(u => u.username === params[0] || u.email === params[0]);
    }
    return mockStore.user_accounts;
  }
  
  if (cleanSql.includes('from citizen')) {
    if (cleanSql.includes('where citizen_id =')) {
      return mockStore.citizens.filter(c => c.citizen_id == params[0]);
    }
    return mockStore.citizens;
  }

  if (cleanSql.includes('from document_requirement')) {
    return mockStore.document_requirements;
  }

  if (cleanSql.includes('from document')) {
    if (cleanSql.includes('where citizen_id =')) {
      return mockStore.documents.filter(d => d.citizen_id == params[0]);
    }
    return mockStore.documents;
  }

  if (cleanSql.includes('from verification_request')) {
    if (cleanSql.includes('where request_id =')) {
      return mockStore.verification_requests.filter(r => r.request_id == params[0]);
    }
    if (cleanSql.includes('where citizen_id =')) {
      return mockStore.verification_requests.filter(r => r.citizen_id == params[0]);
    }
    return mockStore.verification_requests;
  }

  if (cleanSql.includes('from assistance_request')) {
    return mockStore.assistance_requests;
  }

  if (cleanSql.includes('from volunteer')) {
    return mockStore.volunteers;
  }

  if (cleanSql.includes('from notification')) {
    return mockStore.notifications;
  }

  if (cleanSql.includes('from area')) {
    return mockStore.areas;
  }

  // Fallback default
  return [{ affectedRows: 1, insertId: Date.now() }];
}

module.exports = {
  query,
  getIsRealMySQL: () => isRealMySQL,
  mockStore
};
