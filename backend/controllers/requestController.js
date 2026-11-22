const db = require('../db/connection');
const { evaluateVerificationReadiness } = require('../services/readinessEngine');

async function getRequests(req, res, next) {
  try {
    const userRole = req.user.role;
    const citizenId = req.user.citizen_id;

    let sql = `
      SELECT vr.request_id, vr.citizen_id, c.name AS citizen_name, c.email AS citizen_email,
             vr.voter_id, vr.request_type, vr.submission_date, vr.current_status, vr.remarks, vr.updated_at
      FROM Verification_Request vr
      JOIN Citizen c ON vr.citizen_id = c.citizen_id
    `;
    const params = [];

    // Role-based access control: Citizens can only see their own verification requests
    if (userRole === 'CITIZEN') {
      if (!citizenId) {
        return res.status(403).json({ error: 'Citizen identifier not found in authorization token.' });
      }
      sql += ' WHERE vr.citizen_id = ?';
      params.push(citizenId);
    }

    sql += ' ORDER BY vr.submission_date DESC';

    const requests = await db.query(sql, params);
    res.json(requests);
  } catch (err) {
    next(err);
  }
}

async function createRequest(req, res, next) {
  try {
    const citizenId = req.user.citizen_id;
    const { request_type, voter_id, remarks, selected_document_ids } = req.body;

    if (!citizenId) {
      return res.status(403).json({ error: 'Only registered citizens can create verification requests.' });
    }

    // Wrap multi-table write inside an ACID transaction
    const result = await db.executeTransaction(async (conn) => {
      // 1. Insert Verification Request
      const [reqRes] = await conn.query(
        'INSERT INTO Verification_Request (citizen_id, voter_id, request_type, current_status, remarks) VALUES (?, ?, ?, ?, ?)',
        [citizenId, voter_id || null, request_type, 'SUBMITTED', remarks || 'Request initiated by citizen']
      );

      const requestId = reqRes.insertId || Date.now();

      // 2. Link documents if selected
      if (Array.isArray(selected_document_ids) && selected_document_ids.length > 0) {
        for (const docId of selected_document_ids) {
          // Ownership verification: ensure doc belongs to this citizen
          const [docCheck] = await conn.query(
            'SELECT document_id FROM Document WHERE document_id = ? AND citizen_id = ?',
            [docId, citizenId]
          );
          if (docCheck.length > 0) {
            await conn.query('INSERT IGNORE INTO Request_Document (request_id, document_id) VALUES (?, ?)', [requestId, docId]);
          }
        }
      } else {
        // Auto-attach matching documents owned by the citizen for this request_type
        const [reqDocs] = await conn.query(
          'SELECT document_type FROM Document_Requirement WHERE request_type = ? AND active = 1',
          [request_type]
        );
        const reqTypes = reqDocs.map(r => r.document_type);

        if (reqTypes.length > 0) {
          const [citDocs] = await conn.query(
            'SELECT document_id FROM Document WHERE citizen_id = ? AND document_type IN (?)',
            [citizenId, reqTypes]
          );
          for (const cd of citDocs) {
            await conn.query('INSERT IGNORE INTO Request_Document (request_id, document_id) VALUES (?, ?)', [requestId, cd.document_id]);
          }
        }
      }

      // Note: If real MySQL is used, database triggers trg_after_verification_request_insert
      // automatically insert into Status_History and Notification.
      // If running in mock store mode, populate mock history to avoid duplicates.
      if (!db.getIsRealMySQL()) {
        await conn.query(
          'INSERT INTO Status_History (request_id, old_status, new_status, changed_by, remarks) VALUES (?, ?, ?, ?, ?)',
          [requestId, 'NONE', 'SUBMITTED', 'Citizen Submission', 'Request created and submitted']
        );
      }

      return { requestId };
    });

    // Evaluate readiness checklist
    const readiness = await evaluateVerificationReadiness(citizenId, request_type, result.requestId);

    res.status(201).json({
      message: 'Verification request created successfully.',
      request_id: result.requestId,
      current_status: 'SUBMITTED',
      readiness
    });
  } catch (err) {
    next(err);
  }
}

