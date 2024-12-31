const {
    createNewGame,
    addParticipant,
    fetchGames,
    retrieveGameById,
    gameExists,
    removeParticipant
} = require('../models/gamesModel');
const { getUserSocket } = require('../sockets/socketioAuthMiddleware.js');

// Create a new game
const createGame = async (req, res) => {
    const { user } = req; // Decoded from JWT
    const { max_number_of_players } = req.body;

    if (!max_number_of_players || !['2', '4'].includes(max_number_of_players)) {
        return res.status(400).json({ error: 'Invalid number of players. Only \'2\' or \'4\' are allowed', message: 'Data field: \'max_number_of_players\' is required' });
    }

    try {
        const io = req.app.get('io');
        console.log(io);
        // console.log(`Active sockets: ${io.sockets.sockets.size}`);
        const socketId = getUserSocket(user.id)
        if (socketId) {
            console.log(socketId);
            return res.status(400).json({ error: 'You have already a socket' });
        }

        const gameId = await createNewGame(user.id, max_number_of_players);
        res.status(201).json({ message: 'Game created', gameId });
    } catch (error) {
        // console.error('Error creating game:', error);
        if (error.sqlState === '45000') {
            return res.status(400).json({ error: error.message, message: 'sqlState: 45000 error on creating game.' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Join an existing game
const joinGame = async (req, res) => {
    const { user } = req; // Decoded from JWT
    const { gameId } = req.body;

    if (!gameId) {
        return res.status(400).json({ error: 'gameId data field is required' });
    }

    try {
        await addParticipant(gameId, user.id);
        res.status(200).json({ message: 'Joined game' });
    } catch (error) {
        if (error.sqlState === '45000') {
            return res.status(400).json({ error: error.message });
        }
        console.error('Error joining game:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Leave a game
const leaveGame = async (req, res) => {
    const { user } = req; // Decoded from JWT
    // const { gameId } = req.params;
    try {
        await removeParticipant(user.id);
        res.status(200).json({ message: 'Player left game' });
    } catch (error) {
        console.error('Error leaving game:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// List all games
const listGames = async (req, res) => {
    try {
        const games = await fetchGames();
        res.status(200).json({ games });
    } catch (error) {
        console.error('Error fetching games:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Retrieve a game by id
const retrieveGame = async (req, res) => {
    const { gameId } = req.params;
    try {
        if (!gameId || isNaN(gameId)) {
            return res.status(400).json({ error: 'gameId numeric as parameter is required' });
        }
        if (!await gameExists(gameId)) {
            throw new Error(`There is no game with id ${gameId}`);
        }
        const game = await retrieveGameById(gameId);
        res.status(200).json({ game });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

module.exports = {
    createGame,
    joinGame,
    leaveGame,
    listGames,
    retrieveGame
};