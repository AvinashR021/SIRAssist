const express = require('express');
const router = express.Router();
const assistanceController = require('../controllers/assistanceController');
const { verifyToken } = require('../middleware/auth');

router.get('/match', verifyToken, assistanceController.matchVolunteers);
router.get('/', verifyToken, assistanceController.getAssistanceRequests);
router.post('/', verifyToken, assistanceController.createAssistanceRequest);
router.put('/:id', verifyToken, assistanceController.updateAssistanceStatus);

module.exports = router;
