// const tiles = [
//     // Single square (Monomino)
//     { name: "Monomino", coordinates: [[0, 0]] },
//
//     // Two squares (Domino)
//     { name: "Domino", coordinates: [[0, 0], [1, 0]] },
//
//     // Three squares (Trominoes)
//     { name: "Tromino I", coordinates: [[0, 0], [1, 0], [2, 0]] },
//     { name: "Tromino L", coordinates: [[0, 0], [1, 0], [1, 1]] },
//
//     // Four squares (Tetrominoes)
//     { name: "Tetromino I", coordinates: [[0, 0], [1, 0], [2, 0], [3, 0]] },
//     { name: "Tetromino O", coordinates: [[0, 0], [1, 0], [0, 1], [1, 1]] },
//     { name: "Tetromino L", coordinates: [[0, 0], [1, 0], [2, 0], [2, 1]] },
//     { name: "Tetromino T", coordinates: [[0, 0], [1, 0], [2, 0], [1, 1]] },
//     { name: "Tetromino Z", coordinates: [[0, 0], [1, 0], [1, 1], [1, 2]] },
//
//     // Five squares (Pentominoes)
//     { name: "Pentomino I", coordinates: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]] },
//     { name: "Pentomino L", coordinates: [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2]] },
//     { name: "Pentomino T", coordinates: [[0, 0], [1, 0], [2, 0], [1, 1], [2, 1]] },
//     { name: "Pentomino Z", coordinates: [[0, 0], [1, 0], [1, 1], [2, 1], [2, 2]] },
//     { name: "Pentomino U", coordinates: [[0, 0], [0, 1], [0, 2], [1, 0], [1, 2]] },
//     { name: "Pentomino F", coordinates: [[0, 0], [0, 1], [1, 1], [1, 2], [2, 1]] }, //to be checked
//     { name: "Pentomino W", coordinates: [[0, 0], [1, 0], [1, 1], [1, 2], [2, 2]] },
//     { name: "Pentomino X", coordinates: [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2]] },
//     { name: "Pentomino P", coordinates: [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1]] },
//     { name: "Pentomino J", coordinates: [[0, 0], [1, 0], [1, 1], [1, 2], [1, 3]] },
//     { name: "Pentomino Y", coordinates: [[0, 0], [0, 1], [0, 2], [0, 3], [1, 1]] },
//     { name: "Pentomino S", coordinates: [[0, 0], [0, 1], [1, 1], [1, 2], [1, 3]] },
// ];

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

function mirrorTile(tile, axis = "horizontal") {
    return tile.coordinates.map(([x, y]) => {
        if (axis === "horizontal") {
            return [x, -y];
        } else if (axis === "vertical") {
            return [-x, y];
        } else {
            throw new Error("Invalid axis. Use 'horizontal' or 'vertical'.");
        }
    });
}


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

module.exports = {
    rotateTile,
    mirrorTile,
    normalizeCoordinates,
    visualizeTile,
    getTileById,
    tiles,
};
