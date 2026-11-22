# SIRAssist – Document Upload, Manual Volunteer Review & Notification Workflow
**Academic Project:** SIRAssist – Citizen Assistance and Verification Management System for Electoral Roll Revision  
**Department of Computer Science & Engineering (AI & ML)**  
**Target Database:** MySQL 8.0+ (`sirassist_db`)  

---

## 1. Objective
To provide a secure, auditable, and automated workflow for electoral roll revision assistance where:
1. Citizens can securely upload scanned supporting documents (address proof, identity proof, age proof) in PDF, JPG, JPEG, or PNG formats.
2. Authorized community volunteers perform manual quality inspection (checking readability, completeness, and consistency).
3. Review decisions and constructive feedback are recorded atomically in the database and automatically dispatched as in-app notifications.
4. Citizens can correct deficiencies by uploading subsequent document versions while preserving an immutable historical audit trail.

---

## 2. Existing Problem & Academic Justification
In conventional paper-based or basic electronic filing systems:
- Citizens upload documents without quality feedback; unreadable or cut-off proofs remain unnoticed until formal rejection by election officials.
- Prior systems recorded only text reference numbers (e.g. `XXXX-XXXX-1234`) without accommodating actual digital file verification.
- Ad-hoc file sharing violates data privacy by exposing documents to unvetted personnel or using unprotected public URLs.
- Lack of version control leads to overwritten evidence, loss of audit history, and inability to track whether a citizen addressed volunteer remarks.

---

## 3. Proposed Solution Architecture
SIRAssist implements a 4-tier relational model combining **Document Header**, **Document Version**, **Volunteer Assignment**, and **Document Review**:

```
+---------------+       1:N       +--------------------+
|    Citizen    | --------------< |      Document      |
+---------------+                 +--------------------+
                                      |            |
                              1:N     |            | 1:N
                                      v            v
                 +----------------------+        +-----------------------+
                 |   Document_Version   |        |  Volunteer_Assignment |
                 +----------------------+        +-----------------------+
                             | 1:1                           |
                             v                               v
                 +----------------------+        +-----------------------+
                 |   Document_Review    | >------------ |       Volunteer       |
                 +----------------------+               +-----------------------+
                             |
                             v (Generates)
                 +----------------------+
                 |     Notification     |
                 +----------------------+
```

---

## 4. Workflows

### 4.1 Citizen Workflow
1. **Upload:** Logged-in citizen navigates to **My Documents**, selects document category, chooses file (PDF/JPG/PNG, max 5 MB), enters optional note, and submits.
2. **Queueing:** Document record created with `file_review_status = 'Pending Review'` and `current_version = 1`.
3. **Notification:** Citizen receives an instant in-app notification when a volunteer completes review.
4. **Correction & Resubmission:** If status is `Correction Required`, the citizen inspects the volunteer's feedback, selects a new file, and resubmits. The system stores it as `version_number = 2`, archives `v1` in history, and resets status to `Pending Review`.

### 4.2 Volunteer Review Workflow
1. **Queue Inspection:** Volunteer logs in and accesses **Document Reviews**. Only documents explicitly assigned to that volunteer are displayed.
2. **Inspection:** Volunteer opens the document preview. An authenticated streaming endpoint securely serves the file with zoom and page controls.
3. **Manual Review:** Volunteer inspects image clarity, completeness, and checklist alignment, then selects a decision:
   - `Reviewed – No Issues Found` (file is clear and complete)
   - `Correction Required` (blurry, missing page, wrong document type)
   - `Additional Document Requested`
   - `Unable to Review`
4. **Feedback:** If issues exist, volunteer provides mandatory constructive feedback (e.g., *"The meter address on the electricity bill is blurry. Please upload a clear photo showing the complete page."*).
5. **Atomic Commit:** Review details, document status update, assignment completion, and citizen notification are committed inside a single database transaction.

