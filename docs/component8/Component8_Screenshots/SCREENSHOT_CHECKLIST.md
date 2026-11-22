# Component 8 Demonstration Screenshots Checklist

**Institution:** RV College of Engineering, Bengaluru  
**Department:** CSE (AI & ML) | DBMS Laboratory  
**Component:** Component 8: Design of Forms, Security and Validation

---

### Screenshot Catalog & Evidence Mapping

| Screen ID | Form / View | Page Route | Description of Captured Evidence | Status |
|---|---|---|---|:---:|
| **SS-01** | Citizen Registration Form | `/register` | Clean form layout with role selection, address fields, and show/hide password buttons. | Verified in UI |
| **SS-02** | Registration Inline Errors | `/register` | Inline validation errors triggered for invalid email, 8-digit mobile, and weak password. | Verified in UI |
| **SS-03** | Password Strength Meter | `/register` | Live visual password strength meter displaying score, color track, and criteria checklist. | Verified in UI |
| **SS-04** | Citizen Login Form | `/login` | Clean login card, show/hide password, and quick demo credentials buttons. | Verified in UI |
| **SS-05** | Citizen Profile Management | `/profile` | Grouped cards for Personal Info, Contact Info, Residential Address, and Reference Voter Record. | Verified in UI |
| **SS-06** | Document Repository Table | `/documents` | Masked identity references table, status badges, and academic privacy banner. | Verified in UI |
| **SS-07** | Add Document Modal | `/documents` | Modal dialog with masked reference helper (`XXXX-XXXX-1234`) and non-future date restriction. | Verified in UI |
| **SS-08** | Verification Request Modal | `/citizen-dashboard` | Request type dropdown, document checklist binding checkboxes, and 500-char remarks counter. | Verified in UI |
| **SS-09** | Document Readiness Checklist | `/citizen-dashboard` | Visual progress bar, completion count ("X of Y"), Available vs Missing badges, and source rules. | Verified in UI |
| **SS-10** | Request Status Workflow Timeline | `/requests/:id` | 5-stage horizontal step timeline bar and immutable database audit history log. | Verified in UI |
| **SS-11** | Volunteer Assistance Portal | `/volunteer-dashboard` | Volunteer profile settings card, availability selector, skills input, and active workload table. | Verified in UI |
| **SS-12** | Admin Status Transition Modal | `/admin-dashboard` | Valid state transition selector, remarks input, and transaction trigger notice. | Verified in UI |
| **SS-13** | Validation & Security Demo Page | `/admin/validation-demo` | Dedicated evaluator demo page showing 10 live test scenarios with real PASS/FAIL results. | Verified in UI |
| **SS-14** | Automated Test Suite Terminal Run | Terminal Console | Console output showing 23/23 tests passing with 100% success rate. | Verified in Shell |

---

### Instructions for Evaluation Presentation

1. **Terminal Evidence:** Show terminal running `node tests/component8_validation_test.js` displaying 23/23 passing tests.
2. **Interactive UI Walkthrough:**
   - Navigate to `http://localhost:5173/admin/validation-demo` to demonstrate all 10 evaluation test cases live to the examiner.
   - Navigate to `/register` to demonstrate inline errors and the password strength meter.
   - Navigate to `/citizen-dashboard` to showcase the Document Readiness Checklist and Status Timeline.
