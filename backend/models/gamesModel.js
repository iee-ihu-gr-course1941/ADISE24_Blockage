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
        throw new Error(err.message);
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
        throw new Error(err.message);
    }
};

// Check if a participant has an active game
// Return true if partcipant is in the game, false otherwise
const checkIfParticipantInTheGame = async (playerId, gameId) => {
    try {
        const query = `
            SELECT  p.player_id, g.game_id, g.status
            FROM games g INNER JOIN
            participants p on (g.game_id=p.game_id)
            WHERE p.player_id = ? AND p.game_id = ?
            AND g.status IN ('initialized', 'started');
        `;
        const [results] = await db.query(query, [playerId, gameId]);
        // console.log(results);
        return results.length > 0;
    } catch (err) {
        throw new Error(err.message);
    }
};

// Remove a participant from a game
const removeParticipant = async (playerId) => {
    try {
        const query = `
            CALL RemoveParticipant(?)
        `;
        const [results] = await db.query(query, [playerId]);
        return results;
    } catch (err) {
        throw new Error(err.message);
    }
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
        throw new Error('Error retrieving games');
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
        // console.error('Error retrieving game with ID:', err);
        throw new Error(err.message);
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
        // console.error('Error retrieving game with ID:', err);
        throw new Error(err.message);
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
        throw new Error(err.message);
    }
}


const fetchPlacedTiles = async (gameId) => {
    try {
        const [results] = await db.query('SELECT * FROM placed_tiles WHERE game_id = ?', [gameId]);
        return results;
    } catch (err) {
        const error = new Error('Failed to fetch game data');
        throw error;
    }
}

const fetchParticipants = async (gameId) =>{
    try {
        const [results] = await db.query(
            'SELECT player_id FROM participants WHERE game_id = ?',
            [gameId]
        );
        return results;
    } catch (err) {
        throw new Error('Failed to fetch participants');
    }
}

const fetchPlayerColors = async (gameId) =>{
    try {
        const [results] = await db.query(
            'SELECT player_id, color FROM participants WHERE game_id = ?',
            [gameId]
        );
        const playerColors = {};
        results.forEach(({ player_id, color }) => {
            playerColors[player_id] = color;
        });
        return playerColors;
    } catch (err) {
        throw new Error(err.message);
    }
}

module.exports = {
    createNewGame,
    fetchGames,
    retrieveGameById,
    gameExists,
    updateGameStatus,
    addParticipant,
    removeParticipant,
    checkIfParticipantInTheGame,
    fetchPlacedTiles,
    fetchParticipants,
    fetchPlayerColors
};