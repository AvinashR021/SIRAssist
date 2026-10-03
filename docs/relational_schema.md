# SIRAssist – Relational Schema & Normalization Proof

## 1. Relational Schema Notation

Primary Keys are **underlined**, Foreign Keys are marked with `FK`.

* **Address** (<u>address_id</u>, house_number, street, village, taluk, district, state, pin_code)
* **Area** (<u>area_id</u>, name, taluk, district, state, pin_code)
* **Citizen** (<u>citizen_id</u>, name, date_of_birth, gender, mobile, email, address_id<sup>FK</sup>, created_at)
* **Volunteer** (<u>volunteer_id</u>, name, mobile, email, area_id<sup>FK</sup>, availability, skills, verification_status, created_at)
* **User_Account** (<u>user_id</u>, username, email, password_hash, role, citizen_id<sup>FK</sup>, volunteer_id<sup>FK</sup>, active, created_at)
* **Constituency** (<u>constituency_id</u>, name, district, state)
* **Polling_Station** (<u>polling_station_id</u>, station_name, address_id<sup>FK</sup>, constituency_id<sup>FK</sup>)
* **Voter_Record** (<u>voter_id</u>, citizen_id<sup>FK</sup>, epic_reference, constituency_id<sup>FK</sup>, polling_station_id<sup>FK</sup>, record_status, last_checked_at)
* **Document_Requirement** (<u>requirement_id</u>, request_type, document_type, mandatory, description, source_reference, active)
* **Document** (<u>document_id</u>, citizen_id<sup>FK</sup>, document_type, document_reference_masked, issue_date, verification_status, uploaded_at)
* **Verification_Request** (<u>request_id</u>, citizen_id<sup>FK</sup>, voter_id<sup>FK</sup>, request_type, submission_date, current_status, remarks, created_at, updated_at)
* **Request_Document** (<u>request_id</u><sup>FK</sup>, <u>document_id</u><sup>FK</sup>, submitted_at)
* **Status_History** (<u>history_id</u>, request_id<sup>FK</sup>, old_status, new_status, changed_by, changed_at, remarks)
* **Assistance_Request** (<u>assistance_id</u>, citizen_id<sup>FK</sup>, volunteer_id<sup>FK</sup>, request_type, request_date, status, priority, notes, assigned_at, completed_at)
* **Notification** (<u>notification_id</u>, citizen_id<sup>FK</sup>, request_id<sup>FK</sup>, message, created_at, read_status)

---

## 2. Normalization Analysis (1NF, 2NF, 3NF)

### First Normal Form (1NF)
A relation is in **1NF** if all attributes contain atomic (indivisible) values and there are no repeating groups or multi-valued arrays stored in a single field.
* **Verification**: In SIRAssist, every column contains scalar primitive types (integers, strings, dates, booleans, enums).
* **Multi-valued relationships** such as documents submitted for a request are separated into a dedicated junction table (`Request_Document`), avoiding comma-separated lists of IDs.

### Second Normal Form (2NF)
A relation is in **2NF** if it is in 1NF and all non-key attributes are **fully functionally dependent** on the primary key (no partial dependencies on a composite key).
* **Verification**:
  * Tables with single-attribute primary keys automatically satisfy 2NF because no partial key exists.
  * For composite primary key tables like `Request_Document(request_id, document_id)`, the non-key attribute `submitted_at` depends on the exact combination of `request_id` AND `document_id` (when that specific document was attached to that specific request). Therefore, no partial dependency exists.

### Third Normal Form (3NF)
A relation is in **3NF** if it is in 2NF and no non-key attribute is **transitively dependent** on another non-key attribute (no X -> Y -> Z dependencies).
* **Verification**:
  * In `Citizen`: `address_id` is a foreign key. Street/district details are stored separately in the `Address` table rather than inside `Citizen`, preventing transitive dependencies (`citizen_id -> address_id -> district`).
  * In `Volunteer`: Area details are linked via `area_id -> Area(area_id)`, keeping `Volunteer` free of transitive dependencies.
  * In `Voter_Record`: Polling station address details are referenced via `polling_station_id -> Polling_Station(polling_station_id)`.
  * All non-key attributes in every table depend **only** on the primary key ("the key, the whole key, and nothing but the key"). Thus, the database is in **3NF**.
