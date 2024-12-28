const {
    createNewGame,
    addParticipant,
    fetchGames,
    retrieveGameById,
    gameExists,
    checkIfPlayerHasActiveGame
} = require('../models/gamesModel');

// Create a new game
const createGame = async (req, res) => {
    const { user } = req; // Decoded from JWT
    const { max_number_of_players } = req.body;

    if (!max_number_of_players || !['2', '4'].includes(max_number_of_players)) {
        return res.status(400).json({ error: 'Invalid number of players. Only \'2\' or \'4\' are allowed' });
    }

    try {
        const isPlayerInActiveGame = await checkIfPlayerHasActiveGame(user.id);
        if (isPlayerInActiveGame) {
            return res.status(400).json({ error: `Player with id: \'${user.id}\' already has an active game` })
        }

        const gameId = await createNewGame(user.id, max_number_of_players);
        res.status(201).json({ message: 'Game created', gameId });

        // const io = req.app.get('io');
        // const socket = io.sockets.sockets.get(user.id);
        // console.log(io);
        // console.log(socket);
        // socket.join(gameId);
        // io.to(user.id).emit('game-created', { message: `Game with id ${gameId} created successfully` });

    } catch (error) {
        console.error('Error creating game:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Join an existing game
const joinGame = async (req, res) => {
    const { user } = req; // Decoded from JWT
    const { gameId, color } = req.body;

    if (!gameId || !color) {
        return res.status(400).json({ error: 'Game ID and color are required' });
    }

    try {
        await addParticipant(gameId, user.id, color);
        res.status(200).json({ message: 'Joined game' });
    } catch (error) {
        console.error('Error joining game:', error);
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

const retrieveGame = async (req, res) => {
    const { gameId } = req.params;
    try {
        if (!gameExists(gameId))
            throw new Error(`There is no game with id ${gameId}`);
        const game = await retrieveGameById(gameId);
        res.status(200).json({ game });
    } catch (err) {
        res.status(400).json(err.message);
    }
}

module.exports = {
    createGame,
    joinGame,
    listGames,
    retrieveGame
};
