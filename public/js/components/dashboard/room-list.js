import dashboardAPI from '../../api/dashboardRestAPI.js';
import socketDashboardAPI from '../../api/dashboardWebsocketsAPI.js'

// Function to populate the room list on the dashboard
const populateRoomList = async (newRooms, status) => {
    const roomList = document.getElementById("room-list");

    const participants = await dashboardAPI.fetchParticipantsOfGamesByStatus(status);
    let i = 0;
    roomList.innerHTML = ""; // Clear existing rooms on dashboard
    for (const room of newRooms) {
        const roomCard = await createRoomCard(room, participants[i]);
        roomList.appendChild(roomCard);
        i++;
    }
};

// Function to create a room card
const createRoomCard = async (room, current_participants) => {
    const roomCard = document.createElement("div");
    roomCard.className = "room-card";

    // room card title
    const title = document.createElement("h3");
    title.textContent = `Room ${room.game_id}`;
    roomCard.appendChild(title);

    // room card info
    const max_players = room.max_number_of_players;
    // console.log(current_participants);

    // room card participant container
    const participantsContainer = document.createElement("div");
    participantsContainer.className = "participants-container";

    for (let i = 0; i < max_players; i++) {
        const participantContainer = document.createElement("div");
        const avatar = document.createElement("img");
        const playerName = document.createElement("p");
        participantContainer.className = "participant-container";
        playerName.className = "player-name";
        if (i < current_participants.length) {
            avatar.className = "avatar-black";
            playerName.textContent = current_participants[i].player_name;
        } else {
            avatar.className = "avatar-gray";
        }
        avatar.setAttribute("src", `../../assets/images/${avatar.className}.png`);
        avatar.setAttribute("alt", `${avatar.className} image`);
        participantContainer.appendChild(avatar);
        participantContainer.appendChild(playerName);
        participantsContainer.appendChild(participantContainer);
    }

    roomCard.appendChild(participantsContainer);
    // room card join button
    const joinButton = document.createElement("button");
    joinButton.className = "join-button";
    joinButton.textContent = "JOIN";

    if (room.status !== "initialized") {
        joinButton.disabled = true;
    }
    // Event listener for join button
    joinButton.addEventListener("click", async () => {
        console.log(`Joining ${room.name}`);
        // Initialize socket and create or join the provided by id room
        await socketDashboardAPI.initializeSocket(room.game_id);
    });
    roomCard.appendChild(joinButton);
    return roomCard;
};

export {
    populateRoomList,
    createRoomCard
};