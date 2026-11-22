# SIRAssist – Validation Test Cases Specification

**Institution:** RV College of Engineering, Bengaluru  
**Subject:** Database Management Systems | Component 8  
**Total Documented Test Cases:** 23

---

### Category A: Citizen Registration (Form 1)

#### Test Case A1: Empty Full Name
- **Input:** `{ name: "", email: "valid@example.com", mobile: "9845012345", password: "Password@123", role: "CITIZEN" }`
- **Expected Result:** HTTP 400 Bad Request (`Full name is required and must be between 3 and 100 characters.`).
- **Actual Result:** HTTP 400 Bad Request. Field error rendered inline.
- **Status:** PASS

#### Test Case A2: Malformed Email Syntax
- **Input:** `{ name: "Ramesh", email: "not-an-email", mobile: "9845012345", password: "Password@123", role: "CITIZEN" }`
- **Expected Result:** HTTP 400 Bad Request (`A valid email address (max 100 characters) is required.`).
- **Actual Result:** HTTP 400 Bad Request.
- **Status:** PASS

#### Test Case A3: Invalid Mobile Format (8 Digits)
- **Input:** `{ name: "Ramesh", email: "ramesh@example.com", mobile: "98450123", password: "Password@123", role: "CITIZEN" }`
- **Expected Result:** HTTP 400 Bad Request (`Mobile number must be a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.`).
- **Actual Result:** HTTP 400 Bad Request.
- **Status:** PASS

#### Test Case A4: Weak Password (<8 Chars & No Diversity)
- **Input:** `{ name: "Ramesh", email: "ramesh@example.com", mobile: "9845012345", password: "weak", role: "CITIZEN" }`
- **Expected Result:** HTTP 400 Bad Request (`Password must be at least 8 characters long and include uppercase, lowercase, and numbers.`).
- **Actual Result:** HTTP 400 Bad Request.
- **Status:** PASS

#### Test Case A5: Duplicate Email Registration
- **Input:** `{ email: "ramesh.k@example.com", ... }` (already in `User_Account`)
- **Expected Result:** HTTP 400 Bad Request (`This email address is already registered.`).
- **Actual Result:** HTTP 400 Bad Request.
- **Status:** PASS

#### Test Case A6: Valid Citizen Registration
- **Input:** `{ username: "ananya_s", email: "ananya@example.com", mobile: "9845019999", password: "Password@123", role: "CITIZEN", address: { pin_code: "560059" } }`
- **Expected Result:** HTTP 201 Created with signed JWT session token.
- **Actual Result:** HTTP 201 Created. Token returned.
- **Status:** PASS

---

### Category B: Authentication & Authorization (Form 2)

#### Test Case B1: Invalid Password Credentials
- **Input:** `{ email: "ramesh.k@example.com", password: "wrong_password" }`
- **Expected Result:** HTTP 401 Unauthorized (`Invalid email or password.`).
- **Actual Result:** HTTP 401 Unauthorized.
- **Status:** PASS

#### Test Case B2: Valid Admin Login
- **Input:** `{ email: "admin@sirassist.org", password: "password123" }`
- **Expected Result:** HTTP 200 OK with `ADMIN` role JWT.
- **Actual Result:** HTTP 200 OK. Role `ADMIN`.
- **Status:** PASS

#### Test Case B3: RBAC Role Restriction
- **Input:** Request to `GET /api/admin/statistics` using `CITIZEN` bearer token.
- **Expected Result:** HTTP 403 Forbidden.
- **Actual Result:** HTTP 403 Forbidden (`Role CITIZEN does not have access to this resource.`).
- **Status:** PASS

---

### Category C: Profile & Address Constraints (Form 3)

#### Test Case C1: Invalid 4-Digit Postal PIN Code
- **Input:** `{ address: { pin_code: "5600" } }`
- **Expected Result:** HTTP 400 Bad Request (`PIN code must contain exactly 6 digits.`).
- **Actual Result:** HTTP 400 Bad Request.
- **Status:** PASS

