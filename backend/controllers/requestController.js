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

    if (userRole === 'CITIZEN' && citizenId) {
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

    if (!citizenId || !request_type) {
      return res.status(400).json({ error: 'Citizen ID and request_type are required.' });
    }

    // Demonstrates Transaction workflow (Requirement #30.5)
    // 1. Create Verification Request
    const reqRes = await db.query(
      'INSERT INTO Verification_Request (citizen_id, voter_id, request_type, current_status, remarks) VALUES (?, ?, ?, ?, ?)',
      [citizenId, voter_id || null, request_type, 'SUBMITTED', remarks || 'New request created']
    );

    const requestId = reqRes.insertId || Date.now();

    // 2. Link documents in Request_Document junction table
    if (Array.isArray(selected_document_ids) && selected_document_ids.length > 0) {
      for (const docId of selected_document_ids) {
        await db.query('INSERT INTO Request_Document (request_id, document_id) VALUES (?, ?)', [requestId, docId]);
      }
    } else {
      // Auto-attach matching documents owned by the citizen
      const reqDocs = await db.query(
        'SELECT dr.document_type FROM Document_Requirement dr WHERE dr.request_type = ? AND dr.active = 1',
        [request_type]
      );
      const reqTypes = reqDocs.map(r => r.document_type);

      if (reqTypes.length > 0) {
        const citDocs = await db.query(
          'SELECT document_id FROM Document WHERE citizen_id = ? AND document_type IN (?)',
          [citizenId, reqTypes]
        );
        for (const cd of citDocs) {
          await db.query('INSERT IGNORE INTO Request_Document (request_id, document_id) VALUES (?, ?)', [requestId, cd.document_id]);
        }
      }
    }

    // 3. Log initial status history
    await db.query(
      'INSERT INTO Status_History (request_id, old_status, new_status, changed_by, remarks) VALUES (?, ?, ?, ?, ?)',
      [requestId, 'NONE', 'SUBMITTED', 'Citizen Submission', 'Request created successfully']
    );

    // 4. Create notification
    await db.query(
      'INSERT INTO Notification (citizen_id, request_id, message) VALUES (?, ?, ?)',
      [citizenId, requestId, `Verification request #${requestId} (${request_type}) has been created successfully with status: SUBMITTED.`]
    );

    // Evaluate readiness summary
    const readiness = await evaluateVerificationReadiness(citizenId, request_type, requestId);

    res.status(201).json({
      message: 'Request created successfully.',
      request_id: requestId,
      current_status: 'SUBMITTED',
      readiness
    });
  } catch (err) {
    next(err);
  }
}

async function getRequestById(req, res, next) {
  try {
    const requestId = req.params.id;

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
    const requestId = req.params.id;
    const { status, remarks } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'New status is required.' });
    }

    const validStatuses = ['DRAFT', 'SUBMITTED', 'DOCUMENTS_PENDING', 'DOCUMENTS_SUBMITTED', 'UNDER_REVIEW', 'RESOLVED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Allowed values: ${validStatuses.join(', ')}` });
    }

    const currentReqs = await db.query('SELECT current_status, citizen_id FROM Verification_Request WHERE request_id = ?', [requestId]);
    if (currentReqs.length === 0) {
      return res.status(404).json({ error: 'Verification request not found.' });
    }

    const oldStatus = currentReqs[0].current_status;
    const citizenId = currentReqs[0].citizen_id;

    // Update Verification_Request
    await db.query(
      'UPDATE Verification_Request SET current_status = ?, remarks = COALESCE(?, remarks), updated_at = NOW() WHERE request_id = ?',
      [status, remarks, requestId]
    );

    // Insert Status History
    await db.query(
      'INSERT INTO Status_History (request_id, old_status, new_status, changed_by, remarks) VALUES (?, ?, ?, ?, ?)',
      [requestId, oldStatus, status, req.user.username || 'Admin User', remarks || `Status updated to ${status}`]
    );

    // Create Notification
    await db.query(
      'INSERT INTO Notification (citizen_id, request_id, message) VALUES (?, ?, ?)',
      [citizenId, requestId, `Your verification request #${requestId} status has been updated to ${status}.`]
    );

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
    const requestId = req.params.id;
    const currentReqs = await db.query('SELECT citizen_id, request_type FROM Verification_Request WHERE request_id = ?', [requestId]);
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
