# SIRAssist – Component 8 Comprehensive Report
## Design of Forms, Security and Validation (Maximum 10 Marks)

**Institution:** RV College of Engineering, Bengaluru  
**Department:** Department of Computer Science & Engineering (Artificial Intelligence & Machine Learning)  
**Subject:** Database Management Systems (DBMS Laboratory - 21CS42 / 22AIM42)  
**Project Title:** SIRAssist – Citizen Assistance and Verification Management System for Electoral Roll Revision  
**Submission Date:** November 2026  
**Evaluation Rubric:** Component 8: Design of Forms, Security and Validation (Excellent Tier)

---

## 1. Executive Summary & Objective

SIRAssist is a specialized database management system and citizen assistance platform developed to facilitate electoral roll revision workflows. Rather than functioning as an official election portal, SIRAssist addresses the critical preparatory phase for citizens by providing:
1. **Document Readiness Checklists:** Determining whether a citizen has the requisite supporting documentation prior to formal application.
2. **Workflow Verification Tracking:** Tracking verification assistance requests through a relational state-machine with immutable audit logging.
3. **Community Volunteer Coordination:** Spatial and skill-based matching of volunteers to assist elderly and digitally constrained citizens.

**Component 8 Objective:**  
To engineer, validate, and document a robust, secure, and user-centric form management layer backed by stringent three-tier validation (Frontend, Backend Middleware, and Relational Database Constraints) alongside enterprise-grade security mechanisms (Bcrypt password hashing, JWT authorization, Role-Based Access Control, rate limiting, and HTTP security headers).

---

## 2. Tools and Engineering Technologies Used

| Tier / Layer | Technology | Version | Purpose in Component 8 |
|---|---|---|---|
| **Frontend Framework** | React.js | 18.3.1 | Reactive Single-Page Application (SPA) architecture |
| **Build Tool** | Vite | 5.2.11 | High-performance bundling and asset compilation |
| **Client-Side Routing** | React Router DOM | 6.23.1 | Role-guarded route protection (`ProtectedRoute`) |
| **Icons & Visuals** | Lucide React | 0.395.0 | Accessible UI iconography (success, error, loading) |
| **Analytics & Data Viz** | Chart.js & react-chartjs-2 | 4.4.3 / 5.2.0 | Administrative workload and status analytics |
| **Backend Runtime** | Node.js | v24.15.0 | Server-side execution environment |
| **Application Server** | Express.js | 4.19.2 | RESTful API routing, sanitization & middleware |
| **Relational Database** | MySQL Community Server | 8.0+ | Relational data store, 3NF schema, ACID engine |
| **Database Driver** | mysql2/promise | 3.9.7 | Parameterized queries & connection pooling |
| **Cryptography** | bcryptjs | 2.4.3 | Salted password hashing (10 salt rounds) |
| **Token Authentication** | jsonwebtoken (JWT) | 9.0.2 | Stateless signed session bearer tokens (24h expiry) |

---

## 3. Form Design Principles Applied

SIRAssist adheres to eight foundational principles of human-computer interaction (HCI) and secure form architecture:

1. **Simplicity:** Forms solicit only necessary information (e.g. registration avoids cluttering with full voter identification until the citizen actually creates a request).
2. **Clarity & Semantics:** Clear, unambiguous field labels, meaningful placeholder examples, and explicit required markers (`*`).
3. **Consistency:** Unified styling, typography (Inter), button behaviors, and responsive layouts across all 9 application forms.
4. **Logical Grouping:** Complex entities (such as Citizen Profile) are logically segmented into Personal Information, Contact Information, and Address Information cards.
5. **Real-time User Guidance:** Inline password strength meters with live criteria checks (length, uppercase, lowercase, digits) and reference formatting guides (e.g. `XXXX-XXXX-1234`).
6. **Error Prevention:** Client-side pre-validation catches syntax errors before network transmission; buttons disable during processing to eliminate duplicate double-clicks.
7. **Accessibility & Usability:** Focus rings, high-contrast status badges, keyboard navigation support, and zero reliance on browser popup `alert()` dialogs.
8. **Clear Feedback:** Unambiguous inline error messages, dismissible success banners, and comprehensive audit history timelines.

---

## 4. Implemented Application Forms Overview

