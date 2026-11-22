# SIRAssist – Security Implementation Architecture

**Institution:** RV College of Engineering, Bengaluru  
**Department:** CSE (AI & ML) | DBMS Laboratory  
**Component 8:** Design of Forms, Security and Validation

---

## 1. Password Hashing & Key Derivation

- **Library:** `bcryptjs` (Pure JavaScript implementation of the Blowfish-based crypt algorithm).
- **Salt Rounds:** `10` rounds (generating $2^{10} = 1024$ hash iterations).
- **Implementation Location:** `backend/controllers/authController.js` (Lines 36-37)
- **Code Reference:**
  ```javascript
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);
  ```
- **Verification Logic:**
  ```javascript
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) return res.status(401).json({ error: 'Invalid email or password.' });
  ```
- **Security Guarantees:**
  - Salt is generated cryptographically uniquely for every user account.
  - Rainbow table attacks are impossible due to per-user salt.
  - Plain-text passwords are never stored, logged, or emitted in API payloads.

---

## 2. Stateless Authentication & JWT Management

- **Library:** `jsonwebtoken`
- **Signing Algorithm:** HMAC SHA-256 (`HS256`)
- **Secret Management:** Loaded from environment variable `JWT_SECRET` in `.env`.
- **Token Expiry:** `24h`
- **Token Payload:**
  ```json
  {
    "user_id": 3,
    "username": "ramesh_k",
    "email": "ramesh.k@example.com",
    "role": "CITIZEN",
    "citizen_id": 1,
    "volunteer_id": null,
    "exp": 1795416000
  }
  ```
- **Authorization Header:** `Authorization: Bearer <token>`
- **Token Verification:** `backend/middleware/auth.js -> verifyToken()`

---

## 3. Role-Based Access Control (RBAC)

The system implements 3 distinct security roles:
1. `CITIZEN`: Can read and update only their own profile, recorded documents, and requests (`WHERE citizen_id = ?`).
2. `VOLUNTEER`: Can access community assistance requests assigned to them or unassigned in their area.
3. `ADMIN`: Full administrative visibility, statistics, volunteer assignment, and request status updates.

- **Middleware Implementation:** `backend/middleware/auth.js -> requireRole(...roles)`
  ```javascript
  function requireRole(...roles) {
    return (req, res, next) => {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ error: `Forbidden. Role ${req.user.role} does not have access to this resource.` });
      }
      next();
    };
  }
  ```
- **Public Registration Role Guard:** Admin roles cannot be self-selected during registration. `validateRegister` explicitly restricts roles to `CITIZEN` or `VOLUNTEER`.

---

## 4. SQL Injection Prevention

- **Mechanism:** Parameterized Queries using prepared statement placeholders (`?`) provided by the `mysql2/promise` library.
- **Rule:** User input is NEVER concatenated or interpolated directly into SQL query strings.
- **Example in Connection Wrapper (`backend/db/connection.js`):**
  ```javascript
  async function query(sql, params = []) {
    const [rows] = await pool.query(sql, params);
    return rows;
  }
  ```
- **Proof:** Attempting to inject `1' OR '1'='1` in the login username or email parameter binds the string literally to the column `WHERE email = '1\' OR \'1\'=\'1'`, yielding zero matches rather than altering the SQL parse tree.

---

## 5. Cross-Site Scripting (XSS) & Clickjacking Protection

- **Middleware File:** `backend/middleware/securityHeaders.js`
- **HTTP Response Headers:**
  - `X-Frame-Options: DENY` (Eliminates clickjacking / iframe embedding).
  - `X-Content-Type-Options: nosniff` (Prevents MIME confusion attacks).
  - `X-XSS-Protection: 1; mode=block` (Enables browser cross-site scripting filter).
  - `Content-Security-Policy`:
    ```
    default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'
    ```
  - `Referrer-Policy: strict-origin-when-cross-origin`
- **Frontend Safe Rendering:** React automatically escapes string values rendered inside JSX curly braces `{name}`, preventing script injection.

---

## 6. Brute-Force Rate Limiting

- **Middleware File:** `backend/middleware/rateLimiter.js`
- **Configuration:** Window: 15 minutes | Max Requests: 15 per client IP
- **Protected Endpoints:**
  - `POST /api/auth/login`
  - `POST /api/auth/register`
- **Response upon Limit Exceeded:** HTTP 429 Too Many Requests with `Retry-After` header.

---

## 7. Relational Database Constraints & ACID Transactions

| Constraint Type | Table | Constraint Name | Enforcement Purpose |
|---|---|---|---|
| **PRIMARY KEY** | All tables | `PRIMARY` | Ensures entity uniqueness and clustered indexing |
| **FOREIGN KEY** | `Verification_Request` | `fk_verification_citizen` | Enforces referential integrity (rejects non-existent citizens) |
| **UNIQUE KEY** | `User_Account` | `uq_email`, `uq_username` | Prevents duplicate user accounts |
| **UNIQUE KEY** | `Document` | `uq_citizen_doc` | Prevents duplicate document references per citizen |
| **CHECK Constraint** | `Address` | `chk_pincode` | Enforces 6 numeric digits on postal codes |
| **CHECK Constraint** | `Citizen` | `chk_citizen_mobile` | Enforces 10-digit Indian mobile starting with 6-9 |
| **CHECK Constraint** | `Volunteer` | `chk_volunteer_mobile` | Enforces 10-digit mobile on volunteer roster |
| **ACID Transaction** | `connection.js` | `executeTransaction` | Multi-statement updates commit or rollback atomically |
