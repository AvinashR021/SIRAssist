const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const assignmentController = require('../controllers/assignmentController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken, requireRole('ADMIN'));

router.get('/statistics', adminController.getStatistics);
router.get('/citizens', adminController.getCitizens);
router.put('/volunteers/:id', adminController.updateVolunteerStatus);
router.post('/requirements', adminController.addRequirement);
router.put('/requirements/:id', adminController.updateRequirement);
router.post('/assign-volunteer', adminController.assignVolunteer);

// Document review & volunteer assignments
router.get('/document-reviews', assignmentController.listAllDocuments);
router.get('/documents', assignmentController.listAllDocuments);
router.get('/volunteer-assignments', assignmentController.listAssignments);
router.post('/volunteer-assignments', assignmentController.createAssignment);

module.exports = router;
