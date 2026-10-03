# SIRAssist – Citizen Assistance and Verification Management System
### Comprehensive Academic Project Documentation & DBMS Report

---

## 1. Title
**SIRAssist – Citizen Assistance and Verification Management System for Electoral Roll Revision**

---

## 2. Abstract
During electoral roll revision processes, citizens—especially elderly individuals and digitally less-experienced populations—face significant challenges in organizing supporting documents, tracking verification requests, and seeking local assistance. SIRAssist is an academic citizen assistance, document readiness checklist, and request management platform built using Node.js, Express, React.js, and MySQL 8.0. SIRAssist acts strictly as an educational citizen-side readiness layer and does not perform official voter registration or government decision-making. The system integrates verification readiness algorithms, area-based volunteer matching, automated status audit history logging, database transactions, stored procedures, triggers, views, and privacy-by-design principles.

---

## 3. Introduction
Electoral roll revision is a crucial democratic exercise. However, navigating document submission requirements, understanding procedural forms (e.g. Form 6, Form 8), and tracking whether necessary supporting proofs have been prepared can be overwhelming for citizens. SIRAssist is developed as a DBMS project to address citizen-side readiness and support coordination without imitating or replacing official Election Commission systems.

---

## 4. Problem Statement
Citizens frequently face the following challenges:
- Difficulty identifying which supporting documents are required for specific request types.
- Uncertainty regarding which documents have already been recorded and which remain missing.
- Absence of a centralized, transparent status timeline to view historical progress.
- Difficulty finding verified local community volunteers for doorstep or digital guidance.

---

## 5. Existing System
Existing official portals (e.g. NVSP / Voters Service Portal) serve as the authoritative government registry for voter records and official submissions. However:
- They do not focus on pre-submission citizen document readiness checklists.
- They lack community volunteer matching for digital assistance.
- They do not provide interactive academic DBMS tracking and audit history logs for citizen education.

---

## 6. Limitations & Gap Addressed
SIRAssist bridges the gap by providing a **citizen-side organization layer**. It answers:
- *"What documents do I need to prepare?"*
- *"Which documents have I recorded?"*
- *"What is missing from my checklist?"*
- *"Who can help me in my local area?"*

---

## 7. Proposed System
SIRAssist offers:
1. **Verification Readiness Engine**: Automatic comparison between request type requirements and citizen uploaded documents.
2. **Volunteer Assistance Matching**: Spatial & skill-based matching of citizens needing help with available local volunteers.
3. **Status History & Audit Trail**: Database triggers that record every status change into an immutable audit table.
4. **Role-Based Access Control**: Separate interfaces for Citizens, Volunteers, and Administrators.

---

## 8. Objectives
- Design and normalize a 3NF MySQL relational database schema.
- Implement ACID-compliant database transactions for request submission and volunteer assignment.
- Build automated database triggers and stored procedures.
- Provide a clean, modern React + Express web application with interactive charts and search controls.

---

## 9. Novelty
The novelty lies in creating a **citizen-centric verification readiness + document checklist + assistance matching + audit tracking platform** integrated with an academic DBMS.

---

## 10. Scope
- **Included**: Document reference tracking, verification checklist matching, volunteer assignment, status workflow management, admin analytics, SQL query execution demonstration.
- **Excluded**: Legal voter eligibility determination, official database modification, political party tracking, political opinion polling.

---

## 11. Functional Requirements
- **Citizen**: Register/login, manage profile & address, track voter reference, log document metadata, create verification requests, view readiness percentage, request volunteer assistance, view notifications.
- **Volunteer**: Register/login, set area and skills, toggle availability, manage assigned assistance requests, update notes.
- **Admin**: Seeded super-user, view dashboard analytics, manage document requirements rules, update request status, match and assign volunteers.

---

## 12. Non-Functional Requirements
- **Security**: JWT authentication, bcrypt password hashing, parameterized SQL queries against SQL injection.
- **Performance**: Indexed database fields (`email`, `mobile`, `current_status`, `area_id`) ensuring fast lookup.
- **Usability**: Responsive UI, clear disclaimers, clear timeline indicators.

---

## 13. System Architecture
```text
[ React.js Frontend (Vite) ] <--- HTTP REST API (JWT) ---> [ Express.js Backend ] <--- mysql2 ---> [ MySQL 8.0 Database ]
```

---

## 14. ER Diagram
*See complete Mermaid ER diagram in `docs/ER_Diagram.md`.*

