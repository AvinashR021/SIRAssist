# SIRAssist – Component 8 Viva Voce Preparation Guide & 2-Minute Demo Script

**Institution:** RV College of Engineering, Bengaluru  
**Department:** Department of Computer Science & Engineering (Artificial Intelligence & Machine Learning)  
**Subject:** Database Management Systems (DBMS Laboratory)  
**Topic:** Component 8: Design of Forms, Security and Validation (Maximum 10 Marks)

---

## Part 1: Top 20 Viva Voce Questions & Answers (20–40 Seconds Each)

### Q1. What is form design?
**Answer:** Form design is the process of structuring and styling user input fields to collect data accurately, efficiently, and intuitively. It bridges human intent with the database schema.  
*SIRAssist Example:* In our Citizen Profile form, we logically divided eleven fields into three distinct cards: Personal Information, Contact Information, and Address Information, making data entry easy for senior citizens.

---

### Q2. What are the principles of good form design?
**Answer:** Good form design follows eight principles: simplicity, clarity, consistency, logical grouping, user guidance, error prevention, accessibility, and prompt feedback.  
*SIRAssist Example:* Our registration form provides real-time guidance using a password strength meter, required asterisks (`*`), and inline error messages instead of disruptive alert popups.

---

### Q3. What is validation?
**Answer:** Validation is the process of inspecting incoming data against syntax, type, range, and business rules before processing or storing it. It ensures data integrity and system security.  
*SIRAssist Example:* In SIRAssist, mobile numbers must match the regular expression `^[6-9]\d{9}$`, ensuring only valid 10-digit Indian numbers are accepted.

---

### Q4. What is frontend validation?
**Answer:** Frontend validation occurs in the user's browser using client-side JavaScript before sending a network request. It provides immediate visual feedback and improves user experience.  
*SIRAssist Example:* If a user enters passwords that do not match in `Register.jsx`, an inline error `"Passwords do not match"` appears instantly without making a network call.

---

### Q5. What is backend validation?
**Answer:** Backend validation is performed on the server inside API controllers and middleware. It is the true gatekeeper of application security because client-side checks can be bypassed using tools like Postman or curl.  
*SIRAssist Example:* Our Express middleware `validator.js` validates every payload field, rejecting malicious or malformed requests with an HTTP 400 Bad Request.

---

### Q6. Why do we need both frontend and backend validation?
**Answer:** Frontend validation provides a fast, responsive user experience, while backend validation provides non-negotiable security. Never trust user input, as any attacker can send raw HTTP requests directly to the API, bypassing browser checks.  
*SIRAssist Example:* A user bypassing the React UI to register with a 4-digit mobile number via curl is immediately caught and blocked by `validator.js` on the Express backend.

---

### Q7. What is SQL injection?
**Answer:** SQL injection is a critical vulnerability where malicious SQL commands are entered into form inputs to manipulate the database query parse tree, allowing attackers to bypass authentication or steal data.  
*SIRAssist Example:* If an attacker inputs `' OR '1'='1` into an unparameterized login query, the query evaluates to true and logs the attacker in as the first user in the database.

---

### Q8. How do parameterized queries prevent SQL injection?
**Answer:** Parameterized queries use prepared statements where SQL code and user parameters are sent separately. The database treats parameters strictly as literal data values, never as executable SQL commands.  
*SIRAssist Example:* In `backend/db/connection.js`, we use `pool.query('SELECT * FROM User_Account WHERE email = ?', [email])`. Even if the email contains SQL keywords, it is treated strictly as a string literal.

---

### Q9. What is password hashing?
**Answer:** Password hashing is a one-way mathematical function that transforms plain-text passwords into an irreversible, fixed-length string. A unique random salt is added to prevent rainbow table attacks.  
*SIRAssist Example:* We use `bcryptjs` with 10 salt rounds in `authController.js`. The database stores only values like `$2a$10$...` and never plain-text passwords.

---

### Q10. What is authentication?
**Answer:** Authentication is the process of verifying a user's identity—confirming that users are who they claim to be.  
*SIRAssist Example:* During login, SIRAssist compares the provided password hash against the stored hash and issues a signed JSON Web Token (JWT) valid for 24 hours.

---

### Q11. What is authorization?
**Answer:** Authorization is the process of determining what actions, resources, and data an authenticated user is permitted to access based on their assigned role.  
*SIRAssist Example:* A citizen is authorized to view only their own requests (`WHERE citizen_id = ?`), whereas an administrator is authorized to view global statistics and update request statuses.

---

### Q12. What is role-based access control (RBAC)?
**Answer:** RBAC restricts system access based on the roles assigned to users within an organization.  
*SIRAssist Example:* We define three distinct roles: `CITIZEN`, `VOLUNTEER`, and `ADMIN`. Our middleware `requireRole('ADMIN')` returns HTTP 403 Forbidden if a citizen attempts to access administrative routes.

---

### Q13. What is a database constraint?
**Answer:** A database constraint is a declarative rule enforced by the relational database engine to maintain data integrity, accuracy, and reliability at the storage layer.  
*SIRAssist Example:* The `Address` table includes `CONSTRAINT chk_pincode CHECK (CHAR_LENGTH(pin_code) = 6 AND pin_code REGEXP '^[0-9]+$')`, blocking any invalid PIN code at the MySQL engine level.

---

