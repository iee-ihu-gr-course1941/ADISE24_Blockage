const { gameExists } = require('../models/gamesModel');

module.exports = (io) => {

    io.on('connection', (socket) => {
        const { user } = socket;
        console.log(`User ${user.id}  with socketID: '${socket.id}' connected`);
        socket.on('game-created', async ({ gameId }) => {
            try {
                if (!(await createAndJoinGameValidation(socket, gameId))) {
                    return;
                }
                checkIfAlreadyInActiveGame(socket)

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
                checkIfAlreadyInActiveGame(socket);

                socket.join(gameId);
                socket.currentRoom = gameId;
                console.log(`Server event: "player-joined" for socket: '${socket.id}' to gameId: ${gameId}`);
                socket.emit('player-joined-successfully', { message: `Player '${user.id}' joined game ${gameId} successfully` });
                io.to(gameId).emit('player-joined', { message: `Player with socketId: '${socket.id}' joined the game ${gameId}` });
            } catch (error) {
                console.error(`Error joining game for socket: ${socket.id}`, error);
                socket.emit('error', { message: 'Error joining game' });
            }
        });
        socket.on('disconnect', () => {
            checkIfAlreadyInActiveGame(socket);
            console.log('user with socketID: ' + socket.id + ' disconnected');
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

const checkIfAlreadyInActiveGame = (socket) => {
    if (socket.currentRoom) {
        const currentRoom = socket.currentRoom;
        socket.leave(socket.currentRoom);
        console.log(`Server event: "player-left" for socket: '${socket.id}' to gameId: ${socket.currentRoom}`);
        io.to(currentRoom).emit('player-left', { message: `Player with socketId: '${socket.id}' left the game ${currentRoom}` });
    }
}