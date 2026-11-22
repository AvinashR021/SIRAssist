const db = require('../backend/db/connection');

async function migrate() {
  console.log('Starting SIRAssist Document Review migration...');

  // 1. Notification columns
  const notifCols = (await db.query('DESCRIBE Notification')).map(c => c.Field);
  if (!notifCols.includes('title')) {
    await db.query('ALTER TABLE Notification ADD COLUMN title VARCHAR(200) NULL AFTER notification_id');
    console.log('✅ Added Notification.title');
  }
  if (!notifCols.includes('document_id')) {
    await db.query('ALTER TABLE Notification ADD COLUMN document_id INT NULL AFTER request_id');
    console.log('✅ Added Notification.document_id');
  }
  if (!notifCols.includes('review_id')) {
    await db.query('ALTER TABLE Notification ADD COLUMN review_id INT NULL AFTER document_id');
    console.log('✅ Added Notification.review_id');
  }

  // 2. Document columns
  const docCols = (await db.query('DESCRIBE Document')).map(c => c.Field);
  if (!docCols.includes('request_id')) {
    await db.query('ALTER TABLE Document ADD COLUMN request_id INT NULL AFTER citizen_id');
    console.log('✅ Added Document.request_id');
  }
  if (!docCols.includes('current_version')) {
    await db.query('ALTER TABLE Document ADD COLUMN current_version INT NOT NULL DEFAULT 1 AFTER document_type');
    console.log('✅ Added Document.current_version');
  }
  if (!docCols.includes('file_review_status')) {
    await db.query(`ALTER TABLE Document ADD COLUMN file_review_status ENUM(
      'Pending Review',
      'Under Review',
      'Reviewed – No Issues Found',
      'Correction Required',
      'Additional Document Requested',
      'Unable to Review'
    ) NOT NULL DEFAULT 'Pending Review' AFTER current_version`);
    console.log('✅ Added Document.file_review_status');
  }
  if (!docCols.includes('description')) {
    await db.query('ALTER TABLE Document ADD COLUMN description TEXT NULL AFTER file_review_status');
    console.log('✅ Added Document.description');
  }
  if (!docCols.includes('created_at')) {
    await db.query('ALTER TABLE Document ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER description');
    console.log('✅ Added Document.created_at');
  }
  if (!docCols.includes('updated_at')) {
    await db.query('ALTER TABLE Document ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at');
    console.log('✅ Added Document.updated_at');
  }

  // 3. Document_Version table
  await db.query(`
    CREATE TABLE IF NOT EXISTS Document_Version (
      version_id INT AUTO_INCREMENT PRIMARY KEY,
      document_id INT NOT NULL,
      version_number INT NOT NULL DEFAULT 1,
      storage_key VARCHAR(500) NOT NULL,
      original_filename VARCHAR(255) NOT NULL,
      mime_type VARCHAR(100) NOT NULL,
      file_size_bytes INT NOT NULL,
      uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      uploaded_by INT NOT NULL,
      CONSTRAINT fk_dv_document FOREIGN KEY (document_id) REFERENCES Document(document_id) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_dv_uploader FOREIGN KEY (uploaded_by) REFERENCES User_Account(user_id) ON DELETE RESTRICT ON UPDATE CASCADE,
      CONSTRAINT uq_doc_version UNIQUE (document_id, version_number)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  console.log('✅ Document_Version table verified.');

  // 4. Document_Review table
  await db.query(`
    CREATE TABLE IF NOT EXISTS Document_Review (
      review_id INT AUTO_INCREMENT PRIMARY KEY,
      version_id INT NOT NULL,
      volunteer_id INT NOT NULL,
      review_decision ENUM(
        'Reviewed – No Issues Found',
        'Correction Required',
        'Additional Document Requested',
        'Unable to Review'
      ) NOT NULL,
      issue_category ENUM(
        'Blurry or unreadable document',
        'Incomplete document',
        'Incorrect document type',
        'Missing page',
        'File cannot be opened',
        'Other issue',
        'N/A'
      ) NOT NULL DEFAULT 'N/A',
      feedback_message TEXT NULL,
      additional_document_request TEXT NULL,
      reviewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_dr_version FOREIGN KEY (version_id) REFERENCES Document_Version(version_id) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_dr_volunteer FOREIGN KEY (volunteer_id) REFERENCES Volunteer(volunteer_id) ON DELETE RESTRICT ON UPDATE CASCADE,
      CONSTRAINT uq_review_version UNIQUE (version_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  console.log('✅ Document_Review table verified.');

  // 5. Volunteer_Assignment table
  await db.query(`
    CREATE TABLE IF NOT EXISTS Volunteer_Assignment (
      assignment_id INT AUTO_INCREMENT PRIMARY KEY,
      document_id INT NOT NULL,
      volunteer_id INT NOT NULL,
      assigned_by INT NOT NULL,
      assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      status ENUM('Active','Completed','Cancelled') NOT NULL DEFAULT 'Active',
      CONSTRAINT fk_va_document FOREIGN KEY (document_id) REFERENCES Document(document_id) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_va_volunteer FOREIGN KEY (volunteer_id) REFERENCES Volunteer(volunteer_id) ON DELETE RESTRICT ON UPDATE CASCADE,
      CONSTRAINT fk_va_admin FOREIGN KEY (assigned_by) REFERENCES User_Account(user_id) ON DELETE RESTRICT ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  console.log('✅ Volunteer_Assignment table verified.');

  const allTables = (await db.query('SHOW TABLES')).map(t => Object.values(t)[0]);
  console.log('🎉 Migration Successful! Tables in DB:', allTables);
  process.exit(0);
}

migrate().catch(e => {
  console.error('Migration failed:', e);
  process.exit(1);
});
