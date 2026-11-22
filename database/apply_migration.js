const db = require('../backend/db/connection');

async function applyMigrations() {
  setTimeout(async () => {
    try {
      try {
        await db.query('ALTER TABLE Document ADD CONSTRAINT uq_citizen_doc UNIQUE (citizen_id, document_type, document_reference_masked)');
        console.log('✅ Added uq_citizen_doc constraint');
      } catch (err) {
        if (err.message.includes('Duplicate key name') || err.message.includes('already exists')) {
          console.log('ℹ️ uq_citizen_doc constraint already exists');
        } else {
          console.warn('⚠️ uq_citizen_doc error:', err.message);
        }
      }

      try {
        await db.query("ALTER TABLE Citizen ADD CONSTRAINT chk_citizen_mobile CHECK (CHAR_LENGTH(mobile) = 10 AND mobile REGEXP '^[6-9][0-9]{9}$')");
        console.log('✅ Added chk_citizen_mobile constraint');
      } catch (err) {
        if (err.message.includes('Duplicate constraint') || err.message.includes('already exists')) {
          console.log('ℹ️ chk_citizen_mobile constraint already exists');
        } else {
          console.warn('⚠️ chk_citizen_mobile error:', err.message);
        }
      }

      try {
        await db.query("ALTER TABLE Volunteer ADD CONSTRAINT chk_volunteer_mobile CHECK (CHAR_LENGTH(mobile) = 10 AND mobile REGEXP '^[6-9][0-9]{9}$')");
        console.log('✅ Added chk_volunteer_mobile constraint');
      } catch (err) {
        if (err.message.includes('Duplicate constraint') || err.message.includes('already exists')) {
          console.log('ℹ️ chk_volunteer_mobile constraint already exists');
        } else {
          console.warn('⚠️ chk_volunteer_mobile error:', err.message);
        }
      }

      console.log('Migration execution complete.');
      process.exit(0);
    } catch (e) {
      console.error('Fatal migration error:', e);
      process.exit(1);
    }
  }, 1000);
}

applyMigrations();
