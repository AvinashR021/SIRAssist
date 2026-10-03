# SIRAssist – Citizen Assistance and Verification Management System

> **ACADEMIC PROJECT DISCLAIMER:** SIRAssist is an academic project developed for citizen assistance and workflow demonstration. It is not an official government or Election Commission application. Information shown in this demo is fictional/sample data. Users should rely on official government sources for authoritative electoral information, eligibility, verification and submissions.

---

## 📌 Project Overview
**SIRAssist** solves a citizen-side social problem during electoral roll revision processes. It acts as a **citizen assistance, document checklist readiness, and request management platform** that helps citizens:
1. Understand required supporting documents for verification requests.
2. Track which documents have been prepared and which remain missing.
3. Submit and track verification/assistance requests with full audit history timeline visibility.
4. Find matched local community volunteers for doorstep or digital guidance.

---

## 🛠️ Recommended Technology Stack
- **Frontend**: React.js (Vite), JavaScript, Tailwind CSS, Lucide React Icons, Chart.js / react-chartjs-2, Axios
- **Backend**: Node.js, Express.js
- **Database**: MySQL 8.0+
- **Database Connectivity**: `mysql2` (with promise pool & fallback in-memory mode)
- **Authentication**: JSON Web Tokens (JWT) & `bcryptjs` password hashing
- **API Architecture**: REST API

---

## 📂 Project Structure

```text
SIRAssist/
├── backend/
│   ├── controllers/         # Express controllers (auth, citizen, document, request, assistance, volunteer, admin, demo)
│   ├── db/                  # MySQL database connection pool & query engine
│   ├── middleware/          # JWT authentication & error handling middleware
│   ├── routes/              # Express REST API routes
│   ├── services/            # Verification Readiness Engine & Volunteer Matcher algorithms
│   ├── server.js            # Main backend entry point
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Navbar, Footer, ReadinessBadge, StatusTimeline
│   │   ├── context/         # AuthContext state management
│   │   ├── pages/           # Home, Login, Register, CitizenDashboard, CitizenProfile, Documents, Details, Volunteer, Admin, DbmsDemo
│   │   ├── services/        # Axios API client instance
│   │   ├── App.jsx          # React Router definition & role guards
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
│
├── database/
│   ├── schema.sql           # MySQL DDL (15 entities, PKs, FKs, constraints & indexes)
│   ├── seed.sql             # Fictional dataset (20 Citizens, 10 Volunteers, 30 Requests, etc.)
│   ├── triggers.sql         # Status_History audit logging & notification triggers
│   ├── procedures.sql       # Stored Procedures (GetCitizenVerificationSummary, GetAvailableVolunteers)
│   ├── views.sql            # SQL Views (Citizen Dashboard, Pending Requests, Volunteer Dashboard)
│   └── queries.sql          # 15+ Advanced DBMS demonstration queries
│
├── docs/
│   ├── ER_Diagram.md        # Mermaid ER Diagram & cardinality specifications
│   ├── relational_schema.md # Relational schema & 1NF/2NF/3NF normalization proofs
│   └── project_documentation.md # Comprehensive 30-section academic DBMS project report
│
├── .env.example
├── package.json
└── README.md
```

---

## 🔑 Demo Login Credentials

All seed accounts use the default password: **`password123`**

| Role | Username / Email | Password | Description |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@sirassist.org` / `admin` | `password123` | System Administrator (Full access, analytics dashboard, volunteer assignment) |
| **VOLUNTEER** | `arjun.v@example.com` / `vol_arjun` | `password123` | Registered Volunteer (Zone 1 - South Bengaluru) |
| **CITIZEN** | `ramesh.k@example.com` / `ramesh_k` | `password123` | Senior Citizen User (Vijayanagar Assembly) |

---

## 🚀 Quick Setup Instructions

### 1. Database Setup (MySQL 8.0+)
Open MySQL Workbench or Command Line and execute the SQL scripts in order:
```sql
SOURCE database/schema.sql;
SOURCE database/seed.sql;
SOURCE database/triggers.sql;
SOURCE database/procedures.sql;
SOURCE database/views.sql;
```

### 2. Backend Setup
```bash
cd backend
npm install
npm run dev
```
The backend API will start on **http://localhost:5000**.

### 3. Frontend Setup
In a new terminal:
```bash
cd frontend
npm install
npm run dev
```
Open **http://localhost:3000** in your browser.

---

## 📊 Key DBMS Features Demonstrated
1. **Verification Readiness Engine**: Compares citizen uploaded documents against `Document_Requirement` rules to calculate checklist readiness percentages (`✓ Available`, `⚠ Missing`).
2. **Volunteer Matching Algorithm**: Finds available volunteers based on citizen spatial `area_id` and requested `skill`.
3. **Database Triggers**: Automatically records `Verification_Request` status changes into the `Status_History` audit log and dispatches `Notification` records.
4. **Interactive SQL Query Runner**: The `/demo` route allows executing 15+ complex SQL queries live during project viva presentations.
