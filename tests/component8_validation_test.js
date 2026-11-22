/**
 * Automated Test Runner for SIRAssist - Component 8
 * Department of CSE (AI & ML), RV College of Engineering
 * Uses native Node.js fetch (zero external dependencies)
 */

const db = require('../backend/db/connection');
const app = require('../backend/server');

const TEST_PORT = 5055;
let server;
const baseURL = `http://localhost:${TEST_PORT}/api`;

const results = [];

function recordResult(testId, form, testCase, expected, actual, pass) {
  results.push({
    testId,
    form,
    testCase,
    expected,
    actual: typeof actual === 'object' ? JSON.stringify(actual) : String(actual),
    pass: pass ? 'PASS' : 'FAIL'
  });
}

async function request(method, path, body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${baseURL}${path}`, options);
  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }
  return { status: res.status, headers: res.headers, data };
}

async function runTests() {
  console.log('===============================================================');
  console.log('🧪 Starting SIRAssist Component 8 Automated Test Suite');
  console.log('===============================================================');

  // Start test server
  await new Promise(resolve => {
    server = app.listen(TEST_PORT, () => {
      console.log(`Test server running on port ${TEST_PORT}`);
      resolve();
    });
  });

  // Wait 1 second for DB pool initialization
  await new Promise(resolve => setTimeout(resolve, 1000));

  let citizenToken = '';
  let adminToken = '';
  let createdCitizenEmail = `test.citizen.${Date.now()}@example.com`;
  let createdDocId = null;
  let createdReqId = null;

  try {
    // -----------------------------------------------------------------
    // TEST 1: Form 1 - Registration with empty name
    // -----------------------------------------------------------------
    {
      const res = await request('POST', '/auth/register', {
        username: `user_${Date.now()}`,
        email: `emptyname_${Date.now()}@example.com`,
        password: 'Password@123',
        role: 'CITIZEN',
        name: '',
        mobile: '9845012345'
      });
      const match = res.status === 400 && res.data?.error?.includes('Full name');
      recordResult('T01', 'Form 1: Citizen Registration', 'Empty name submission', 'HTTP 400 (Full name required)', `HTTP ${res.status}: ${res.data?.error}`, match);
    }

    // -----------------------------------------------------------------
    // TEST 2: Form 1 - Registration with malformed email
    // -----------------------------------------------------------------
    {
      const res = await request('POST', '/auth/register', {
        username: `user_${Date.now()}`,
        email: 'invalid-email-address',
        password: 'Password@123',
        role: 'CITIZEN',
        name: 'Test Citizen',
        mobile: '9845012345'
      });
      const match = res.status === 400 && res.data?.error?.includes('valid email');
      recordResult('T02', 'Form 1: Citizen Registration', 'Invalid email format rejection', 'HTTP 400 (Valid email required)', `HTTP ${res.status}: ${res.data?.error}`, match);
    }

    // -----------------------------------------------------------------
    // TEST 3: Form 1 - Registration with 8-digit mobile
    // -----------------------------------------------------------------
    {
      const res = await request('POST', '/auth/register', {
        username: `user_${Date.now()}`,
        email: `badmob_${Date.now()}@example.com`,
        password: 'Password@123',
        role: 'CITIZEN',
        name: 'Test Citizen',
        mobile: '98450123'
      });
      const match = res.status === 400 && res.data?.error?.includes('10-digit');
      recordResult('T03', 'Form 1: Citizen Registration', 'Invalid 8-digit mobile rejection', 'HTTP 400 (10-digit mobile required)', `HTTP ${res.status}: ${res.data?.error}`, match);
    }

    // -----------------------------------------------------------------
    // TEST 4: Form 1 - Registration with weak password
    // -----------------------------------------------------------------
    {
      const res = await request('POST', '/auth/register', {
        username: `user_${Date.now()}`,
        email: `badpwd_${Date.now()}@example.com`,
        password: 'weak',
        role: 'CITIZEN',
        name: 'Test Citizen',
        mobile: '9845012345'
      });
      const match = res.status === 400 && res.data?.error?.includes('8 characters');
      recordResult('T04', 'Form 1: Citizen Registration', 'Weak password (<8 chars) rejection', 'HTTP 400 (Min 8 chars required)', `HTTP ${res.status}: ${res.data?.error}`, match);
    }

    // -----------------------------------------------------------------
    // TEST 5: Form 1 - Registration with duplicate email
    // -----------------------------------------------------------------
    {
      const res = await request('POST', '/auth/register', {
        username: `dup_${Date.now()}`,
        email: 'ramesh.k@example.com',
        password: 'Password@123',
        role: 'CITIZEN',
        name: 'Duplicate Ramesh',
        mobile: '9845012345'
      });
      const match = res.status === 400 && res.data?.error?.includes('already registered');
      recordResult('T05', 'Form 1: Citizen Registration', 'Duplicate email rejection (UNIQUE constraint)', 'HTTP 400 (Already registered)', `HTTP ${res.status}: ${res.data?.error}`, match);
    }

    // -----------------------------------------------------------------
    // TEST 6: Form 1 - Valid Citizen Registration
    // -----------------------------------------------------------------
    {
      const res = await request('POST', '/auth/register', {
        username: `cit_${Date.now()}`,
        email: createdCitizenEmail,
        password: 'Password@123',
        role: 'CITIZEN',
        name: 'Ananya Sharma',
        mobile: '9845019999',
        address: {
          house_number: '#12',
          street: 'Kengeri Ring Road',
          village: 'RVCE Zone',
          district: 'Bengaluru',
          pin_code: '560059'
        }
      });
      citizenToken = res.data?.token;
      recordResult('T06', 'Form 1: Citizen Registration', 'Valid Citizen registration', 'HTTP 201 Created & JWT issued', `HTTP ${res.status}: User ID ${res.data?.user?.user_id}`, res.status === 201);
    }

    // -----------------------------------------------------------------
    // TEST 7: Form 2 - Login with invalid password
    // -----------------------------------------------------------------
    {
      const res = await request('POST', '/auth/login', {
        email: 'ramesh.k@example.com',
        password: 'wrong_password_xyz'
      });
      const match = res.status === 401 && res.data?.error?.includes('Invalid email or password');
      recordResult('T07', 'Form 2: Login', 'Invalid password login', 'HTTP 401 Generic message', `HTTP ${res.status}: ${res.data?.error}`, match);
    }

    // -----------------------------------------------------------------
    // TEST 8: Form 2 - Valid Admin Login
    // -----------------------------------------------------------------
    {
      const res = await request('POST', '/auth/login', {
        email: 'admin@sirassist.org',
        password: 'password123'
      });
      adminToken = res.data?.token;
      recordResult('T08', 'Form 2: Login', 'Valid Admin Login', 'HTTP 200 with ADMIN role', `HTTP ${res.status}: Role ${res.data?.user?.role}`, res.data?.user?.role === 'ADMIN');
    }

    // -----------------------------------------------------------------
    // TEST 9: Form 3 - Citizen Profile update with invalid 4-digit PIN
    // -----------------------------------------------------------------
    {
      const res = await request(
        'PUT',
        '/citizens/profile',
        {
          name: 'Ananya Sharma',
          mobile: '9845019999',
          address: { pin_code: '5600' }
        },
        citizenToken
      );
      const match = res.status === 400 && res.data?.error?.includes('6 digits');
      recordResult('T09', 'Form 3: Citizen Profile', 'Invalid 4-digit PIN code rejection', 'HTTP 400 (6 digits required)', `HTTP ${res.status}: ${res.data?.error}`, match);
    }

    // -----------------------------------------------------------------
    // TEST 10: Form 3 - Citizen Profile update with valid data
    // -----------------------------------------------------------------
    {
      const res = await request(
        'PUT',
        '/citizens/profile',
        {
          name: 'Ananya Sharma',
          gender: 'Female',
          mobile: '9845019999',
          address: {
            house_number: '#12B',
            street: 'Mysore Road',
            village: 'Kengeri',
            taluk: 'Bengaluru South',
            district: 'Bengaluru',
            state: 'Karnataka',
            pin_code: '560059'
          }
        },
        citizenToken
      );
      recordResult('T10', 'Form 3: Citizen Profile', 'Valid Profile & Address update', 'HTTP 200 Profile updated', `HTTP ${res.status}: ${res.data?.message}`, res.status === 200);
    }

    // -----------------------------------------------------------------
    // TEST 11: Form 4 - Document with future issue date
    // -----------------------------------------------------------------
    {
      const res = await request(
        'POST',
        '/documents',
        {
          document_type: 'Voter ID',
          document_reference_masked: 'KA/01/168/XXXX99',
          issue_date: '2030-01-01'
        },
        citizenToken
      );
      const match = res.status === 400 && res.data?.error?.includes('future');
      recordResult('T11', 'Form 4: Document Management', 'Future issue date rejection', 'HTTP 400 (Cannot be in future)', `HTTP ${res.status}: ${res.data?.error}`, match);
    }

    // -----------------------------------------------------------------
    // TEST 12: Form 4 - Valid Document Reference creation
    // -----------------------------------------------------------------
    {
      const res = await request(
        'POST',
        '/documents',
        {
          document_type: 'Aadhaar (Masked)',
          document_reference_masked: 'XXXX-XXXX-8888',
          issue_date: '2020-05-15'
        },
        citizenToken
      );
      createdDocId = res.data?.document_id;
      recordResult('T12', 'Form 4: Document Management', 'Valid Document metadata creation', 'HTTP 201 Document added', `HTTP ${res.status}: Doc ID ${createdDocId}`, res.status === 201);
    }

    // -----------------------------------------------------------------
    // TEST 13: Form 4 - Duplicate Document Reference prevention
    // -----------------------------------------------------------------
    {
      const res = await request(
        'POST',
        '/documents',
        {
          document_type: 'Aadhaar (Masked)',
          document_reference_masked: 'XXXX-XXXX-8888',
          issue_date: '2020-05-15'
        },
        citizenToken
      );
      const match = res.status === 400 && res.data?.error?.includes('already been added');
      recordResult('T13', 'Form 4: Document Management', 'Duplicate Document rejection (DB UNIQUE index)', 'HTTP 400 (Already added)', `HTTP ${res.status}: ${res.data?.error}`, match);
    }

    // -----------------------------------------------------------------
    // TEST 14: Form 5 - Verification Request with invalid request type
    // -----------------------------------------------------------------
    {
      const res = await request(
        'POST',
        '/requests',
        {
          request_type: 'Invalid_Type_X',
          remarks: 'Test invalid request type'
        },
        citizenToken
      );
      const match = res.status === 400 && res.data?.error?.includes('Request type must be one of');
      recordResult('T14', 'Form 5: Verification Request', 'Invalid request type rejection', 'HTTP 400 (Allowed types only)', `HTTP ${res.status}: ${res.data?.error}`, match);
    }

    // -----------------------------------------------------------------
    // TEST 15: Form 5 - Valid Verification Request creation
    // -----------------------------------------------------------------
    {
      const res = await request(
        'POST',
        '/requests',
        {
          request_type: 'Record Verification',
          remarks: 'Academic verification test request',
          selected_document_ids: createdDocId ? [createdDocId] : []
        },
        citizenToken
      );
      createdReqId = res.data?.request_id;
      recordResult('T15', 'Form 5: Verification Request', 'Valid Verification Request creation', 'HTTP 201 Created (SUBMITTED status)', `HTTP ${res.status}: Req #${createdReqId}`, res.status === 201);
    }

    // -----------------------------------------------------------------
    // TEST 16: Form 6 - Document Readiness Checklist evaluation
    // -----------------------------------------------------------------
    {
      const res = await request('GET', `/requests/${createdReqId}/readiness`, null, citizenToken);
      const isChecklistValid = Array.isArray(res.data?.checklist) && res.data.checklist.length > 0;
      recordResult('T16', 'Form 6: Readiness Checklist', 'Readiness Checklist generation from DB', 'Checklist items array with available/missing status', `Checklist items: ${res.data?.checklist?.length}, Ready: ${res.data?.is_ready}`, isChecklistValid);
    }

    // -----------------------------------------------------------------
    // TEST 17: Form 7 - Assistance Request with empty notes
    // -----------------------------------------------------------------
    {
      const res = await request(
        'POST',
        '/assistance',
        {
          request_type: 'Digital Assistance',
          priority: 'Medium',
          notes: ''
        },
        citizenToken
      );
      const match = res.status === 400;
      recordResult('T17', 'Form 7: Assistance Request', 'Empty notes validation rejection', 'HTTP 400 Bad Request', `HTTP ${res.status}: ${res.data?.error}`, match);
    }

    // -----------------------------------------------------------------
    // TEST 18: Form 7 - Valid Assistance Request submission
    // -----------------------------------------------------------------
    {
      const res = await request(
        'POST',
        '/assistance',
        {
          request_type: 'Digital Assistance',
          priority: 'High',
          notes: 'Doorstep digital assistance for senior citizen'
        },
        citizenToken
      );
      recordResult('T18', 'Form 7: Assistance Request', 'Valid Assistance Request creation', 'HTTP 201 Logged (PENDING)', `HTTP ${res.status}: Assist ID ${res.data?.assistance_id}`, res.status === 201);
    }

    // -----------------------------------------------------------------
    // TEST 19: Form 8 - Volunteer Profile update validation
    // -----------------------------------------------------------------
    {
      const volLogin = await request('POST', '/auth/login', {
        email: 'arjun.v@example.com',
        password: 'password123'
      });
      const volToken = volLogin.data?.token;

      const volUpdate = await request(
        'PUT',
        '/volunteers/profile',
        {
          availability: 'Available',
          skills: 'Digital Assistance, Senior Citizen Support, Kannada Help'
        },
        volToken
      );
      recordResult('T19', 'Form 8: Volunteer Profile', 'Volunteer availability & skills update', 'HTTP 200 Settings updated', `HTTP ${volUpdate.status}: ${volUpdate.data?.message}`, volUpdate.status === 200);
    }

    // -----------------------------------------------------------------
    // TEST 20: Form 9 - Admin Status Update: Invalid state transition
    // -----------------------------------------------------------------
    {
      const res = await request(
        'PUT',
        `/requests/${createdReqId}/status`,
        {
          status: 'RESOLVED',
          remarks: 'Skipping review directly to resolved'
        },
        adminToken
      );
      const match = res.status === 400 && res.data?.error?.includes('Invalid status transition');
      recordResult('T20', 'Form 9: Admin Status', 'Invalid status transition rejection', 'HTTP 400 (Invalid transition)', `HTTP ${res.status}: ${res.data?.error}`, match);
    }

    // -----------------------------------------------------------------
    // TEST 21: Form 9 - Admin Status Update: Valid transition (SUBMITTED -> UNDER_REVIEW)
    // -----------------------------------------------------------------
    {
      const res = await request(
        'PUT',
        `/requests/${createdReqId}/status`,
        {
          status: 'UNDER_REVIEW',
          remarks: 'Request reviewed by election verification officer'
        },
        adminToken
      );
      recordResult('T21', 'Form 9: Admin Status', 'Valid status transition (SUBMITTED -> UNDER_REVIEW)', 'HTTP 200 Status updated', `HTTP ${res.status}: New status ${res.data?.new_status}`, res.status === 200);
    }

    // -----------------------------------------------------------------
    // TEST 22: Security - Role-Based Access Control (403 on Admin endpoint by Citizen)
    // -----------------------------------------------------------------
    {
      const res = await request('GET', '/admin/statistics', null, citizenToken);
      const match = res.status === 403;
      recordResult('T22', 'Security: RBAC', 'Citizen accessing Admin statistics', 'HTTP 403 Forbidden', `HTTP ${res.status}: ${res.data?.error}`, match);
    }

    // -----------------------------------------------------------------
    // TEST 23: Security - HTTP Security Headers enforcement
    // -----------------------------------------------------------------
    {
      const res = await request('GET', '/health');
      const hasCsp = !!res.headers.get('content-security-policy');
      const frameOpts = res.headers.get('x-frame-options');
      const nosniff = res.headers.get('x-content-type-options');
      const secPassed = hasCsp && frameOpts === 'DENY' && nosniff === 'nosniff';
      recordResult('T23', 'Security: Headers', 'Security headers (CSP, X-Frame-Options, X-Content-Type)', 'Security headers present', `X-Frame-Options: ${frameOpts}, nosniff: ${nosniff}`, secPassed);
    }

  } catch (fatalErr) {
    console.error('Fatal test error:', fatalErr);
  } finally {
    // Shutdown test server
    server.close();
  }

  // Print Summary Table
  console.log('\n===============================================================');
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('===============================================================');
  console.table(results.map(r => ({
    ID: r.testId,
    Form: r.form,
    'Test Case': r.testCase,
    'Pass/Fail': r.pass
  })));

  const total = results.length;
  const passed = results.filter(r => r.pass === 'PASS').length;
  const failed = results.filter(r => r.pass === 'FAIL').length;
  console.log(`\nTOTAL: ${total} | PASSED: ${passed} | FAILED: ${failed} | SUCCESS RATE: ${((passed/total)*100).toFixed(1)}%`);

  return results;
}

if (require.main === module) {
  runTests().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
}

module.exports = { runTests };
