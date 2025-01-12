import dashboardAPI from '../../api/dashboardRestAPI.js';
import socketDashboardAPI from '../../api/dashboardWebsocketsAPI.js'

// Show lobby card by room/game id
const showLobbyCard = async (roomId) => {
    const lobbyCard = document.getElementById("lobby-card");
    const dashboardOverlay = document.getElementById("dashboard-overlay");

    lobbyCard.innerHTML = "";

    const room = await dashboardAPI.fetchGameById(roomId); //get room by id -- ensuring the room latest info
    if (!room) {
        hideLobbyCard();
        return;
    }
    const currentParticipants = await dashboardAPI.fetchParticipantsByGameId(room.game_id); // get current participants of room
    // console.log(currentParticipants);
    // const arrayKT = [...currentParticipants];
    // console.log(arrayKT);

    //title
    const title = document.createElement("h2");
    title.className = "lobby-title";
    title.textContent = `Room ${room.game_id}`;
    lobbyCard.appendChild(title);

    // participants info
    const maxPlayers = room.max_number_of_players;

    const participantsLobbyContainer = document.createElement("div");
    participantsLobbyContainer.className = "participants-lobby-container";

    // fill in with participants
    for (let i = 0; i < maxPlayers; i++) {
        const participantLobbyContainer = document.createElement("div");
        const avatar = document.createElement("img");
        const playerNumberText = document.createElement("p");
        const playerName = document.createElement("p");
        const playerColor = document.createElement("p");

        participantLobbyContainer.className = "participant-lobby-container";
        playerNumberText.className = "player-number-text";
        playerName.className = "player-name";
        playerColor.className = "player-color";
        // console.log(currentParticipants);

        if (i < currentParticipants.length) {
            avatar.className = "avatar-black";
            playerNumberText.textContent = `Player ${i + 1}:`;
            playerName.textContent = currentParticipants[i].player_name;
            playerColor.textContent = currentParticipants[i].color;
            playerColor.style.color = playerColor.textContent;
        } else {
            avatar.className = "avatar-gray";
            playerNumberText.textContent = `Player ${i + 1}:`;
        }
        avatar.setAttribute("src", `../../assets/images/${avatar.className}.png`);
        avatar.setAttribute("alt", `${avatar.className} image`);
        participantLobbyContainer.appendChild(avatar);
        participantLobbyContainer.appendChild(playerNumberText);
        participantLobbyContainer.appendChild(playerName);
        participantLobbyContainer.appendChild(playerColor);

        // crown image: only for leader
        if (i === 0) {
            const crownImg = document.createElement("img");
            crownImg.className = "crown-img";
            crownImg.setAttribute("src", "../../assets/images/crown.png");
            participantLobbyContainer.appendChild(crownImg);
        }
        participantsLobbyContainer.appendChild(participantLobbyContainer);
    }
    lobbyCard.appendChild(participantsLobbyContainer);
    // waiting message
    const waitingMessage = document.createElement("p");
    waitingMessage.className = "waiting-message";
    waitingMessage.textContent = "Waiting for other players to join...";
    lobbyCard.appendChild(waitingMessage);
    // leave button
    const leaveButton = document.createElement("button");
    leaveButton.className = "leave-button";
    leaveButton.textContent = "LEAVE";
    // Event listener for leave button
    leaveButton.addEventListener("click", async () => {
        await socketDashboardAPI.emitEvent('player-left', async (data) => {
            console.log('Player left:', data);
        });
        location.reload();
        // hide lobby card
        lobbyCard.classList.add("hidden");
        dashboardOverlay.classList.add("hidden");
    });
    lobbyCard.appendChild(leaveButton);
    // appear lobby card
    lobbyCard.classList.remove("hidden");
    dashboardOverlay.classList.remove("hidden");
    return lobbyCard;
}

// Hide lobby card
const hideLobbyCard = () => {
    const lobbyCard = document.getElementById("lobby-card");
    const dashboardOverlay = document.getElementById("dashboard-overlay");
    lobbyCard.classList.add("hidden");
    dashboardOverlay.classList.add("hidden");
}

// Disable leave button and change waiting message for 5 secs
const disableLobbyCard = () => {
//     const leaveButton = document.getElementsByClassName("leave-button")[0];
//     const waitingMessage = document.getElementsByClassName("waiting-message")[0];
    
//     if (!leaveButton || !waitingMessage) {
//         console.error("Leave button or waiting message not found");
//         return;
//     }

//     leaveButton.disabled = true;
//     let i = 0;
//     const intervalId = setInterval(function () {
//         waitingMessage.innerHTML = `Game starts in: <b style="color: red;">${5 - i}</b>`;
//         i++;
//         if (i > 5) {
//             clearInterval(intervalId);
//         }
//     }, 1000);
}

export {
    showLobbyCard,
    hideLobbyCard,
    disableLobbyCard
}