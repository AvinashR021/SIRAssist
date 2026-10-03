const express = require('express');
const router = express.Router();
const volunteerController = require('../controllers/volunteerController');
const { verifyToken } = require('../middleware/auth');

router.get('/available', verifyToken, volunteerController.getAvailableVolunteers);
router.get('/', verifyToken, volunteerController.getVolunteers);
router.put('/profile', verifyToken, volunteerController.updateVolunteerProfile);
router.put('/:id', verifyToken, volunteerController.updateVolunteerProfile);

module.exports = router;
