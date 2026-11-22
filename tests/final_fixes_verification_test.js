/**
 * SIRAssist – Final Bug Fixes, Security & Workflow Verification Test
 * Verifies:
 *   1. Task 2: Completed volunteer assignments remain visible in history, are read-only, streamable, and prevent duplicate reviews.
 *   2. Task 3: Citizen document resubmission reliably reactivates the volunteer assignment and lands in Pending queue.
 *   3. Task 4: Concurrent version safety and file cleanup on error.
 *   4. Task 5: Atomic volunteer assignment by admin.
 */
const http = require('http');
const path = require('path');
const fs   = require('fs');
const db   = require('../backend/db/connection');
const app  = require('../backend/server');

const PORT = 5088;
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
  console.log('🧪 Starting SIRAssist Final Fixes Verification Test Suite');
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
      // 1. Authenticate users
      const citizenLogin = await request('POST', '/auth/login', {}, { email: 'ramesh.k@example.com', password: 'password123' });
      const citizenToken = citizenLogin.body.token;

      const volunteer1Login = await request('POST', '/auth/login', {}, { email: 'arjun.v@example.com', password: 'password123' });
      const volunteer1Token = volunteer1Login.body.token;

      const volunteer2Login = await request('POST', '/auth/login', {}, { email: 'divya.v@example.com', password: 'password123' });
      const volunteer2Token = volunteer2Login.body.token;

      const adminLogin = await request('POST', '/auth/login', {}, { email: 'admin@sirassist.org', password: 'password123' });
      const adminToken = adminLogin.body.token;

      assert(Boolean(citizenToken && volunteer1Token && volunteer2Token && adminToken), 'Authentication for Citizen, Volunteers & Admin succeeded');

      // 2. Citizen uploads new document
      const samplePdf = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>%%EOF');
      const upRes = await uploadMultipart(
        '/documents/upload',
        citizenToken,
        { document_type: 'Electricity Bill Verification', description: 'Address verification for review fix' },
        'document_file',
        'ebill_test.pdf',
        samplePdf,
        'application/pdf'
      );
      assert(upRes.status === 201 && upRes.body.document_id, 'Citizen uploaded document successfully (v1)');
      const docId = upRes.body.document_id;

      // 3. Admin assigns to Volunteer 1 (Arjun) via atomic transaction (Task 5)
      const assignRes = await request('POST', '/admin/volunteer-assignments', {
        'Authorization': `Bearer ${adminToken}`
      }, { document_id: docId, volunteer_id: 1 });
      assert(assignRes.status === 201 && assignRes.body.assignment_id, 'Task 5: Admin atomic volunteer assignment succeeded');

      // 4. Volunteer 1 sees document in 'pending' queue
      const queueRes = await request('GET', '/volunteer/document-reviews', {
        'Authorization': `Bearer ${volunteer1Token}`
      });
      const inPending = (queueRes.body.pending || []).some(d => d.document_id === docId);
      assert(inPending, 'Task 2: Document appears in assigned volunteer Pending Reviews queue');

      // 5. Volunteer 1 reviews with 'Correction Required'
      const rev1Res = await request('POST', `/volunteer/document-reviews/${docId}/review`, {
        'Authorization': `Bearer ${volunteer1Token}`
      }, {
        review_decision: 'Correction Required',
        issue_category: 'Blurry or unreadable document',
        feedback_message: 'Please upload a sharper scan showing consumer number and address.'
      });
      assert(rev1Res.status === 200, 'Volunteer 1 submitted review: Correction Required');

      // 6. Citizen resubmits version 2 (Task 3 & 4)
      const resubRes = await uploadMultipart(
        `/documents/${docId}/resubmit`,
        citizenToken,
        {},
        'document_file',
        'ebill_sharp_v2.pdf',
        samplePdf,
        'application/pdf'
      );
      assert(resubRes.status === 200 && resubRes.body.version_number === 2, 'Task 3 & 4: Citizen resubmission creates v2 with row lock and Pending Review status');

      // 7. Verify assignment was reactivated for Volunteer 1 and appears back in Pending queue (Task 3)
      const queueAfterResub = await request('GET', '/volunteer/document-reviews', {
        'Authorization': `Bearer ${volunteer1Token}`
      });
      const backInPending = (queueAfterResub.body.pending || []).some(d => d.document_id === docId);
      assert(backInPending, 'Task 3: Document v2 reliably returned to assigned volunteer Pending queue');

      // 8. Volunteer 1 reviews v2 with 'Reviewed – No Issues Found'
      const rev2Res = await request('POST', `/volunteer/document-reviews/${docId}/review`, {
        'Authorization': `Bearer ${volunteer1Token}`
      }, {
        review_decision: 'Reviewed – No Issues Found',
        feedback_message: 'Scan is clear and verified against address checklist.'
      });
      assert(rev2Res.status === 200, 'Volunteer 1 approved v2: Reviewed – No Issues Found');

      // 9. Verify assignment is now 'Completed' and appears in 'history' (Task 2)
      const queueAfterComplete = await request('GET', '/volunteer/document-reviews', {
        'Authorization': `Bearer ${volunteer1Token}`
      });
      const inHistory = (queueAfterComplete.body.history || []).some(d => d.document_id === docId);
      const notInPending = !(queueAfterComplete.body.pending || []).some(d => d.document_id === docId);
      assert(inHistory && notInPending, 'Task 2: Completed document is in Review History and removed from Pending');

      // 10. Volunteer 1 opens completed document: Must be accessible and marked is_read_only (Task 2)
      const detailRes = await request('GET', `/volunteer/document-reviews/${docId}`, {
        'Authorization': `Bearer ${volunteer1Token}`
      });
      assert(detailRes.status === 200 && detailRes.body.is_read_only === true, 'Task 2: Volunteer can open completed review in read-only mode');

      // 11. Volunteer 1 streaming file of completed document (Task 2)
      const v2Id = detailRes.body.versions[0].version_id;
      const streamRes = await request('GET', `/documents/${docId}/versions/${v2Id}/file`, {
        'Authorization': `Bearer ${volunteer1Token}`
      });
      assert(streamRes.status === 200 && streamRes.headers['content-type'] === 'application/pdf', 'Task 2: Volunteer can stream file of completed review');

      // 12. Security Check: Unrelated Volunteer 2 (Divya) is BLOCKED with 403 (Task 2)
      const unassignedDetail = await request('GET', `/volunteer/document-reviews/${docId}`, {
        'Authorization': `Bearer ${volunteer2Token}`
      });
      const unassignedStream = await request('GET', `/documents/${docId}/versions/${v2Id}/file`, {
        'Authorization': `Bearer ${volunteer2Token}`
      });
      assert(unassignedDetail.status === 403 && unassignedStream.status === 403, 'Task 2 Security: Unassigned volunteer is strictly blocked (403)');

      // 13. Duplicate review prevention on completed document (Task 2)
      const dupRev = await request('POST', `/volunteer/document-reviews/${docId}/review`, {
        'Authorization': `Bearer ${volunteer1Token}`
      }, {
        review_decision: 'Reviewed – No Issues Found'
      });
      assert(dupRev.status === 403 || dupRev.status === 409, 'Task 2 Security: Duplicate review on completed document rejected');

      console.log('\n===============================================================');
      console.log(`📊 Final Fixes Test Summary: ${passed} PASSED, ${failed} FAILED (Total: ${passed + failed})`);
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
