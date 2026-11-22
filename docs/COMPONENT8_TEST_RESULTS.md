# SIRAssist – Component 8 Test Execution Results Matrix

**Project:** SIRAssist – Citizen Assistance and Verification Management System for Electoral Roll Revision  
**Institution:** RV College of Engineering, Bengaluru  
**Department:** Department of Computer Science & Engineering (Artificial Intelligence & Machine Learning)  
**Subject:** Database Management Systems (DBMS Laboratory)  
**Evaluation Rubric:** Component 8: Design of Forms, Security and Validation (Maximum 10 Marks)  
**Execution Environment:** Node.js v24.15.0 | Express.js 4.19.2 | MySQL 8.0 (`sirassist_db`) | Windows Shell  
**Test Runner:** `node tests/component8_validation_test.js` (Automated API and Constraint Harness)  
**Execution Timestamp:** 2026-11-22T12:36:18+05:30  
**Overall Status:** **23 / 23 Tests PASSED (100.0% Success Rate)**

---

## 1. Automated Test Execution Results Matrix

| Test ID | Form / Component | Test Case | Expected Result | Actual Result | Pass/Fail |
|---|---|---|---|---|:---:|
| **T01** | Form 1: Citizen Registration | Empty name submission | HTTP 400 Bad Request (`Full name is required`) | HTTP 400: Full name is required and must be between 3 and 100 characters. | **PASS** |
| **T02** | Form 1: Citizen Registration | Malformed email (`not-an-email`) | HTTP 400 Bad Request (`valid email required`) | HTTP 400: A valid email address (max 100 characters) is required. | **PASS** |
| **T03** | Form 1: Citizen Registration | Invalid 8-digit mobile (`98450123`) | HTTP 400 Bad Request (`10-digit mobile required`) | HTTP 400: Mobile number must be a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9. | **PASS** |
| **T04** | Form 1: Citizen Registration | Weak password (`weak`, <8 chars, no diversity) | HTTP 400 Bad Request (`Min 8 chars, diversity required`) | HTTP 400: Password must be at least 8 characters long. | **PASS** |
| **T05** | Form 1: Citizen Registration | Duplicate email registration (`ramesh.k@example.com`) | HTTP 400 Bad Request (`Already registered` - UNIQUE constraint) | HTTP 400: This email address is already registered. Please login or use a different email. | **PASS** |
| **T06** | Form 1: Citizen Registration | Valid Citizen registration with Address | HTTP 201 Created & JWT session token issued | HTTP 201: Registration successful. User ID generated and token issued. | **PASS** |
| **T07** | Form 2: Login | Invalid password credentials | HTTP 401 Unauthorized (Generic message, no enumeration) | HTTP 401: Invalid email or password. | **PASS** |
| **T08** | Form 2: Login | Valid Admin Login (`admin@sirassist.org`) | HTTP 200 OK with `ADMIN` role session | HTTP 200: Login successful. Role: ADMIN, Token issued. | **PASS** |
| **T09** | Form 3: Citizen Profile | Invalid 4-digit PIN code (`5600`) | HTTP 400 Bad Request (`6 digits required`) | HTTP 400: PIN code must contain exactly 6 digits. | **PASS** |
| **T10** | Form 3: Citizen Profile | Valid Citizen Profile & Address update | HTTP 200 OK (`Profile and address updated`) | HTTP 200: Profile and address updated successfully. | **PASS** |
| **T11** | Form 4: Document Management | Future issue date rejection (`2030-01-01`) | HTTP 400 Bad Request (`Cannot be in future`) | HTTP 400: Document issue date cannot be in the future. | **PASS** |
| **T12** | Form 4: Document Management | Valid Document metadata creation | HTTP 201 Created (Masked reference stored) | HTTP 201: Document metadata added successfully. | **PASS** |
| **T13** | Form 4: Document Management | Duplicate Document entry (`uq_citizen_doc` index) | HTTP 400 Bad Request (Duplicate identity rejected) | HTTP 400: This document reference has already been added to your profile. | **PASS** |
| **T14** | Form 5: Verification Request | Invalid request type (`Invalid_Type_X`) | HTTP 400 Bad Request (Allowed types ENUM check) | HTTP 400: Request type must be one of allowed values. | **PASS** |
| **T15** | Form 5: Verification Request | Valid Verification Request creation | HTTP 201 Created (`SUBMITTED` status & Request ID) | HTTP 201: Verification request created successfully with status SUBMITTED. | **PASS** |
| **T16** | Form 6: Readiness Checklist | Readiness checklist generated from database | Readiness object with available/missing status items | Checklist evaluated: 2 requirements mapped, Available/Missing calculated. | **PASS** |
| **T17** | Form 7: Assistance Request | Empty notes description submission | HTTP 400 Bad Request (`Notes required`) | HTTP 400: Description/notes are required to explain your assistance need. | **PASS** |
| **T18** | Form 7: Assistance Request | Valid Assistance Request submission | HTTP 201 Created (`PENDING` status) | HTTP 201: Assistance request logged successfully. Status: PENDING. | **PASS** |
| **T19** | Form 8: Volunteer Profile | Volunteer availability & skills update | HTTP 200 OK (`Settings updated`) | HTTP 200: Volunteer profile updated successfully. | **PASS** |
| **T20** | Form 9: Admin Request Status | Invalid state transition (`SUBMITTED` -> `RESOLVED`) | HTTP 400 Bad Request (Illegal state transition) | HTTP 400: Invalid status transition from 'SUBMITTED' to 'RESOLVED'. | **PASS** |
| **T21** | Form 9: Admin Request Status | Valid state transition (`SUBMITTED` -> `UNDER_REVIEW`) | HTTP 200 OK (Atomic transaction & trigger notification) | HTTP 200: Request status updated successfully. New status: UNDER_REVIEW. | **PASS** |
| **T22** | Security: RBAC | Citizen token accessing `/api/admin/statistics` | HTTP 403 Forbidden (Role mismatch) | HTTP 403: Forbidden. Role CITIZEN does not have access to this resource. | **PASS** |
| **T23** | Security: HTTP Headers | Security headers (CSP, X-Frame-Options, nosniff) | Headers present on all HTTP responses | X-Frame-Options: DENY, X-Content-Type-Options: nosniff, CSP present. | **PASS** |

---

## 2. Summary Statistics

- **Total Test Cases Executed:** 23
- **Passed Test Cases:** 23
- **Failed Test Cases:** 0
- **Unexecuted Tests:** 0
- **Overall Component 8 Success Rate:** **100.0%**

---

## 3. Evaluator Verification Steps

To re-run and verify these test cases at any time on the evaluation machine:

```powershell
# Open terminal in project root
cd c:\Users\avina_lxw1l2h\Desktop\SIRAssist

# Execute the automated test runner
node tests/component8_validation_test.js
```
