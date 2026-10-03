const express = require('express');
const router = express.Router();
const citizenController = require('../controllers/citizenController');
const { verifyToken } = require('../middleware/auth');

router.get('/profile', verifyToken, citizenController.getProfile);
router.put('/profile', verifyToken, citizenController.updateProfile);

module.exports = router;
