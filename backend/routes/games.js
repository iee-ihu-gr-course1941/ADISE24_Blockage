const express = require('express');
const { authenticateToken } = require('../middleware/authMiddleware');
const { createGame, joinGame, leaveGame, listGames, listGamesByStatus, retrieveGame, retrieveParticipants, retrieveParticipantsByStatus} = require('../controllers/gamesController');

const router = express.Router();

// router.all('*', authenticateToken); //Applies middleware to all HTTP methods and all routes on the router.
router.use('/', authenticateToken); //Applies middleware to all routes on the router

// Create a game
router.post('/create', createGame);

// Join a game
router.post('/join', joinGame);

// Leave a game
router.delete('/leave/', leaveGame);

// List all games
router.get('/', listGames);

// List games by status
router.get('/status', listGamesByStatus);

// Retrieve all participants of games by status
router.get('/participants', retrieveParticipantsByStatus);

// Retrieve a game by id
router.get('/:gameId', retrieveGame);

// Retrieve all participants by game id
router.get('/:gameId/participants', retrieveParticipants);

module.exports = router;
