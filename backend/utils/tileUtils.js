const { retrievePlacedTiles, retrieveParticipantsIds, retrievePlayerColors, updateGameStatus } = require('../models/gamesModel');
const Mutex = require('async-mutex').Mutex;
const db = require('../config/db');
const gameLocks = {}; // Mutex for each game and player


const tiles = [
    // Single square (Monomino)
    { id: 1, name: "Monomino", coordinates: [[0, 0]] },

    // Three squares (Trominoes)
    { id: 2, name: "Domino", coordinates: [[0, 0], [1, 0]] },

    // Three squares (Trominoes)
    { id: 3, name: "Tromino I", coordinates: [[0, 0], [1, 0], [2, 0]] },
    { id: 4, name: "Tromino L", coordinates: [[0, 0], [1, 0], [1, 1]] },

    // Four squares (Tetrominoes)
    { id: 5, name: "Tetromino I", coordinates: [[0, 0], [1, 0], [2, 0], [3, 0]] },
    { id: 6, name: "Tetromino O", coordinates: [[0, 0], [1, 0], [0, 1], [1, 1]] },
    { id: 7, name: "Tetromino L", coordinates: [[0, 0], [1, 0], [2, 0], [2, 1]] },
    { id: 8, name: "Tetromino T", coordinates: [[0, 0], [1, 0], [2, 0], [1, 1]] },
    { id: 9, name: "Tetromino Z", coordinates: [[0, 0], [0, 1], [1, 1], [1, 2]] },

    // Five squares (Pentominoes)
    { id: 10, name: "Pentomino I", coordinates: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]] },
    { id: 11, name: "Pentomino L", coordinates: [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2]] },
    { id: 12, name: "Pentomino T", coordinates: [[0, 0], [1, 0], [2, 0], [1, 1], [1, 2]] },
    { id: 13, name: "Pentomino W", coordinates: [[0, 0], [1, 0], [1, 1], [2, 1], [2, 2]] },
    { id: 14, name: "Pentomino U", coordinates: [[0, 0], [0, 1], [0, 2], [1, 0], [1, 2]] },
    { id: 15, name: "Pentomino F", coordinates: [[0, 0], [0, 1], [1, 1], [1, 2], [2, 1]] },
    { id: 16, name: "Pentomino Z", coordinates: [[0, 0], [1, 0], [1, 1], [1, 2], [2, 2]] },
    { id: 17, name: "Pentomino X", coordinates: [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2]] },
    { id: 18, name: "Pentomino P", coordinates: [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1]] },
    { id: 19, name: "Pentomino J", coordinates: [[0, 0], [1, 0], [1, 1], [1, 2], [1, 3]] },
    { id: 20, name: "Pentomino Y", coordinates: [[0, 0], [0, 1], [0, 2], [0, 3], [1, 1]] },
    { id: 21, name: "Pentomino S", coordinates: [[0, 0], [0, 1], [1, 1], [1, 2], [1, 3]] },
];

function getTileById(tileId) {
    const tile = tiles.find((tile) => tile.id === tileId);
    if (!tile) {
        throw new Error(`Tile with ID ${tileId} not found`);
    }
    return tile;
}


function rotateTile(tile, angle) {
    const radians = (Math.PI / 180) * angle;

    return tile.coordinates.map(([x, y]) => [
        Math.round(x * Math.cos(radians) - y * Math.sin(radians)),
        Math.round(x * Math.sin(radians) + y * Math.cos(radians)),
    ]);
}

function mirrorTile(tile, axis = 0) {
    return tile.coordinates.map(([x, y]) => {
        if (axis === 1) {
            return [x, -y];
        } else if (axis === 0) {
            return [x, y];
        } else {
            throw new Error("Invalid axis.");
        }
    });
}

// absolute coordinates
function normalizeCoordinates(coordinates) {
    const minX = Math.min(...coordinates.map(([x]) => x));
    const minY = Math.min(...coordinates.map(([_, y]) => y));
    return coordinates.map(([x, y]) => [x - minX, y - minY]);
}

