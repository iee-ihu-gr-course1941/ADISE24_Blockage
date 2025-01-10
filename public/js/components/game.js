import authApi from '../api/authApi.js';
import socketGameAPI from '../api/gameWebsocketsAPI.js';
import gameRestAPI from '../api/gameRestAPI.js';

const token = authApi.getToken();
const gameId = sessionStorage.getItem('gameId');
const myName = sessionStorage.getItem('playerName');
let lastClickedTile = null;
let participants = null;

document.addEventListener('DOMContentLoaded', async () => {

    participants = await gameRestAPI.fetchParticipantsByGameId(gameId);

    // Redirects to login page if token is missing
    if (!token) {
        window.location.href = '/login';
        return;
    }
    const playerName = document.getElementById("player-name");
    playerName.innerHTML = sessionStorage.getItem('playerName');
    socketGameAPI.initializeSocket(gameId);

    createBoard();

    await createScoreBars(gameId);

});


const createScoreBars = async (gameId) => {
    const scoreContainer = document.getElementById('score-container');

    for (let participant of participants) {
        const scoreBox = document.createElement('div');
        const playerName = document.createElement('span');
        const score = document.createElement('p');

        scoreBox.classList.add('score-box');
        playerName.classList.add('participant-name');
        score.classList.add('score');

        console.log(participant);

        playerName.textContent = participant.player_name;
        playerName.style.color = participant.color;
        score.textContent = participant.score;
        score.style.color = participant.color;

        scoreBox.appendChild(playerName);
        scoreBox.appendChild(score);
        scoreContainer.appendChild(scoreBox);
    }

    return scoreContainer;
}

// Function to normalize tile coordinates
function normalizeCoordinates(coordinates) {
    const minX = Math.min(...coordinates.map(([x]) => x));
    const minY = Math.min(...coordinates.map(([_, y]) => y));
    return coordinates.map(([x, y]) => [x - minX, y - minY]);
}

// Function to visualize a single tile
function renderTile(tile, container, toolbox, clickedTile, color) {
    // console.log(tile);
    const currentTurn = document.getElementById('current-turn');

    const normalized = normalizeCoordinates(tile.coordinates);

    const maxX = Math.max(...normalized.map(([x]) => x));
    const maxY = Math.max(...normalized.map(([_, y]) => y));

    // Create tile box container
    const tileBox = document.createElement("div");
    tileBox.className = "tile-box";
    tileBox.style.gridTemplateRows = `repeat(${maxX + 1}, 1fr)`;
    tileBox.style.gridTemplateColumns = `repeat(${maxY + 1}, 1fr)`;

    const player = participants.find((participant) => participant.player_name === myName)
    if (player.color === color) {
        tileBox.classList.add('active');
    } else {
        tileBox.classList.remove('active');
    }

    // Render grid cells
    for (let row = 0; row <= maxX; row++) {
        for (let col = 0; col <= maxY; col++) {
            const cell = document.createElement("div");
            const isFilled = normalized.some(([x, y]) => x === row && y === col);
            cell.className = isFilled ? `grid-cell-${color}` : `grid-cell empty`;
            cell.style.width = "19px";
            cell.style.height = "19px";
            tileBox.appendChild(cell);
        }
    }

    if (tileBox.classList.contains('active')) {
        // if (currentTurn.textContent === `Current turn: ${myName}`) {
        tileBox.addEventListener("click", () => {
            clickedTile.innerHTML = "";

            const clonedTile = tileBox.cloneNode(true);
            clickedTile.appendChild(clonedTile);

            toolbox.insertBefore(clickedTile, toolbox.firstChild);

            lastClickedTile = tile;
            // console.log(lastClickedTile);
            console.log("Tile clicked");

            const board = socketGameAPI.getBoard();
            // board, tile, mirror, rotate
            highlightValidCells(board, tile);

        });
    }
    container.appendChild(tileBox);
}

const updateCurrentTurn = (currentTurnName) => {
    const currentTurnElement = document.getElementById('current-turn');
    currentTurnElement.textContent = `Current turn: ${currentTurnName}`;
}

