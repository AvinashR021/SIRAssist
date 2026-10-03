const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/', verifyToken, requestController.getRequests);
router.post('/', verifyToken, requestController.createRequest);
router.get('/:id', verifyToken, requestController.getRequestById);
router.get('/:id/readiness', verifyToken, requestController.getReadiness);
router.put('/:id/status', verifyToken, requireRole('ADMIN', 'VOLUNTEER'), requestController.updateRequestStatus);

module.exports = router;
