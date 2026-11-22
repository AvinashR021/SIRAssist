/**
 * SIRAssist – Volunteer Document Review Controller
 * Volunteer sees only documents explicitly assigned to them.
 * Review submission is an atomic ACID transaction:
 *   1. Record review details in Document_Review
 *   2. Update Document file_review_status
 *   3. If reviewed cleanly, complete the assignment
 *   4. Dispatch in-app notification to the document owner citizen
 */
const db = require('../db/connection');

function getNotificationContent(decision, feedback, docType) {
  const titles = {
    'Reviewed – No Issues Found': 'Document Reviewed – No Issues Found',
    'Correction Required': 'Action Required: Document Correction Needed',
    'Additional Document Requested': 'Additional Document Requested',
    'Unable to Review': 'Document Review Notice: Unable to Review'
  };

  const title = titles[decision] || 'Document Review Update';
  let message = '';

  if (decision === 'Reviewed – No Issues Found') {
    message = `Your uploaded document (${docType}) has been reviewed. No readability or completeness issues were reported.`;
  } else if (decision === 'Correction Required') {
    message = `Your document (${docType}) needs correction. Reviewer feedback: "${feedback || 'Please review the feedback'}". Please open your document review to see details and upload a corrected version.`;
  } else if (decision === 'Additional Document Requested') {
    message = `Your volunteer has requested additional supporting information for your document (${docType}). Please review the message.`;
  } else {
    message = `The reviewer was unable to complete review of your document (${docType}). Reviewer notes: "${feedback || 'Please check document details'}".`;
  }

  return { title, message };
}

// ─── VOLUNTEER: List documents assigned to this volunteer ───────────────────
// Supports separate views: 'pending' (actionable) vs 'history' (completed/reviewed) vs 'all'
async function getAssignedDocuments(req, res, next) {
  try {
    const volunteerId = req.user?.volunteer_id;
    if (!volunteerId) return res.status(403).json({ error: 'Volunteer session required.' });

    const view = req.query.view || 'all'; // 'pending' | 'history' | 'all'

    // Fetch latest assignment per document for this volunteer (Active or Completed)
    const rows = await db.query(
      `SELECT
         d.document_id, d.document_type, d.description,
         d.current_version, d.file_review_status, d.created_at,
         c.name AS citizen_name, c.email AS citizen_email,
         d.request_id,
         va.assignment_id, va.assigned_at, va.status AS assignment_status,
         v.version_id, v.original_filename, v.mime_type, v.file_size_bytes, v.uploaded_at AS file_uploaded_at,
         r.review_id, r.review_decision, r.issue_category, r.feedback_message, r.reviewed_at
       FROM Volunteer_Assignment va
       JOIN Document d ON d.document_id = va.document_id
       JOIN Citizen  c ON c.citizen_id  = d.citizen_id
       LEFT JOIN Document_Version v
         ON v.document_id = d.document_id AND v.version_number = d.current_version
       LEFT JOIN Document_Review r ON r.version_id = v.version_id
       WHERE va.assignment_id IN (
         SELECT MAX(va2.assignment_id)
         FROM Volunteer_Assignment va2
         WHERE va2.volunteer_id = ? AND va2.status IN ('Active', 'Completed')
         GROUP BY va2.document_id
       )
       ORDER BY (d.file_review_status = 'Pending Review' AND va.status = 'Active') DESC, d.created_at DESC`,
      [volunteerId]
    );

    const docList = rows || [];

    // Separate into pending vs history
    // Pending: Active assignment AND not yet finalized (Pending Review, Under Review, or waiting for initial action)
    const pendingDocs = docList.filter(
      r => r.assignment_status === 'Active' &&
           (r.file_review_status === 'Pending Review' || r.file_review_status === 'Under Review' || !r.review_id)
    );

    // History: Assignment is Completed, or volunteer already submitted a review
    const historyDocs = docList.filter(
      r => r.assignment_status === 'Completed' ||
           r.file_review_status === 'Reviewed – No Issues Found' ||
           Boolean(r.review_id)
    );

    const summary = {
      pending: pendingDocs.length,
      reviewed: docList.filter(r => r.file_review_status === 'Reviewed – No Issues Found' || r.assignment_status === 'Completed').length,
      correction: docList.filter(r => r.file_review_status === 'Correction Required').length,
      awaiting: docList.filter(r => r.file_review_status === 'Additional Document Requested' || r.file_review_status === 'Unable to Review').length
    };

    let returnedDocs = docList;
    if (view === 'pending') {
      returnedDocs = pendingDocs;
    } else if (view === 'history') {
      returnedDocs = historyDocs;
    }

    res.json({
      summary,
      documents: returnedDocs,
      pending: pendingDocs,
      history: historyDocs
    });
  } catch (err) {
    next(err);
  }
}

