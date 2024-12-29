const db = require('../config/db');

//Create a new game
// Return the brandnew game id 
const createNewGame = async (createdBy, maxPlayers) => {
    try {
        const query = ` 
            INSERT INTO games (created_by, max_number_of_players)
            VALUES (?, ?)
        `;
        const [result] = await db.query(query, [createdBy, maxPlayers]);
        return result.insertId;
    } catch (err) {
        const error = new Error('Error creating game');
        throw error;
    }
}

// Add a participant to a game
// Return a participant object
const addParticipant = async (gameId, playerId, color) => {
    try {
        const query = `
            INSERT INTO participants (game_id, player_id, color)
            VALUES (?, ?, ?)
        `;
        const [result] = await db.query(query, [gameId, playerId, color]);
        return result[0];
    } catch (err) {
        const error = new Error('Error adding participant');
        throw error;
    }
}

// Fetch all games
// Return a list of games objects

// FIX THIS QUERY -- There must be a fetchGames to retrieve only games with status 'intiatialized' or 'started'
const fetchGames = async () => {
    try {
        const query = `
            SELECT g.game_id, g.created_by, g.status, g.max_number_of_players, COUNT(p.player_id) AS current_players
            FROM games g
            LEFT JOIN participants p ON g.game_id = p.game_id
            GROUP BY g.game_id
        `;
        const [results] = await db.query(query);
        return results;
    } catch (err) {
        const error = new Error('Error retrieving games');
        throw error;
    }
};

// Retrieve game by id
// Return the game object
const retrieveGameById = async (gameId) => {
    try {
        const query = `
            SELECT * FROM games WHERE game_id = ?
        `;
        const [result] = await db.query(query, [gameId]);
        // console.log(result);
        // console.log(result[0]['game_id']);
        return result[0];
    } catch (err) {
        console.error('Error retrieving game with ID:', err);
    }
}

// Check if game exists
// Return true if game exists, false otherwise
const gameExists = async (gameId) => {
    try {
        const query = `
            SELECT * FROM games WHERE game_id = ?
        `;
        const [result] = await db.query(query, [gameId]);
        // console.log(result);
        // console.log(result.length);
        return result.length > 0;
    } catch (err) {
        console.error('Error retrieving game with ID:', err);
    }
}

// Check if player has active game where game status 'initialized' or 'started'
// Return true if player has active game, false otherwise
const checkIfPlayerHasActiveGame = async (playerId) => {
    try {
        const query = `
            SELECT COUNT(*) AS active_games
            FROM games G
            LEFT JOIN participants P ON G.game_id = P.game_id
            WHERE (G.created_by = ? OR P.player_id = ?)
            AND (G.status = 'not_active' OR G.status = 'initialized' OR G.status = 'started')
        `;
        const [results] = await db.query(query, [playerId, playerId]);
        return results[0].active_games > 0;
    } catch (error) {
        console.error('Error checking if player has active game:', error);
        // throw error;
    }
}

module.exports = {
    createNewGame,
    addParticipant,
    fetchGames,
    retrieveGameById,
    gameExists,
    checkIfPlayerHasActiveGame
};