| Form Number | Form Name | Primary Entity | Role Access | Key Validation & Security Highlights |
|---|---|---|---|---|
| **Form 1** | Citizen Registration | `User_Account`, `Citizen` | Public (Unauthenticated) | 10-digit mobile regex, 8+ char password complexity meter, show/hide toggle, duplicate email prevention, admin role restriction. |
| **Form 2** | Secure Login | `User_Account` | Public (Unauthenticated) | Required fields, valid email syntax, generic 401 response (no enumeration), in-memory IP rate limiting (15 attempts/15 min). |
| **Form 3** | Citizen Profile Management | `Citizen`, `Address` | Citizen | Grouped into 3 sections, past date of birth validation, 6-digit PIN code CHECK constraint, neutral age handling. |
| **Form 4** | Document Metadata Repository | `Document` | Citizen | Masked reference format (`XXXX-XXXX-1234`), non-future issue date, relational duplicate identity prevention (`uq_citizen_doc`). |
| **Form 5** | Verification Request Submission | `Verification_Request`, `Request_Document` | Citizen | Request type validation, multi-select document checklist binding, 500-char remarks limit, duplicate-click prevention. |
| **Form 6** | Document Readiness Checklist | `Document_Requirement`, `Document` | Citizen, Admin | Dynamic database rule lookup, Available vs Missing calculation, progress bar, official ECI source traceability. |
| **Form 7** | Community Assistance Request | `Assistance_Request` | Citizen | Assistance category ENUM validation, priority levels, non-empty description requirement, auto-volunteer matching. |
| **Form 8** | Volunteer Profile & Availability | `Volunteer` | Volunteer | Availability ENUM ('Available', 'Busy', 'Unavailable'), skills minimum 3 chars, operational area binding. |
| **Form 9** | Admin Request Status Transition | `Verification_Request`, `Status_History` | Admin | Strict status transition state machine, remarks length enforcement, ACID transaction update, automated trigger sync. |
| **Form 10** | Validation & Security Demo | Test Runner Suite | Admin | Interactive evaluator harness executing 10 live test cases with real pass/fail evidence. |

---

## 5. Three-Tier Validation Architecture

```
[ Tier 1: Client-Side (React) ]
  • Regex checks: Mobile (^[6-9]\d{9}$), PIN (^\d{6}$)
  • Dynamic password strength score (0-4)
  • Prevent future dates (max={todayStr})
  • Inline visual error indicators and disabled submit guards
             │
             ▼  (HTTP POST/PUT with JSON Payload)
[ Tier 2: Backend Middleware (Express.js) ]
  • Rate limiting middleware (rateLimiter.js)
  • Input sanitization (trimming, tag stripping)
  • Explicit payload validators (validator.js)
  • Role-Based Access Control token verification (auth.js)
  • Generic sanitized error responses (no stack trace leakage)
             │
             ▼  (Parameterized SQL via mysql2 Pool)
[ Tier 3: Relational Database (MySQL 8.0) ]
  • PRIMARY KEY (auto_increment unique identifiers)
  • FOREIGN KEY (ON DELETE CASCADE / SET NULL)
  • UNIQUE KEY (User_Account.email, User_Account.username, Document.uq_citizen_doc)
  • CHECK Constraints (Address.chk_pincode, Citizen.chk_citizen_mobile, Volunteer.chk_volunteer_mobile)
  • ENUM Types (Roles, Genders, Request Types, Statuses)
```

---

## 6. Security Implementation Details

1. **Password Hashing:** Implemented with `bcryptjs` using a salt work factor of 10 rounds. Passwords are never stored in plain text and never emitted in API responses or console logs.
2. **Session Security (JWT):** Signed JSON Web Tokens containing user ID, username, email, and role, expiring in 24 hours. Verified on all protected routes via `verifyToken`.
3. **Role-Based Access Control (RBAC):** Middleware `requireRole('ADMIN')` and `requireRole('VOLUNTEER')` strictly prohibit privilege escalation. Citizens can only inspect their own records (`WHERE citizen_id = ?`).
4. **SQL Injection Prevention:** 100% of SQL statements across the backend use parameterized queries with prepared statement placeholders (`?`). Direct string concatenation is completely barred.
5. **Cross-Site Scripting (XSS) & Clickjacking Protection:** Enforced via `securityHeaders.js` setting `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `X-XSS-Protection: 1; mode=block`, and Content Security Policy (CSP).
6. **Brute-Force Rate Limiting:** In-memory IP tracking on authentication endpoints (`/api/auth/register` and `/api/auth/login`) limits abusive requests to 15 attempts per 15-minute window, returning HTTP 429.
7. **Privacy-by-Design Compliance:** Sensitive national ID scans and raw 12-digit Aadhaar numbers are never collected or stored. Only masked references (e.g. `XXXX-XXXX-1234`) are maintained.

---

## 7. Database Transactions & Triggers

### Atomic Transactions
Multi-table state transitions are wrapped inside `db.executeTransaction(async (conn) => { ... })`:
- When an admin updates request status, the update statement executes atomically. If any constraint or connection issue occurs, `conn.rollback()` executes automatically, preventing partial database corruption.

### Database Triggers Sync
The database features two active triggers:
1. `trg_after_verification_request_insert`: Automatically logs initial `'NONE' -> NEW.current_status` into `Status_History` and dispatches an automated notification to `Notification`.
2. `trg_after_verification_request_update_status`: Automatically logs old vs new status changes and creates notifications on status updates.
**Dual-logging Prevention:** The backend controllers verify whether real MySQL is active; manual backend inserts into `Status_History` are omitted when MySQL triggers are active, eliminating redundant duplicate entries.

---

## 8. Conclusion

SIRAssist Component 8 demonstrates an industry-standard, secure, and fully verified form management system. By enforcing validation across client UI, server middleware, and relational constraints, the application ensures data integrity, prevents security exploits, and delivers a transparent, accessible experience tailored for electoral roll revision assistance.