#### Test Case C2: Valid Profile & Address Update
- **Input:** `{ name: "Ananya Sharma", mobile: "9845019999", address: { pin_code: "560059", state: "Karnataka" } }`
- **Expected Result:** HTTP 200 OK (`Profile and address updated successfully.`).
- **Actual Result:** HTTP 200 OK.
- **Status:** PASS

---

### Category D: Document Management (Form 4)

#### Test Case D1: Future Issue Date Rejection
- **Input:** `{ document_type: "Voter ID", document_reference_masked: "XXXX-9999", issue_date: "2030-01-01" }`
- **Expected Result:** HTTP 400 Bad Request (`Document issue date cannot be in the future.`).
- **Actual Result:** HTTP 400 Bad Request.
- **Status:** PASS

#### Test Case D2: Valid Document Addition
- **Input:** `{ document_type: "Aadhaar (Masked)", document_reference_masked: "XXXX-XXXX-8888", issue_date: "2020-05-15" }`
- **Expected Result:** HTTP 201 Created with generated `document_id`.
- **Actual Result:** HTTP 201 Created.
- **Status:** PASS

#### Test Case D3: Duplicate Document Reference Prevention
- **Input:** Re-submitting identical `{ document_type: "Aadhaar (Masked)", document_reference_masked: "XXXX-XXXX-8888" }` for the same citizen.
- **Expected Result:** HTTP 400 Bad Request (`This document reference has already been added to your profile.`).
- **Actual Result:** HTTP 400 Bad Request.
- **Status:** PASS

---

### Category E: Verification & Assistance Workflows (Forms 5, 6, 7, 8, 9)

#### Test Case E1: Invalid Request Type in Form 5
- **Input:** `{ request_type: "IllegalType" }`
- **Expected Result:** HTTP 400 Bad Request (`Request type must be one of...`).
- **Actual Result:** HTTP 400 Bad Request.
- **Status:** PASS

#### Test Case E2: Valid Verification Request Submission (Form 5)
- **Input:** `{ request_type: "Record Verification", remarks: "Academic check" }`
- **Expected Result:** HTTP 201 Created with `SUBMITTED` status.
- **Actual Result:** HTTP 201 Created.
- **Status:** PASS

#### Test Case E3: Document Readiness Evaluation (Form 6)
- **Input:** `GET /api/requests/:id/readiness`
- **Expected Result:** Readiness payload containing checklist comparison and percentage.
- **Actual Result:** HTTP 200 with dynamic checklist matching database rules.
- **Status:** PASS

#### Test Case E4: Empty Notes in Assistance Request (Form 7)
- **Input:** `{ request_type: "Digital Assistance", notes: "" }`
- **Expected Result:** HTTP 400 Bad Request (`Description/notes are required...`).
- **Actual Result:** HTTP 400 Bad Request.
- **Status:** PASS

#### Test Case E5: Valid Assistance Request (Form 7)
- **Input:** `{ request_type: "Digital Assistance", priority: "High", notes: "Doorstep guidance needed" }`
- **Expected Result:** HTTP 201 Created with `PENDING` status.
- **Actual Result:** HTTP 201 Created.
- **Status:** PASS

#### Test Case E6: Volunteer Availability Update (Form 8)
- **Input:** `{ availability: "Available", skills: "Form Filling, Senior Support" }`
- **Expected Result:** HTTP 200 OK.
- **Actual Result:** HTTP 200 OK.
- **Status:** PASS

#### Test Case E7: Invalid State Transition in Admin Status (Form 9)
- **Input:** Attempt transition from `SUBMITTED` directly to `RESOLVED` (skipping `UNDER_REVIEW`).
- **Expected Result:** HTTP 400 Bad Request (`Invalid status transition from 'SUBMITTED' to 'RESOLVED'`).
- **Actual Result:** HTTP 400 Bad Request.
- **Status:** PASS

#### Test Case E8: Valid State Transition in Admin Status (Form 9)
- **Input:** Transition from `SUBMITTED` to `UNDER_REVIEW`.
- **Expected Result:** HTTP 200 OK with atomic database transaction execution.
- **Actual Result:** HTTP 200 OK. Status updated and audit history synchronized.
- **Status:** PASS
