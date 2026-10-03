const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const { verifyToken } = require('../middleware/auth');

router.get('/requirements', documentController.getRequirements);
router.get('/', verifyToken, documentController.getDocuments);
router.post('/', verifyToken, documentController.addDocument);
router.delete('/:id', verifyToken, documentController.deleteDocument);

module.exports = router;
