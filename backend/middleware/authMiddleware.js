const jwt = require('jsonwebtoken');
const { getPlayerById } = require('../models/playersModel.js');

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware to validate JWT tokens
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authorization token is missing or invalid' });
    }

    const token = authHeader.split(' ')[1];

    try {
        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await getPlayerById(decoded.id);
        // console.log(user);

        // Check if user with the provided token exists 
        if (!user.length || user[0].player_id !== decoded.id) {
            console.error('User not found in the database');
            return res.status(401).json({ error: 'User not found', message: 'It could be potential due to token expiration' })
        }

        req.user = decoded; // Attach decoded user to request
        next(); // Proceed to the next middleware or route handler
    } catch (error) {
        console.error('Token verification failed:', error);
        return res.status(403).json({ error: 'Invalid token' });
    }
};

module.exports = { authenticateToken };
