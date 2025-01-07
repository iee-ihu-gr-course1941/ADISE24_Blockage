const {
    createNewGame,
    retrieveGames,
    retrieveGameById,
    gameExists,
    updateGameStatus,
    addParticipant,
    removeParticipant,
    checkIfParticipantInTheGame,
    retrievePlacedTiles,
    retrieveParticipantsIds,
    retrievePlayerColors,
    retrievePlayerScores
} = require('../models/gamesModel');
const { getUserSocket, removeUserSocketMap } = require('../sockets/socketioAuthMiddleware.js');
const {
    rotateTile,
    mirrorTile,
    normalizeCoordinates,
    visualizeTile,
    getTileById,
    allocateTiles,
    placeTile,
    reloadGameState,
    initializeBoard,
    validateTilePlacement,
    visualizeBoard,
    constructBoard,
    generateTileTransformations,
    checkNoRemainingMoves,
    tiles,
    gameTiles
} = require('../utils/tileUtils');

module.exports = (io) => {
    io.on('connection', async (socket) => {
        const { user, gameID } = socket;
        console.log(`User ${user.id}  with socketID: '${socket.id}' connected`);
        console.info(`Number of current active sockets: ${io.sockets.sockets.size}`);
        try {
            // Check if room already exists
            // console.log(io.sockets.adapter.rooms);
            const roomExists = io.sockets.adapter.rooms.has(gameID);
            console.log(`Room ${gameID} exists: ${roomExists}`);
            if (roomExists) {
                // player-join 

                // For websocket reconnection purposes
                // Check if player is already in the game
                if (await checkIfParticipantInTheGame(user.id, gameID)) {
                    // Check if player is already in the game with another socket
                    if (getUserSocket(user.id)) {
                        // If so disconnect the new socket and return
                        console.log('THERE ARE 2 SOCKETS FOR THE SAME USER');
                        socket.emit('error', { message: `Player '${user.playerName}' already in the game by other socket. You are disconnected by this one!` });
                        removeUserSocketMap(socket);
                        socket.disconnect();
                        return;
                    }
                    // player is already in the game, rejoin
                    socket.join(gameID);
                    socket.currentRoom = gameID;
                    console.log(`Rejoined in game/room '${gameID}' socket: '${socket.id}'`);
                    io.to(gameID).emit('player-joined', { message: `Player '${user.playerName}' rejoined game '${gameID}' with socket '${socket.id}'` });
                    console.log(io.sockets.adapter.rooms);
                    return;
                }
                // player is not already in the game, So add him/her, join
                await addParticipant(gameID, user.id);
                socket.join(gameID)
                socket.currentRoom = gameID;
                console.log(`Joined in game/room '${gameID}' socket: '${socket.id}'`);
                io.to(gameID).emit('player-joined', { message: `Player '${user.playerName}' with socket ID '${socket.id}' joined game '${gameID}'` });

                const game = await retrieveGameById(gameID);

                if (game.status === 'started') {

                    const participants = await retrieveParticipantsIds(gameID);

                    // Allocate tiles to participants
                    allocateTiles(gameID, participants);

                    // Construct the empty board
                    const board = await constructBoard(gameID);

                    // Notify all participants that the game has started
                    io.to(gameID).emit('game-started', {
                        message: `Game '${gameID}' has started.`,
                        board: board,
                        tiles: gameTiles[gameID], // In-memory tiles for each player
                        turn: game.player_turn,
                    });

                    console.log(`Game '${gameID}' started, participants notified and tiles allocated.`);
                }


            } else {
                // create-game
                const game = await retrieveGameById(gameID);
                if (game.status !== 'initialized') {
                    throw new Error(`Game with ID ${gameID} is not in status 'initialized', cannot create room for it`);
                }
                socket.join(gameID)
                socket.currentRoom = gameID;
                console.log(`Created game/room '${gameID}' by socket: '${socket.id}'`);
                socket.emit('game-created', { message: `Player '${user.playerName}' with socket ID '${socket.id}' created game '${gameID}'` });
            }
        } catch (error) {
            console.error(`Error creating game for socket: ${socket.id}`, error);
            socket.emit('error', { error: error.message, message: `Error creating game or adding participant for player '${user.playerName}'` });
            removeUserSocketMap(socket);
            socket.disconnect();
        }
        socket.on('player-left', async () => {
            // Check if game exists & has status 'initialized'
            try {
                const game = await retrieveGameById(gameID);
                if (game.game_id && game.status === 'initialized') {
                    // Check if player is in the room
                    if (checkIfAlreadyInActiveRoom(socket)) {
                        // Remove player's db record from the game

                        // Check if player is creator
                        if (game.status = 'initialized' && game.created_by === user.id) {
                            // Remove participants of the game and the game itself
                            socket.to(gameID).emit('game-deleted', { message: `Game '${game.game_id}' deleted by its creator '${user.playerName}'` });
                            const roomSockets = await io.in(gameID).fetchSockets();
                            // afinei teleytaio to room socket toy leader na diagrafei
                            // console.log(roomSockets.reverse());
                            console.log(roomSockets);
                            for (let playerSocket of roomSockets) {
                                // removePlayerFromRoom(playerSocket, io);
                                const currentRoom = socket.currentRoom;
                                removeUserSocketMap(socket);
                                socket.leave(socket.currentRoom);
                                console.log(`player with socket ID: '${socket.id}' left from game: ${socket.currentRoom}`);
                                socket.currentRoom = null;
                                playerSocket.disconnect();
                            }
                            // // REMOVES ALL THE PARTICIPANTS OF THE GAME AND GAME BECAUSE THIS PLAYER IS THE CREATOR! 
                            // // CAUSED BY: (stored procedure CONSTRAINT: deletes every participant of the same game and the game itself)
                            await removeParticipant(user.id);
                            return;
                        }
                        // Remove participant from the game
                        await removeParticipant(user.id);
                        // Remove player from the room and then disconnect his/her socket
                        removePlayerFromRoom(socket, io);
                        socket.disconnect();

                    } else {
                        socket.emit('error', { message: 'Error leaving game, you are not in an active room' });
                    }
                } else {
                    socket.emit('error', { message: `Error leaving game, game does not exist or is not in status 'initialized'` });
                }
            } catch (error) {
                console.error(`Error leaving game for socket: ${socket.id}`, error);
                socket.emit('error', { error: error.message, message: 'Error leaving game' });
            }
        });
        socket.on('game-ended', async ({ status }) => {
            try {
                if (!status) {
                    return socket.emit('error', { message: 'status data field is required' });
                }
                await updateGameStatus(gameID, status);
                io.of('/').in(gameID).disconnectSockets();
            } catch (error) {
                console.error(`Error ending game for socket: ${socket.id}`, error);
                socket.emit('error', { error: error.message, message: 'Error ending game' });
            }
        });
        socket.on('disconnect', () => {
            // Check if player belongs in the room
            if (checkIfAlreadyInActiveRoom(socket)) {
                // Remove player from the room
                removePlayerFromRoom(socket, io);
                console.log('player with socket: ' + socket.id + ' disconnected');
                console.info(`Number of current active sockets: ${io.sockets.sockets.size}`);
            }
        });

        socket.on('place-tile', async ({ tileId, anchorX, anchorY, mirror, rotate }) => {
            try {

                // Construct the board state
                const board = await constructBoard(gameID);

                // Validate tile placement
                const validationResult = await validateTilePlacement(
                    board,
                    gameID,
                    user.id,
                    tileId,
                    anchorX,
                    anchorY,
                    mirror,
                    rotate
                );
                if (!validationResult.valid) {
                    socket.emit('error', { message: validationResult.reason });
                    return;
                }

                // Place the tile
                await placeTile(gameID, user.id, tileId, anchorX, anchorY, mirror, rotate);

                // Update the scores
                const updatedScores = await retrievePlayerScores(gameID);

                // Determine the next player's turn
                const updatedGame = await retrieveGameById(gameID);

                // Broadcast the unified event to all players in the game room
                const updatedBoard = await constructBoard(gameID);

                io.to(gameID).emit('game-update', {
                    board: updatedBoard,
                    scores: updatedScores,
                    nextPlayerTurn: updatedGame.player_turn,
                });

                console.log(`Move broadcasted: Player ${user.id} placed tile ${tileId} in game ${gameID}`);
            } catch (error) {
                console.error('Error handling tile placement:', error.message);
                socket.emit('error', { message: 'Tile placement failed', error: error.message });
            }
        });

        // Check if provided by client event name is valid
        // Return error message to socket
        // For Development purposes!
        const validEvents = ['place-tile', 'player-left', 'game-ended', 'disconnect'];
        socket.onAny((event, ...args) => {
            if ((validEvents.includes(event)))
                return;
            console.log(`Event: ${event}, args: ${args}`);
            socket.emit('error', { message: 'Invalid event name' });
        });
    });
}


// Check if socket is already in a room
const checkIfAlreadyInActiveRoom = (socket) => {
    return socket.currentRoom ? true : false;
}

// Remove the passed socket from the current room and emit 'player-left' event to the room
const removePlayerFromRoom = (socket, io) => {
    const currentRoom = socket.currentRoom;
    removeUserSocketMap(socket);
    socket.leave(socket.currentRoom);
    console.log(`player with socket ID: '${socket.id}' left from game: ${socket.currentRoom}`);
    socket.currentRoom = null;
    io.to(currentRoom).emit('player-left', { message: `Player with socket ID: '${socket.id}' and name: '${socket.user.playerName}' left the game '${currentRoom}'` });
}