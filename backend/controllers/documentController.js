const db = require('../db/connection');

async function getDocuments(req, res, next) {
  try {
    const citizenId = req.user.citizen_id;
    if (!citizenId) {
      return res.status(403).json({ error: 'Citizen identifier missing in session token.' });
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

    if (!citizenId) {
      return res.status(403).json({ error: 'Only citizens can add document references.' });
    }

    // Mask identity reference to strictly comply with Privacy-by-Design
    let safeMasked = document_reference_masked;
    if (safeMasked.length > 4 && !safeMasked.includes('X') && !safeMasked.includes('*')) {
      const lastFour = safeMasked.slice(-4);
      safeMasked = `XXXX-XXXX-${lastFour}`;
    }

    // Check for duplicate document record for this citizen
    const existing = await db.query(
      'SELECT document_id FROM Document WHERE citizen_id = ? AND document_type = ? AND document_reference_masked = ?',
      [citizenId, document_type, safeMasked]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'This document reference has already been added to your profile.' });
    }

    const result = await db.query(
      'INSERT INTO Document (citizen_id, document_type, document_reference_masked, issue_date, verification_status) VALUES (?, ?, ?, ?, ?)',
      [citizenId, document_type, safeMasked, issue_date, 'Verified']
    );

    res.status(201).json({
      message: 'Document metadata added successfully.',
      document_id: result.insertId || Date.now(),
      document_reference_masked: safeMasked
    });
  } catch (err) {
    next(err);
  }
}

async function deleteDocument(req, res, next) {
  try {
    const citizenId = req.user.citizen_id;
    const documentId = parseInt(req.params.id);

    if (isNaN(documentId)) {
      return res.status(400).json({ error: 'Invalid document ID.' });
    }

    // Check if document is linked to any active verification requests
    const linked = await db.query(
      'SELECT rd.request_id FROM Request_Document rd JOIN Verification_Request vr ON rd.request_id = vr.request_id WHERE rd.document_id = ? AND vr.current_status NOT IN ("RESOLVED", "CANCELLED")',
      [documentId]
    );

    if (linked.length > 0) {
      return res.status(400).json({
        error: `Cannot delete document. It is actively linked to pending verification request #VR100${linked[0].request_id}.`
      });
    }

    const delRes = await db.query('DELETE FROM Document WHERE document_id = ? AND citizen_id = ?', [documentId, citizenId]);

    if (delRes.affectedRows === 0) {
      return res.status(404).json({ error: 'Document not found or you do not have permission to delete it.' });
    }

    res.json({ message: 'Document reference removed successfully.' });
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

    sql += ' ORDER BY mandatory DESC, document_type ASC';

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