function visualizeTile(coordinates) {
    const normalized = normalizeCoordinates(coordinates);
    const maxX = Math.max(...normalized.map(([x]) => x));
    const maxY = Math.max(...normalized.map(([_, y]) => y));

    const grid = Array.from({ length: maxX + 1 }, () =>
        Array(maxY + 1).fill('.')
    );

    for (const [x, y] of normalized) {
        grid[x][y] = 'O';
    }

    grid.forEach((row) => console.log(row.join(' ')));

    // // Render the grid with axes
    // console.log("   " + Array.from({ length: maxY + 1 }, (_, i) => i).join(" ")); // Horizontal axis
    // grid.forEach((row, i) => {
    //     console.log(`${i} | ${row.join(" ")}`); // Vertical axis with row data
    // });
}

// In-memory store for game tiles
const gameTiles = {};

// Allocate tiles to participants
function allocateTiles(gameId, participants) {
    if (!gameTiles[gameId]) {
        gameTiles[gameId] = {};
    }

    participants.forEach(({ player_id }) => {
        gameTiles[gameId][player_id] = [...tiles]; // Clone tiles for each participant
    });

    console.log(`Tiles allocated for game ${gameId}`);
}


async function placeTile(gameId, playerId, tileId, anchorX, anchorY, mirror, rotate) {
    // Initialize mutex for this game and player
    const key = `${gameId}-${playerId}`;
    if (!gameLocks[key]) {
        gameLocks[key] = new Mutex();
    }

    const lock = gameLocks[key];
    return lock.runExclusive(async () => {
        try {
            // Validate the player's turn using the stored procedure
            await db.query('CALL validate_turn(?, ?)', [gameId, playerId]);

            if (!gameTiles[gameId] || !gameTiles[gameId][playerId]) {
                await reloadGameState(gameId);
                if (!gameTiles[gameId] || !gameTiles[gameId][playerId]) {
                    throw new Error(`No tiles allocated for the player`);
                }
            }

            const playerTiles = gameTiles[gameId][playerId];
            const tileIndex = playerTiles.findIndex((tile) => tile.id === tileId);

            if (tileIndex === -1) {
                throw new Error(`Tile ${tileId} is not available for player ${playerId}`);
            }

            const tile = playerTiles[tileIndex];

            // Execute the stored procedure for tile placement
            await db.query(
                'CALL place_tile(?, ?, ?, ?, ?, ?, ?)',
                [gameId, playerId, tileId, anchorX, anchorY, mirror ? 1 : 0, rotate]
            );

            // Calculate tile size (score increment)
            const tileSize = tile.coordinates.length;

            // Update score
            await db.query('CALL update_score(?, ?, ?)', [gameId, playerId, tileSize]);

            // Remove the tile from memory after successful placement
            playerTiles.splice(tileIndex, 1);
            console.log(`Tile ${tileId} placed by player ${playerId} in game ${gameId}`);

            // Check for deadlock
            if (await checkNoRemainingMoves(gameId, await constructBoard(gameId))) {
                await updateGameStatus(gameId, 'ended');
                return;
            }

            // Update the turn to the next player
            await db.query('CALL update_turn(?)', [gameId]);
        } catch (error) {
            console.error('Tile placement failed:', error.message);
            throw error;
        }
    });
}

async function reloadGameState(gameId) {
    try {

        // Fetch placed tiles from the database
        const placedTiles = await retrievePlacedTiles(gameId);

        // Fetch participants of the game
        const participants = await retrieveParticipantsIds(gameId);

        // Reinitialize game tiles
        gameTiles[gameId] = {};

        // Assign tiles to each participant
        participants.forEach(({ player_id }) => {
            // Start with a full set of tiles
            gameTiles[gameId][player_id] = [...tiles];

            // Remove tiles that the participant has already placed
            const placedTileIds = placedTiles
                .filter((placedTile) => placedTile.player_id === player_id)
                .map((placedTile) => placedTile.tile_id);

            gameTiles[gameId][player_id] = gameTiles[gameId][player_id].filter(
                (tile) => !placedTileIds.includes(tile.id)
            );
        });

        console.log(`Game state reloaded successfully for game ${gameId}`);
        console.log(gameTiles[gameId]); // Debugging: Print the in-memory tile state
    } catch (error) {
        console.error('Failed to reload game state:', error.message);
        throw error;
    }
}

