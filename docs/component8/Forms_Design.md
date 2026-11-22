# SIRAssist – Forms Design Specification
## Detailed Architectural & UI/UX Breakdown of Major Forms

**Institution:** RV College of Engineering, Bengaluru  
**Subject:** Database Management Systems (Component 8: Design of Forms, Security and Validation)

---

### FORM 1: Citizen & Volunteer Registration
- **Component File:** `frontend/src/pages/Register.jsx`
- **Backend Controller:** `backend/controllers/authController.js -> register()`
- **Backend Route:** `POST /api/auth/register`
- **Purpose:** Onboards new citizens and volunteers into the system while preventing admin self-registration and credential duplication.

#### Form Fields & Types:
1. `role` (Radio buttons / segmented control: `'CITIZEN'` or `'VOLUNTEER'`) - Required
2. `name` (`text`) - Full Name - Required
3. `username` (`text`) - Unique System Username - Required
4. `email` (`email`) - Unique Contact Email - Required
5. `mobile` (`tel`) - 10-digit Indian Mobile Number - Required
6. `password` (`password` with show/hide toggle) - Required
7. `confirmPassword` (`password` with show/hide toggle) - Required
8. `address` (`house_number`, `street`, `village`, `district`, `pin_code`) - Required for Citizen role

#### Validation Rules:
- Name: Min 3 chars, max 100 chars, regex `^[a-zA-Z\s\.\'-]+$`.
- Username: Min 3 chars, max 50 chars, regex `^[a-zA-Z0-9_\-\.]+$`.
- Email: RFC 5322 regex validation; backend checks `SELECT user_id FROM User_Account WHERE email = ?` and rejects duplicates with HTTP 400.
- Mobile: Exactly 10 digits starting with 6, 7, 8, or 9 (`^[6-9]\d{9}$`).
- Password: Min 8 chars, must contain at least 1 uppercase, 1 lowercase, and 1 numeric digit.
- Confirm Password: Strict equality `password === confirmPassword`.
- PIN Code: Exactly 6 numeric digits (`^\d{6}$`).

#### UI/UX Feedback:
- Real-time password strength meter (Weak/Moderate/Strong) with checklist bullets.
- Inline red error messages beneath each invalid field.
- Loading spinner and disabled button state during submission (`submitting` state).
- Dismissible alert banner for server-side rejections.

---

### FORM 2: Secure Login
- **Component File:** `frontend/src/pages/Login.jsx`
- **Backend Controller:** `backend/controllers/authController.js -> login()`
- **Backend Route:** `POST /api/auth/login`
- **Purpose:** Authenticates registered citizens, volunteers, and administrators, generating a 24-hour signed JWT session token.

#### Form Fields & Types:
1. `email` (`text` / `email`) - Registered Email or Username - Required
2. `password` (`password` with show/hide toggle) - Password - Required

#### Validation Rules:
- Email/Username: Required, max 100 characters.
- Password: Required, max 128 characters.
- Generic Error Message: When credentials fail, returns `"Invalid email or password."` to eliminate user enumeration vulnerability.
- Rate Limiting: Enforced via `rateLimiter.js` (max 15 attempts per 15 minutes). Exceeding limits returns HTTP 429.

#### UI/UX Feedback:
- Password visibility toggle.
- One-click demo credentials buttons (Citizen, Volunteer, Admin) for smooth evaluator grading.
- Clean loading state during bcrypt verification.

---

### FORM 3: Citizen Profile & Address Management
- **Component File:** `frontend/src/pages/CitizenProfile.jsx`
- **Backend Controller:** `backend/controllers/citizenController.js -> updateProfile()`
- **Backend Route:** `PUT /api/citizens/profile`
- **Purpose:** Allows citizens to maintain their demographic profile and residential address for electoral roll verification.

#### Form Fields & Logical Sections:
**Section 1: Personal Information**
- `name` (`text`) - Full Legal Name - Required
- `date_of_birth` (`date`, `max=today`) - Date of Birth (non-future)
- `gender` (`select`: Male, Female, Other, Prefer not to say)

**Section 2: Contact Information**
- `mobile` (`tel`) - 10-digit Indian Mobile Number - Required
- `email` (`email`) - Read-only account identifier

**Section 3: Address Information**
- `house_number` (`text`), `street` (`text`), `village` (`text`), `taluk` (`text`), `district` (`text`), `state` (`text`), `pin_code` (`text`, 6 digits)

#### Validation Rules:
- Date of Birth cannot exceed current system date (`selected <= today`).
- Date of Birth does NOT infer voter eligibility (purely demographic matching).
- PIN Code must contain exactly 6 digits (validated on frontend, backend middleware, and database CHECK constraint `chk_pincode`).
- Mobile must be 10 digits starting with 6-9 (enforced by CHECK constraint `chk_citizen_mobile`).

---

### FORM 4: Supporting Document Management
- **Component File:** `frontend/src/pages/DocumentsPage.jsx`
- **Backend Controller:** `backend/controllers/documentController.js -> addDocument()`
- **Backend Route:** `POST /api/documents`
- **Purpose:** Records metadata references of citizen supporting identity proofs for readiness evaluation.

