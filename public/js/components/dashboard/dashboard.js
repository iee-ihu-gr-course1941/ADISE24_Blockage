import authApi from '../../api/authApi.js';
import dashboardAPI from '../../api/dashboardRestAPI.js';
import socketAPI from '../../api/dashboardWebsocketsAPI.js'
import { populateRoomList } from './room-list.js';

document.addEventListener('DOMContentLoaded', async () => {
    const token = authApi.getToken();

    // Redirects to login page if token is missing
    if (!token) {
        window.location.href = '/login';
        return;
    }

    const playerName = document.getElementById("player-name");
    // const roomList = document.getElementById("room-list");
    const createRoomButton = document.getElementById("create-room-button");
    const dropdownButton = document.getElementById("dropdown-button");
    const dropdownContent = document.getElementById("dropdown-content");

    playerName.innerHTML = sessionStorage.getItem('playerName');

    // Fetch all games/rooms with status: 'initialized'
    const initGamesStatus = 'initialized';
    const rooms = await dashboardAPI.fetchGamesByStatus(initGamesStatus);
    console.log('No of rooms')
    console.log(rooms.length);
    populateRoomList(rooms, initGamesStatus);

    //  Event listener for create button
    createRoomButton.addEventListener('click', async () => {
        try {
            // create a new game
            let max_players = prompt("Please enter the number of players. Valid numbers: '2', '4'", "2")
            if (max_players == null) return;
            const { gameId } = await dashboardAPI.createGame(max_players);
            console.log(gameId); // gameID

            // Update the dropdown button text & fetch the content for the selected view
            const dropdownValue = dropdownButton.textContent
            fetchDashboardContent(dropdownValue)

            // SocketIO IMPLEMENTATION
            await socketAPI.initializeSocket(gameId);

        } catch (error) {
            alert(error.message.split('message:')[1]);
        }
    })

    // Event listener for dropdown items
    dropdownContent.addEventListener('click', (event) => {
        event.stopPropagation();
        const selectedItem = event.target.closest("div");

        if (!selectedItem)
            return;

        const selectedValue = selectedItem.getAttribute("data-value");
        console.log(selectedValue);

        // Update dropdown button text
        dropdownButton.textContent = selectedValue;

        // Update the dashboard content based on the selected view
        fetchDashboardContent(selectedValue);
    });
});

const fetchDashboardContent = async (viewType) => {
    console.log(`Fetching content for view: ${viewType}`);
    // Update the rooms data dynamically based on the view type
    let rooms;
    switch (viewType) {
        case "IN LOBBY":
            rooms = await dashboardAPI.fetchGamesByStatus('initialized');
            await populateRoomList(rooms, 'initialized');
            break;
        case "In Game":
            rooms = await dashboardAPI.fetchGamesByStatus('started');
            await populateRoomList(rooms, 'started');
            break;
        case "Both":
            rooms = await dashboardAPI.fetchGamesByStatus('initialized-started');
            await populateRoomList(rooms, 'initialized-started');
            break;
        default:
            rooms = await dashboardAPI.fetchGamesByStatus('initialized');
            await populateRoomList(rooms, 'initialized');
    }
}
// const dashboard = {
//     fetchDashboardContent
// };

// export default dashboard;