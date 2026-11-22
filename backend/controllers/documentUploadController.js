/**
 * SIRAssist – Document Upload Controller
 * Handles: citizen upload, listing, file streaming, resubmission.
 * All file access is gated behind authentication + ownership checks.
 */
const path = require('path');
const fs   = require('fs');
const db   = require('../db/connection');
const { UPLOAD_DIR } = require('../middleware/uploadMiddleware');

// ─── CITIZEN: Upload a new document file ────────────────────────────────────
async function uploadDocument(req, res, next) {
  try {
    const citizenId = req.user?.citizen_id;
    const userId    = req.user?.user_id;
    if (!citizenId) {
      if (req.file) fs.unlinkSync(path.join(UPLOAD_DIR, req.file.filename));
      return res.status(403).json({ error: 'Only citizens can upload documents.' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded. Please select a valid document file (PDF, JPG, JPEG, PNG).' });
    }

    const { document_type, description, request_id } = req.body;
    if (!document_type || !document_type.trim()) {
      fs.unlinkSync(path.join(UPLOAD_DIR, req.file.filename));
      return res.status(400).json({ error: 'Document type is required.' });
    }

    // Validate request_id if supplied
    let validRequestId = null;
    if (request_id && request_id !== '' && request_id !== 'null') {
      const rid = parseInt(request_id);
      if (!isNaN(rid)) {
        const rows = await db.query(
          'SELECT request_id FROM Verification_Request WHERE request_id = ? AND citizen_id = ?',
          [rid, citizenId]
        );
        if (!rows || rows.length === 0) {
          fs.unlinkSync(path.join(UPLOAD_DIR, req.file.filename));
          return res.status(400).json({ error: 'Selected verification request does not belong to your account.' });
        }
        validRequestId = rid;
      }
    }

    // Atomic transaction: Insert Document and Document_Version
    const result = await db.executeTransaction(async (conn) => {
      const [docRes] = await conn.query(
        `INSERT INTO Document
           (citizen_id, request_id, document_type, document_reference_masked, issue_date,
            current_version, file_review_status, description, verification_status)
         VALUES (?, ?, ?, ?, CURDATE(), 1, 'Pending Review', ?, 'Pending')`,
        [citizenId, validRequestId, document_type.trim(), 'FILE-UPLOAD', description?.trim() || null]
      );
      const documentId = docRes.insertId;

      await conn.query(
        `INSERT INTO Document_Version
           (document_id, version_number, storage_key, original_filename, mime_type, file_size_bytes, uploaded_by)
         VALUES (?, 1, ?, ?, ?, ?, ?)`,
        [documentId, req.file.filename, req.file.originalname, req.file.mimetype, req.file.size, userId]
      );

      return { documentId };
    });

    res.status(201).json({
      message: 'Document uploaded successfully. It is now queued for volunteer manual review.',
      document_id: result.documentId,
      version_number: 1,
      status: 'Pending Review'
    });
  } catch (err) {
    if (req.file) {
      try { fs.unlinkSync(path.join(UPLOAD_DIR, req.file.filename)); } catch {}
    }
    next(err);
  }
}

// ─── CITIZEN: List my uploaded documents ────────────────────────────────────
async function getMyDocuments(req, res, next) {
  try {
    const citizenId = req.user?.citizen_id;
    if (!citizenId) return res.status(403).json({ error: 'Citizen session required.' });

    const rows = await db.query(
      `SELECT
         d.document_id, d.document_type, d.description, d.current_version,
         d.file_review_status, d.created_at AS uploaded_at, d.request_id,
         v.version_id, v.original_filename, v.file_size_bytes, v.mime_type, v.uploaded_at AS file_uploaded_at,
         r.review_id, r.review_decision, r.issue_category, r.feedback_message,
         r.additional_document_request, r.reviewed_at,
         vol.name AS reviewer_name
       FROM Document d
       LEFT JOIN Document_Version v
         ON v.document_id = d.document_id AND v.version_number = d.current_version
       LEFT JOIN Document_Review r ON r.version_id = v.version_id
       LEFT JOIN Volunteer vol ON vol.volunteer_id = r.volunteer_id
       WHERE d.citizen_id = ?
       ORDER BY d.document_id DESC`,
      [citizenId]
    );

    res.json(rows || []);
  } catch (err) {
    next(err);
  }
}

// ─── CITIZEN / AUTHENTICATED: Get document details & version history ────────
async function getDocumentDetail(req, res, next) {
  try {
    const citizenId   = req.user?.citizen_id;
    const volunteerId = req.user?.volunteer_id;
    const role        = req.user?.role;
    const documentId  = parseInt(req.params.id);

    if (isNaN(documentId)) return res.status(400).json({ error: 'Invalid document ID.' });

    // Authorization check
    let authorized = false;
    if (role === 'CITIZEN' && citizenId) {
      const docs = await db.query(
        'SELECT document_id FROM Document WHERE document_id = ? AND citizen_id = ?',
        [documentId, citizenId]
      );
      authorized = docs.length > 0;
    } else if (role === 'VOLUNTEER' && volunteerId) {
      const assigned = await db.query(
        `SELECT assignment_id FROM Volunteer_Assignment
         WHERE document_id = ? AND volunteer_id = ? AND status = 'Active'`,
        [documentId, volunteerId]
      );
      authorized = assigned.length > 0;
    } else if (role === 'ADMIN') {
      authorized = true;
    }

    if (!authorized) {
      return res.status(403).json({ error: 'Access denied. You do not have permission to view this document.' });
    }

    const docRows = await db.query(
      `SELECT d.*, c.name AS citizen_name, c.email AS citizen_email
       FROM Document d
       JOIN Citizen c ON c.citizen_id = d.citizen_id
       WHERE d.document_id = ?`,
      [documentId]
    );
    if (!docRows || docRows.length === 0) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    const versions = await db.query(
      `SELECT v.version_id, v.version_number, v.original_filename, v.mime_type,
              v.file_size_bytes, v.uploaded_at,
              r.review_id, r.review_decision, r.issue_category,
              r.feedback_message, r.additional_document_request, r.reviewed_at,
              vol.name AS reviewer_name
       FROM Document_Version v
       LEFT JOIN Document_Review r ON r.version_id = v.version_id
       LEFT JOIN Volunteer vol ON vol.volunteer_id = r.volunteer_id
       WHERE v.document_id = ?
       ORDER BY v.version_number DESC`,
      [documentId]
    );

    res.json({ document: docRows[0], versions });
  } catch (err) {
    next(err);
  }
}

// ─── CITIZEN: Resubmit a corrected version ──────────────────────────────────
async function resubmitDocument(req, res, next) {
  try {
    const citizenId  = req.user?.citizen_id;
    const userId     = req.user?.user_id;
    const documentId = parseInt(req.params.id);

    if (!citizenId) {
      if (req.file) fs.unlinkSync(path.join(UPLOAD_DIR, req.file.filename));
      return res.status(403).json({ error: 'Citizen session required.' });
    }
    if (isNaN(documentId)) {
      if (req.file) fs.unlinkSync(path.join(UPLOAD_DIR, req.file.filename));
      return res.status(400).json({ error: 'Invalid document ID.' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No corrected file uploaded.' });
    }

    const docs = await db.query(
      `SELECT document_id, citizen_id, file_review_status, current_version
       FROM Document WHERE document_id = ? AND citizen_id = ?`,
      [documentId, citizenId]
    );
    if (!docs || docs.length === 0) {
      fs.unlinkSync(path.join(UPLOAD_DIR, req.file.filename));
      return res.status(404).json({ error: 'Document not found or access denied.' });
    }

    const doc = docs[0];
    if (!['Correction Required', 'Additional Document Requested', 'Unable to Review'].includes(doc.file_review_status)) {
      fs.unlinkSync(path.join(UPLOAD_DIR, req.file.filename));
      return res.status(400).json({ error: `Resubmission not allowed for current review status: ${doc.file_review_status}` });
    }

    const newVersion = doc.current_version + 1;

    await db.executeTransaction(async (conn) => {
      await conn.query(
        `INSERT INTO Document_Version
           (document_id, version_number, storage_key, original_filename, mime_type, file_size_bytes, uploaded_by)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [documentId, newVersion, req.file.filename, req.file.originalname, req.file.mimetype, req.file.size, userId]
      );

      await conn.query(
        `UPDATE Document SET current_version = ?, file_review_status = 'Pending Review', updated_at = NOW()
         WHERE document_id = ?`,
        [newVersion, documentId]
      );
    });

    res.json({
      message: `Corrected document resubmitted successfully as Version ${newVersion}. Status reset to Pending Review.`,
      version_number: newVersion,
      status: 'Pending Review'
    });
  } catch (err) {
    if (req.file) {
      try { fs.unlinkSync(path.join(UPLOAD_DIR, req.file.filename)); } catch {}
    }
    next(err);
  }
}

// ─── SECURE FILE STREAMING ──────────────────────────────────────────────────
async function streamDocumentFile(req, res, next) {
  try {
    const citizenId   = req.user?.citizen_id;
    const volunteerId = req.user?.volunteer_id;
    const role        = req.user?.role;

    const documentId = parseInt(req.params.id);
    const versionId  = parseInt(req.params.versionId);
    if (isNaN(documentId) || isNaN(versionId)) {
      return res.status(400).json({ error: 'Invalid document or version ID.' });
    }

    // Strict Authorization check
    let allowed = false;
    if (role === 'CITIZEN' && citizenId) {
      const rows = await db.query(
        'SELECT document_id FROM Document WHERE document_id = ? AND citizen_id = ?',
        [documentId, citizenId]
      );
      allowed = rows.length > 0;
    } else if (role === 'VOLUNTEER' && volunteerId) {
      const rows = await db.query(
        `SELECT va.assignment_id FROM Volunteer_Assignment va
         WHERE va.document_id = ? AND va.volunteer_id = ? AND va.status = 'Active'`,
        [documentId, volunteerId]
      );
      allowed = rows.length > 0;
    } else if (role === 'ADMIN') {
      allowed = true;
    }

    if (!allowed) {
      return res.status(403).json({ error: 'Access denied. You are not authorized to view or download this document.' });
    }

    const versions = await db.query(
      'SELECT storage_key, original_filename, mime_type FROM Document_Version WHERE version_id = ? AND document_id = ?',
      [versionId, documentId]
    );
    if (!versions || versions.length === 0) {
      return res.status(404).json({ error: 'Document version not found.' });
    }

    const { storage_key, original_filename, mime_type } = versions[0];
    const filePath = path.join(UPLOAD_DIR, storage_key);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Document file not found on storage server.' });
    }

    // Path traversal security check
    const resolved = path.resolve(filePath);
    if (!resolved.startsWith(path.resolve(UPLOAD_DIR))) {
      return res.status(403).json({ error: 'Path traversal detected.' });
    }

    res.set({
      'Content-Type': mime_type,
      'Content-Disposition': `inline; filename="${encodeURIComponent(original_filename)}"`,
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Content-Type-Options': 'nosniff',
    });

    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  uploadDocument,
  getMyDocuments,
  getDocumentDetail,
  resubmitDocument,
  streamDocumentFile,
};
