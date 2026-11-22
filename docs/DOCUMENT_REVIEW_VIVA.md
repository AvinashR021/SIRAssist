# SIRAssist – Document Review & Verification System
## Viva Voce & Academic Exam Preparation Guide

---

### Q1: Why is manual document review needed instead of automated OCR/AI?
**Answer:**
1. Electoral roll revision requires high-stakes accuracy to prevent disenfranchisement. In semi-arid or rural areas, document scans often suffer from uneven lighting, skewed mobile photos, or faded watermarks that automated OCR misinterprets or erroneously rejects.
2. The volunteer does **not** certify citizenship or official voter eligibility; rather, they perform a **pre-scrutiny quality check**—verifying that the document is legible, uncropped, and oriented properly before official submission to the Election Commission.
3. This saves administrative overhead: by flagging blurry documents early, the citizen can resubmit a clear copy immediately instead of facing statutory rejection weeks later.

---

### Q2: How does a volunteer access uploaded documents?
**Answer:**
A volunteer accesses documents strictly through an **authenticated and authorized backend pipeline**:
1. The volunteer logs in and receives a JSON Web Token (JWT) identifying their `user_id`, `role = VOLUNTEER`, and `volunteer_id`.
2. The volunteer opens `/volunteer-dashboard`. The frontend calls `GET /api/volunteer/document-reviews`.
3. The SQL query filters records by `WHERE va.volunteer_id = ? AND va.status = 'Active'` by joining `Volunteer_Assignment` with `Document`, `Document_Version`, and `Citizen`.
4. When previewing the file, the frontend requests `GET /api/documents/:id/versions/:versionId/file`. The server verifies that the requesting volunteer is assigned to that document before streaming bytes. Direct public URLs to files do not exist.

---

