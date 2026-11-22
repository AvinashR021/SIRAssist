const db = require('../db/connection');

async function getNotifications(req, res, next) {
  try {
    const citizenId = req.user.citizen_id;
    if (!citizenId) {
      return res.json([]);
    }

    const notifications = await db.query(
      `SELECT notification_id, citizen_id, request_id, document_id, review_id,
              title, message, created_at, read_status
       FROM Notification
       WHERE citizen_id = ?
       ORDER BY created_at DESC`,
      [citizenId]
    );

    res.json(notifications || []);
  } catch (err) {
    next(err);
  }
}

async function markAsRead(req, res, next) {
  try {
    const notificationId = parseInt(req.params.id);
    const citizenId = req.user.citizen_id;

    if (isNaN(notificationId)) {
      return res.status(400).json({ error: 'Invalid notification ID.' });
    }

    await db.query(
      'UPDATE Notification SET read_status = TRUE WHERE notification_id = ? AND citizen_id = ?',
      [notificationId, citizenId]
    );

    res.json({ message: 'Notification marked as read.' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getNotifications,
  markAsRead
};
