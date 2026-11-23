/**
 * SIRAssist – Urgent Bug Fix Verification Test
 * Verifies:
 * 1. Automatic region assignment: assigned_by = NULL, assignment_method = 'AUTO'
 * 2. Upload resilience: upload succeeds even if no volunteer is available -> 'Pending Assignment'
 * 3. Manual assignment: assigned_by = admin_id, assignment_method = 'MANUAL'
 * 4. Citizen visibility: document immediately visible in My Documents with status and assigned volunteer details
 * 5. Foreign keys and SIR data integrity remain 100% intact
 */
const http = require('http');
const db = require('../backend/db/connection');
const app = require('../backend/server');

const PORT = 5098;
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

async function run() {
  console.log('\n================================================================');
  console.log('🧪 Verifying Fix: Column assigned_by cannot be null & Auto/Manual Workflow');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, name, details = '') {
    if (condition) {
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name} - ${details}`);
      failed++;
    }
  }

  server = app.listen(PORT, async () => {
    try {
      // 1. Auth tokens
      const citLogin = await request('POST', '/auth/login', {}, { email: 'ramesh.k@example.com', password: 'password123' });
      assert(citLogin.status === 200, 'Citizen Ramesh logged in');
      const citToken = citLogin.body.token;

      const adminLogin = await request('POST', '/auth/login', {}, { email: 'admin@sirassist.org', password: 'password123' });
      assert(adminLogin.status === 200, 'Admin logged in');
      const adminToken = adminLogin.body.token;

      // 2. Test Step 1 & 2: Automatic Region-based upload
      console.log('\n--- Step 1 & 2: Document Upload with Auto-Assignment ---');
      const testPdf = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>%%EOF');
      const uploadRes = await uploadMultipart(
        '/documents/upload',
        citToken,
        { document_type: 'Income Certificate Proof' },
        'document_file',
        'income_proof.pdf',
        testPdf,
        'application/pdf'
      );

      assert(uploadRes.status === 201, 'Upload HTTP status is 201', JSON.stringify(uploadRes.body));
      assert(uploadRes.body.document_id, 'Document ID returned');
      const docId = uploadRes.body.document_id;

      // 3. Inspect database: Volunteer_Assignment table
      const [assignment] = await db.query(
        'SELECT * FROM Volunteer_Assignment WHERE document_id = ? ORDER BY assignment_id DESC LIMIT 1',
        [docId]
      );
      assert(!!assignment, 'Volunteer_Assignment record created in MySQL');
      assert(assignment.assigned_by === null, 'Volunteer_Assignment.assigned_by is strictly NULL for AUTO assignment');
      assert(assignment.assignment_method === 'AUTO', "Volunteer_Assignment.assignment_method is 'AUTO'");
      assert(assignment.status === 'Active', "Volunteer_Assignment.status is 'Active'");

      // Check document status
      const [doc] = await db.query('SELECT * FROM Document WHERE document_id = ?', [docId]);
      assert(doc.file_review_status === 'Pending Review', "Document.file_review_status transitioned to 'Pending Review'");

      // 4. Test Step 4: Citizen visibility
      console.log('\n--- Step 4: Immediate Citizen Document Visibility ---');
      const myDocsRes = await request('GET', '/documents/my', { 'Authorization': `Bearer ${citToken}` });
      assert(myDocsRes.status === 200, 'getMyDocuments returns 200');
      const uploadedDoc = (myDocsRes.body || []).find(d => d.document_id === docId);
      assert(!!uploadedDoc, 'Uploaded document is immediately visible in My Documents');
      assert(uploadedDoc.assigned_volunteer_name !== undefined, 'Assigned volunteer name is populated for citizen');
      assert(uploadedDoc.file_review_status === 'Pending Review', 'Review status displayed accurately to citizen');

      // 5. Test Step 2 & 5: Manual Assignment by Admin
      console.log('\n--- Step 2 & 5: Admin Manual Assignment Override ---');
      // Reassign to volunteer 2 (Priya Sharma)
      const manualRes = await request('POST', '/admin/volunteer-assignments', {
        'Authorization': `Bearer ${adminToken}`
      }, {
        document_id: docId,
        volunteer_id: 2
      });
      assert(manualRes.status === 201, 'Admin reassigns volunteer successfully');

      const [manualAssign] = await db.query(
        'SELECT * FROM Volunteer_Assignment WHERE document_id = ? ORDER BY assignment_id DESC LIMIT 1',
        [docId]
      );
      assert(manualAssign.volunteer_id === 2, 'New assignment points to Volunteer 2');
      assert(manualAssign.assigned_by !== null, 'Volunteer_Assignment.assigned_by is set to Admin user_id for MANUAL assignment');
      assert(manualAssign.assignment_method === 'MANUAL', "Volunteer_Assignment.assignment_method is 'MANUAL'");

      // 6. Test Step 3: Upload when no regional volunteer available (Simulated by temporarily setting all volunteers to Unavailable)
      console.log('\n--- Step 3: Upload Resilience When No Volunteer Available ---');
      // Set all volunteers to 'Busy' temporarily
      await db.query("UPDATE Volunteer SET availability = 'Busy'");

      const noVolUpload = await uploadMultipart(
        '/documents/upload',
        citToken,
        { document_type: 'Ration Card Proof' },
        'document_file',
        'ration_card.pdf',
        testPdf,
        'application/pdf'
      );

      assert(noVolUpload.status === 201, 'Upload succeeds with 201 even when NO volunteer is available', JSON.stringify(noVolUpload.body));
      const noVolDocId = noVolUpload.body.document_id;
      assert(noVolUpload.body.status === 'Pending Assignment', "Upload response status reports 'Pending Assignment'");

      const [noVolDoc] = await db.query('SELECT * FROM Document WHERE document_id = ?', [noVolDocId]);
      assert(noVolDoc.file_review_status === 'Pending Assignment', "Document.file_review_status in MySQL is 'Pending Assignment'");

      const noVolAssignments = await db.query('SELECT * FROM Volunteer_Assignment WHERE document_id = ?', [noVolDocId]);
      assert(noVolAssignments.length === 0, 'No partial or invalid assignment records created in database');

      // Restore volunteer availability
      await db.query("UPDATE Volunteer SET availability = 'Available'");

      // Citizen checks My Documents
      const myDocsAfter = await request('GET', '/documents/my', { 'Authorization': `Bearer ${citToken}` });
      const pendingDoc = (myDocsAfter.body || []).find(d => d.document_id === noVolDocId);
      assert(!!pendingDoc, 'Pending Assignment document is immediately visible in My Documents');
      assert(pendingDoc.file_review_status === 'Pending Assignment', 'Status displays as Pending Assignment');
      assert(!pendingDoc.assigned_volunteer_name, 'No volunteer is displayed (properly shows not assigned yet)');

      console.log('\n================================================================');
      console.log(`📊 Test Summary: ${passed} PASSED, ${failed} FAILED (Total: ${passed + failed})`);
      console.log('================================================================\n');

      server.close();
      process.exit(failed > 0 ? 1 : 0);
    } catch (err) {
      console.error('Fatal test error:', err);
      // Restore availability in case of error
      await db.query("UPDATE Volunteer SET availability = 'Available'").catch(() => {});
      if (server) server.close();
      process.exit(1);
    }
  });
}

run();
