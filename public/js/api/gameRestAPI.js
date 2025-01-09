import { BASE_URL_API } from '../../config.js';
import authApi from './authApi.js';


const fetchParticipantsByGameId = async (gameId) => {
    try {
        const response = await fetch(`${BASE_URL_API}/games/${gameId}/participants`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authApi.getToken()}`
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

const gameRestAPI = {
    fetchParticipantsByGameId
};

export default gameRestAPI;