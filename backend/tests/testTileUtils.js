const {
    rotateTile,
    mirrorTile,
    normalizeCoordinates,
    visualizeTile,
    getTileById,
    tiles,
} = require('../utils/tileUtils');

// const tile = [[0, 0], [1, 0], [2, 0], [1, 1],  [1, 2]];
function testTileById(tileId) {
    try {
        // Get the tile by ID
        const tile = getTileById(tileId);

        console.log(`\nTesting Tile: ${tile.name} (ID: ${tile.id})`);

        console.log("Original Tile:");
        visualizeTile(tile.coordinates);

        let rotatedTile;
        console.log("\nRotated 90°:");
        rotatedTile = rotateTile(tile, -90);
        visualizeTile(rotatedTile);

        console.log("\nRotated 180°:");
        rotatedTile = rotateTile(tile, -180);
        visualizeTile(rotatedTile);

        console.log("\nRotated 270°:");
        rotatedTile = rotateTile(tile, -270);
        visualizeTile(rotatedTile);

        console.log("\nHorizontally Mirrored:");
        const mirroredTile = mirrorTile(tile, "horizontal");
        visualizeTile(mirroredTile);

        console.log("\nVertically Mirrored:");
        const verticallyMirroredTile = mirrorTile(tile, "vertical");
        visualizeTile(verticallyMirroredTile);

    } catch (error) {
        console.error(error.message);
    }
}

const prompt = require("prompt-sync")();

function interactiveTileTest() {
    const tileId = parseInt(prompt("Enter a Tile ID to test: "), 10);
    testTileById(tileId);
}

interactiveTileTest();


