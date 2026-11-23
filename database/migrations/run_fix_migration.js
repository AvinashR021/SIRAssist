const db = require('../../backend/db/connection');

async function run() {
  setTimeout(async () => {
    try {
      console.log('--- Applying Fix Migration ---');
      // 1. Alter Volunteer_Assignment.assigned_by to INT NULL
      await db.query('ALTER TABLE Volunteer_Assignment MODIFY COLUMN assigned_by INT NULL');
      console.log('✅ Altered Volunteer_Assignment.assigned_by to INT NULL');

      // 2. Check if assignment_method exists
      const cols = await db.query(
        "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'sirassist_db' AND TABLE_NAME = 'Volunteer_Assignment' AND COLUMN_NAME = 'assignment_method'"
      );
      if (!cols || cols.length === 0) {
        await db.query(
          "ALTER TABLE Volunteer_Assignment ADD COLUMN assignment_method ENUM('AUTO', 'MANUAL') NOT NULL DEFAULT 'MANUAL' AFTER status"
        );
        console.log('✅ Added assignment_method column (ENUM: AUTO, MANUAL)');
      } else {
        console.log('ℹ️ assignment_method column already exists');
      }

      // 3. Document.file_review_status
      await db.query(`ALTER TABLE Document MODIFY COLUMN file_review_status ENUM(
        'Pending Assignment',
        'Pending Review',
        'Under Review',
        'Reviewed – No Issues Found',
        'Correction Required',
        'Additional Document Requested',
        'Unable to Review'
      ) NOT NULL DEFAULT 'Pending Review'`);
      console.log('✅ Extended Document.file_review_status ENUM with Pending Assignment');

      // Verify schema
      const desc = await db.query('DESCRIBE Volunteer_Assignment');
      console.log('Volunteer_Assignment structure:');
      console.table(desc);

      const docDesc = await db.query("SHOW COLUMNS FROM Document LIKE 'file_review_status'");
      console.log('Document.file_review_status structure:');
      console.table(docDesc);

      console.log('--- Migration completed successfully! ---');
      process.exit(0);
    } catch (err) {
      console.error('Migration failed:', err);
      process.exit(1);
    }
  }, 500);
}

run();