// Main function to render all tiles
const renderAllTiles = async (gameId, tiles) => {
    const rightPanel = document.getElementById("right-panel");
    const toolBox = document.createElement("div");
    const clickedTile = document.createElement("div");

    rightPanel.innerHTML = "";
    toolBox.className = "tool-box";
    clickedTile.className = "clicked-tile";

    const tilesArray = Array.isArray(tiles) ? tiles : Object.values(tiles);
    // console.log("tilesArray");
    // console.log(tilesArray);
    if (!Array.isArray(tilesArray)) {
        console.error("tiles is not an array");
        return;
    }

    let i = 0;
    for (let participant of participants) {

        const tileContainer = document.createElement("div");
        tileContainer.className = "tile-container";

        for (let tile of tilesArray[i]) {
            renderTile(tile, tileContainer, toolBox, clickedTile, participant.color);
        }

        rightPanel.appendChild(tileContainer);


        if (participant.player_name === myName) {
            const clickedTile = document.createElement("div");
            const rotateImg = document.createElement("img");
            const flipImage = document.createElement("img");

            clickedTile.className = "clicked-tile";
            rotateImg.className = "tool-image rotate";
            flipImage.className = "tool-image flip";

            rotateImg.setAttribute("src", "../../../assets/images/rotate-icon.png");
            flipImage.setAttribute("src", "../../../assets/images/flip-icon.png");


            // TODO - Add functionality to rotate and flip tile!
            rotateImg.addEventListener("click", () => {
                const currentRotation = parseInt(rotateImg.getAttribute("data-rotation") || "0");
                const newRotation = currentRotation + 90;
                rotateImg.style.transform = `rotate(${newRotation}deg)`;
                rotateImg.setAttribute("data-rotation", newRotation);
            });

            flipImage.addEventListener("click", () => {

            });

            toolBox.appendChild(rotateImg);
            toolBox.appendChild(flipImage);
        }
        rightPanel.appendChild(toolBox);
        i++;
    }
}

// Create the board in the DOM
const createBoard = () => {
    const board = document.getElementById("board");
    // boardElement.innerHTML = '';

    for (let row = 0; row < 20; row++) {
        for (let col = 0; col < 20; col++) {
            const cell = document.createElement("div");
            cell.className = "board-cell";
            cell.dataset.row = row;
            cell.dataset.col = col;

            // Add click event to place a tile
            cell.addEventListener("click", () => {
                if (!cell.classList.contains('valid-cell')) {
                    console.log('Invalid move');
                    return socketGameAPI.emitEvent('error', { message: 'Invalid move' });
                }
                placeTile(row, col);
            });
            board.appendChild(cell);
        }
    }
}

const fillBoard = (newBoardState) => {
    const board = document.getElementById("board");
    board.innerHTML = '';

    for (let row = 0; row < newBoardState.length; row++) {
        for (let col = 0; col < newBoardState[row].length; col++) {
            const cell = document.createElement("div");
            cell.className = "board-cell";
            cell.dataset.row = row;
            cell.dataset.col = col;

            if (newBoardState[row][col].occupied) {
                cell.classList.add(`occupied-${newBoardState[row][col].playerColor}`);
            }

            // Add click event to place a tile
            cell.addEventListener("click", () => {
                if (!cell.classList.contains('valid-cell')) {
                    console.log('Invalid move');
                    return socketGameAPI.emitEvent('error', { message: 'Invalid move' });
                }
                placeTile(row, col);
            });
            board.appendChild(cell);
        }
    }
};


const getPlayerCorner = (playerColor, boardWidth, boardHeight) => {
    const corners = {
        blue: [0, 0], // Top-left
        red: [boardHeight - 1, boardWidth - 1], // Bottom-right
        green: [0, boardWidth - 1], // Top-right
        magenta: [boardHeight - 1, 0], // Bottom-left

    };
    return corners[playerColor];
}


