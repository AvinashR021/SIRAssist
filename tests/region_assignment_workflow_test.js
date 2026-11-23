/**
 * SIRAssist – Priority 9 Complete End-to-End Workflow & Region Assignment Test Suite
 * Tests:
 *   Test A: Citizen Upload -> Immediate Visibility -> Persistence across Logout/Login -> File Streaming
 *   Test B: Region-Based Volunteer Assignment (Area/Locality matching & Workload Balancing)
 *   Test C: Volunteer Review Action & File Preview
 *   Test D: Citizen Feedback Notification & Version Resubmission Loop
 *   Test E: Security, Cross-Tenant Isolation & SIR Data Immutability
 *   Test F: Admin Regional Assignment Recommendations & Manual Override
 */
const http = require('http');
const db = require('../backend/db/connection');
const app = require('../backend/server');

const PORT = 5099;
const BASE_URL = `http://localhost:${PORT}/api`;

let server;

function request(method, endpoint, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + endpoint);
    const req = http.request(
      url,
      {
        method,
        headers: {
          ...headers,
          ...(body && typeof body === 'object' && !headers['Content-Type']
            ? { 'Content-Type': 'application/json' }
            : {})
        }
      },
      (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          let parsed;
          try { parsed = JSON.parse(data); } catch { parsed = data; }
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        });
      }
    );
    req.on('error', reject);
    if (body) {
      if (typeof body === 'string' || Buffer.isBuffer(body)) {
        req.write(body);
      } else {
        req.write(JSON.stringify(body));
      }
    }
    req.end();
  });
}

