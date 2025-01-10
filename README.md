# Blokus Multiplayer Web Game

Blokus is a strategic board game where players take turns placing uniquely shaped tiles on a shared board. The goal is to place as many tiles as possible while adhering to placement rules. This project implements a multiplayer version of Blokus using Node.js, WebSockets, and MySQL.

---

## **Technologies Used**

### Backend
- **Node.js**: For building the server and handling API requests.
- **Express.js**: To simplify routing and middleware.
- **Socket.IO**: For real-time communication between players.
- **MySQL**: To manage game state and player data.
- **JSON Web Tokens (JWT)**: For secure authentication.

### Frontend
- **HTML/CSS/JavaScript**: For a dynamic and interactive UI.
- **Socket.IO Client**: To handle WebSocket communication.

---

## **Features**

### **Core Gameplay**
- **Player Management**:
    - Players log in as guests with unique usernames.
    - JWT-based authentication.
- **Game Lobby**:
    - Players can create and join game rooms.
    - Real-time updates for lobby status using WebSockets.
- **Tile Placement**:
    - All 21 Blokus tile shapes implemented.
    - Placement rules enforced, including:
        - Corner-touch requirement.
        - No edge-touch rule for same-player tiles.
        - Board boundaries.
- **Game Synchronization**:
    - Real-time updates for moves using WebSockets.
    - Persistent game state using MySQL.

### **WebSocket Integration**
- Players automatically join WebSocket rooms corresponding to their game.
- Broadcast events for:
    - Player joins and leaves.
    - Game moves.
    - Game start and end.

---
## **Setup Instructions**

### Prerequisites 

#### Without Docker:
1. **Node.js and npm**: [Download and Install](https://nodejs.org/)
2. **MySQL**
#### With Docker:
1. **Docker**: [Download and Install](https://www.docker.com/)
2. **Docker Compose**: [Download and Install](https://docs.docker.com/compose/install/)

### Steps

1. Clone this repository:
   ```bash
   git clone https://github.com/iee-ihu-gr-course1941/ADISE24_Blockage.git
   cd ADISE24_Blockage/backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up the database:

4. Configure the backend:
    - Copy `.env.example` to `.env`:
      ```bash
      cp .env.example .env
      ```
    - Update the `.env` file with your MySQL credentials and JWT secret.

5. Start the backend:
   ```bash
   npm start
   ```

### Docker Setup

- Run:
  ```bash
  docker-compose up -d
  ```

---

## **Gameplay Overview**

1. **Creating a Game**:
    - A player creates a game via an HTTP request.
    - The player is added as the first participant and assigned a color.

2. **Joining a Game**:
    - Players can join available games until the maximum number of players is reached.
    - Each player is assigned a unique color dynamically.

3. **Tile Placement**:
    - Players take turns placing tiles on the board.
    - Placement rules are validated in real-time.

4. **Game End**:
    - The game ends when all players have placed all possible tiles or when no moves remain.
    - Scores are calculated based on unplaced tiles.

---

## API Endpoints

### **Authentication**
- `POST /auth/guest`: Login as a guest player.

### **Game Management**
- `GET /games`: Get all available games.
- `GET /games/:gameId`: Get game details.
- `GET /games/status`: Get games by status.
- `GET /games/participants`: Get all the participants of games by status.
- `GET /games/:gameId/participants`: Get all participants by gameId.
- `POST /games/create`: Create a new game.
- `POST /games/join`: Join an existing game.
- `DELETE /games/leave`: Delete a game.

## WebSocket Events
### Client-Side Events
- `connection`: Connect to the server.
- `player-left`: Notify player leaves from lobby.
- `place-tile`: Place a tile on the board.
- `game-ended`: Notify game end.
- `disconnect`: Disconnect from the server.

### Server-Side Events
- `connect`: Notify connection.
- `error`: Notify an error.
- `game-created`: Notify game created.
- `player-joined`: Notify player joins the game.
- `player-left`: Notify player leaves from lobby.
- `game-started`: Notify game start.
- `board-initialized`: Initialize the game board.
- `game-update`: Update game state.
- `game-deleted`: Notify game deleted.
- `game-ended`: Notify game end.