### Q14. What is the difference between PRIMARY KEY and UNIQUE?
**Answer:** A PRIMARY KEY uniquely identifies each record in a table and cannot contain NULL values (a table can have only one primary key). A UNIQUE constraint ensures all non-null values in a column are distinct, and a table can have multiple UNIQUE constraints.  
*SIRAssist Example:* In `User_Account`, `user_id` is the `PRIMARY KEY`, while `email` and `username` have `UNIQUE` constraints to prevent duplicate accounts.

---

### Q15. Why are foreign keys important?
**Answer:** Foreign keys enforce referential integrity between tables, preventing orphan records and ensuring that relationships between entities remain valid.  
*SIRAssist Example:* In `Verification_Request`, `citizen_id` is a foreign key referencing `Citizen(citizen_id)`. If anyone attempts to insert a request for a non-existent citizen ID (such as `999999`), MySQL rejects it immediately.

---

### Q16. What is a transaction?
**Answer:** A transaction is a sequence of database operations executed as a single logical unit of work, strictly adhering to ACID properties (Atomicity, Consistency, Isolation, and Durability). Either all operations succeed (COMMIT) or all are undone (ROLLBACK).  
*SIRAssist Example:* In `db.executeTransaction()`, when updating request status, if any step fails, `conn.rollback()` executes, ensuring partial updates never occur.

---

### Q17. How are transactions used in SIRAssist?
**Answer:** We use transactions for multi-step state changes: creating verification requests with linked documents, updating request statuses with audit history, and assigning volunteers.  
*SIRAssist Example:* When an admin updates request status, the update to `Verification_Request` runs within an active transaction. In MySQL, the trigger `trg_after_verification_request_update_status` captures the change into `Status_History` atomically.

---

### Q18. How do we protect citizen information?
**Answer:** We follow Privacy-by-Design principles. We never collect or store raw 12-digit Aadhaar numbers or identity document scans. We only store masked references (e.g. `XXXX-XXXX-1234`), use parameterized SQL, apply rate limiting, and use secure HTTP headers.  
*SIRAssist Example:* In `documentController.js`, any unmasked reference is automatically masked before insertion into the `Document` table.

---

### Q19. What makes our form design user-friendly?
**Answer:** Our forms feature high-contrast blue and neutral themes, clear field labels, required asterisks, helpful placeholders, inline error messages, password strength bars, and disabled buttons with loading spinners during processing.  
*SIRAssist Example:* The Document Readiness Checklist displays intuitive progress bars with clear "Available" and "Missing" badges, making readiness obvious to elderly citizens at a glance.

---

### Q20. What modern engineering tools did we use?
**Answer:** We built SIRAssist using React 18, Vite, Tailwind CSS, Lucide React icons, Chart.js, Node.js, Express.js, `mysql2/promise` connection pooling, `bcryptjs` password hashing, and MySQL 8.0 with InnoDB ACID storage engine.  
*SIRAssist Example:* We verified our complete implementation using an automated test runner script that executes 23 comprehensive API and constraint test cases in under 4 seconds with a 100% pass rate.

---

## Part 2: Two-Minute Live Demonstration Script for Evaluators

**Setting up:** Open terminal with `node tests/component8_validation_test.js` output and browser at `http://localhost:5173`.

### 0:00 – 0:30 | Introduction & Objective
> "Good morning/afternoon, professors. This is **SIRAssist – Citizen Assistance and Verification Management System for Electoral Roll Revision**.  
> For **Component 8: Design of Forms, Security and Validation**, our goal was to implement a rock-solid, three-tier validation and security architecture across the React frontend, Express API middleware, and MySQL database constraints."

### 0:30 – 1:00 | Form Design & Validation (Registration & Profile)
> "Let me first demonstrate **Form 1: Citizen Registration**.  
> Notice our clean UI design. As I type a password, our live **Password Strength Meter** analyzes length, uppercase, lowercase, and numbers in real time.  
> If I try submitting with an 8-digit mobile number or invalid email, our client-side validation catches it with clear inline errors, preventing unnecessary network traffic.  
> Furthermore, in **Form 3: Citizen Profile**, fields are logically grouped into Personal, Contact, and Address cards, and postal PIN codes are strictly validated for 6 digits."

### 1:00 – 1:30 | Document Readiness Checklist & Workflows (Forms 4, 5, 6)
> "In **Form 4: Document Repository**, adhering to Privacy-by-Design, we only collect masked references like `XXXX-XXXX-1234`. The database enforces a `UNIQUE` constraint `uq_citizen_doc` preventing duplicate documents.  
> In **Form 5: Verification Request**, the citizen selects their request type and attaches supporting documents.  
> In **Form 6: Document Readiness Checklist**, our system dynamically queries database requirements from `Document_Requirement` and compares them against the citizen's documents, displaying an instant visual calculation of **Available** versus **Missing** items."

### 1:30 – 2:00 | Security, RBAC & Live Demonstration Page (Phase 8 & Terminal)
> "Finally, let's look at **Security and Administration**.  
> All passwords use **Bcrypt hashing with 10 salt rounds**, and sessions use signed JWT tokens with Role-Based Access Control.  
> On our dedicated **Admin → Validation & Security Demo page**, we have implemented an interactive test harness displaying 10 live test scenarios—including foreign key rejections, SQL injection prevention, and ACID rollback tests.  
> In our terminal, our automated test suite executes **23 out of 23 test cases with a 100% pass rate**. Thank you!"