// ─── VOLUNTEER: Get detail of an assigned document ──────────────────────────
async function getAssignedDocumentDetail(req, res, next) {
  try {
    const volunteerId = req.user?.volunteer_id;
    const documentId  = parseInt(req.params.id);
    if (!volunteerId) return res.status(403).json({ error: 'Volunteer session required.' });
    if (isNaN(documentId)) return res.status(400).json({ error: 'Invalid document ID.' });

    // Authorization: Volunteer must have an Active or Completed assignment,
    // OR have previously reviewed this document.
    const assigned = await db.query(
      `SELECT assignment_id, status FROM Volunteer_Assignment
       WHERE document_id = ? AND volunteer_id = ? AND status IN ('Active', 'Completed')
       ORDER BY assignment_id DESC LIMIT 1`,
      [documentId, volunteerId]
    );

    let prevReview = [];
    if (!assigned || assigned.length === 0) {
      prevReview = await db.query(
        `SELECT r.review_id
         FROM Document_Review r
         JOIN Document_Version v ON v.version_id = r.version_id
         WHERE v.document_id = ? AND r.volunteer_id = ?
         LIMIT 1`,
        [documentId, volunteerId]
      );
    }

    if ((!assigned || assigned.length === 0) && (!prevReview || prevReview.length === 0)) {
      return res.status(403).json({ error: 'Access denied. This document is not assigned to you.' });
    }

    const assignment = assigned && assigned.length > 0 ? assigned[0] : null;

    const docRows = await db.query(
      `SELECT d.*, c.name AS citizen_name, c.email AS citizen_email
       FROM Document d JOIN Citizen c ON c.citizen_id = d.citizen_id
       WHERE d.document_id = ?`,
      [documentId]
    );
    if (!docRows || docRows.length === 0) return res.status(404).json({ error: 'Document not found.' });
    const doc = docRows[0];

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

    // Read-only determination:
    // If assignment is completed, or if current version is already reviewed, this is strictly read-only
    const currentVersionObj = versions.find(v => v.version_number === doc.current_version);
    const isAlreadyReviewed = Boolean(currentVersionObj?.review_id);
    const isCompleted = assignment ? assignment.status === 'Completed' : true;
    const isReadOnly = isCompleted || isAlreadyReviewed || doc.file_review_status === 'Reviewed – No Issues Found';

    res.json({
      document: doc,
      versions,
      is_read_only: isReadOnly,
      assignment_status: assignment?.status || 'Completed',
      has_active_assignment: assignment?.status === 'Active'
    });
  } catch (err) {
    next(err);
  }
}