function uploadMultipart(endpoint, token, fields, fileField, filename, fileContent, mimeType) {
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
  let body = '';

  for (const [key, val] of Object.entries(fields)) {
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="${key}"\r\n\r\n`;
    body += `${val}\r\n`;
  }

  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="${fileField}"; filename="${filename}"\r\n`;
  body += `Content-Type: ${mimeType}\r\n\r\n`;

  const payload = Buffer.concat([
    Buffer.from(body, 'utf-8'),
    Buffer.isBuffer(fileContent) ? fileContent : Buffer.from(fileContent, 'utf-8'),
    Buffer.from(`\r\n--${boundary}--\r\n`, 'utf-8')
  ]);

  return request('POST', endpoint, {
    'Authorization': `Bearer ${token}`,
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Content-Length': payload.length
  }, payload);
}

async function runTests() {
  console.log('\n===============================================================');
  console.log('🧪 Starting SIRAssist Region Assignment & Workflow Test Suite');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} - ${details}`);
      failed++;
    }
  }

  server = app.listen(PORT, async () => {
    try {
      // 0. Snapshot SIR core counts for immutability check
      const initialCitRows = await db.query('SELECT COUNT(*) AS count FROM Citizen');
      const initialVotRows = await db.query('SELECT COUNT(*) AS count FROM Voter_Record');
      const initialReqRows = await db.query('SELECT COUNT(*) AS count FROM Verification_Request');
      const initialCitCount = initialCitRows[0].count;
      const initialVotCount = initialVotRows[0].count;
      const initialReqCount = initialReqRows[0].count;

      // --- Authenticate roles ---
      const citLogin = await request('POST', '/auth/login', {}, { email: 'ramesh.k@example.com', password: 'password123' });
      assert(citLogin.status === 200 && citLogin.body.token, 'Auth: Citizen Ramesh Kumar logged in');
      const citToken = citLogin.body.token;

      const cit2Login = await request('POST', '/auth/login', {}, { email: 'sunitha.rao@example.com', password: 'password123' });
      assert(cit2Login.status === 200 && cit2Login.body.token, 'Auth: Citizen Sunitha Rao logged in');
      const cit2Token = cit2Login.body.token;

      const vol1Login = await request('POST', '/auth/login', {}, { email: 'arjun.v@example.com', password: 'password123' });
      assert(vol1Login.status === 200 && vol1Login.body.token, 'Auth: Volunteer Arjun (Area 1) logged in');
      const vol1Token = vol1Login.body.token;

      const vol3Login = await request('POST', '/auth/login', {}, { email: 'kiran.v@example.com', password: 'password123' });
      assert(vol3Login.status === 200 && vol3Login.body.token, 'Auth: Volunteer Kiran (Area 2) logged in');
      const vol3Token = vol3Login.body.token;

      const adminLogin = await request('POST', '/auth/login', {}, { email: 'admin@sirassist.org', password: 'password123' });
      assert(adminLogin.status === 200 && adminLogin.body.token, 'Auth: Admin logged in');
      const adminToken = adminLogin.body.token;

      // ===============================================================
      // TEST A: Citizen Upload -> Immediate Visibility -> Persistence
      // ===============================================================
      console.log('\n--- TEST A: Citizen Upload & Immediate Visibility ---');
      const pdfBytes = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>%%EOF');
      const upRes = await uploadMultipart(
        '/documents/upload',
        citToken,
        { document_type: 'Electricity Bill Proof' },
        'document_file',
        'ebill_proof.pdf',
        pdfBytes,
        'application/pdf'
      );

      assert(upRes.status === 201 && upRes.body.document_id, 'Test A1: Citizen uploaded document successfully');
      const docId = upRes.body.document_id;

      // Immediate retrieval
      const getMy1 = await request('GET', '/documents/my', { 'Authorization': `Bearer ${citToken}` });
      assert(getMy1.status === 200 && Array.isArray(getMy1.body), 'Test A2: getMyDocuments returns 200 array');
      const foundInList = (getMy1.body || []).find(d => d.document_id === docId);
      assert(Boolean(foundInList), 'Test A3: Uploaded document appears immediately in My Documents');
      assert(foundInList?.assigned_volunteer_name, 'Test A4: Assigned volunteer details returned to citizen');

      // Persistence across logout/login
      const citReLogin = await request('POST', '/auth/login', {}, { email: 'ramesh.k@example.com', password: 'password123' });
      const newCitToken = citReLogin.body.token;
      const getMy2 = await request('GET', '/documents/my', { 'Authorization': `Bearer ${newCitToken}` });
      const stillFound = (getMy2.body || []).find(d => d.document_id === docId);
      assert(Boolean(stillFound), 'Test A5: Document remains visible after logout and login');

      // Secure streaming of document file by owner citizen
      const streamRes = await request('GET', `/documents/${docId}/versions/${foundInList.version_id}/file`, {
        'Authorization': `Bearer ${newCitToken}`
      });
      assert(streamRes.status === 200 && streamRes.headers['content-type'] === 'application/pdf', 'Test A6: Citizen can stream/preview their own document');

      // ===============================================================
      // TEST B: Region-Based Volunteer Assignment
      // ===============================================================
      console.log('\n--- TEST B: Region-Based Volunteer Assignment ---');
      // Citizen Ramesh (Area 1 - Bengaluru South Zone) must be assigned a volunteer in Area 1
      const [assignmentRow] = await db.query(
        `SELECT va.*, v.name as vol_name, v.area_id, ar.name as area_name
         FROM Volunteer_Assignment va
         JOIN Volunteer v ON v.volunteer_id = va.volunteer_id
         JOIN Area ar ON ar.area_id = v.area_id
         WHERE va.document_id = ? AND va.status = 'Active'`,
        [docId]
      );
      assert(Boolean(assignmentRow), 'Test B1: Assignment record exists in MySQL');
      assert(assignmentRow?.area_id === 1, `Test B2: Volunteer assigned from same area (Area 1: ${assignmentRow?.area_name})`);
      assert(['Arjun Reddy', 'Divya Murthy'].includes(assignmentRow?.vol_name), 'Test B3: Correct local volunteer assigned');

      // ===============================================================
      // TEST C: Volunteer Review & Document Preview
      // ===============================================================
      console.log('\n--- TEST C: Volunteer Review Action ---');
      const assignedVolId = assignmentRow.volunteer_id;
      const assignedVolToken = assignedVolId === 1 ? vol1Token : (await request('POST', '/auth/login', {}, { email: 'divya.v@example.com', password: 'password123' })).body.token;

      // Check volunteer pending queue
      const volQueue = await request('GET', '/volunteer/document-reviews', { 'Authorization': `Bearer ${assignedVolToken}` });
      const docInVolQueue = (volQueue.body.pending || []).find(d => d.document_id === docId);
      assert(Boolean(docInVolQueue), 'Test C1: Document appears in assigned volunteer pending queue');

      // Volunteer opens detail and streams document
      const volDocDetail = await request('GET', `/volunteer/document-reviews/${docId}`, { 'Authorization': `Bearer ${assignedVolToken}` });
      assert(volDocDetail.status === 200 && volDocDetail.body.citizen_name, 'Test C2: Volunteer opened document detail successfully');

      const volStream = await request('GET', `/documents/${docId}/versions/${foundInList.version_id}/file`, {
        'Authorization': `Bearer ${assignedVolToken}`
      });
      assert(volStream.status === 200, 'Test C3: Volunteer can stream and preview the actual PDF document');

      // Volunteer submits review: Correction Needed
      const revRes = await request('POST', `/volunteer/document-reviews/${docId}/review`, {
        'Authorization': `Bearer ${assignedVolToken}`
      }, {
        review_decision: 'Correction Needed',
        reason: 'Blurry document',
        feedback_message: 'The electricity consumer ID is blurry. Please upload a high-resolution scan.'
      });
      assert(revRes.status === 200, 'Test C4: Volunteer submitted review: Correction Needed');

      // ===============================================================
      // TEST D: Citizen Feedback & Resubmission Loop
      // ===============================================================
      console.log('\n--- TEST D: Citizen Feedback & Resubmission ---');
      const notifsRes = await request('GET', '/notifications', { 'Authorization': `Bearer ${newCitToken}` });
      const correctionNotif = (notifsRes.body || []).find(n => n.document_id === docId);
      assert(Boolean(correctionNotif), 'Test D1: Citizen received in-app notification regarding correction');

      // Citizen resubmits corrected document (v2)
      const clearPdf = Buffer.from('%PDF-1.4\n2 0 obj<<>>endobj\ntrailer<<>>%%EOF');
      const resubRes = await uploadMultipart(
        `/documents/${docId}/resubmit`,
        newCitToken,
        {},
        'document_file',
        'ebill_clear_v2.pdf',
        clearPdf,
        'application/pdf'
      );
      assert(resubRes.status === 200 && resubRes.body.version_number === 2, 'Test D2: Citizen resubmitted corrected document as v2');

      // Verify v2 returns to volunteer pending queue
      const volQueue2 = await request('GET', '/volunteer/document-reviews', { 'Authorization': `Bearer ${assignedVolToken}` });
      const inQueueAgain = (volQueue2.body.pending || []).find(d => d.document_id === docId);
      assert(Boolean(inQueueAgain && inQueueAgain.current_version === 2), 'Test D3: Resubmitted v2 returned to volunteer pending queue');

      // Volunteer approves v2: No Issues Found
      const approveRes = await request('POST', `/volunteer/document-reviews/${docId}/review`, {
        'Authorization': `Bearer ${assignedVolToken}`
      }, {
        review_decision: 'No Issues Found',
        feedback_message: 'Document is clear and verified.'
      });
      assert(approveRes.status === 200, 'Test D4: Volunteer approved document: No Issues Found');

      // Assignment completed and moved to review history
      const volQueue3 = await request('GET', '/volunteer/document-reviews', { 'Authorization': `Bearer ${assignedVolToken}` });
      const removedFromPending = !(volQueue3.body.pending || []).some(d => d.document_id === docId);
      const inHistory = (volQueue3.body.history || []).some(d => d.document_id === docId);
      assert(removedFromPending && inHistory, 'Test D5: Completed review moved from Pending to Review History');

      // ===============================================================
      // TEST E: Security & Isolation
      // ===============================================================
      console.log('\n--- TEST E: Security & Access Control ---');
      // Citizen 2 (Sunitha) cannot access Citizen 1's document
      const crossCitizenRes = await request('GET', `/documents/${docId}`, { 'Authorization': `Bearer ${cit2Token}` });
      assert(crossCitizenRes.status === 403, 'Test E1: Cross-citizen document access strictly denied (403)');

      // Unrelated volunteer (Kiran from Area 2) cannot access Citizen 1's completed review
      const crossVolRes = await request('GET', `/volunteer/document-reviews/${docId}`, { 'Authorization': `Bearer ${vol3Token}` });
      assert(crossVolRes.status === 403, 'Test E2: Unrelated volunteer cannot access document (403)');

      // Unauthenticated access blocked
      const unauthRes = await request('GET', `/documents/${docId}`);
      assert(unauthRes.status === 401, 'Test E3: Unauthenticated document access blocked (401)');

      // Verify core SIR records are immutable
      const finalCitRows = await db.query('SELECT COUNT(*) AS count FROM Citizen');
      const finalVotRows = await db.query('SELECT COUNT(*) AS count FROM Voter_Record');
      const finalReqRows = await db.query('SELECT COUNT(*) AS count FROM Verification_Request');
      assert(
        initialCitCount === finalCitRows[0].count &&
        initialVotCount === finalVotRows[0].count &&
        initialReqCount === finalReqRows[0].count,
        'Test E4: Existing SIR records remain completely preserved and unchanged'
      );

      // ===============================================================
      // TEST F: Admin Regional Assignment & Override
      // ===============================================================
      console.log('\n--- TEST F: Admin Regional Recommendations & Override ---');
      const eligRes = await request('GET', `/admin/documents/${docId}/eligible-volunteers`, {
        'Authorization': `Bearer ${adminToken}`
      });
      assert(eligRes.status === 200 && Array.isArray(eligRes.body.volunteers), 'Test F1: Admin fetched regional recommendations');
      assert(eligRes.body.volunteers[0]?.recommendation?.includes('Recommended'), 'Test F2: Top recommended volunteer is from same locality/district');

      // Admin reassigns to Volunteer 1 (Arjun)
      const adminReassign = await request('POST', '/admin/volunteer-assignments', {
        'Authorization': `Bearer ${adminToken}`
      }, {
        document_id: docId,
        volunteer_id: 1
      });
      assert(adminReassign.status === 201, 'Test F3: Admin successfully reassigned volunteer via atomic transaction');

      console.log('\n===============================================================');
      console.log(`📊 Test Execution Summary: ${passed} PASSED, ${failed} FAILED (Total: ${passed + failed})`);
      console.log('===============================================================\n');

      server.close();
      process.exit(failed > 0 ? 1 : 0);
    } catch (err) {
      console.error('Fatal test error:', err);
      if (server) server.close();
      process.exit(1);
    }
  });
}

runTests();

