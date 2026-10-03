const db = require('../db/connection');

async function getStatistics(req, res, next) {
  try {
    const totalCitizens = await db.query('SELECT COUNT(*) AS count FROM Citizen');
    const totalRequests = await db.query('SELECT COUNT(*) AS count FROM Verification_Request');
    const pendingRequests = await db.query('SELECT COUNT(*) AS count FROM Verification_Request WHERE current_status IN ("SUBMITTED", "DOCUMENTS_PENDING", "DOCUMENTS_SUBMITTED", "UNDER_REVIEW")');
    const resolvedRequests = await db.query('SELECT COUNT(*) AS count FROM Verification_Request WHERE current_status = "RESOLVED"');
    const totalAssistance = await db.query('SELECT COUNT(*) AS count FROM Assistance_Request');
    const totalVolunteers = await db.query('SELECT COUNT(*) AS count FROM Volunteer');

    // Chart 1: Requests by status
    const statusChart = await db.query(
      'SELECT current_status AS label, COUNT(*) AS count FROM Verification_Request GROUP BY current_status'
    );

    // Chart 2: Requests by area / district
    const areaChart = await db.query(
      `SELECT COALESCE(a.district, 'Unassigned') AS label, COUNT(vr.request_id) AS count
       FROM Verification_Request vr
       JOIN Citizen c ON vr.citizen_id = c.citizen_id
       LEFT JOIN Address a ON c.address_id = a.address_id
       GROUP BY COALESCE(a.district, 'Unassigned')`
    );

    // Chart 3: Assistance requests by category
    const categoryChart = await db.query(
      'SELECT request_type AS label, COUNT(*) AS count FROM Assistance_Request GROUP BY request_type'
    );

    // Chart 4: Monthly request count
    const monthlyChart = await db.query(
      `SELECT DATE_FORMAT(submission_date, '%b %Y') AS label, COUNT(*) AS count
       FROM Verification_Request
       GROUP BY DATE_FORMAT(submission_date, '%b %Y'), DATE_FORMAT(submission_date, '%Y-%m')
       ORDER BY DATE_FORMAT(submission_date, '%Y-%m') ASC`
    );

    res.json({
      cards: {
        totalCitizens: totalCitizens[0]?.count || 0,
        totalRequests: totalRequests[0]?.count || 0,
        pendingRequests: pendingRequests[0]?.count || 0,
        resolvedRequests: resolvedRequests[0]?.count || 0,
        totalAssistance: totalAssistance[0]?.count || 0,
        totalVolunteers: totalVolunteers[0]?.count || 0
      },
      charts: {
        statusChart,
        areaChart,
        categoryChart,
        monthlyChart
      }
    });
  } catch (err) {
    next(err);
  }
}

async function getCitizens(req, res, next) {
  try {
    const { search } = req.query;
    let sql = `
      SELECT c.citizen_id, c.name, c.email, c.mobile, c.date_of_birth, c.gender, c.created_at,
             a.house_number, a.street, a.village, a.taluk, a.district, a.pin_code
      FROM Citizen c
      LEFT JOIN Address a ON c.address_id = a.address_id
    `;
    const params = [];

    if (search) {
      sql += ' WHERE (c.name LIKE ? OR c.email LIKE ? OR c.mobile LIKE ? OR c.citizen_id = ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, isNaN(search) ? -1 : parseInt(search));
    }

    sql += ' ORDER BY c.created_at DESC';

    const citizens = await db.query(sql, params);
    res.json(citizens);
  } catch (err) {
    next(err);
  }
}

async function updateVolunteerStatus(req, res, next) {
  try {
    const volunteerId = req.params.id;
    const { status, availability } = req.body;

    await db.query(
      'UPDATE Volunteer SET verification_status = COALESCE(?, verification_status), availability = COALESCE(?, availability) WHERE volunteer_id = ?',
      [status, availability, volunteerId]
    );

    res.json({ message: 'Volunteer status updated successfully.' });
  } catch (err) {
    next(err);
  }
}

async function addRequirement(req, res, next) {
  try {
    const { request_type, document_type, mandatory, description, source_reference } = req.body;

    if (!request_type || !document_type) {
      return res.status(400).json({ error: 'request_type and document_type are required.' });
    }

    const result = await db.query(
      'INSERT INTO Document_Requirement (request_type, document_type, mandatory, description, source_reference, active) VALUES (?, ?, ?, ?, ?, ?)',
      [request_type, document_type, mandatory ? 1 : 0, description || '', source_reference || 'Official ECI Guidelines 2026', 1]
    );

    res.status(201).json({
      message: 'Document requirement rule added.',
      requirement_id: result.insertId || Date.now()
    });
  } catch (err) {
    next(err);
  }
}

async function updateRequirement(req, res, next) {
  try {
    const requirementId = req.params.id;
    const { active, mandatory, description } = req.body;

    await db.query(
      'UPDATE Document_Requirement SET active = COALESCE(?, active), mandatory = COALESCE(?, mandatory), description = COALESCE(?, description) WHERE requirement_id = ?',
      [active, mandatory, description, requirementId]
    );

    res.json({ message: 'Requirement updated.' });
  } catch (err) {
    next(err);
  }
}

async function assignVolunteer(req, res, next) {
  try {
    const { assistance_id, volunteer_id } = req.body;

    if (!assistance_id || !volunteer_id) {
      return res.status(400).json({ error: 'assistance_id and volunteer_id are required.' });
    }

    await db.query(
      'UPDATE Assistance_Request SET volunteer_id = ?, status = "ASSIGNED", assigned_at = NOW() WHERE assistance_id = ?',
      [volunteer_id, assistance_id]
    );

    const reqRows = await db.query('SELECT citizen_id FROM Assistance_Request WHERE assistance_id = ?', [assistance_id]);
    if (reqRows.length > 0) {
      const volRows = await db.query('SELECT name FROM Volunteer WHERE volunteer_id = ?', [volunteer_id]);
      const volName = volRows[0]?.name || 'a volunteer';
      await db.query(
        'INSERT INTO Notification (citizen_id, message) VALUES (?, ?)',
        [reqRows[0].citizen_id, `Volunteer ${volName} has been assigned to your assistance request #${assistance_id}.`]
      );
    }

    res.json({ message: 'Volunteer assigned successfully.' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getStatistics,
  getCitizens,
  updateVolunteerStatus,
  addRequirement,
  updateRequirement,
  assignVolunteer
};
