require('dotenv').config(); // Load environment variables

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const gameRoutes = require('./routes/games');


const app = express();

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';


// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/auth', authRoutes);
app.use('/games', gameRoutes);

// Simple route for testing
app.get('/', (req, res) => res.send('Blokus Game Backend'));

// Start server
app.listen(PORT, () => console.log(`Server running on http://${HOST}:${PORT}`));