// ─── VOLUNTEER: Submit review decision ──────────────────────────────────────
async function submitReview(req, res, next) {
  try {
    const volunteerId = req.user?.volunteer_id;
    const documentId  = parseInt(req.params.id);
    if (!volunteerId) return res.status(403).json({ error: 'Volunteer session required.' });
    if (isNaN(documentId)) return res.status(400).json({ error: 'Invalid document ID.' });

    const {
      review_decision,
      issue_category,
      feedback_message,
      additional_document_request
    } = req.body;

    const VALID_DECISIONS = [
      'Reviewed – No Issues Found',
      'Correction Required',
      'Additional Document Requested',
      'Unable to Review'
    ];
    if (!review_decision || !VALID_DECISIONS.includes(review_decision)) {
      return res.status(400).json({ error: 'Review decision is required and must be a valid option.' });
    }

    if (['Correction Required', 'Unable to Review'].includes(review_decision)) {
      if (!issue_category || issue_category === 'N/A') {
        return res.status(400).json({ error: 'Issue category is mandatory when correction or inability to review is selected.' });
      }
      if (!feedback_message || feedback_message.trim().length < 5) {
        return res.status(400).json({ error: 'A constructive feedback message (min 5 characters) is mandatory.' });
      }
    }

    if (review_decision === 'Additional Document Requested') {
      if (!additional_document_request || additional_document_request.trim().length < 5) {
        return res.status(400).json({ error: 'Please describe the additional document or information requested.' });
      }
    }

    if (feedback_message && feedback_message.length > 2000) {
      return res.status(400).json({ error: 'Feedback message cannot exceed 2000 characters.' });
    }

    // Check volunteer assignment - must be currently Active
    const assigned = await db.query(
      `SELECT assignment_id FROM Volunteer_Assignment
       WHERE document_id = ? AND volunteer_id = ? AND status = 'Active'
       LIMIT 1`,
      [documentId, volunteerId]
    );
    if (!assigned || assigned.length === 0) {
      return res.status(403).json({ error: 'Access denied. You do not have an active assignment to review this document.' });
    }

    // Atomic transaction with row-level locking for ACID guarantee
    const result = await db.executeTransaction(async (conn) => {
      // 1. Lock Document and get current version with FOR UPDATE
      const [docRows] = await conn.query(
        `SELECT d.document_id, d.current_version, d.document_type, d.citizen_id,
                v.version_id
         FROM Document d
         JOIN Document_Version v ON v.document_id = d.document_id AND v.version_number = d.current_version
         WHERE d.document_id = ? FOR UPDATE`,
        [documentId]
      );
      if (!docRows || docRows.length === 0) {
        const notFoundErr = new Error('Document or latest version not found.');
        notFoundErr.status = 404;
        throw notFoundErr;
      }
      const doc = docRows[0];

      // 2. Prevent duplicate review on the exact same version
      const [existing] = await conn.query(
        'SELECT review_id FROM Document_Review WHERE version_id = ? FOR UPDATE',
        [doc.version_id]
      );
      if (existing && existing.length > 0) {
        const conflictErr = new Error(`Version ${doc.current_version} of this document has already been reviewed.`);
        conflictErr.status = 409;
        throw conflictErr;
      }

      // 3. Insert Review
      const [revRes] = await conn.query(
        `INSERT INTO Document_Review
           (version_id, volunteer_id, review_decision, issue_category, feedback_message, additional_document_request)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          doc.version_id,
          volunteerId,
          review_decision,
          issue_category || 'N/A',
          feedback_message?.trim() || null,
          additional_document_request?.trim() || null
        ]
      );
      const reviewId = revRes.insertId;

      // 4. Update Document status
      await conn.query(
        'UPDATE Document SET file_review_status = ?, updated_at = NOW() WHERE document_id = ?',
        [review_decision, documentId]
      );

      // 5. Mark assignment completed if no issues found
      if (review_decision === 'Reviewed – No Issues Found') {
        await conn.query(
          `UPDATE Volunteer_Assignment SET status = 'Completed' WHERE document_id = ? AND volunteer_id = ? AND status = 'Active'`,
          [documentId, volunteerId]
        );
      }

      // 6. Create Notification for citizen
      const { title, message } = getNotificationContent(review_decision, feedback_message?.trim(), doc.document_type);
      await conn.query(
        `INSERT INTO Notification (citizen_id, request_id, document_id, review_id, title, message)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [doc.citizen_id, null, documentId, reviewId, title, message]
      );

      return { reviewId };
    });

    res.json({
      message: 'Document review submitted successfully.',
      review_id: result.reviewId,
      new_status: review_decision
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
}

module.exports = {
  getAssignedDocuments,
  getAssignedDocumentDetail,
  submitReview
};