const validateTilePlacement = async (board, tile, anchorX, anchorY, mirror, rotate) => {
    const boardHeight = board.length;
    const boardWidth = board[0].length;

    let playerColor = null;
    for (let participant of participants) {
        if (participant.player_name === myName) {
            playerColor = participant.color;
            break;
        }
    }

    if (!playerColor) {
        console.log('Player color not found, ON GAME.JS LINE: 287');
        return false; // { valid: false, reason: 'Player color not found'};
    }

    const playerCorner = getPlayerCorner(playerColor, boardWidth, boardHeight);

    // Check if this is the first tile placed by the player
    // if (!Array.isArray(board) || !board.length || !Array.isArray(board[0])) {
    //     console.error('Invalid board state');
    //     return false;
    // }

    const isFirstPlacement = !board.some((row) => {
        // console.log(row);
        row.some((cell) => cell.occupied && cell.playerColor === playerColor)
    }
    );




    // // Apply transformations (rotation and mirroring)
    let transformedCoordinates = tile.coordinates;
    transformedCoordinates = normalizeCoordinates(rotateTile({ coordinates: transformedCoordinates }, parseInt(rotate)));
    transformedCoordinates = normalizeCoordinates(mirrorTile({ coordinates: transformedCoordinates }, parseInt(mirror)));
    const transformedTile = transformedCoordinates.map(([x, y]) => [x + anchorX, y + anchorY]);

    let cornerTouch = false;

    if (isFirstPlacement) {
        // Check if none of the coordinates of the transformedTile equals the coordinates of playerCorner
        if (!transformedTile.some(([x, y]) => x === playerCorner[0] && y === playerCorner[1])) {
            return false //{ valid: false, reason: 'Tile must touch the player’s corner' };
        }
    }

    for (const [x, y] of transformedTile) {
        // Boundary Check
        if (x < 0 || x >= boardHeight || y < 0 || y >= boardWidth) {
            return false; // Out of bounds
        }

        // Overlap Check
        if (board[x][y].occupied) {
            return false; // Overlap with another tile
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
                board[cx][cy].playerColor === playerColor
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
                board[ex][ey].playerColor === playerColor
            ) {
                return false; // Edge touch violation
            }
        }
    }

    // Final Corner Touch Check
    if (!isFirstPlacement && !cornerTouch) {
        return false; // No corner touch
    }

    return true; // Placement is valid
}


// Rotate tile coordinates
const rotateTile = (tile, angle) => {
    const radians = (Math.PI / 180) * angle;
    return tile.coordinates.map(([x, y]) => [
        Math.round(x * Math.cos(radians) - y * Math.sin(radians)),
        Math.round(x * Math.sin(radians) + y * Math.cos(radians)),
    ]);
}

const mirrorTile = (tile, axis = 0) => {
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


const highlightValidCells = async (board, tile, mirror = 0, rotate = 0) => {
    const boardHeight = board.length;
    const boardWidth = board[0].length;

    // Clear previous highlights
    document.querySelectorAll('.valid-cell').forEach((cell) => {
        cell.classList.remove('valid-cell');
    });

    // Iterate through all board cells
    for (let x = 0; x < boardHeight; x++) {
        for (let y = 0; y < boardWidth; y++) {
            if (await validateTilePlacement(board, tile, x, y, mirror, rotate)) {
                // Highlight valid cell
                const cell = document.querySelector(`[data-row="${x}"][data-col="${y}"]`);
                if (cell) {
                    cell.classList.add('valid-cell');
                }
            }
        }
    }
}


// tileId, anchrX, anchorY, mirror, rotate
const placeTile = async (anchorX, anchorY) => {
    // const tile = document.querySelector('.clicked-tile .tile-box');

    // TODO - match mirror and rotate with the clicked tile
    // const mirror = parseInt(document.querySelector('.tool-box .tool-image.flip').getAttribute('data-rotation') || "0", 10);
    // const rotate = (document.querySelector('.tool-box .tool-image.rotate').getAttribute('data-rotation') || "0", 10);

    const mirror = 0;
    const rotate = "0";

    const board = socketGameAPI.getBoard();
    const isValid = await validateTilePlacement(board, lastClickedTile, anchorX, anchorY, mirror, rotate);

    if (isValid) {
        // Emit event to server
        const tileId = lastClickedTile.id;

        await socketGameAPI.emitEvent('place-tile', { tileId, anchorX, anchorY, mirror, rotate });
    } else {
        console.log('Invalid move');
    }
}

const updateScores = async (players) => {
    const scoreElements = document.getElementsByClassName('score');

    let i = 0;
    for (let player of players) {
        scoreElements[i].textContent = player.score;
        i++;
    }
}



export {
    createBoard,
    fillBoard,
    renderAllTiles,
    createScoreBars,
    updateScores,
    updateCurrentTurn
}
