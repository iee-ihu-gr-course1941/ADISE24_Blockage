const db = require('../config/db');

// Create a new game and add the creator as a participant
const createNewGame = async (createdBy, maxPlayers) => {
    try {
        const [results] = await db.query('CALL CreateGameAndJoin(?,?,@gameId); SELECT @gameId AS gameId;', [createdBy, maxPlayers]);
        // Extract the gameId from the second result set (the SELECT @gameId query)
        const gameId = results[1][0].gameId;
        return gameId;
    } catch (err) {
        if (err.sqlState === '45000') {
            const error = new Error(err.message);
            error.sqlState = err.sqlState;
            throw error;
        }
        const error = new Error(err.message);
        throw error;
    }
}

// Add a participant to a game
// Return a participant object
const addParticipant = async (gameId, playerId) => {
    try {
        const query = `
            CALL JoinGame(?, ?)
        `;
        const [result] = await db.query(query, [gameId, playerId]);
        return result[0];
    } catch (err) {
        const error = new Error('Error adding participant');
        throw error;
    }
};

// Remove a participant from a game
const removeParticipant = (playerId) => {
    return new Promise((resolve, reject) => {
        const query = `
            CALL RemoveParticipant(?)
        `;
        db.query(query, [playerId], (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
};

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
            SELECT 1 FROM games WHERE game_id = ?
        `;
        const [result] = await db.query(query, [gameId]);
        // console.log(result);
        // console.log(result.length);
        return result.length > 0;
    } catch (err) {
        console.error('Error retrieving game with ID:', err);
    }
}

// Update game status
// Return nothing
// IT SUPPORTS ONLY 'ENDED' OR 'ABORTED' STATUS GIVEN BY CLIENT
const updateGameStatus = async (gameId, status) => {
    try {
        await db.query('CALL updateGameStatus(?, ?)', [gameId, status]);
        return;
    } catch (err) {
        // if (err.sqlState === '45000') 
        const error = new Error(err.message);
        throw error;
    }
}

module.exports = {
    createNewGame,
    addParticipant,
    fetchGames,
    retrieveGameById,
    updateGameStatus,
    gameExists,
    removeParticipant
};