### 4.3 Administrator Workflow
- Admin accesses **Document Review Assignments** in the Admin Dashboard.
- Admin inspects all uploaded citizen documents and assigns/reassigns active tasks to approved volunteers.

---

## 5. Database Entities & Relational Schema

### 5.1 `Document` (Header Table)
| Column Name | Data Type | Key / Constraints | Description |
|:---|:---|:---|:---|
| `document_id` | `INT` | `PRIMARY KEY AUTO_INCREMENT` | Unique document identifier |
| `citizen_id` | `INT` | `FOREIGN KEY -> Citizen(citizen_id)` | Owner citizen |
| `request_id` | `INT NULL` | `FOREIGN KEY -> Verification_Request(request_id)` | Optional link to verification request |
| `document_type` | `VARCHAR(100)` | `NOT NULL` | Category (Address, Identity, Age, etc.) |
| `current_version` | `INT` | `NOT NULL DEFAULT 1` | Pointer to the latest active version |
| `file_review_status` | `ENUM` | `DEFAULT 'Pending Review'` | Workflow status (`Pending Review`, `Under Review`, `Reviewed – No Issues Found`, `Correction Required`, etc.) |
| `description` | `TEXT NULL` | | Citizen's optional description |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | Initial upload timestamp |
| `updated_at` | `TIMESTAMP` | `ON UPDATE CURRENT_TIMESTAMP` | Latest modification timestamp |

### 5.2 `Document_Version` (File Storage & Versioning)
| Column Name | Data Type | Key / Constraints | Description |
|:---|:---|:---|:---|
| `version_id` | `INT` | `PRIMARY KEY AUTO_INCREMENT` | Unique version identifier |
| `document_id` | `INT` | `FOREIGN KEY -> Document(document_id)` | Parent document |
| `version_number` | `INT` | `NOT NULL DEFAULT 1` | Incremental version index |
| `storage_key` | `VARCHAR(500)` | `NOT NULL` | Randomized storage key on server filesystem |
| `original_filename` | `VARCHAR(255)` | `NOT NULL` | Original file name for user reference |
| `mime_type` | `VARCHAR(100)` | `NOT NULL` | MIME type (`application/pdf`, `image/jpeg`, etc.) |
| `file_size_bytes` | `INT` | `NOT NULL` | File size in bytes (max 5,242,880) |
| `uploaded_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | Version upload timestamp |
| `uploaded_by` | `INT` | `FOREIGN KEY -> User_Account(user_id)` | User account of uploader |
| **Constraint** | `UNIQUE` | `(document_id, version_number)` | Prevents duplicate version numbers |

### 5.3 `Document_Review` (Manual Review Audit)
| Column Name | Data Type | Key / Constraints | Description |
|:---|:---|:---|:---|
| `review_id` | `INT` | `PRIMARY KEY AUTO_INCREMENT` | Unique review identifier |
| `version_id` | `INT` | `FOREIGN KEY -> Document_Version(version_id)` | Target version being reviewed |
| `volunteer_id` | `INT` | `FOREIGN KEY -> Volunteer(volunteer_id)` | Reviewer volunteer identifier |
| `review_decision` | `ENUM` | `NOT NULL` | Outcome decision |
| `issue_category` | `ENUM` | `DEFAULT 'N/A'` | Categorized deficiency |
| `feedback_message` | `TEXT NULL` | | Specific instructions for citizen |
| `additional_document_request` | `TEXT NULL` | | Description of extra proof required |
| `reviewed_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | Review timestamp |
| **Constraint** | `UNIQUE` | `(version_id)` | One review per document version |

