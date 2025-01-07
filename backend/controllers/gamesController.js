const {
    createNewGame,
    addParticipant,
    fetchGames,
    fetchGamesByStatus,
    retrieveGameById,
    retrieveParticipantsByGameId,
    retrieveParticipantsOfGamesByStatus,
    gameExists,
    removeParticipant
} = require('../models/gamesModel');

// Create a new game
const createGame = async (req, res) => {
    const { user } = req; // Decoded from JWT
    const { max_number_of_players } = req.body;

    if (!max_number_of_players || !['2', '4'].includes(max_number_of_players)) {
        return res.status(400).json({ message: `Invalid number of players. Only '2' or '4' are allowed`, error: `Data field: 'max_number_of_players' is required` });
    }

    try {
        const gameId = await createNewGame(user.id, max_number_of_players);
        res.status(201).json({ message: 'Game created', gameId });
    } catch (error) {
        if (error.sqlState === '45000') {
            return res.status(400).json({ error: 'sqlState: 45000 error on creating game.', message: error.message });
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

const listGamesByStatus = async (req, res) => {
    const { status } = req.query;
    let arrayStatus = null;
    try {
        if (!status) {
            return res.status(400).json({ error: 'status query field is required' });
        }
        if (status !== 'initialized' && status !== 'started') {
            if (status === "initialized-started") {
                arrayStatus = status.split('-');
            } else {
                return res.status(400).json({ error: `Invalid status. Only 'initialized' or 'started' or 'initialized-started' are allowed` });
            }
        }
        const games = await fetchGamesByStatus(arrayStatus ? arrayStatus : status);
        res.status(200).json({ games });
    } catch (error) {
        console.error('Error fetching games:', error);
        res.status(400).json({ message: error.message });
    }
};

// Retrieve a game by id
const retrieveGame = async (req, res) => {
    console.log("retrieveGame");
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

// Retrieve all participants by game id
const retrieveParticipants = async (req, res) => {
    const { gameId } = req.params;
    try {
        if (!gameId || isNaN(gameId)) {
            return res.status(400).json({ error: 'gameId numeric as parameter is required' });
        }
        if (!await gameExists(gameId)) {
            throw new Error(`There is no game with id ${gameId}`);
        }
        const participants = await retrieveParticipantsByGameId(gameId);
        res.status(200).json({ participants });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

// Retrieve all participants of games by status ('started' or 'initialized' or both)
const retrieveParticipantsByStatus = async (req, res) => {
    const { status } = req.query;
    console.log(status);
    let arrayStatus = null;
    try {
        if (!status) {
            return res.status(400).json({ error: 'status query field is required' });
        }
        if (status !== 'initialized' && status !== 'started') {
            if (status === "initialized-started") {
                arrayStatus = status.split('-');
                // console.log(arrayStatus);
            } else {
                return res.status(400).json({ error: `Invalid status. Only 'initialized' or 'started' or 'initialized-started' are allowed` });
            }
        }
        let participants = await retrieveParticipantsOfGamesByStatus(arrayStatus ? arrayStatus : status);
        res.status(200).json({ participants });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

module.exports = {
    createGame,
    joinGame,
    leaveGame,
    listGames,
    listGamesByStatus,
    retrieveGame,
    retrieveParticipants,
    retrieveParticipantsByStatus
};