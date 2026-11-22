const express = require('express');
const router  = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/assignmentController');

// Admin: list all documents (with assignment status)
router.get('/documents', verifyToken, requireRole('ADMIN'), ctrl.listAllDocuments);

// Admin: list all volunteer assignments
router.get('/volunteer-assignments', verifyToken, requireRole('ADMIN'), ctrl.listAssignments);

// Admin: assign volunteer to document
router.post('/volunteer-assignments', verifyToken, requireRole('ADMIN'), ctrl.createAssignment);

module.exports = router;
