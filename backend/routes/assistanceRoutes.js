const express = require('express');
const router = express.Router();
const assistanceController = require('../controllers/assistanceController');
const { verifyToken, requireRole } = require('../middleware/auth');
const { validateAssistanceRequest } = require('../middleware/validator');

router.get('/', verifyToken, assistanceController.getAssistanceRequests);
router.post('/', verifyToken, validateAssistanceRequest, assistanceController.createAssistanceRequest);
router.put('/:id', verifyToken, requireRole('ADMIN', 'VOLUNTEER'), assistanceController.updateAssistanceStatus);
router.get('/match', verifyToken, assistanceController.matchVolunteers);

module.exports = router;
