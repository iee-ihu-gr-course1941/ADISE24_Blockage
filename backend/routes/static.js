const path = require('path');
const express = require('express');

const router = express.Router()
const publicDirectoryPath = path.join(__dirname, '/../../', 'public');

router.use(express.static(publicDirectoryPath));

router.get('/login', (req, res) => {
    res.sendFile(path.join(publicDirectoryPath, 'login.html'));
});

router.get('/dashboard', (req, res) => {
    res.sendFile(path.join(publicDirectoryPath, 'dashboard.html'));
});

router.get('/game', (req, res) => {
    res.sendFile(path.join(publicDirectoryPath, 'game.html'));
});

module.exports = router;