### 5.4 `Volunteer_Assignment` (Access Control Junction)
| Column Name | Data Type | Key / Constraints | Description |
|:---|:---|:---|:---|
| `assignment_id` | `INT` | `PRIMARY KEY AUTO_INCREMENT` | Unique assignment identifier |
| `document_id` | `INT` | `FOREIGN KEY -> Document(document_id)` | Target document |
| `volunteer_id` | `INT` | `FOREIGN KEY -> Volunteer(volunteer_id)` | Assigned volunteer |
| `assigned_by` | `INT` | `FOREIGN KEY -> User_Account(user_id)` | Admin user who authorized assignment |
| `assigned_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | Assignment timestamp |
| `status` | `ENUM` | `DEFAULT 'Active'` | `Active`, `Completed`, or `Cancelled` |

### 5.5 `Notification` (Alert Center)
| Column Name | Data Type | Key / Constraints | Description |
|:---|:---|:---|:---|
| `notification_id` | `INT` | `PRIMARY KEY AUTO_INCREMENT` | Unique notification identifier |
| `citizen_id` | `INT` | `FOREIGN KEY -> Citizen(citizen_id)` | Recipient citizen |
| `document_id` | `INT NULL` | `FOREIGN KEY -> Document(document_id)` | Related document |
| `review_id` | `INT NULL` | | Related review record |
| `title` | `VARCHAR(200)` | | Notification headline |
| `message` | `TEXT` | `NOT NULL` | Detail message |
| `read_status` | `BOOLEAN` | `DEFAULT FALSE` | Read / unread indicator |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | Dispatch timestamp |

---

## 6. Key SQL Queries & JOIN Operations

### 6.1 Volunteer Review Queue Query (Demonstrating 5-Table JOIN)
Retrieves all documents assigned to a specific volunteer with current version file details and latest review state:
```sql
SELECT 
    d.document_id,
    d.document_type,
    d.current_version,
    d.file_review_status,
    c.name AS citizen_name,
    c.email AS citizen_email,
    v.version_id,
    v.original_filename,
    v.file_size_bytes,
    v.mime_type,
    r.review_decision,
    r.feedback_message,
    r.reviewed_at
FROM Volunteer_Assignment va
JOIN Document d ON d.document_id = va.document_id
JOIN Citizen c ON c.citizen_id = d.citizen_id
LEFT JOIN Document_Version v 
    ON v.document_id = d.document_id AND v.version_number = d.current_version
LEFT JOIN Document_Review r 
    ON r.version_id = v.version_id
WHERE va.volunteer_id = ? AND va.status = 'Active'
ORDER BY (d.file_review_status = 'Pending Review') DESC, d.created_at DESC;
```

### 6.2 Citizen Version History Audit Trail Query
Retrieves the complete immutable audit trail of all versions uploaded for a document and the respective volunteer reviews:
```sql
SELECT 
    v.version_id,
    v.version_number,
    v.original_filename,
    v.mime_type,
    v.file_size_bytes,
    v.uploaded_at,
    r.review_id,
    r.review_decision,
    r.issue_category,
    r.feedback_message,
    r.reviewed_at,
    vol.name AS reviewer_name
