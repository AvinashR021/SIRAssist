const express = require('express');
const router  = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/reviewController');

// Volunteer: list all assigned documents (with summary)
router.get('/', verifyToken, requireRole('VOLUNTEER'), ctrl.getAssignedDocuments);

// Volunteer: get one document detail + history
router.get('/:id', verifyToken, requireRole('VOLUNTEER'), ctrl.getAssignedDocumentDetail);

// Volunteer: submit review
router.post('/:id/review', verifyToken, requireRole('VOLUNTEER'), ctrl.submitReview);

module.exports = router;
