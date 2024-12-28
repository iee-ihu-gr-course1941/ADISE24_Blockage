const jwt = require('jsonwebtoken');
const { getPlayer } = require('../models/playersModel.js');

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware to validate JWT tokens for socketio clients
const socketioToken = async (socket, next) => {

    // Check if token is provided in the headers
    // *Note: Postman does not support socket.handshake.auth.token
    //  therefore we need to use socket.handshake.headers.token in order to check it
    const authHeader = socket.handshake.auth?.token || socket.handshake.headers?.token;

    if (!authHeader || !authHeader.startsWith('Bearer')) {
        // console.error('SocketIO client trying to connect BUT... Token is missing');
        // Proceed to the next middleware by producing an error message to client and forces
        // to release the handshake connection for both sides (server-client)
        return next(new Error('Authorization token is missing or invalid (websocket)'));
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await getPlayer(decoded.id);
        // console.log(user);

        // Check if user with the provided token exists 
        if (!user.length || user[0].player_id !== decoded.id) {
            throw new Error('User not found');
        }

        socket.user = decoded; // Attach decoded user to request
        next(); // Proceed to the next middleware or route handler
    } catch (error) {
        console.error('Token verification failed (websocket)');
        // Proceed to the next middleware by producing an error message to client and forces
        // to release the handshake connection for both sides (server-client)
        return next(new Error('Invalid token (websocket)'));
    }
}

module.exports = { socketioToken }