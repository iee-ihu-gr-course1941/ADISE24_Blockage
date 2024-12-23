const { createNewGame, addParticipant, fetchGames, markParticipantReady } = require('../models/gamesModel');

// Create a new game
const createGame = async (req, res) => {
    const { user } = req; // Decoded from JWT
    const { max_number_of_players } = req.body;

    if (!max_number_of_players || !['2', '4'].includes(max_number_of_players)) {
        return res.status(400).json({ error: 'Invalid number of players' });
    }

    try {
        const gameId = await createNewGame(user.id, max_number_of_players);
        res.status(201).json({ message: 'Game created', gameId });
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

// Set participant as ready
const setPlayerReady = async (req, res) => {
    const { user } = req;
    const { gameId } = req.params;

    try {
        await markParticipantReady(gameId, user.id);
        res.status(200).json({ message: 'Player marked as ready' });
    } catch (error) {
        console.error('Error marking player ready:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { createGame, joinGame, listGames, setPlayerReady };
