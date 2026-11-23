/**
 * SIRAssist – Interactive Database Explorer Test Suite
 * Tests:
 *   1. Cascading dropdown endpoints (States -> Districts -> Constituencies -> Polling Stations)
 *   2. Parameterized search across all 14 query categories
 *   3. Role-based access control and citizen data isolation
 *   4. SQL injection defense and filter validation
 *   5. Academic DBMS concept execution (Phase 11)
 */
const http = require('http');
const db   = require('../backend/db/connection');
const app  = require('../backend/server');

const PORT = 5092;
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

async function runTests() {
  console.log('\n===============================================================');
  console.log('🧪 Starting SIRAssist Database Explorer Test Suite');
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
      const adminLogin = await request('POST', '/auth/login', {}, { email: 'admin@sirassist.org', password: 'password123' });
      const adminToken = adminLogin.body.token;

      const citizenLogin = await request('POST', '/auth/login', {}, { email: 'ramesh.k@example.com', password: 'password123' });
      const citizenToken = citizenLogin.body.token;

      const volunteerLogin = await request('POST', '/auth/login', {}, { email: 'arjun.v@example.com', password: 'password123' });
      const volunteerToken = volunteerLogin.body.token;

      assert(Boolean(adminToken && citizenToken && volunteerToken), '1. User Authentication (Admin, Citizen, Volunteer)');

      // 2. Cascading: States
      const statesRes = await request('GET', '/explorer/states');
      assert(statesRes.status === 200 && Array.isArray(statesRes.body) && statesRes.body.includes('Karnataka'), '2. Cascading: Loaded States from MySQL (contains Karnataka)');

      // 3. Cascading: Districts for Karnataka
      const distRes = await request('GET', '/explorer/districts?state=Karnataka');
      assert(distRes.status === 200 && distRes.body.includes('Bengaluru'), '3. Cascading: Loaded Districts for Karnataka (contains Bengaluru)');

      // 4. Cascading: Constituencies for Bengaluru
      const constRes = await request('GET', '/explorer/constituencies?district=Bengaluru');
      assert(constRes.status === 200 && constRes.body.length >= 3, '4. Cascading: Loaded Constituencies in Bengaluru (count >= 3)');
      const sampleConstId = constRes.body[0].constituency_id;

      // 5. Cascading: Polling Stations for Constituency
      const psRes = await request('GET', `/explorer/polling-stations?constituencyId=${sampleConstId}`);
      assert(psRes.status === 200 && psRes.body.length >= 1, `5. Cascading: Loaded Polling Stations for Constituency #${sampleConstId}`);

      // 6. Category 1: Search Constituencies
      const cat1 = await request('GET', '/explorer/search?category=search_constituencies&district=Bengaluru');
      assert(cat1.status === 200 && cat1.body.totalRecords >= 3, '6. Query Cat 1: Search Constituencies (Bengaluru filter)');

      // 7. Category 2: Search Polling Stations
      const cat2 = await request('GET', `/explorer/search?category=search_polling_stations&constituencyId=${sampleConstId}`);
      assert(cat2.status === 200 && cat2.body.records.length > 0 && cat2.body.records[0].constituency_name, '7. Query Cat 2: Search Polling Stations (INNER JOIN with Constituency)');

      // 8. Category 3: Constituency-Wise Polling Stations
      const cat3 = await request('GET', `/explorer/search?category=constituency_polling_stations&constituencyId=${sampleConstId}`);
      assert(cat3.status === 200 && cat3.body.records.length > 0, '8. Query Cat 3: Constituency-Wise Polling Stations');

      // 9. Category 4: District-Wise Constituencies
      const cat4 = await request('GET', '/explorer/search?category=district_constituencies&district=Bengaluru');
      assert(cat4.status === 200 && cat4.body.records.length >= 3, '9. Query Cat 4: District-Wise Constituencies');

      // 10. Category 5: Constituency Citizens (Admin access)
      const cat5Admin = await request('GET', `/explorer/search?category=constituency_citizens&constituencyId=${sampleConstId}`, {
        'Authorization': `Bearer ${adminToken}`
      });
      assert(cat5Admin.status === 200 && cat5Admin.body.records.length > 0, '10. Query Cat 5: Constituency Citizens (3-Table JOIN, Admin Access)');

      // 11. Security Check: Guest cannot access Category 5 (Constituency Citizens)
      const cat5Guest = await request('GET', `/explorer/search?category=constituency_citizens&constituencyId=${sampleConstId}`);
      assert(cat5Guest.status === 403, '11. Security Check: Unauthenticated/Guest access to Citizen Records BLOCKED (403)');

      // 12. Category 6: Polling Station-Wise Records
      const cat6 = await request('GET', `/explorer/search?category=polling_station_records&constituencyId=${sampleConstId}`, {
        'Authorization': `Bearer ${adminToken}`
      });
      assert(cat6.status === 200, '12. Query Cat 6: Polling Station-Wise Records (Multi-table JOIN)');

      // 13. Category 7: Verification Request Status (Citizen Role Isolation)
      const cat7Citizen = await request('GET', '/explorer/search?category=verification_requests', {
        'Authorization': `Bearer ${citizenToken}`
      });
      assert(cat7Citizen.status === 200 && cat7Citizen.body.records.length > 0, '13. Query Cat 7: Citizen Verification Requests (Scoped to Authenticated Citizen)');

      // 14. Category 8: Pending Verification Requests
      const cat8 = await request('GET', '/explorer/search?category=pending_requests', {
        'Authorization': `Bearer ${adminToken}`
      });
      assert(cat8.status === 200 && cat8.body.records.every(r => ['SUBMITTED', 'DOCUMENTS_PENDING', 'DOCUMENTS_SUBMITTED', 'UNDER_REVIEW'].includes(r.current_status)), '14. Query Cat 8: Pending Verification Requests (Filter & Days Pending)');

      // 15. Category 9: Volunteer Assistance Records
      const cat9 = await request('GET', '/explorer/search?category=volunteer_assistance', {
        'Authorization': `Bearer ${adminToken}`
      });
      assert(cat9.status === 200 && cat9.body.totalRecords >= 20, '15. Query Cat 9: Volunteer Assistance Records (4-Table JOIN)');

      // 16. Category 10: Document Reviews
      const cat10 = await request('GET', '/explorer/search?category=document_reviews', {
        'Authorization': `Bearer ${adminToken}`
      });
      assert(cat10.status === 200 && cat10.body.records.length > 0, '16. Query Cat 10: Document Review Status (Document + Version + Review + Volunteer)');

      // 17. Category 11: Constituency-Wise Record Count (GROUP BY & COUNT)
      const cat11 = await request('GET', '/explorer/search?category=constituency_record_count');
      assert(cat11.status === 200 && cat11.body.records[0].total_polling_stations !== undefined, '17. Query Cat 11: Constituency-Wise Record Count (GROUP BY & COUNT)');

      // 18. Category 12: Polling Station-Wise Record Count
      const cat12 = await request('GET', '/explorer/search?category=polling_station_record_count');
      assert(cat12.status === 200 && cat12.body.records[0].registered_voters_count !== undefined, '18. Query Cat 12: Polling Station-Wise Record Count (GROUP BY & COUNT)');

      // 19. Category 13: Verification Status Summary (Aggregates & Percentages)
      const cat13 = await request('GET', '/explorer/search?category=verification_status_summary');
      assert(cat13.status === 200 && cat13.body.records.length > 0 && cat13.body.records[0].percentage_of_total !== undefined, '19. Query Cat 13: Verification Status Summary (Aggregate Functions & Subquery Percentage)');

      // 20. Category 14: Volunteer Assignment Summary
      const cat14 = await request('GET', '/explorer/search?category=volunteer_assignment_summary', {
        'Authorization': `Bearer ${adminToken}`
      });
      assert(cat14.status === 200 && cat14.body.records.length > 0 && cat14.body.records[0].total_document_assignments !== undefined, '20. Query Cat 14: Volunteer Assignment Summary (LEFT JOIN, SUM(CASE ...), GROUP BY)');

      // 21. SQL Injection Safety Check: Malicious filter payloads are treated safely as parameter data
      const sqliTest = await request('GET', "/explorer/search?category=search_constituencies&district=' OR 1=1 -- ");
      assert(sqliTest.status === 200 && sqliTest.body.totalRecords === 0, '21. Security: SQL Injection attempt safely handled via parameterized query (0 rows returned)');

      // 22. Server-Side Pagination Check
      const page1 = await request('GET', '/explorer/search?category=search_polling_stations&page=1&limit=3');
      const page2 = await request('GET', '/explorer/search?category=search_polling_stations&page=2&limit=3');
      assert(page1.status === 200 && page2.status === 200 && page1.body.records[0].polling_station_id !== page2.body.records[0].polling_station_id, '22. Server-Side Pagination: Page 1 and Page 2 return distinct sliced records');

      // 23. Phase 11: Academic Demo Concepts Listing
      const demoConcepts = await request('GET', '/explorer/demo-concepts');
      assert(demoConcepts.status === 200 && demoConcepts.body.length === 10, '23. Academic Concepts: Loaded 10 Predefined Demonstration Queries');

      // 24. Phase 11: Execute Subquery Concept
      const subqueryExec = await request('POST', '/explorer/execute-concept', {}, { conceptId: 'concept_subquery' });
      assert(subqueryExec.status === 200 && subqueryExec.body.rowCount > 0 && subqueryExec.body.executionTimeMs >= 0, '24. Academic Concepts: Executed Nested Subquery Demonstration in MySQL');

      // 25. Phase 11: Execute Multi-Join Concept
      const multiJoinExec = await request('POST', '/explorer/execute-concept', {}, { conceptId: 'concept_multi_join' });
      assert(multiJoinExec.status === 200 && multiJoinExec.body.rowCount > 0 && multiJoinExec.body.columns.length >= 6, '25. Academic Concepts: Executed 4-Table Relational JOIN in MySQL');

      console.log('\n===============================================================');
      console.log(`📊 Test Summary: ${passed} PASSED, ${failed} FAILED (Total: ${passed + failed})`);
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
