const jwt = require('jsonwebtoken');
const { getPlayerById } = require('../models/playersModel.js');
const { gameExists } = require('../models/gamesModel.js');

const JWT_SECRET = process.env.JWT_SECRET;
const userSocketMap = new Map();

// Middleware to validate JWT tokens for socketio clients
const socketioToken = async (socket, next) => {

    // Check if token is provided in the headers
    // *Note: Postman does not support socket.handshake.auth.token
    //  therefore we need to use socket.handshake.headers.token in order to check it
    const authHeader = socket.handshake.auth?.token || socket.handshake.headers?.token;
    const gameId = socket.handshake.query?.gameId;

    if (!gameId) {
        return next(new Error(`gameId query is missing`));
    }

    if (!(await gameExists(gameId))) {
        return next(new Error(`Game with id ${gameId} does not exist `));
    }

    if (!authHeader || !authHeader.startsWith('Bearer')) {
        // console.error('SocketIO client trying to connect BUT... Token is missing');
        // Proceed to the next middleware by producing an error message to client and forces
        // to release the handshake connection for both sides (server-client)
        return next(new Error('Authorization token is missing or invalid (websocket)'));
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await getPlayerById(decoded.id);
        // console.log(user);
        // console.log(socket);

        // Check if user with the provided token exists 
        if (!user.length || user[0].player_id !== decoded.id) {
            return next(new Error('User not found'));
        }

        socket.user = decoded; // Attach decoded user to request
        socket.gameID = gameId;
        userSocketMap.set(decoded.id, socket.id)    // Store user's socket id in a map
        next(); // Proceed to the next middleware or route handler
    } catch (error) {
        console.error('Token verification failed (websocket)');
        // Proceed to the next middleware by producing an error message to client and forces
        // to release the handshake connection for both sides (server-client)
        return next(new Error('Invalid token (websocket)'));
    }
}

// Get user's socket by user id
const getUserSocket = (userId) => {
    return userSocketMap.get(userId);
}

// Cleanup socketioUserMap when a user disconnects
const removeUserSocketMap = (socket) => {
    if (socket.user && userSocketMap.has(socket.user.id)) {
        userSocketMap.delete(socket.user.id); // Remove user from the map
    }
}

module.exports = { socketioToken, getUserSocket, removeUserSocketMap }