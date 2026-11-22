const express = require('express');
const router = express.Router();
const demoController = require('../controllers/demoController');
const { verifyToken, requireRole } = require('../middleware/auth');

// Existing SQL Query Runner endpoints
router.get('/queries', demoController.getQueriesList);
router.post('/execute', demoController.runQuery);

// Component 8 Validation & Security Demo endpoints
router.get('/validation-tests', demoController.getValidationTests);
router.post('/run-validation-test', demoController.runValidationTest);

module.exports = router;
