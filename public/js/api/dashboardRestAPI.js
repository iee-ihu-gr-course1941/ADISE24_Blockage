import { BASE_URL_API } from '../../config.js';
import authApi from './authApi.js';

const createGame = async (max_number_of_players) => {
    try {
        const response = await fetch(`${BASE_URL_API}/games/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authApi.getToken()}`
            },
            body: JSON.stringify({ max_number_of_players })
        });

        // console.log(response)
        const data = await response.json();
        console.log(data);

        if (!response.ok) {

            if (response.status === 400) {
                throw new Error(`error: ${data.error}, message: ${data.message}`);
            }
            throw new Error(`${data.error}`);
        }
        return data;

    } catch (error) {
        throw error;
    }
};

const fetchGameById = async (gameId) => {
    try {
        const response = await fetch(`${BASE_URL_API}/games/${gameId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authApi.getToken()}`
            }
        });
        let data = await response.json();
        if (!response.ok) {
            throw new Error(`${data.error || data.message}`);
        }
        const { game } = data;
        return game;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

const fetchAllGames = async () => {
    try {
        const response = await fetch(`${BASE_URL_API}/games/`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authApi.getToken()}`
            }
        });
        // console.log(response);
        let data = await response.json();

        if (!response.ok) {
            throw new Error(`${data.error}`);
        }
        const { games } = data;
        return games;
    } catch (error) {
        console.log(error);
        throw error;
    }
};

const fetchGamesByStatus = async (status) => {
    try {
        const response = await fetch(`${BASE_URL_API}/games/status?status=${status}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authApi.getToken()}`
            }
        });
        // console.log(response);
        let data = await response.json();

        if (!response.ok) {
            throw new Error(`${data.error}`);
        }
        const { games } = data;
        return games;
    } catch (error) {
        console.log(error);
        throw error;
    }
};

const fetchParticipantsByGameId = async (gameId) => {
    try {
        const response = await fetch(`${BASE_URL_API}/games/${gameId}/participants`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authApi.getToken()}`
                // 'Cache-Control': 'no-cache',
            }
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(`${data.error}`);
        }
        const { participants } = data;
        return participants;
    } catch (error) {
        throw error;
    }
};

const fetchParticipantsOfGamesByStatus = async (status) => {
    try {
        const response = await fetch(`${BASE_URL_API}/games/participants?status=${status}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authApi.getToken()}`
            }
        });
        const data = await response.json();
        // console.log(data);
        if (!response.ok) {
            throw new Error(`${data.error}`);
        }
        const { participants } = data;
        return participants;
    } catch (error) {
        throw error;
    }
};

const dashboardAPI = {
    createGame,
    fetchGameById,
    fetchAllGames,
    fetchGamesByStatus,
    fetchParticipantsByGameId,
    fetchParticipantsOfGamesByStatus
};

export default dashboardAPI;