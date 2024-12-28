const db = require('../config/db');
const dbPromise = require('../config/db');

// Create a player in the database
// const createPlayer = (playername) => {
//     return new Promise((resolve, reject) => {
//         const query = 'INSERT INTO players (player_name) VALUES (?)';
//         db.query(query, [playername], (err, results) => {
//             if (err) {
//                 if (err.code === 'ER_DUP_ENTRY') {
//                     return reject(new Error('Player name already exists'));
//                 }
//                 return reject(err);
//             }
//             resolve(results.insertId);
//         });
//     });
// };

const createPlayer = async (playerName) => {
    try {
        const query = 'INSERT INTO players (player_name) VALUES (?)';
        const [results] = await dbPromise.query(query, [playerName]);
        return results.insertId;
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            const error = new Error('Player name already exists');
            error.statusCode = 400;
            throw error;
        }
        throw err;
    }
};

const getPlayer = async (playerId) => {
    try {
        const query = 'SELECT * FROM players WHERE player_id = ? ';
        const [user] = await db.query(query, [playerId]);
        return user;
    } catch (error) {
        console.error('Error fetching player:', error);
    }
};

module.exports = { createPlayer, getPlayer };
