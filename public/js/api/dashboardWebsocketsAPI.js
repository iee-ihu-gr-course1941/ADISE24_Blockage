// import { io } from "socket.io-client";
import { io } from "https://cdn.socket.io/4.8.1/socket.io.esm.min.js";
import { BASE_URL_API } from '../../config.js';
import { showLobbyCard, hideLobbyCard, disableLobbyCard } from '../components/dashboard/lobby.js';

let socket = null;

// Initialization of Socket.IO Client (WebSocket) connection
const initializeSocket = async (gameId) => {

    if (socket && socket.connected) {
        console.warn('Socket is already connected.');
        return;
    }
    // Socket.IO Client connection
    socket = io(`${BASE_URL_API}`, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 10000,
        reconnectionAttempts: 5,
        auth: { token: `Bearer ${sessionStorage.getItem('authToken')}` },
        query: { gameId }
    });

    // Listen for connection success
    socket.on('connect', async () => {
        console.log('Connected to Socket.IO server with ID:', socket.id);

        // Listen for events
        listenEvent('player-joined', async (data) => {
            console.log('Player joined:', data);
            // Update the UI to show the player joined
            await showLobbyCard(gameId);
        });
        listenEvent('player-left', async (data) => {
            console.log(data.message);
            // Update the UI to show the refreshed lobby
            await showLobbyCard(gameId);
        });
        listenEvent('game-started', async (data) => {
            console.log(data.message);
            // save gameID in sessionStorage & Redirect to the game page
            sessionStorage.setItem('gameId', gameId);
            window.location.href = `/game`;

        });
        listenEvent('game-deleted', async (data) => {
            console.log(data);
            // Update the UI to hide the deleted game and refresh the page
            hideLobbyCard();
            alert('The room you were in, has been deleted.');
            location.reload();
        });
        listenEvent('game-created', async (data) => {
            console.log(data.message);
            // console.log(data.room);
            // Update the UI to show the game created (& player joined in the room)
            await showLobbyCard(gameId);
        });
        listenEvent('error', (error) => {
            console.error('Socket error:', error.message);
            // if (error.reason === 'room not recreated yet') {
            //     socket.connect();
            // }
        });
    });

    // Listen for connection failure
    socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message);
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
        return;
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

const socketClientAPI = {
    initializeSocket,
    emitEvent,
    listenEvent
};

export default socketClientAPI;
