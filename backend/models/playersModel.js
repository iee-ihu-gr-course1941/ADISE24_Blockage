const db = require('../config/db');
const dbPromise = require('../config/db');

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

const getPlayerById = async (playerId) => {
    try {
        const query = 'SELECT * FROM players WHERE player_id = ? ';
        const [user] = await db.query(query, [playerId]);
        return user;
    } catch (error) {
        console.error('Error fetching player:', error);
    }
};

module.exports = { createPlayer, getPlayerById };
