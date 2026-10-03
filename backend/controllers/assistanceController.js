const db = require('../db/connection');
const { findMatchingVolunteers } = require('../services/volunteerMatcher');

async function createAssistanceRequest(req, res, next) {
  try {
    const citizenId = req.user.citizen_id;
    const { request_type, priority, notes, area_id } = req.body;

    if (!citizenId || !request_type) {
      return res.status(400).json({ error: 'Citizen ID and request_type are required.' });
    }

    const result = await db.query(
      'INSERT INTO Assistance_Request (citizen_id, request_type, status, priority, notes) VALUES (?, ?, ?, ?, ?)',
      [citizenId, request_type, 'PENDING', priority || 'Medium', notes || '']
    );

    const assistanceId = result.insertId || Date.now();

    // Auto find matching volunteers for convenience
    const matches = await findMatchingVolunteers(area_id || null, request_type);

    res.status(201).json({
      message: 'Assistance request logged successfully.',
      assistance_id: assistanceId,
      status: 'PENDING',
      suggested_volunteers: matches.volunteers
    });
  } catch (err) {
    next(err);
  }
}

async function getAssistanceRequests(req, res, next) {
  try {
    const { role, citizen_id, volunteer_id } = req.user;

    let sql = `
      SELECT ar.assistance_id, ar.citizen_id, c.name AS citizen_name, c.mobile AS citizen_mobile, c.email AS citizen_email,
             ar.volunteer_id, v.name AS volunteer_name, v.mobile AS volunteer_mobile,
             ar.request_type, ar.request_date, ar.status, ar.priority, ar.notes, ar.assigned_at, ar.completed_at
      FROM Assistance_Request ar
      JOIN Citizen c ON ar.citizen_id = c.citizen_id
      LEFT JOIN Volunteer v ON ar.volunteer_id = v.volunteer_id
    `;

    const params = [];

    if (role === 'CITIZEN' && citizen_id) {
      sql += ' WHERE ar.citizen_id = ?';
      params.push(citizen_id);
    } else if (role === 'VOLUNTEER' && volunteer_id) {
      sql += ' WHERE (ar.volunteer_id = ? OR ar.status = "PENDING")';
      params.push(volunteer_id);
    }

    sql += ' ORDER BY ar.request_date DESC';

    const requests = await db.query(sql, params);
    res.json(requests);
  } catch (err) {
    next(err);
  }
}

async function updateAssistanceStatus(req, res, next) {
  try {
    const assistanceId = req.params.id;
    const { status, notes, volunteer_id } = req.body;

    const validStatuses = ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Allowed: ${validStatuses.join(', ')}` });
    }

    let assignedAtClause = '';
    let completedAtClause = '';

    if (status === 'ASSIGNED') {
      assignedAtClause = ', assigned_at = NOW()';
    } else if (status === 'COMPLETED') {
      completedAtClause = ', completed_at = NOW()';
    }

    await db.query(
      `UPDATE Assistance_Request 
       SET status = COALESCE(?, status), 
           notes = COALESCE(?, notes), 
           volunteer_id = COALESCE(?, volunteer_id) 
           ${assignedAtClause} ${completedAtClause}
       WHERE assistance_id = ?`,
      [status, notes, volunteer_id, assistanceId]
    );

    // Notify citizen if volunteer assigned or completed
    const reqRows = await db.query('SELECT citizen_id FROM Assistance_Request WHERE assistance_id = ?', [assistanceId]);
    if (reqRows.length > 0 && status) {
      await db.query(
        'INSERT INTO Notification (citizen_id, message) VALUES (?, ?)',
        [reqRows[0].citizen_id, `Assistance request #${assistanceId} status updated to: ${status}.`]
      );
    }

    res.json({ message: 'Assistance request status updated successfully.' });
  } catch (err) {
    next(err);
  }
}

async function matchVolunteers(req, res, next) {
  try {
    const { area_id, skill } = req.query;
    const matches = await findMatchingVolunteers(area_id ? parseInt(area_id) : null, skill || '');
    res.json(matches);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createAssistanceRequest,
  getAssistanceRequests,
  updateAssistanceStatus,
  matchVolunteers
};