---

## 15. Entity Descriptions
1. **Citizen**: Stores basic citizen information.
2. **Address**: Normalized physical address storage.
3. **Voter_Record**: Academic reference mapping (EPIC reference, constituency, polling station).
4. **Constituency**: Assembly constituency master.
5. **Polling_Station**: Polling station reference.
6. **Document**: Metadata of citizen supporting documents (masked reference, issue date).
7. **Document_Requirement**: Configurable checklist rules configured by admin.
8. **Verification_Request**: Core request entity tracked through workflow states.
9. **Request_Document**: Junction table linking requests and supporting documents.
10. **Status_History**: Audit log of status transitions.
11. **Volunteer**: Registered volunteer profile, area, availability, and skills.
12. **Area**: Master geographic area table.
13. **Assistance_Request**: Citizen help requests assigned to volunteers.
14. **Notification**: Automated citizen notification dispatches.
15. **User_Account**: Auth credentials, role (`CITIZEN`, `VOLUNTEER`, `ADMIN`), and relation keys.

---

## 16. Relational Schema
*See full schema specification in `docs/relational_schema.md`.*

---

## 17. Normalization
All major tables have been normalized to **Third Normal Form (3NF)**:
- **1NF**: All fields are scalar and atomic.
- **2NF**: Primary keys are minimal; no partial dependencies.
- **3NF**: Non-key fields depend directly on the primary key without transitive dependencies.

---

## 18. SQL Tables
Implemented in `database/schema.sql` with full foreign key constraints (`ON DELETE CASCADE / SET NULL`) and `CHECK` constraints.

---

## 19. SQL Queries
15 comprehensive DBMS queries implemented in `database/queries.sql` demonstrating `JOIN`, `GROUP BY`, `HAVING`, `ORDER BY`, aggregate functions, and subqueries.

---

## 20. Stored Procedures
Implemented in `database/procedures.sql`:
1. `GetCitizenVerificationSummary(p_citizen_id)`
2. `GetAvailableVolunteers(p_area_id, p_skill)`

---

## 21. Triggers
Implemented in `database/triggers.sql`:
- `trg_after_verification_request_update_status`: Logs old -> new status changes into `Status_History` and dispatches `Notification`.
- `trg_after_verification_request_insert`: Logs initial submission event.

---

## 22. Views
Implemented in `database/views.sql`:
1. `vw_citizen_request_dashboard`
2. `vw_pending_verification_requests`
3. `vw_volunteer_assistance_dashboard`

---

## 23. Transactions
Request submission and volunteer assignment utilize explicit SQL transactions (`START TRANSACTION; ... COMMIT; ROLLBACK;`) to ensure atomicity and consistency.

---

## 24. UI Screens
- **Public Home Page**: Academic disclaimers, features, process flow.
- **Citizen Dashboard**: Summary cards, readiness checklist, request timeline, notification drawer.
- **Volunteer Dashboard**: Active assignments, status update drawer, skills toggle.
- **Admin Dashboard**: Chart.js analytics graphs, volunteer assignment modal, status updater.
- **DBMS Showcase Page**: Interactive runner for the 15 demonstration queries.

---

## 25. Testing
Test scenarios include:
- Auth: Registration, duplicate email rejection, invalid password check.
- Documents: Adding document metadata, checklist score recalculation.
- Requests: Workflow status changes triggering status history inserts.
- Authorization: Enforcing role-based API protection.

---

## 26. Security
- Password Hashing: `bcryptjs` (salt round 10).
- Authentication: JSON Web Tokens (JWT) sent in HTTP headers.
- SQL Security: 100% parameterized SQL prepared statements (`mysql2`).

---

## 27. Privacy by Design
- No real Aadhaar / PAN numbers stored (masked strings used: `XXXX-XXXX-1234`).
- No identity document image uploads required.
- No political affiliation, voting preference, or candidate tracking.

---

## 28. Limitations
- Academic demonstration system only.
- Does not connect to live government databases.

---

## 29. Future Scope
- Multilingual interface (Kannada, Hindi).
- Accessibility features for elderly citizens (voice guidance, large print mode).
- Mobile application (React Native).

---

## 30. Conclusion
SIRAssist demonstrates how relational database principles—such as normalization, integrity constraints, triggers, stored procedures, transactions, and indexing—can solve a practical citizen social problem by improving document readiness and request tracking during electoral roll revision.
