const express = require('express');
const { loginGuest } = require('../controllers/authController');

const router = express.Router();

// Guest login route
router.post('/guest', loginGuest);

module.exports = router;
