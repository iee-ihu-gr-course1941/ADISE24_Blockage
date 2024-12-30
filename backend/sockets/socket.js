const { gameExists, retrieveGameById, updateGameStatus } = require('../models/gamesModel');
const { removeUserSocketMap } = require('../sockets/socketioAuthMiddleware.js');

module.exports = (io) => {

    io.on('connection', (socket) => {
        const { user, gameID } = socket;
        console.log(`User ${user.id}  with socketID: '${socket.id}' connected`);
        console.info(`Number of current active sockets: ${io.sockets.sockets.size}`);
        try {
            // Check if room already exists
            const roomExists = io.sockets.adapter.rooms.has(gameID);
            console.log(`Room ${gameID} exists: ${roomExists}`);
            if (roomExists) {
                // player-join 
                socket.join(gameID)
                socket.currentRoom = gameID;
                console.log(`Joined in game/room '${gameID}' socket: '${socket.id}'`);
                socket.emit('player-joined-successfully', { message: `Player with socket ID '${socket.id}' joined game '${gameID}' successfully` });
            } else {
                // create-game
                socket.join(gameID)
                socket.currentRoom = gameID;
                console.log(`Created game/room '${gameID}' by socket: '${socket.id}'`);
                socket.emit('game-created-successfully', { message: `Player with socker ID '${socket.id}' created game '${gameID}' successfully` });
            }
        } catch (error) {
            console.error(`Error creating game for socket: ${socket.id}`, error);
            socket.emit('error', { message: 'Error creating game' });
        }
        socket.on('game-ended', async ({ status }) => {
            try {
                if (!status) {
                    return socket.emit('error', { message: 'status data field is required' });
                }
                
                await updateGameStatus(gameID, status);
                io.of('/').in(gameID).disconnectSockets();
                socket ? console.log(socket) : console.log('no socket');
            } catch (error) {
                console.error(`Error ending game for socket: ${socket.id}`, error);
                socket.emit('error', { error: error.message, message: 'Error ending game' });
            }
        });
        // TODO
        socket.on('player-left', () => {
            checkIfAlreadyInActiveGame(socket, io);
        });
        socket.on('disconnect', () => {
            checkIfAlreadyInActiveGame(socket, io);
            removeUserSocketMap(socket);
            console.log('player with socket: ' + socket.id + ' disconnected');
            console.info(`Number of current active sockets: ${io.sockets.sockets.size}`);
        });
    });
}

// const createAndJoinGameValidation = async (socket, gameId) => {
//     // check if game with id 'gameId' of message field exists
//     if (!gameId) {
//         socket.emit('error', { message: 'gameId data field is required' });
//         return false;
//     }

//     // check if game with id 'gameId' exists in db
//     const exists = await gameExists(gameId)
//     if (!exists) {
//         socket.emit('error', { message: `Game with id '${gameId}' does not exist` });
//         return false;
//     }
//     return true;
// }

const checkIfAlreadyInActiveGame = (socket, io) => {
    // check if user-socket is already in a room-game with status 'initialized' or 'started'
    // If so, then remove this socket from the current room and emit 'player-left' event
    if (socket.currentRoom) {
        const currentRoom = socket.currentRoom;
        socket.leave(socket.currentRoom);
        console.log(`player with socket: '${socket.id}' left from game: ${socket.currentRoom}`);
        io.to(currentRoom).emit('player-left', { message: `Player with socketId: '${socket.id}' and name: '${socket.user.playerName}' left the game ${currentRoom}` });
        socket.currentRoom = null;
    }
}