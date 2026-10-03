const express = require('express');
const router = express.Router();
const demoController = require('../controllers/demoController');

router.get('/queries', demoController.getQueriesList);
router.post('/execute', demoController.runQuery);

module.exports = router;