FROM Document_Version v
LEFT JOIN Document_Review r ON r.version_id = v.version_id
LEFT JOIN Volunteer vol ON vol.volunteer_id = r.volunteer_id
WHERE v.document_id = ?
ORDER BY v.version_number DESC;
```

---

## 7. ACID Transaction Implementation Example
When a volunteer submits a review, four distinct database modifications must succeed as a single atomic unit. If any statement encounters an error, all changes roll back to prevent state corruption:

```javascript
await db.executeTransaction(async (conn) => {
  // 1. Insert Review Audit Record
  const [revRes] = await conn.query(
    `INSERT INTO Document_Review 
     (version_id, volunteer_id, review_decision, issue_category, feedback_message, additional_document_request)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [versionId, volunteerId, decision, category, feedback, additionalReq]
  );
  const reviewId = revRes.insertId;

  // 2. Update Document Workflow Status
  await conn.query(
    'UPDATE Document SET file_review_status = ?, updated_at = NOW() WHERE document_id = ?',
    [decision, documentId]
  );

  // 3. Mark Assignment Completed if no issues found
  if (decision === 'Reviewed – No Issues Found') {
    await conn.query(
      "UPDATE Volunteer_Assignment SET status = 'Completed' WHERE document_id = ? AND volunteer_id = ?",
      [documentId, volunteerId]
    );
  }

  // 4. Create In-App Notification for Citizen
  await conn.query(
    `INSERT INTO Notification (citizen_id, document_id, review_id, title, message)
     VALUES (?, ?, ?, ?, ?)`,
    [citizenId, documentId, reviewId, notifTitle, notifMessage]
  );
});
```

---

## 8. Security & Privacy Implementation
1. **Isolated Storage:** Document files are stored in `backend/uploads/`, completely outside public web directories (`frontend/dist/` or `public/`).
2. **Cryptographic Storage Keys:** Files are saved using pseudo-random identifiers (`doc_<timestamp>_<hex>.ext`). Raw original filenames and local paths are never exposed.
3. **Path Traversal Guards:** File streaming checks `path.resolve(targetPath).startsWith(UPLOAD_DIR)` to defeat directory traversal attacks (`../../etc/passwd`).
4. **Header Sanitization:** Streaming uses `Content-Disposition: inline`, `X-Content-Type-Options: nosniff`, and `Cache-Control: no-store, no-cache, must-revalidate`.
5. **Backend Authorization Enforcement:**
   - Citizens can only stream and inspect documents matching `document.citizen_id = session.citizen_id`.
   - Volunteers can only access documents where an active row exists in `Volunteer_Assignment` matching their `volunteer_id`.
6. **MIME-Type & Magic Byte Validation:** File uploads reject dangerous extensions and MIME types (`.exe`, `.sh`, `.html`).
7. **Size Limits:** Strict 5 MB buffer limit enforced by Multer.

---

## 9. Test Results Summary
The automated test runner (`tests/document_review_workflow_test.js`) executed all 18 test cases against a live test server:

| Test ID | Test Case | Target Entity / Rule | Result |
|:---|:---|:---|:---:|
| **TC-01** | Valid PDF Upload | `Document`, `Document_Version` | **PASS** |
| **TC-02** | Valid JPG Upload | MIME check `image/jpeg` | **PASS** |
| **TC-03** | Unsupported File Type Rejection (`.exe`) | Multer filter restriction | **PASS** |
| **TC-04** | File-size Limit Rejection (> 5 MB) | Multer 5 MB buffer limit | **PASS** |
| **TC-05** | Upload Without Authentication | JWT middleware validation | **PASS** |
| **TC-06** | Citizen Accessing Another Citizen's Document | Ownership verification | **PASS** |
| **TC-07** | Unassigned Volunteer Attempting Access | `Volunteer_Assignment` check | **PASS** |
| **TC-08** | Assigned Volunteer Successfully Opening Document | Authorization check | **PASS** |
| **TC-09** | Review Submission Without Decision | Mandatory input validation | **PASS** |
| **TC-10** | Correction Decision Without Feedback | Conditional validation rule | **PASS** |
| **TC-11** | Valid Review Submission | `Document_Review` insertion | **PASS** |
| **TC-12** | Notification Creation in Database | `Notification` insertion | **PASS** |
| **TC-13** | Citizen Viewing Notification in Inbox | Citizen inbox query | **PASS** |
| **TC-14** | Citizen Resubmitting Corrected Document (v2) | `current_version` increment | **PASS** |
| **TC-15** | Previous Version Retained in Audit Trail | Immutability check | **PASS** |
| **TC-16** | Latest Version Displayed Correctly | Pointer resolution check | **PASS** |
| **TC-17** | Review Transaction Rollback on Failure | ACID rollback verification | **PASS** |
| **TC-18** | Existing SIR Records Remain Unchanged | Integrity baseline check | **PASS** |

**Execution Score:** 18 Passed, 0 Failed (100% Pass Rate).
