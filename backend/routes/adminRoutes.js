const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken, requireRole('ADMIN'));

router.get('/statistics', adminController.getStatistics);
router.get('/citizens', adminController.getCitizens);
router.put('/volunteers/:id', adminController.updateVolunteerStatus);
router.post('/requirements', adminController.addRequirement);
router.put('/requirements/:id', adminController.updateRequirement);
router.post('/assign-volunteer', adminController.assignVolunteer);

module.exports = router;