function initializeBoard(width, height) {
    return Array.from({ length: height }, () =>
        Array.from({ length: width }, () => ({
            occupied: false,
            playerId: null,
            playerColor: null,
        }))
    );
}

async function constructBoard(gameId, boardWidth = 20, boardHeight = 20) {
    const board = initializeBoard(boardWidth, boardHeight);

    try {
        // Fetch player colors
        const playerColors = await retrievePlayerColors(gameId);
        // Fetch placed tiles from the database
        const placedTiles = await retrievePlacedTiles(gameId);

        // Process each placed tile
        for (const tileData of placedTiles) {
            const {
                tile_id: tileId,
                player_id: playerId,
                anchor_x: anchorX,
                anchor_y: anchorY,
                mirror,
                rotate,
            } = tileData;

            // Get the tile shape using its ID
            const tile = getTileById(tileId);

            // Apply transformations
            let transformedCoordinates = tile.coordinates;

            // Apply rotation
            transformedCoordinates = normalizeCoordinates(rotateTile({ coordinates: transformedCoordinates }, parseInt(rotate)));

            // Apply mirroring
            transformedCoordinates = normalizeCoordinates(mirrorTile({ coordinates: transformedCoordinates }, parseInt(mirror)));

            // Translate to the anchor point
            const placedCoordinates = transformedCoordinates.map(([x, y]) => [x + anchorX, y + anchorY]);

            // Update board state
            for (const [x, y] of placedCoordinates) {
                board[x][y] = {
                    occupied: true,
                    playerId,
                    playerColor: playerColors[playerId],
                };
            }
        }

        return board;
    } catch (error) {
        console.error('Error constructing board:', error.message);
        throw error;
    }
}

function getPlayerCorner(playerColor, boardWidth, boardHeight) {
    const corners = {
        blue: [0, 0], // Top-left
        red: [boardHeight - 1, boardWidth - 1], // Bottom-right
        green: [0, boardWidth - 1], // Top-right
        magenta: [boardHeight - 1, 0], // Bottom-left

    };
    return corners[playerColor];
}

function visualizeBoard(board) {
    console.log('    ' + Array.from({ length: board[0].length }, (_, i) => i % 10).join(' ')); // Column headers
    board.forEach((row, i) => {
        const rowContent = row.map((cell) => {
            if (cell.occupied) {
                switch (cell.playerColor) {
                    case 'blue': return 'B';
                    case 'red': return 'R';
                    case 'green': return 'G';
                    case 'magenta': return 'M';
                    default: return '?';
                }
            }
            return '.';
        }).join(' ');
        console.log(`${i % 10} | ${rowContent}`); // Row headers
    });
}


