const jwt = require('jsonwebtoken');
const { createPlayer } = require('../models/playersModel');
require('dotenv').config();

// Secret for JWT
const JWT_SECRET = process.env.JWT_SECRET;

// Login as Guest
const loginGuest = async (req, res) => {
    const { playerName } = req.body;

    if (!playerName || playerName.trim() === '') {
        return res.status(400).json({ error: 'playerName is required' });
    }

    try {
        // Create player in the database
        const playerId = await createPlayer(playerName);

        // Generate JWT token
        const token = jwt.sign({ id: playerId, playerName }, JWT_SECRET, { expiresIn: '2h' });

        res.status(201).json({ message: 'Guest login successful', token });
    } catch (error) {
        console.error('Error during guest login', error);
        if (error.statusCode === 400) {
            res.status(400).json({ error: error.message, message: 'Duplicate entry' });
        } else {
            res.status(500).json({ error: error.message, message: 'Error during guest login' });
            // res.status(500).json({ error: 'Internal server error' });
        }
    };
};

module.exports = { loginGuest };
