const express = require('express');
const { authenticateToken } = require('../middleware/authMiddleware');
const { createGame, joinGame, listGames, setPlayerReady } = require('../controllers/gamesController');

const router = express.Router();

// router.all('*', authenticateToken); //Applies middleware to all HTTP methods and all routes on the router.
router.use('/', authenticateToken); //Applies middleware to all routes on the router

// Create a game
router.post('/create', createGame);

// Join a game
router.post('/join', joinGame);

// List all games
router.get('/', listGames);

// // Mark a participant as ready
// router.patch('/:gameId/ready', authenticateToken, setPlayerReady);

module.exports = router;
