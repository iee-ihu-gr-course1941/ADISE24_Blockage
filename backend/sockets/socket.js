const {
    retrieveGameById,
    updateGameStatus,
    addParticipant,
    removeParticipant,
    checkIfParticipantInTheGame,
    retrievePlacedTiles,
    retrieveParticipantsIds,
    retrieveParticipantsNameColorScoreByGameId
} = require('../models/gamesModel');
const { getUserSocket, removeUserSocketMap } = require('../sockets/socketioAuthMiddleware.js');
const {
    allocateTiles,
    placeTile,
    validateTilePlacement,
    constructBoard,
    gameTiles
} = require('../utils/tileUtils');

const roomRecreated = new Map(); // Map to track if a room has been recreated

module.exports = (io) => {
    io.on('connection', async (socket) => {
        const { user, gameID } = socket;
        console.log(`User ${user.id}  with socketID: '${socket.id}' connected`);
        console.info(`Number of current active sockets: ${io.sockets.sockets.size}`);
        // console.log(socket)

        try {
            // Check if room already exists

            const roomExists = io.sockets.adapter.rooms.has(gameID);
            console.log(`Room ${gameID} exists: ${roomExists}`);

            if (roomExists) {
                // player-join 

                // For websocket reconnection purposes
                // Check if player is already in the game
                if (await checkIfParticipantInTheGame(user.id, gameID)) {
                    // Check if player is already in the game with another socket


                    // console.log(getUserSocket(user.id));
                    // if (getUserSocket(user.id)) {
                    //     // If so disconnect the new socket and return
                    //     console.log('THERE ARE 2 SOCKETS FOR THE SAME USER');
                    //     socket.emit('error', { message: `Player '${user.playerName}' already in the game by other socket. You are disconnected by this one!` });
                    //     removeUserSocketMap(socket);
                    //     socket.disconnect();
                    //     return;
                    // }


                    // player is already in the game, rejoin
                    socket.join(gameID);
                    socket.currentRoom = gameID;
                    console.log(`Rejoined in game/room '${gameID}' socket: '${socket.id}'`);

                    io.to(gameID).emit('player-joined', { message: `Player '${user.playerName}' rejoined game '${gameID}' with socket '${socket.id}'` });
                    console.log(io.sockets.adapter.rooms);

                    // Check if game has started
                    const game = await retrieveGameById(gameID);
                    console.log(game);
                    if (game.status === 'started') {

                        const placedTiles = await retrievePlacedTiles(gameID);
                        
                        // console.log(placedTiles);
                        if (placedTiles.length !== 0) {
                            // Reload the game state (board, scores)

                            const { updatedScores, updatedBoard, nextPlayerTurnName } = await getLastGameState(socket, gameID);

                            //TODO
                            socket.emit('game-update', {
                                board: updatedBoard,
                                tiles: gameTiles[gameID],
                                scores: updatedScores,
                                nextPlayerTurnName: nextPlayerTurnName,
                            });
                            return;
                        }

                        // gia na exei 3ekinisei to game (diladi status='started') simainei oti to arxiko room exei gemisei sto max_number_of_players
                        // const participants = await retrieveParticipantsIds(gameID);
                        const participants = await retrieveParticipantsNameColorScoreByGameId(gameID);

                        const roomSockets = await io.in(gameID).fetchSockets();
                        const roomSocketsLength = roomSockets.length;
                        // console.log(roomSockets);
                        // console.log(roomSockets.length);

                        // Check if the room is full - That means all players have rejoined the room
                        if (roomSocketsLength === participants.length) {

                            // Allocate tiles to participants
                            allocateTiles(gameID, participants);

                            // Construct the empty board
                            const board = await constructBoard(gameID);

                            let nextPlayerTurnName = null;
                            for (let participant of participants) {
                                if (game.player_turn === participant.player_id) {
                                    nextPlayerTurnName = participant.player_name;
                                    break;
                                }
                            }

                            // Notify all participants that the game has started
                            io.to(gameID).emit('board-initialized', {
                                message: `Board for game '${gameID}' has initialized.`,
                                board: board,
                                tiles: gameTiles[gameID], // In-memory tiles for each player
                                nextPlayerTurnName: nextPlayerTurnName,
                            });

                            console.log(`Board game '${gameID}' initialized, participants notified and tiles allocated.`);
                        }

                    }

                } else {
                    // player is not already in the game, So add him/her, join
                    await addParticipant(gameID, user.id);

                    socket.join(gameID)
                    socket.currentRoom = gameID;
                    console.log(`Joined in room '${gameID}' socket: '${socket.id}'`);
                    io.to(gameID).emit('player-joined', { message: `Player '${user.playerName}' with socket ID '${socket.id}' joined game '${gameID}'` });

                    // !!!There is a trigger in the db that checks if max number of players is reached and changes the status of the game to 'started'

                    // Check if game has started
                    const game = await retrieveGameById(gameID);

                    if (game.status === 'started') {

                        const roomSockets = await io.in(gameID).fetchSockets();
                        // console.log(roomSockets);
                        // console.log('Sockets before emit "game-started" event from server:');

                        const participantIds = await retrieveParticipantsIds(gameID);
                        const participantIdsArray = participantIds.map(({ player_id }) => player_id);
                        // console.log(participantIds);
                        // console.log('Participant array: ', participantIdsArray);

                        let i = 0;
                        for (let playerSocket of roomSockets) {
                            console.log(`${i}: ${playerSocket.id}`);
                            console.log(playerSocket);

                            console.log(`socket mapping before: ${getUserSocket(participantIdsArray[i])} `);
                            removeUserSocketMap(playerSocket);
                            console.log(`socket mapping after: ${getUserSocket(participantIdsArray[i])} `);
                            i++;
                        }
                        io.to(gameID).emit('game-started', { message: `Game '${gameID}' has started.` });
                    }

                }

            } else {
                // create-game/room

                const game = await retrieveGameById(gameID);
                if (game.status === 'initialized') {
                    // create room for 1st time
                    socket.join(gameID)
                    socket.currentRoom = gameID;
                    console.log(`Created room '${gameID}' by socket: '${socket.id}'`);
                    socket.emit('game-created', { message: `Player '${user.playerName}' with socket ID '${socket.id}' created room '${gameID}'` });
                } else if (game.status === 'started') {
                    // Recreate the room ensuring only the creator of the game will recreate it
                    // When the game is started (in /game page)

                    if (game.created_by === user.id) {
                        // create room for 2nd time by the creator of the game

                        roomRecreated.set(gameID, true); // Set to true in order to allow the other sockets to join the room
                        socket.join(gameID)
                        socket.currentRoom = gameID;
                        console.log(`Recreated room '${gameID}' by socket: '${socket.id}'`);
                        socket.emit('game-created', { message: `Player '${user.playerName}' with socket ID '${socket.id}' created AGAIN the room '${gameID}'` });

                    } else if (!roomRecreated.get(gameID)) {
                        // The room has not already been recreated by the original creator

                        socket.emit('error', { message: 'Room has not been recreated by the original creator yet.', reason: 'room not recreated yet' });
                        socket.disconnect(true);
                        return;

                    }
                } else {
                    throw new Error(`Game with ID ${gameID} is not in status 'initialized' nor 'started', cannot create room for it`);
                }
            }
        } catch (error) {
            // Error handling and emitting error message to the socket
            console.error(`Error creating game for socket: ${socket.id}`, error);
            socket.emit('error', { error: error.message, message: `Error creating game or adding participant for player '${user.playerName}'` });
            removeUserSocketMap(socket);
            socket.disconnect();
        };
        socket.on('player-left', async () => {
            // Check if game exists & has status 'initialized' - Player can leave ONLY from a game with status 'initialized'
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

                            // console.log(roomSockets);
                            for (let playerSocket of roomSockets) {
                                removeUserSocketMap(socket);
                                socket.leave(socket.currentRoom);
                                console.log(`player with socket ID: '${socket.id}' left from game: ${socket.currentRoom}`);
                                socket.currentRoom = null;
                                playerSocket.disconnect();
                            }
                            // REMOVES ALL THE PARTICIPANTS OF THE GAME AND GAME BECAUSE THIS PLAYER IS THE CREATOR! 
                            // CAUSED BY: (stored procedure CONSTRAINT: deletes every participant of the same game and the game itself)
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
        // socket.on('ping', () => socket.emit('pong', { message: 'Pong received' }));
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

                const { updatedScores, updatedBoard, nextPlayerTurnName } = await getLastGameState(socket, gameID);

                io.to(gameID).emit('game-update', {
                    message: "Tile placed successfully",
                    board: updatedBoard,
                    tiles: gameTiles[gameID],
                    scores: updatedScores,
                    nextPlayerTurnName: nextPlayerTurnName,
                });
                console.log(`Move broadcasted: Player ${user.id} named ${nextPlayerTurnName} placed tile ${tileId} in game ${gameID}`);

                // Get the updated scores
                // const updatedScores = await retrievePlayerScores(gameID);
                const game = await retrieveGameById(gameID);

                if (game.status === 'ended') {
                    const updatedParticipants = await retrieveParticipantsNameColorScoreByGameId(gameID);

                    const updatedScores = updatedParticipants.map(({ player_name, color, score }) => ({ player_name, color, score }));
                    console.log(updatedScores);

                    // Broadcast the unified event to all players in the game room
                    const updatedBoard = await constructBoard(gameID);

                    // Find the highest score
                    const highestScore = Math.max(...updatedScores.map(player => player.score));
                    console.log(highestScore);
                    // Find the winner(s)
                    const winners = updatedScores.filter(player => player.score === highestScore);
                    console.log(winners) // prepei na epistrefei ton player

                    io.to(gameID).emit('game-ended', {
                        message: `Game ${gameID} has ended.`,
                        board: updatedBoard,
                        tiles: gameTiles[gameID],
                        scores: updatedScores,
                        winner: winners
                    });

                    // Disconnect all sockets in the game room after 10 seconds
                    setTimeout(() => {
                        const sockets = io.sockets.adapter.rooms.get(gameID);
                        if (sockets) {
                            for (const socketId of sockets) {
                                const socket = io.sockets.sockets.get(socketId);
                                if (socket) {
                                    socket.disconnect(true);
                                }
                            }
                        }
                        console.log(`All participants of game ${gameID} have been disconnected.`);
                    }, 10000);
                    return;
                }

            } catch (error) {
                console.error('Error handling tile placement:', error.message);
                socket.emit('error', { message: 'Tile placement failed', error: error.message });
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

        // Check if provided by client event name is valid
        // Return error message to socket
        // For Development purposes!
        const validEvents = ['place-tile', 'player-left', 'game-ended', 'game-started', 'disconnect'];
        socket.onAny((event, ...args) => {
            if ((validEvents.includes(event)))
                return;
            console.log(`Event: ${event}, args: ${args}`);
            socket.emit('error', { message: 'Invalid event name' });
        });
    });
}


// Check if socket is already in a room
const checkIfAlreadyInActiveRoom = async (socket) => {
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

const getLastGameState = async (socket, gameID) => {
    try {
        const updatedParticipants = await retrieveParticipantsNameColorScoreByGameId(gameID);
        console.log(updatedParticipants);

        // Determine the next player's turn
        const updatedGame = await retrieveGameById(gameID);
        console.log(updatedGame);

        // Get the updated participants' scores
        const updatedScores = updatedParticipants.map(({ player_name, color, score }) => ({ player_name, color, score }));
        console.log(updatedScores);

        let nextPlayerTurnName = null;
        for (let updatedParticipant of updatedParticipants) {
            if (updatedGame.player_turn === updatedParticipant.player_id) {
                nextPlayerTurnName = updatedParticipant.player_name;
                break;
            }
        }
        console.log("nextPlayerTurnName: " + nextPlayerTurnName);

        if (!nextPlayerTurnName) {
            socket.emit('error', { message: 'Next Player color is not assigned. Next player turn failure', error: error.message });
        }

        // Broadcast the unified event to all players in the game room
        const updatedBoard = await constructBoard(gameID);

        return { updatedScores, updatedBoard, nextPlayerTurnName };

    } catch (error) {
        console.error('Error handling tile placement:', error.message);
        socket.emit('error', { message: 'Tile placement failed', error: error.message });
    }
}