#### Form Fields & Types:
1. `document_type` (`select`: Aadhaar (Masked), Voter ID, Ration Card, Utility Bill, Bank Passbook, Birth Certificate, Passport, Driving License)
2. `document_reference_masked` (`text`, font-mono) - Masked identifier - Required
3. `issue_date` (`date`, `max=today`) - Issue Date - Required

#### Validation & Security Rules:
- Document Type must be in the approved system ENUM.
- Masked Reference: Min 4, max 50 chars. If raw numbers are submitted, backend auto-masks to `XXXX-XXXX-last4`.
- Issue Date cannot be in the future.
- Duplicate Prevention: Enforced by database UNIQUE constraint `uq_citizen_doc (citizen_id, document_type, document_reference_masked)`.
- No actual document scans or raw Aadhaar numbers are collected (Academic Privacy-by-Design compliance).

---

### FORM 5: Verification Request Submission
- **Component File:** `frontend/src/pages/CitizenDashboard.jsx` (Modal)
- **Backend Controller:** `backend/controllers/requestController.js -> createRequest()`
- **Backend Route:** `POST /api/requests`
- **Purpose:** Initiates an electoral verification assistance request mapped to supporting documents.

#### Form Fields & Types:
1. `request_type` (`select`: Record Verification, Correction Assistance, Missing Record Assistance, Document Clarification, General Assistance)
2. `voter_id` (`text`, optional) - Fictional EPIC reference
3. `remarks` (`textarea`, max 500 characters with character counter)
4. `selected_document_ids` (`checkboxes`) - Attached document IDs owned by citizen

#### Validation Rules:
- Request type required and validated against allowed ENUM.
- Remarks capped at 500 characters.
- Associated document IDs validated against citizen ownership (`WHERE citizen_id = ?`).
- Double-click submission disabled by `submittingReq` lock.
- Initiates an ACID transaction updating `Verification_Request` and linking `Request_Document`.

---

### FORM 6: Document Readiness Checklist
- **Component File:** `frontend/src/components/ReadinessBadge.jsx`
- **Backend Controller:** `backend/controllers/requestController.js -> getReadiness()`
- **Backend Route:** `GET /api/requests/:id/readiness`
- **Purpose:** Evaluates whether a citizen holds all required proofs for their specific request type.

#### Operational Workflow:
1. Queries database table `Document_Requirement` where `request_type = ? AND active = 1`.
2. Queries citizen's recorded entries in `Document`.
3. Performs relational matching: if required type exists, status is `Available`; otherwise, `Missing`.
4. Calculates completion: `available_mandatory_count` / `mandatory_count` and displays percentage.
5. Displays traceable source rule (e.g. `Official ECI Guidelines 2026`).
6. Fallback: If no rules configured, displays `"Checklist not configured for this request type"` without fabricating requirements.

---

### FORM 7: Community Assistance Request
- **Component File:** `frontend/src/pages/CitizenDashboard.jsx` (Modal)
- **Backend Controller:** `backend/controllers/assistanceController.js -> createAssistanceRequest()`
- **Backend Route:** `POST /api/assistance`
- **Purpose:** Connects citizens (particularly seniors) with volunteers for doorstep or digital guidance.

#### Form Fields:
1. `request_type` (`select`: Digital Assistance, Form Filling, Doorstep Visit, Document Scan, Language Help)
2. `priority` (`select`: Low, Medium, High)
3. `area` (`text`: Operational Zone)
4. `notes` (`textarea`, min 5, max 500 characters) - Required

---

### FORM 8: Volunteer Profile & Availability Settings
- **Component File:** `frontend/src/pages/VolunteerDashboard.jsx`
- **Backend Controller:** `backend/controllers/volunteerController.js -> updateVolunteerProfile()`
- **Backend Route:** `PUT /api/volunteers/profile`
- **Purpose:** Allows volunteers to update their operational availability and assistance skillsets.

#### Form Fields:
1. `availability` (`select`: `'Available'`, `'Busy'`, `'Unavailable'`)
2. `skills` (`text`: Comma-separated capabilities, min 3 characters)
3. `area_id` (`select`: Operational area zone)

---

### FORM 9: Admin Request Status Update
- **Component File:** `frontend/src/pages/AdminDashboard.jsx` (Modal)
- **Backend Controller:** `backend/controllers/requestController.js -> updateRequestStatus()`
- **Backend Route:** `PUT /api/requests/:id/status`
- **Purpose:** Administrative state machine transition updating request status and triggering audit logs.

#### State Machine Matrix:
- `SUBMITTED` -> `DOCUMENTS_PENDING`, `UNDER_REVIEW`, `CANCELLED`
- `DOCUMENTS_PENDING` -> `DOCUMENTS_SUBMITTED`, `UNDER_REVIEW`, `CANCELLED`
- `DOCUMENTS_SUBMITTED` -> `UNDER_REVIEW`, `CANCELLED`
- `UNDER_REVIEW` -> `RESOLVED`, `DOCUMENTS_PENDING`, `CANCELLED`
- `RESOLVED` -> `UNDER_REVIEW` (Re-open)
- `CANCELLED` -> Terminal state
- Remarks: Character limited (max 500 chars).
- Transaction: Database trigger `trg_after_verification_request_update_status` captures change in `Status_History` and dispatches `Notification`.
