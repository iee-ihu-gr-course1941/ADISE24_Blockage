import authApi from '../api/authApi.js';
import socketGameAPI from '../api/gameWebsocketsAPI.js';
import gameRestAPI from '../api/gameRestAPI.js';

const token = authApi.getToken();
const gameId = sessionStorage.getItem('gameId');
const myName = sessionStorage.getItem('playerName');

document.addEventListener('DOMContentLoaded', async () => {


    // Redirects to login page if token is missing
    if (!token) {
        window.location.href = '/login';
        return;
    }

    socketGameAPI.initializeSocket(gameId);

    // await renderAllTiles(gameId, tiles);

    createBoard();

    // const participants = await gameRestAPI.fetchParticipantsByGameId(gameId);
    // let isParticipant = false;
    // for( let participant of participants) {
    //     if(participant.playerName === myName) {
    //         isParticipant = true;
    //     }
    // }
    // if (!isParticipant) {
    //     window.location.href = '/dashboard';
    //     return;
    // }

    const gameInfo = document.getElementsByClassName("game-info");
    const currentTurn = document.getElementById("current-turn");

    await createScoreBars(gameId);

});


const createScoreBars = async (gameId) => {
    const scoreContainer = document.getElementById('score-container');

    const participants = await gameRestAPI.fetchParticipantsByGameId(gameId);
    // console.log(participants);

    for (let participant of participants) {
        const scoreBox = document.createElement('div');
        const playerName = document.createElement('span');
        const score = document.createElement('p');

        scoreBox.classList.add('score-box');
        playerName.classList.add('player-name');
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
function renderTile(tile, container, color) {
    // console.log(tile);
    const normalized = normalizeCoordinates(tile.coordinates);

    const maxX = Math.max(...normalized.map(([x]) => x));
    const maxY = Math.max(...normalized.map(([_, y]) => y));

    // Create tile box container
    const tileBox = document.createElement("div");
    tileBox.className = "tile-box";
    tileBox.style.gridTemplateRows = `repeat(${maxX + 1}, 1fr)`;
    tileBox.style.gridTemplateColumns = `repeat(${maxY + 1}, 1fr)`;

    // Render grid cells
    for (let row = 0; row <= maxX; row++) {
        for (let col = 0; col <= maxY; col++) {
            const cell = document.createElement("div");
            const isFilled = normalized.some(([x, y]) => x === row && y === col);
            cell.className = isFilled ? `grid-cell-${color}` : `grid-cell empty`;
            tileBox.appendChild(cell);
        }
    }

    tileBox.addEventListener("click", () => {
        // TODO - Add when it's clicked to display the valid moves on the board
        //        According to its state (via images rotate & flip) to display the...
        //        ...tile properly on the tool-box element (before the two images)

        console.log("Tile clicked");
    });

    // Append tile to container
    container.appendChild(tileBox);
}

// Main function to render all tiles
const renderAllTiles = async (gameId, tiles) => {
    const rightPanel = document.getElementById("right-panel");
    rightPanel.innerHTML = "";

    const tilesArray = Array.isArray(tiles) ? tiles : Object.values(tiles);
    if (!Array.isArray(tilesArray)) {
        console.error("tiles is not an array");
        return;
    }
    // console.log("tilesArray");
    // console.log(tilesArray);

    const participants = await gameRestAPI.fetchParticipantsByGameId(gameId);
    // console.log(participants);

    let i = 0;
    for (let participant of participants) {
        // console.log(participant);
        const tileContainer = document.createElement("div");
        tileContainer.className = "tile-container";

        // tiles.sort((a, b) => {
        //     const widthA = a.coordinates.length;
        //     const widthB = b.coordinates.length;
        //     return widthB - widthA;
        // });

        // tiles = tiles.map(({ coordinates, ...rest }) => ({ ...rest, coordinates: [...coordinates] }));

        // console.log(`tilesArray${[i]}`);
        // console.log(tilesArray[i]);
        for (let tile of tilesArray[i]) {
            renderTile(tile, tileContainer, participant.color);
        }

        // tiles.forEach((tile) => renderTile(tile, tileContainer, participant.color));
        rightPanel.appendChild(tileContainer);

        if (participant.player_name === myName) {
            const toolBox = document.createElement("div");
            const rotateImg = document.createElement("img");
            const flipImage = document.createElement("img");

            toolBox.className = "tool-box";
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
            rightPanel.appendChild(toolBox);
        }
        i++;
    }
}

// Create the board in the DOM
const createBoard = () => {
    const board = document.getElementById("board");

    for (let row = 0; row < 20; row++) {
        for (let col = 0; col < 20; col++) {
            const cell = document.createElement("div");
            cell.className = "board-cell";
            cell.dataset.row = row;
            cell.dataset.col = col;

            // Add click event to place a tile
            cell.addEventListener("click", () => placeTile(row, col));
            board.appendChild(cell);
        }
    }
}

// TODO
const fillBoard = () => {

}

export {
    createBoard,
    renderAllTiles,
    createScoreBars
}