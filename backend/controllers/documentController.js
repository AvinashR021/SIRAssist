const db = require('../db/connection');

async function getDocuments(req, res, next) {
  try {
    const citizenId = req.user.citizen_id;
    if (!citizenId) {
      return res.status(400).json({ error: 'Citizen ID missing in session token.' });
    }

    const documents = await db.query(
      'SELECT document_id, citizen_id, document_type, document_reference_masked, issue_date, verification_status, uploaded_at FROM Document WHERE citizen_id = ? ORDER BY uploaded_at DESC',
      [citizenId]
    );

    res.json(documents);
  } catch (err) {
    next(err);
  }
}

async function addDocument(req, res, next) {
  try {
    const citizenId = req.user.citizen_id;
    const { document_type, document_reference_masked, issue_date } = req.body;

    if (!citizenId || !document_type || !document_reference_masked || !issue_date) {
      return res.status(400).json({ error: 'Missing required document fields: document_type, document_reference_masked, issue_date.' });
    }

    // Mask identity reference to comply with privacy requirement #28
    let safeMasked = document_reference_masked;
    if (safeMasked.length > 4 && !safeMasked.includes('X') && !safeMasked.includes('*')) {
      const lastFour = safeMasked.slice(-4);
      safeMasked = `XXXX-XXXX-${lastFour}`;
    }

    const result = await db.query(
      'INSERT INTO Document (citizen_id, document_type, document_reference_masked, issue_date, verification_status) VALUES (?, ?, ?, ?, ?)',
      [citizenId, document_type, safeMasked, issue_date, 'Verified']
    );

    res.status(201).json({
      message: 'Document metadata added successfully.',
      document_id: result.insertId || Date.now()
    });
  } catch (err) {
    next(err);
  }
}

async function deleteDocument(req, res, next) {
  try {
    const citizenId = req.user.citizen_id;
    const documentId = req.params.id;

    await db.query('DELETE FROM Document WHERE document_id = ? AND citizen_id = ?', [documentId, citizenId]);

    res.json({ message: 'Document removed successfully.' });
  } catch (err) {
    next(err);
  }
}

async function getRequirements(req, res, next) {
  try {
    const { request_type } = req.query;
    let sql = 'SELECT requirement_id, request_type, document_type, mandatory, description, source_reference, active FROM Document_Requirement WHERE active = 1';
    const params = [];

    if (request_type) {
      sql += ' AND request_type = ?';
      params.push(request_type);
    }

    const requirements = await db.query(sql, params);
    res.json(requirements);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDocuments,
  addDocument,
  deleteDocument,
  getRequirements
};
