/**
 * SIRAssist – Admin Volunteer Assignment Controller
 * Allows admins to view all documents and assign or reassign volunteers.
 * Uses atomic MySQL transactions and row-level locking (FOR UPDATE) to guarantee consistency.
 */
const db = require('../db/connection');

// POST /api/admin/volunteer-assignments
// Atomic transaction: Validates document & volunteer, cancels prior active assignment,
// creates new assignment, and updates document workflow status.
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

    const result = await db.executeTransaction(async (conn) => {
      // 1. Lock and validate document
      const [docs] = await conn.query(
        'SELECT document_id, file_review_status FROM Document WHERE document_id = ? FOR UPDATE',
        [docId]
      );
      if (!docs || docs.length === 0) {
        const notFoundErr = new Error('Document not found.');
        notFoundErr.status = 404;
        throw notFoundErr;
      }
      const doc = docs[0];

      // 2. Validate volunteer is Approved
      const [vols] = await conn.query(
        `SELECT volunteer_id, name FROM Volunteer WHERE volunteer_id = ? AND verification_status = 'Approved'`,
        [volId]
      );
      if (!vols || vols.length === 0) {
        const volErr = new Error('Volunteer not found or volunteer is not in Approved status.');
        volErr.status = 404;
        throw volErr;
      }
      const volunteerName = vols[0].name;

      // 3. Cancel any previous active assignment for this document
      await conn.query(
        `UPDATE Volunteer_Assignment SET status = 'Cancelled' WHERE document_id = ? AND status = 'Active'`,
        [docId]
      );

      // 4. Create new Active assignment
      const [insRes] = await conn.query(
        `INSERT INTO Volunteer_Assignment (document_id, volunteer_id, assigned_by, status, assigned_at)
         VALUES (?, ?, ?, 'Active', NOW())`,
        [docId, volId, adminUserId]
      );

      // 5. Update Document status to 'Under Review' if it was 'Pending Review'
      if (doc.file_review_status === 'Pending Review') {
        await conn.query(
          `UPDATE Document SET file_review_status = 'Under Review', updated_at = NOW() WHERE document_id = ?`,
          [docId]
        );
      }

      return {
        assignmentId: insRes.insertId,
        volunteerName
      };
    });

    res.status(201).json({
      message: `Document successfully assigned to volunteer ${result.volunteerName}.`,
      assignment_id: result.assignmentId
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
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
