const db = require('../config/db');

//Create a new game
// const createNewGame = (createdBy, maxPlayers) => {
//     return new Promise((resolve, reject) => {
//         const query = `
//             INSERT INTO games (created_by, max_number_of_players)
//             VALUES (?, ?)
//         `;
//         db.query(query, [createdBy, maxPlayers], (err, results) => {
//             if (err) return reject(err);
//             resolve(results.insertId);
//         });
//     });
// };

const createNewGame = async (createdBy, maxPlayers) => {
    try {
        const query = ` INSERT INTO games (created_by, max_number_of_players)
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

const retrieveGame = async (gameId) => {
    try {
        const query = `
            SELECT * FROM games WHERE game_id = ?
        `;
        const [result] = await db.query(query, [gameId]);
        // console.log(result);
        // console.log(result[0]['game_id']);
        return result[0].game_id;
    } catch (err) {
        console.error('Error retrieving game with ID:', err);
        // const error = new Error(`Error retrieving game with ID: ${gameId}`);
        // throw error;
    }
}

const gameExists = async (gameId) => {
    try {
        const query = `
            SELECT * FROM games WHERE game_id = ?
        `;
        const [result] = await db.query(query, [gameId]);
        return result.length > 0;
    } catch (err) {
        console.error('Error retrieving game with ID:', err);
    }
}

// returns bool
const checkIfPlayerHasActiveGame = async (playerId) => {
    try {
        const query = `
            SELECT * FROM games G INNER JOIN participants P ON G.game_id = P.game_id
            WHERE P.player_id = ? AND NOT
            (G.status = 'not_active' || 
             G.status = 'initialized' || 
             G.status = 'started') ;
        `;
        const [results] = await db.query(query, [playerId]);
        if (results.length)
            return true;
        return false;
    } catch (error) {
        console.error('Error checking if player has active game:', error);
        // throw error;
    }
}

module.exports = {
    createNewGame,
    addParticipant,
    fetchGames,
    retrieveGame,
    gameExists,
    checkIfPlayerHasActiveGame
};