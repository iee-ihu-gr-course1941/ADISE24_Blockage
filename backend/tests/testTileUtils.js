const {
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
} = require('../utils/tileUtils');

const prompt = require("prompt-sync")();

function interactiveTileTest() {
    const tileId = parseInt(prompt("Enter a Tile ID to test: "), 10);
    testTileById(tileId);
}

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

async function main() {
    try {
        // allocateTiles(1, [{ player_id: 1 }, { player_id: 2 }]);

        //constructBoard(gameId, numberOfLines, numberOfColumns)
        let board = await constructBoard(94, 20, 20); // Wait for the promise to resolve

        // Visualize the board
        visualizeBoard(board);

        // await reloadGameState(1)
        //
        // // Validate tile placement
        // const validationResult = await validateTilePlacement(board,1, 2, 3, 16, 15, 0, "90");
        //
        // if (validationResult.valid) {
        //     console.log('Placement is valid!');
        //     // Update the board state
        //     await placeTile(1, 2, 3, 16, 15, 0, '90');
        //     if (await checkNoRemainingMoves(1, board)){
        //         console.log('No remaining moves!');
        //     } else {
        //         console.log('There are remaining moves.');
        //     }
        // }
        // else {
        //     console.log('Invalid placement:', validationResult.reason);
        // }
        //
        // board = await constructBoard(1, 20, 20); // Wait for the promise to resolve
        //
        // // Visualize the board
        // visualizeBoard(board);
    } catch (error) {
        console.error('Error visualizing the board:', error.message);
    }
}

main();
