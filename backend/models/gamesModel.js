const db = require('../config/db');

// Create a new game
const createNewGame = (createdBy, maxPlayers) => {
    return new Promise((resolve, reject) => {
        const query = `
            INSERT INTO games (created_by, max_number_of_players)
            VALUES (?, ?)
        `;
        db.query(query, [createdBy, maxPlayers], (err, results) => {
            if (err) return reject(err);
            resolve(results.insertId);
        });
    });
};

// Add a participant to a game
const addParticipant = (gameId, playerId, color) => {
    return new Promise((resolve, reject) => {
        const query = `
            INSERT INTO participants (game_id, player_id, color)
            VALUES (?, ?, ?)
        `;
        db.query(query, [gameId, playerId, color], (err, results) => {
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

// Mark a participant as ready
const markParticipantReady = (gameId, playerId) => {
    return new Promise((resolve, reject) => {
        const query = `
            UPDATE participants
            SET is_ready = TRUE
            WHERE game_id = ? AND player_id = ?
        `;
        db.query(query, [gameId, playerId], (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
};

module.exports = { createNewGame, addParticipant, fetchGames, markParticipantReady };