### Q3: How is unauthorized access prevented?
**Answer:**
We implement **Defense-in-Depth**:
1. **Never Trust Frontend IDs:** The server extracts the caller's identity (`citizen_id`, `volunteer_id`, `role`) directly from the verified JWT payload, ignoring any client-supplied user identifiers.
2. **Citizen Ownership Check:** Citizens can only query or stream documents where `document.citizen_id = session.citizen_id`.
3. **Explicit Assignment Requirement:** Volunteers can only view documents that have an active row in `Volunteer_Assignment` matching their `volunteer_id`. Other volunteers in the same area cannot see them.
4. **Isolated Storage:** Files are stored in `backend/uploads/` (outside Vite's `dist/` or `public/` web directories), eliminating static file exposure.
5. **Path Traversal Guards:** Resolves canonical paths to ensure requested files cannot escape `UPLOAD_DIR`.

---

### Q4: How are notifications generated?
**Answer:**
Notifications are generated **synchronously and atomically** within the same MySQL database transaction that records the volunteer review:
1. When the volunteer submits their decision (e.g. `Correction Required`), the backend issues an `INSERT INTO Notification (citizen_id, document_id, review_id, title, message)` containing specific feedback.
2. Because this is executed inside `db.executeTransaction`, if the notification insert fails, the review submission is also rolled back.
3. When the citizen opens their dashboard or views the navbar, `GET /api/notifications` queries their unread notices (`read_status = FALSE`). Clicking a notification updates `read_status = TRUE` and opens the document's review page.

---

### Q5: What happens when a citizen uploads a corrected document?
**Answer:**
1. The citizen opens the document feedback modal and clicks **Resubmit**.
2. The server verifies that the document's current status allows resubmission (`Correction Required`, `Additional Document Requested`, or `Unable to Review`).
3. An atomic transaction:
   - Increments `current_version` (e.g., from `1` to `2`).
   - Inserts a new row in `Document_Version` with `version_number = 2`, the new physical file reference, and upload timestamp.
   - Updates `Document.file_review_status = 'Pending Review'`.
4. The previous version (`v1`) and its associated review records remain untouched in the database, preserving a complete audit trail.
5. The assigned volunteer immediately sees `v2` as `Pending Review` in their queue.

---

### Q6: How does document versioning work at the database level?
**Answer:**
We use a **Head-Version Relational Pattern**:
- **`Document`** stores static entity metadata (citizen owner, document category) and a pointer to the active version (`current_version INT`).
- **`Document_Version`** stores immutable instances of file uploads, with a composite unique constraint `UNIQUE(document_id, version_number)`.
- **`Document_Review`** has a foreign key to `version_id` with `UNIQUE(version_id)`, ensuring exactly one review per version.
- When displaying current status, a single `LEFT JOIN Document_Version ON v.document_id = d.document_id AND v.version_number = d.current_version` fetches the latest file without deleting or overwriting past uploads.

---

### Q7: Which tables are connected in this workflow?
**Answer:**
Five core tables are interconnected:
1. `Citizen` (1) ——— (N) `Document` (via `citizen_id`)
2. `Document` (1) ——— (N) `Document_Version` (via `document_id`)
3. `Document_Version` (1) ——— (1) `Document_Review` (via `version_id`)
4. `Document` (1) ——— (N) `Volunteer_Assignment` (via `document_id`)
5. `Volunteer` (1) ——— (N) `Volunteer_Assignment` (via `volunteer_id`)
6. `Citizen` (1) ——— (N) `Notification` (via `citizen_id`)
7. `Document` (1) ——— (N) `Notification` (via `document_id`)

---

### Q8: Where are Foreign Keys and CASCADE options used?
**Answer:**
- `Document.citizen_id` -> `REFERENCES Citizen(citizen_id) ON DELETE CASCADE ON UPDATE CASCADE`
- `Document_Version.document_id` -> `REFERENCES Document(document_id) ON DELETE CASCADE ON UPDATE CASCADE`
- `Document_Version.uploaded_by` -> `REFERENCES User_Account(user_id) ON DELETE RESTRICT` (prevents deleting an account that created audit records)
- `Document_Review.version_id` -> `REFERENCES Document_Version(version_id) ON DELETE CASCADE ON UPDATE CASCADE`
- `Document_Review.volunteer_id` -> `REFERENCES Volunteer(volunteer_id) ON DELETE RESTRICT` (audit integrity: past reviews cannot have their volunteer reference orphaned)
- `Volunteer_Assignment.document_id` -> `REFERENCES Document(document_id) ON DELETE CASCADE`
- `Volunteer_Assignment.volunteer_id` -> `REFERENCES Volunteer(volunteer_id) ON DELETE RESTRICT`
- `Notification.document_id` -> `REFERENCES Document(document_id) ON DELETE SET NULL`

---

### Q9: Why are database transactions needed in this workflow?
**Answer:**
To enforce **ACID (Atomicity, Consistency, Isolation, Durability)** properties:
- Submitting a review requires:
  1. `INSERT INTO Document_Review`
  2. `UPDATE Document SET file_review_status = ...`
  3. `UPDATE Volunteer_Assignment SET status = 'Completed'` (if approved)
  4. `INSERT INTO Notification`
- If the server or database crashed after step 2 but before step 4, the document would be marked as reviewed without the citizen ever receiving a notification. The transaction ensures that either **all four operations succeed**, or **none of them take effect** (automatic rollback).

---

### Q10: How does the system maintain data integrity?
**Answer:**
1. **Entity Integrity:** Primary keys (`AUTO_INCREMENT`) on all tables guarantee unique identification.
2. **Referential Integrity:** Foreign keys with strict `ON DELETE` rules prevent dangling pointers.
3. **Domain Integrity:** MySQL `ENUM` constraints on `file_review_status`, `review_decision`, and `issue_category` ensure that only permitted values are stored.
4. **User-Defined Integrity:**
   - Composite unique key on `(document_id, version_number)` prevents duplicate version indices.
   - Unique key on `Document_Review(version_id)` prevents conflicting duplicate reviews on the same version.
5. **Audit Integrity:** Document reviews and version records are insert-only; past files and volunteer notes are never modified or purged during resubmission.
