const { gameExists } = require('../models/gamesModel');

module.exports = (io) => {

    io.on('connection', (socket) => {
        const { user } = socket;
        console.log(`User ${user.id}  with socketID: '${socket.id}' connected`);
        // console.info(`Number of current active sockets: ${io.sockets.sockets.size}`);
        socket.on('game-created', async ({ gameId }) => {
            try {
                if (!(await createAndJoinGameValidation(socket, gameId))) {
                    return;
                }
                checkIfAlreadyInActiveGame(socket, io)
                console.log(`Server event: "game-created": socket '${socket.id}' to gameId: ${gameId}`);
                socket.join(gameId)
                socket.currentRoom = gameId;
                socket.emit('game-created-successfully', { message: `Game with id ${gameId} created successfully` });
            } catch (error) {
                console.error(`Error creating game for socket: ${socket.id}`, error);
                socket.emit('error', { message: 'Error creating game' });
            }
        });
        socket.on('player-joined', async ({ gameId }) => {
            try {
                if (!(await createAndJoinGameValidation(socket, gameId))) {
                    return;
                }
                checkIfAlreadyInActiveGame(socket, io);

                socket.join(gameId);
                socket.currentRoom = gameId;
                console.log(`Server event: "player-joined": socket: '${socket.id}' to gameId: ${gameId}`);
                socket.emit('player-joined-successfully', { message: `Player '${user.id}' joined game ${gameId} successfully` });
                socket.broadcast.to(gameId).emit('player-joined', { message: `Player joined the game ${gameId}` });
            } catch (error) {
                console.error(`Error joining game for socket: ${socket.id}.`, error);
                socket.emit('error', { message: 'Error joining game' });
            }
        });
        socket.on('player-left', () => {
            checkIfAlreadyInActiveGame(socket, io);
        });
        socket.on('disconnect', () => {
            checkIfAlreadyInActiveGame(socket, io);
            console.log('user with socketID: ' + socket.id + ' disconnected');
            // console.info(`Number of current active sockets: ${io.sockets.sockets.size}`);
        });
    });
}

const createAndJoinGameValidation = async (socket, gameId) => {
    // check if game with id 'gameId' of message field exists
    if (!gameId) {
        socket.emit('error', { message: 'gameId is required' });
        return false;
    }

    // check if game with id 'gameId' exists in db
    const exists = await gameExists(gameId)
    if (!exists) {
        socket.emit('error', { message: `Game with id '${gameId}' does not exist` });
        return false;
    }
    return true;
}

const checkIfAlreadyInActiveGame = (socket, io) => {
    // check if user-socket is already in a room-game with status 'initialized' or 'started'
    // If so, then remove this socket from the current room and emit 'player-left' event
    if (socket.currentRoom) {
        const currentRoom = socket.currentRoom;
        socket.leave(socket.currentRoom);
        console.log(`Server event: "player-left" for socket: '${socket.id}' to gameId: ${socket.currentRoom}`);
        io.to(currentRoom).emit('player-left', { message: `Player with socketId: '${socket.id}' and name: '${socket.user.playerName}' left the game ${currentRoom}` });
        socket.currentRoom = null;
    }
}