require('dotenv').config(); // Load environment variables

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth');
const gameRoutes = require('./routes/games');
const  socketConfig = require('./sockets/config/socketConfig.js');
const { socketioToken } = require('./sockets/socketioAuthMiddleware');


const app = express();
const httpServer = createServer(app);
const io = socketConfig(httpServer);

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';


// Middleware
app.use(cors());
app.use(bodyParser.json());


// Routes
app.use('/auth', authRoutes);
app.use('/games', gameRoutes);

// Applies middleware to all socketio events
io.use(socketioToken);

// Attach socketio to Express app
app.set('io', io); // By doing this, Socket.IO instance becomes accessible from any part of the Express application that has access to the 'app' object!

//Load socket.io events/handlers
require('./sockets/socket.js')(io);

// Simple route for testing
app.get('/', (req, res) => res.send('Blokus Game Backend'));

// Start server
httpServer.listen(PORT, () => console.log(`Server running on http://${HOST}:${PORT}`));