async function validateTilePlacement(board, gameId, playerId, tileId, anchorX, anchorY, mirror, rotate) {
    const boardHeight = board.length;
    const boardWidth = board[0].length;

    const playerColors = await retrievePlayerColors(gameId);
    const playerColor = playerColors[playerId];

    const playerCorner = getPlayerCorner(playerColor, boardWidth, boardHeight);

    // Check if this is the first tile placed
    const isFirstPlacement = !board.some((row) =>
        row.some((cell) => cell.occupied && cell.playerId === playerId)
    );

    // Check if this is the first placement by seeing if all tiles are present
    const isFirstTile = gameTiles[gameId][playerId].length === 21; // All tiles available means it's the first placement

    console.log('Is first placement:', isFirstPlacement, 'Is first tile:', isFirstTile);

    // Apply Transformations (Rotation and Mirroring)
    const tile = getTileById(tileId);
    let transformedCoordinates = tile.coordinates;

    transformedCoordinates = normalizeCoordinates(rotateTile({ coordinates: transformedCoordinates }, parseInt(rotate)));
    // console.log('Transformed Coordinates  after normalizing rotate:', transformedCoordinates);
    transformedCoordinates = normalizeCoordinates(mirrorTile({ coordinates: transformedCoordinates }, parseInt(mirror)));
    // console.log('Transformed Coordinates after normalizing mirror:', transformedCoordinates);
    // Transform tile coordinates to the Placement Position
    const transformedTile = transformedCoordinates.map(([x, y]) => [x + anchorX, y + anchorY]);
    // console.log('Transformed Coordinates after normalizing anchors:', transformedTile);
    let cornerTouch = false;

    if (isFirstTile) {
        // Check if none of the coordinates of the transformedTile equals the coordinates of playerCorner
        if (!transformedTile.some(([x, y]) => x === playerCorner[0] && y === playerCorner[1])) {
            return { valid: false, reason: 'Tile must touch the player’s corner' };
        }
    }

    for (const [x, y] of transformedTile) {
        // Boundary Check
        if (x < 0 || x >= boardHeight || y < 0 || y >= boardWidth) {
            return { valid: false, reason: 'Boundary violation:' };
            // return { valid: false, reason: 'Boundary violation: [x,y]' + [x, y] };
        }

        // Overlap Check
        if (board[x][y].occupied) {
            return { valid: false, reason: 'Tile overlap' };
        }

        // Check Corner Touch
        const cornerNeighbors = [
            [x - 1, y - 1],
            [x - 1, y + 1],
            [x + 1, y - 1],
            [x + 1, y + 1],
        ];
        for (const [cx, cy] of cornerNeighbors) {
            if (
                cx >= 0 &&
                cy >= 0 &&
                cx < boardHeight &&
                cy < boardWidth &&
                board[cx][cy].playerId === playerId
            ) {
                cornerTouch = true;
            }
        }

        // Check Edge Touch
        const edgeNeighbors = [
            [x - 1, y],
            [x + 1, y],
            [x, y - 1],
            [x, y + 1],
        ];
        for (const [ex, ey] of edgeNeighbors) {
            if (
                ex >= 0 &&
                ey >= 0 &&
                ex < boardHeight &&
                ey < boardWidth &&
                board[ex][ey].playerId === playerId
            ) {
                return { valid: false, reason: 'Edge touch violation' };
            }
        }
    }

    // Final Corner Touch Check
    if (!isFirstPlacement && !cornerTouch) {
        return { valid: false, reason: 'No corner touch' };
    }

    return { valid: true };
}

function generateTileTransformations(tile) {
    const transformations = [];

    // Apply all 4 rotations
    for (const rotate of [0, 90, 180, 270]) {
        let rotatedTile = rotateTile(tile, rotate);

        // Add original orientation and horizontal mirror
        transformations.push(normalizeCoordinates(rotatedTile)); // Original
        transformations.push(normalizeCoordinates(mirrorTile({ coordinates: rotatedTile }, 1))); // Mirrored
    }
    return transformations;
}

async function checkNoRemainingMoves(gameId, board) {
    const participants = await retrieveParticipantsIds(gameId); // Fetch all participants in the game
    const playerColors = await retrievePlayerColors(gameId);

    for (const { player_id: playerId } of participants) {
        const playerTiles = gameTiles[gameId][playerId];

        for (const tile of playerTiles) {
            // Generate all transformations of the tile
            const transformations = generateTileTransformations(tile);

            for (const transformedTile of transformations) {
                for (let x = 0; x < board.length; x++) {
                    for (let y = 0; y < board[0].length; y++) {
                        const validationResult = await validateTilePlacement(
                            board,
                            gameId,
                            playerId,
                            tile.id,
                            x,
                            y,
                            0, // No mirroring needed (handled in transformations)
                            0      // Rotation is handled in transformations
                        );

                        if (validationResult.valid) {
                            return false; // Valid move found; game continues
                        }
                    }
                }
            }
        }
    }

    return true; // No valid moves for any player
}



module.exports = {
    rotateTile,
    mirrorTile,
    normalizeCoordinates,
    visualizeTile,
    getTileById,
    allocateTiles,
    placeTile,
    reloadGameState,
    initializeBoard,
    validateTilePlacement,
    visualizeBoard,
    constructBoard,
    generateTileTransformations,
    checkNoRemainingMoves,
    tiles,
    gameTiles
};
