/**
 * Automated Test Runner for SIRAssist Document Review Workflow
 * Evaluates Phase 13 Test Cases:
 *  1. Valid PDF upload
 *  2. Valid JPG upload
 *  3. Unsupported file type rejection
 *  4. File-size limit rejection (>5 MB)
 *  5. Upload without authentication
 *  6. Citizen accessing another citizen's document
 *  7. Unassigned volunteer attempting document access
 *  8. Assigned volunteer successfully opening a document
 *  9. Review submission without decision
 * 10. Correction decision without feedback
 * 11. Valid review submission
 * 12. Notification creation
 * 13. Citizen viewing notification
 * 14. Citizen resubmitting corrected document
 * 15. Previous version retained
 * 16. Latest version displayed correctly
 * 17. Review transaction rollback on failure
 * 18. Existing SIR records remain unchanged
 */

const db = require('../backend/db/connection');
const app = require('../backend/server');

const TEST_PORT = 5066;
let server;
const baseURL = `http://localhost:${TEST_PORT}/api`;

const results = [];

function recordResult(testId, name, expected, actual, pass) {
  results.push({
    testId,
    name,
    expected,
    actual: typeof actual === 'object' ? JSON.stringify(actual) : String(actual),
    pass: pass ? 'PASS' : 'FAIL'
  });
  const icon = pass ? '✅' : '❌';
  console.log(`${icon} [${testId}] ${name}: ${pass ? 'PASS' : 'FAIL'} (Expected: ${expected}, Got: ${actual})`);
}

async function request(method, path, body = null, token = null, isFormData = false) {
  const headers = {};
  if (!isFormData) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = { method, headers };
  if (body) {
    options.body = isFormData ? body : JSON.stringify(body);
  }

  const res = await fetch(`${baseURL}${path}`, options);
  let data = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch (e) {
      data = null;
    }
  } else {
    data = await res.text();
  }
  return { status: res.status, headers: res.headers, data };
}

