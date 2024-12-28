const db = require('../config/db');

// Create a new game and add the creator as a participant
const createNewGame = (createdBy, maxPlayers) => {
    return new Promise((resolve, reject) => {
        db.query('CALL CreateGameAndJoin(?,?,@gameId); SELECT @gameId AS gameId;', [createdBy, maxPlayers], (err, results) => {
            if (err) return reject(err);
            
            // Extract the gameId from the second result set (the SELECT @gameId query)
            const gameId = results[1][0].gameId;
            resolve(gameId);  // Resolve with the new game ID
        });
    });
};

// Add a participant to a game
const addParticipant = (gameId, playerId) => {
    return new Promise((resolve, reject) => {
        const query = `
            CALL JoinGame(?, ?)
        `;
        db.query(query, [gameId, playerId], (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
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
const fetchGames = () => {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT g.game_id, g.created_by, g.status, g.max_number_of_players, COUNT(p.player_id) AS current_players
            FROM games g
            LEFT JOIN participants p ON g.game_id = p.game_id
            GROUP BY g.game_id
        `;
        db.query(query, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
};


module.exports = { createNewGame, addParticipant, fetchGames, removeParticipant };
