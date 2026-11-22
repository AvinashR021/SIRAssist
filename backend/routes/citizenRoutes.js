const express = require('express');
const router = express.Router();
const citizenController = require('../controllers/citizenController');
const { verifyToken } = require('../middleware/auth');
const { validateProfile } = require('../middleware/validator');

router.get('/profile', verifyToken, citizenController.getProfile);
router.put('/profile', verifyToken, validateProfile, citizenController.updateProfile);
router.get('/:id', verifyToken, citizenController.getProfile);

module.exports = router;
