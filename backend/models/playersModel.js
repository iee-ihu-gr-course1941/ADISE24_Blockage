const db = require('../config/db');

// Create a player in the database
const createPlayer = (playername) => {
    return new Promise((resolve, reject) => {
        const query = 'INSERT INTO players (player_name) VALUES (?)';
        db.query(query, [playername], (err, results) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return reject(new Error('Player name already exists'));
                }
                return reject(err);
            }
            resolve(results.insertId);
        });
    });
};

module.exports = { createPlayer };
