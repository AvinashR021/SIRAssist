/**
 * SIRAssist – Admin Volunteer Assignment Controller
 * Allows admins to view all documents and assign or reassign volunteers.
 */
const db = require('../db/connection');

// POST /api/admin/volunteer-assignments
async function createAssignment(req, res, next) {
  try {
    const adminUserId = req.user?.user_id;
    const { document_id, volunteer_id } = req.body;

    if (!document_id || !volunteer_id) {
      return res.status(400).json({ error: 'document_id and volunteer_id are required.' });
    }

    const docId = parseInt(document_id);
    const volId = parseInt(volunteer_id);
    if (isNaN(docId) || isNaN(volId)) {
      return res.status(400).json({ error: 'Invalid document_id or volunteer_id.' });
    }

    // Check document exists
    const docs = await db.query('SELECT document_id FROM Document WHERE document_id = ?', [docId]);
    if (!docs || docs.length === 0) return res.status(404).json({ error: 'Document not found.' });

    // Check volunteer exists and is approved
    const vols = await db.query(
      `SELECT volunteer_id, name FROM Volunteer WHERE volunteer_id = ? AND verification_status = 'Approved'`,
      [volId]
    );
    if (!vols || vols.length === 0) {
      return res.status(404).json({ error: 'Volunteer not found or volunteer is not in Approved status.' });
    }

    // Cancel any previous active assignment for this document
    await db.query(
      `UPDATE Volunteer_Assignment SET status = 'Cancelled' WHERE document_id = ? AND status = 'Active'`,
      [docId]
    );

    // Insert new assignment
    const result = await db.query(
      `INSERT INTO Volunteer_Assignment (document_id, volunteer_id, assigned_by) VALUES (?, ?, ?)`,
      [docId, volId, adminUserId]
    );

    // Update document status to Under Review if it was Pending Review
    await db.query(
      `UPDATE Document SET file_review_status = 'Under Review' WHERE document_id = ? AND file_review_status = 'Pending Review'`,
      [docId]
    );

    res.status(201).json({
      message: `Document successfully assigned to volunteer ${vols[0].name}.`,
      assignment_id: result.insertId || Date.now()
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/volunteer-assignments
async function listAssignments(req, res, next) {
  try {
    const rows = await db.query(
      `SELECT va.assignment_id, va.document_id, va.volunteer_id, va.status, va.assigned_at,
              vol.name AS volunteer_name, vol.email AS volunteer_email,
              c.name AS citizen_name,
              d.document_type, d.file_review_status, d.current_version
       FROM Volunteer_Assignment va
       JOIN Volunteer vol ON vol.volunteer_id = va.volunteer_id
       JOIN Document d ON d.document_id = va.document_id
       JOIN Citizen c ON c.citizen_id = d.citizen_id
       ORDER BY va.assigned_at DESC`
    );
    res.json(rows || []);
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/documents
async function listAllDocuments(req, res, next) {
  try {
    const rows = await db.query(
      `SELECT d.document_id, d.document_type, d.file_review_status, d.current_version,
              d.created_at, d.description,
              c.name AS citizen_name, c.citizen_id, c.email AS citizen_email,
              va.volunteer_id, vol.name AS assigned_volunteer,
              va.status AS assignment_status, va.assigned_at
       FROM Document d
       JOIN Citizen c ON c.citizen_id = d.citizen_id
       LEFT JOIN Volunteer_Assignment va ON va.document_id = d.document_id AND va.status = 'Active'
       LEFT JOIN Volunteer vol ON vol.volunteer_id = va.volunteer_id
       ORDER BY d.created_at DESC`
    );
    res.json(rows || []);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createAssignment,
  listAssignments,
  listAllDocuments
};