async function getRequestById(req, res, next) {
  try {
    const requestId = parseInt(req.params.id);
    if (isNaN(requestId)) {
      return res.status(400).json({ error: 'Invalid request ID format.' });
    }

    const requests = await db.query(
      `SELECT vr.request_id, vr.citizen_id, c.name AS citizen_name, c.email AS citizen_email, c.mobile AS citizen_mobile,
              vr.voter_id, vr.request_type, vr.submission_date, vr.current_status, vr.remarks, vr.updated_at
       FROM Verification_Request vr
       JOIN Citizen c ON vr.citizen_id = c.citizen_id
       WHERE vr.request_id = ?`,
      [requestId]
    );

    if (requests.length === 0) {
      return res.status(404).json({ error: 'Verification request not found.' });
    }

    const request = requests[0];

    // Ownership check for citizen
    if (req.user.role === 'CITIZEN' && req.user.citizen_id !== request.citizen_id) {
      return res.status(403).json({ error: 'Access denied. You can only view your own verification requests.' });
    }

    // Linked documents
    const documents = await db.query(
      `SELECT d.document_id, d.document_type, d.document_reference_masked, d.issue_date, d.verification_status, rd.submitted_at
       FROM Request_Document rd
       JOIN Document d ON rd.document_id = d.document_id
       WHERE rd.request_id = ?`,
      [requestId]
    );

    // Status Timeline History
    const history = await db.query(
      `SELECT history_id, old_status, new_status, changed_by, changed_at, remarks
       FROM Status_History
       WHERE request_id = ?
       ORDER BY changed_at ASC`,
      [requestId]
    );

    // Readiness checklist
    const readiness = await evaluateVerificationReadiness(request.citizen_id, request.request_type, requestId);

    res.json({
      request,
      documents,
      history,
      readiness
    });
  } catch (err) {
    next(err);
  }
}

async function updateRequestStatus(req, res, next) {
  try {
    const requestId = parseInt(req.params.id);
    const { status, remarks } = req.body;

    if (isNaN(requestId)) {
      return res.status(400).json({ error: 'Invalid request ID format.' });
    }

    // Fetch existing request
    const currentReqs = await db.query(
      'SELECT request_id, current_status, citizen_id FROM Verification_Request WHERE request_id = ?',
      [requestId]
    );

    if (currentReqs.length === 0) {
      return res.status(404).json({ error: 'Verification request not found.' });
    }

    const currentReq = currentReqs[0];
    const oldStatus = currentReq.current_status;

    if (oldStatus === status) {
      return res.status(400).json({ error: `Request is already in status '${status}'. No transition required.` });
    }

    // Enforce valid status transitions
    const validTransitions = {
      DRAFT: ['SUBMITTED', 'CANCELLED'],
      SUBMITTED: ['DOCUMENTS_PENDING', 'UNDER_REVIEW', 'CANCELLED'],
      DOCUMENTS_PENDING: ['DOCUMENTS_SUBMITTED', 'UNDER_REVIEW', 'CANCELLED'],
      DOCUMENTS_SUBMITTED: ['UNDER_REVIEW', 'DOCUMENTS_PENDING', 'CANCELLED'],
      UNDER_REVIEW: ['RESOLVED', 'DOCUMENTS_PENDING', 'CANCELLED'],
      RESOLVED: ['UNDER_REVIEW'], // Admin re-opening
      CANCELLED: []
    };

    const allowedNext = validTransitions[oldStatus] || [];
    if (!allowedNext.includes(status)) {
      return res.status(400).json({
        error: `Invalid status transition from '${oldStatus}' to '${status}'. Allowed next statuses: ${allowedNext.join(', ') || 'None (Terminal state)'}`
      });
    }

    // Execute atomic transaction to update request status
    await db.executeTransaction(async (conn) => {
      await conn.query(
        'UPDATE Verification_Request SET current_status = ?, remarks = COALESCE(?, remarks), updated_at = NOW() WHERE request_id = ?',
        [status, remarks || `Status changed from ${oldStatus} to ${status}`, requestId]
      );

      // In real MySQL, trigger trg_after_verification_request_update_status automatically
      // handles Status_History insertion and Notification generation.
      // If in mock store, record it manually:
      if (!db.getIsRealMySQL()) {
        await conn.query(
          'INSERT INTO Status_History (request_id, old_status, new_status, changed_by, remarks) VALUES (?, ?, ?, ?, ?)',
          [requestId, oldStatus, status, req.user.username || 'Admin User', remarks || `Status updated to ${status}`]
        );
      }
    });

    res.json({
      message: 'Request status updated successfully.',
      request_id: requestId,
      old_status: oldStatus,
      new_status: status
    });
  } catch (err) {
    next(err);
  }
}

async function getReadiness(req, res, next) {
  try {
    const requestId = parseInt(req.params.id);
    if (isNaN(requestId)) {
      return res.status(400).json({ error: 'Invalid request ID format.' });
    }

    const currentReqs = await db.query(
      'SELECT citizen_id, request_type FROM Verification_Request WHERE request_id = ?',
      [requestId]
    );

    if (currentReqs.length === 0) {
      return res.status(404).json({ error: 'Request not found.' });
    }

    const readiness = await evaluateVerificationReadiness(currentReqs[0].citizen_id, currentReqs[0].request_type, requestId);
    res.json(readiness);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getRequests,
  createRequest,
  getRequestById,
  updateRequestStatus,
  getReadiness
};
