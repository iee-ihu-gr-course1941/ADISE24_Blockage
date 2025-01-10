// import { io } from "socket.io-client";
import { io } from "https://cdn.socket.io/4.8.1/socket.io.esm.min.js";
import { BASE_URL_API } from '../../config.js';
import { fillBoard, renderAllTiles, updateCurrentTurn, updateScores } from '../components/game.js';

let socket = null;
let board = null;
let currentTurn = null;
let remainingTiles = {};

// Initialization of Socket.IO Client (WebSocket) connection
const initializeSocket = async (gameId) => {

    if (socket && socket.connected) {
        console.warn('Socket is already connected.');
        return;
    }
    // Socket.IO Client connection
    socket = io(`${BASE_URL_API}`, {
        reconnectionAttempts: 5,
        reconnectionDelayMax: 10000,
        auth: { token: `Bearer ${sessionStorage.getItem('authToken')}` },
        query: { gameId }
    });

    // Listen for connection success
    socket.on('connect', async () => {
        console.log('Connected to Socket.IO server with ID:', socket.id);
        console.log(socket);
        // Listen for events
        listenEvent('player-joined', async (data) => {
            console.log('Player joined again:', data);
        });
        listenEvent('game-created', async (data) => {
            console.log('Player created game again:', data);
        });
        listenEvent('board-initialized', async (data) => {
            console.log('Board Initialized!!!:', data);
            const { board: newBoard, tiles, nextPlayerTurnName } = data;
            // console.log('Tiles:', tiles);
            // console.log('Players:', players);
            // console.log('Current Player:', currentPlayer);
            console.log("tiles");
            console.log(tiles);

            // Update the board state
            board = newBoard;
            remainingTiles = tiles;
            await renderAllTiles(gameId, remainingTiles);

            currentTurn = nextPlayerTurnName;
            updateCurrentTurn(currentTurn);

        });
        listenEvent('game-update', async (data) => {
            console.log('Game Updated!!:', data.message ? data.message : data);

            let { board: updatedBoard, tiles, nextPlayerTurnName, scores} = data;
            // console.log('Updated Board:', updatedBoard);
            // console.log('Tiles:', tiles);
            // console.log('Next Player Turn Name:', nextPlayerTurnName);
            // console.log('Updated Players With Scores:', scores);
            board = updatedBoard;
            fillBoard(board);
            remainingTiles = tiles;
            await renderAllTiles(gameId, remainingTiles);
            updateScores(scores);
            updateCurrentTurn(nextPlayerTurnName);

        });
        listenEvent('place-tile', async (data) => {

        });
        listenEvent('game-ended', async (data) => {

        });
        listenEvent('error', async ({ message, reason }) => {
            console.error('Socket error:', message);

            if (reason == 'room not recreated yet') {
                // IF THIS DOESNT SUCCESS THEN JUST RELOAD THE PAGE
                // Try to reconnect again
                socket.connect();
            }
        });

    });

    // Listen for connection failure
    socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
    });

    // Listen for disconnection
    socket.on('disconnect', () => {
        console.log('Socket disconnected with ID:', socket.id);
    });
}

// Emit an event to the server
const emitEvent = async (eventName, data) => {
    if (!socket || !socket.connected) {
        console.error('Cannot emit event. Socket is not connected.');
        throw new Error('Socket is not connected.');
    }
    socket.emit(eventName, data);
}

// Listen an event from the server
const listenEvent = async (eventName, callback) => {
    if (!socket) {
        console.error('Cannot listen for event. Socket is not initialized.');
        return;
    }

    socket.on(eventName, callback);
}

const getBoard = () => {
    return board;
}

const getCurrentTurn = () => {
    return currentTurn;
}

const getRemainingTiles = () => {
    return remainingTiles;
}

const socketGameAPI = {
    initializeSocket,
    emitEvent,
    listenEvent,
    getBoard,
    getCurrentTurn,
    getRemainingTiles
};

export default socketGameAPI;