async function runTests() {
  console.log('===============================================================');
  console.log('🧪 Starting SIRAssist Document Review Workflow Test Suite');
  console.log('===============================================================');

  // Start test server on dedicated port
  await new Promise(resolve => {
    server = app.listen(TEST_PORT, () => {
      console.log(`Test server running at http://localhost:${TEST_PORT}`);
      resolve();
    });
  });

  try {
    // ── Log in accounts ──
    const loginCitizen1 = await request('POST', '/auth/login', { email: 'ramesh.k@example.com', password: 'password123' });
    const cit1Token = loginCitizen1.data.token;

    const loginCitizen2 = await request('POST', '/auth/login', { email: 'sunitha.rao@example.com', password: 'password123' });
    const cit2Token = loginCitizen2.data.token;

    const loginVolunteer1 = await request('POST', '/auth/login', { email: 'arjun.v@example.com', password: 'password123' });
    const vol1Token = loginVolunteer1.data.token;

    const loginVolunteer2 = await request('POST', '/auth/login', { email: 'divya.v@example.com', password: 'password123' });
    const vol2Token = loginVolunteer2.data.token;

    const loginAdmin = await request('POST', '/auth/login', { email: 'admin@sirassist.org', password: 'password123' });
    const adminToken = loginAdmin.data.token;

    // ── Pre-check: Count existing baseline records ──
    const [citCountBefore] = await db.query('SELECT COUNT(*) AS count FROM Citizen');
    const [voterCountBefore] = await db.query('SELECT COUNT(*) AS count FROM Voter_Record');
    const [reqCountBefore] = await db.query('SELECT COUNT(*) AS count FROM Verification_Request');

    let createdDocId = null;

    // ── Test 1: Valid PDF Upload ──
    {
      const formData = new FormData();
      const samplePdfBlob = new Blob(['%PDF-1.4 sample address proof document'], { type: 'application/pdf' });
      formData.append('document_file', samplePdfBlob, 'sample_address_proof.pdf');
      formData.append('document_type', 'Address Proof (Utility Bill / Rent Agreement)');
      formData.append('description', 'Test electricity bill proof');

      const res = await request('POST', '/documents/upload', formData, cit1Token, true);
      const pass = res.status === 201 && res.data.document_id && res.data.status === 'Pending Review';
      if (pass) createdDocId = res.data.document_id;
      recordResult('TC-01', 'Valid PDF Upload', 'Status 201 with document_id and Pending Review status', `Status ${res.status}`, pass);
    }

    // ── Test 2: Valid JPG Upload ──
    {
      const formData = new FormData();
      const sampleJpgBlob = new Blob(['fake-jpg-binary-content'], { type: 'image/jpeg' });
      formData.append('document_file', sampleJpgBlob, 'sample_identity_proof.jpg');
      formData.append('document_type', 'Identity Proof (Masked Aadhaar / Passport)');
      formData.append('description', 'Test photo identity card');

      const res = await request('POST', '/documents/upload', formData, cit1Token, true);
      const pass = res.status === 201 && res.data.document_id;
      recordResult('TC-02', 'Valid JPG Upload', 'Status 201 with document_id', `Status ${res.status}`, pass);
    }

    // ── Test 3: Unsupported File Type Rejection ──
    {
      const formData = new FormData();
      const exeBlob = new Blob(['MZ executable binary payload'], { type: 'application/x-msdownload' });
      formData.append('document_file', exeBlob, 'malicious_file.exe');
      formData.append('document_type', 'Address Proof (Utility Bill / Rent Agreement)');

      const res = await request('POST', '/documents/upload', formData, cit1Token, true);
      const pass = res.status === 500 || res.status === 400; // Multer error caught
      recordResult('TC-03', 'Unsupported File Type Rejection', 'Status 400 or 500 error from Multer fileFilter', `Status ${res.status}`, pass);
    }

    // ── Test 4: File Size Limit Rejection (> 5 MB) ──
    {
      const formData = new FormData();
      // Generate 5.5 MB payload
      const largeBlob = new Blob([new Uint8Array(5.5 * 1024 * 1024)], { type: 'application/pdf' });
      formData.append('document_file', largeBlob, 'oversized_document.pdf');
      formData.append('document_type', 'Address Proof (Utility Bill / Rent Agreement)');

      const res = await request('POST', '/documents/upload', formData, cit1Token, true);
      const pass = res.status === 500 || res.status === 400;
      recordResult('TC-04', 'File-size Limit Rejection (> 5 MB)', 'Rejected due to size limit', `Status ${res.status}`, pass);
    }

    // ── Test 5: Upload Without Authentication ──
    {
      const formData = new FormData();
      const pdfBlob = new Blob(['%PDF-1.4 document'], { type: 'application/pdf' });
      formData.append('document_file', pdfBlob, 'doc.pdf');
      formData.append('document_type', 'Address Proof');

      const res = await request('POST', '/documents/upload', formData, null, true);
      const pass = res.status === 401;
      recordResult('TC-05', 'Upload Without Authentication', 'Status 401 Unauthorized', `Status ${res.status}`, pass);
    }

    // ── Test 6: Citizen Accessing Another Citizen's Document ──
    {
      // Citizen 2 attempts to fetch Citizen 1's document
      const res = await request('GET', `/documents/${createdDocId}`, null, cit2Token);
      const pass = res.status === 403 || res.status === 404;
      recordResult('TC-06', 'Citizen Accessing Another Citizen Document', 'Status 403 or 404 access denied', `Status ${res.status}`, pass);
    }

    // ── Test 7: Unassigned Volunteer Attempting Document Access ──
    {
      // Volunteer 1 is not yet assigned to createdDocId
      const res = await request('GET', `/volunteer/document-reviews/${createdDocId}`, null, vol1Token);
      const pass = res.status === 403;
      recordResult('TC-07', 'Unassigned Volunteer Attempting Document Access', 'Status 403 Access Denied (Not assigned)', `Status ${res.status}`, pass);
    }

    // ── Step: Admin assigns Volunteer 1 to createdDocId ──
    {
      const assignRes = await request('POST', '/admin/volunteer-assignments', {
        document_id: createdDocId,
        volunteer_id: 1 // Arjun Reddy
      }, adminToken);
      if (assignRes.status !== 201) console.error('Assignment error:', assignRes.data);
    }

    // ── Test 8: Assigned Volunteer Successfully Opening Document ──
    {
      const res = await request('GET', `/volunteer/document-reviews/${createdDocId}`, null, vol1Token);
      const pass = res.status === 200 && res.data.document && res.data.document.document_id === createdDocId;
      recordResult('TC-08', 'Assigned Volunteer Successfully Opening Document', 'Status 200 with document metadata & versions', `Status ${res.status}`, pass);
    }

    // ── Test 9: Review Submission Without Decision ──
    {
      const res = await request('POST', `/volunteer/document-reviews/${createdDocId}/review`, {
        feedback_message: 'Incomplete review attempt'
      }, vol1Token);
      const pass = res.status === 400;
      recordResult('TC-09', 'Review Submission Without Decision', 'Status 400 Bad Request', `Status ${res.status}`, pass);
    }

    // ── Test 10: Correction Decision Without Feedback ──
    {
      const res = await request('POST', `/volunteer/document-reviews/${createdDocId}/review`, {
        review_decision: 'Correction Required',
        issue_category: 'Blurry or unreadable document',
        feedback_message: '' // Empty feedback
      }, vol1Token);
      const pass = res.status === 400;
      recordResult('TC-10', 'Correction Decision Without Feedback', 'Status 400 Mandatory feedback required', `Status ${res.status}`, pass);
    }

    // ── Test 11: Valid Review Submission (Correction Required) ──
    {
      const res = await request('POST', `/volunteer/document-reviews/${createdDocId}/review`, {
        review_decision: 'Correction Required',
        issue_category: 'Blurry or unreadable document',
        feedback_message: 'The uploaded utility bill scan is blurry and the meter address is illegible. Please upload a clear photo showing the complete page.'
      }, vol1Token);
      const pass = res.status === 200 && res.data.new_status === 'Correction Required';
      recordResult('TC-11', 'Valid Review Submission', 'Status 200 with new_status = Correction Required', `Status ${res.status}`, pass);
    }

    // ── Test 12: Notification Creation ──
    {
      const notifs = await db.query(
        'SELECT notification_id, title, message, read_status FROM Notification WHERE document_id = ? ORDER BY notification_id DESC LIMIT 1',
        [createdDocId]
      );
      const pass = notifs.length > 0 && notifs[0].title.includes('Correction') && notifs[0].read_status === 0;
      recordResult('TC-12', 'Notification Creation in Database', 'Notification record present with unread status', `Found ${notifs.length} notification(s)`, pass);
    }

    // ── Test 13: Citizen Viewing Notification ──
    {
      const res = await request('GET', '/notifications', null, cit1Token);
      const found = Array.isArray(res.data) && res.data.some(n => n.document_id === createdDocId);
      const pass = res.status === 200 && found;
      recordResult('TC-13', 'Citizen Viewing Notification in Inbox', 'Status 200 containing document review notification', `Found: ${found}`, pass);
    }

    // ── Test 14: Citizen Resubmitting Corrected Document (Version 2) ──
    {
      const formData = new FormData();
      const correctedPdfBlob = new Blob(['%PDF-1.4 corrected clear high-res utility bill'], { type: 'application/pdf' });
      formData.append('document_file', correctedPdfBlob, 'corrected_clear_bill.pdf');

      const res = await request('POST', `/documents/${createdDocId}/resubmit`, formData, cit1Token, true);
      const pass = res.status === 200 && res.data.version_number === 2 && res.data.status === 'Pending Review';
      recordResult('TC-14', 'Citizen Resubmitting Corrected Document', 'Status 200 with version_number = 2 and status = Pending Review', `Status ${res.status}, v${res.data?.version_number}`, pass);
    }

    // ── Test 15: Previous Version Retained in Audit History ──
    {
      const versions = await db.query(
        'SELECT version_number, original_filename FROM Document_Version WHERE document_id = ? ORDER BY version_number ASC',
        [createdDocId]
      );
      const reviews = await db.query(
        'SELECT r.review_decision FROM Document_Review r JOIN Document_Version v ON r.version_id = v.version_id WHERE v.document_id = ?',
        [createdDocId]
      );
      const pass = versions.length === 2 && reviews.length === 1 && reviews[0].review_decision === 'Correction Required';
      recordResult('TC-15', 'Previous Version & Review Retained in Audit Trail', '2 versions stored; v1 review decision preserved', `${versions.length} versions, ${reviews.length} review(s)`, pass);
    }

    // ── Test 16: Latest Version Displayed Correctly ──
    {
      const res = await request('GET', `/documents/${createdDocId}`, null, cit1Token);
      const doc = res.data.document;
      const pass = res.status === 200 && doc.current_version === 2 && doc.file_review_status === 'Pending Review';
      recordResult('TC-16', 'Latest Version Displayed Correctly', 'current_version = 2, file_review_status = Pending Review', `v${doc?.current_version}, status: ${doc?.file_review_status}`, pass);
    }

    // ── Test 17: Review Transaction Rollback on Simulated Failure ──
    {
      let caughtRollback = false;
      const statusBefore = (await db.query('SELECT file_review_status FROM Document WHERE document_id = ?', [createdDocId]))[0].file_review_status;

      try {
        await db.executeTransaction(async (conn) => {
          // Update status
          await conn.query('UPDATE Document SET file_review_status = ? WHERE document_id = ?', ['Reviewed – No Issues Found', createdDocId]);
          // Simulate an intentional database error (foreign key or duplicate constraint failure)
          await conn.query('INSERT INTO Document_Review (version_id, volunteer_id, review_decision) VALUES (9999999, 1, "Reviewed – No Issues Found")');
        });
      } catch (err) {
        caughtRollback = true;
      }

      const statusAfter = (await db.query('SELECT file_review_status FROM Document WHERE document_id = ?', [createdDocId]))[0].file_review_status;
      const pass = caughtRollback && statusBefore === statusAfter;
      recordResult('TC-17', 'Review Transaction Rollback on Failure', 'Transaction rolls back; document status unchanged', `Caught error: ${caughtRollback}, status before = status after (${statusAfter})`, pass);
    }

    // ── Test 18: Existing SIR Records Remain Unchanged ──
    {
      const [citCountAfter] = await db.query('SELECT COUNT(*) AS count FROM Citizen');
      const [voterCountAfter] = await db.query('SELECT COUNT(*) AS count FROM Voter_Record');
      const [reqCountAfter] = await db.query('SELECT COUNT(*) AS count FROM Verification_Request');

      const pass =
        citCountBefore.count === citCountAfter.count &&
        voterCountBefore.count === voterCountAfter.count &&
        reqCountBefore.count === reqCountAfter.count;

      recordResult('TC-18', 'Existing SIR Records Remain Unchanged', 'Counts of Citizen, Voter_Record, Verification_Request unchanged', `Citizens: ${citCountAfter.count}, Voters: ${voterCountAfter.count}, Requests: ${reqCountAfter.count}`, pass);
    }

    // ── Final Summary ──
    const totalPassed = results.filter(r => r.pass === 'PASS').length;
    const totalFailed = results.filter(r => r.pass === 'FAIL').length;

    console.log('===============================================================');
    console.log(`📊 Test Execution Summary: ${totalPassed} PASSED, ${totalFailed} FAILED (Total: ${results.length})`);
    console.log('===============================================================');

  } catch (err) {
    console.error('Fatal test error:', err);
  } finally {
    if (server) {
      server.close();
      console.log('Test server closed.');
    }
    process.exit(0);
  }
}

runTests();
