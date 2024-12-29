const {
    createNewGame,
    addParticipant,
    fetchGames,
    retrieveGameById,
    gameExists,
    checkIfPlayerHasActiveGame
} = require('../models/gamesModel');
const { getUserSocket } = require('../sockets/socketioAuthMiddleware.js');

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
            return res.status(400).json({ error: `You already have an active game` })
        }

        // ... socketio here

        const gameId = await createNewGame(user.id, max_number_of_players);
        console.log(`New game added: gameId: ${gameId}`);

        // -> This will be needed after the merge/ stored procedure
        if (!(['blue', 'red', 'green', 'magenta'].includes(color))) {
            return res.status(400).json({ error: `The provided color '${color}' is not allowed. Please choose one of the following: 'blue','red','green','magenta'` });
        }

        // -> The 'red' color hardcoded will be replaced by the specified from stored procedure
        const participant = await addParticipant(gameId, user.id, 'red');
        console.log(`New participant added: gameId: ${participant}`);
        res.status(200).json({ message: `Game and participant added`, gameId });
    } catch (error) {
        console.error('Error creating game or creating a leader participant :', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Join an existing game
const joinGame = async (req, res) => {
    const { user } = req; // Decoded from JWT
    const { gameId, color } = req.body;
    try {
        if (!gameId || !color) {
            return res.status(400).json({ error: 'Game ID and color are required' });
        }
        if (!await gameExists(gameId)) {
            return res.status(400).json({error: `There is no game with id ${gameId}`});
        }
        if(await checkIfPlayerHasActiveGame(user.id)){
            return res.status(400).json({ error: `You already has an active game` })
        }
        if(!(['blue','red','green','magenta'].includes(color))){
            return res.status(400).json({error: `The provided color '${color}' is not allowed. Please choose one of the following: 'blue','red','green','magenta'`});
        }

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
        if (!gameId || isNaN(gameId)) {
            return res.status(400).json({ error: 'Game ID numeric as parameter is required' });
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
    listGames,
    retrieveGame
};
