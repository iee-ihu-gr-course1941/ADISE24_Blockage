import { BASE_URL_API } from '../../config.js';
import authApi from './authApi.js';



const validateAndRedirectToGame = async (gameId) => {
    try {
        const response = await fetch(`${BASE_URL_API}/game?gameId=${gameId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`
            },
        });

        // const data = await response.json();


        if (response.redirected) {
            // Redirect according to the server response
            window.location.href = response.url;
            return;
    }
         if (!response.ok) {
            if (response.status === 403) {
                throw new Error(`error: ${data.message}`);
            }
            throw new Error(`${data.message}`);
            // window.location.href = '/dashboard';
            // return;
        }

        const html = await response.text();
        document.body.innerHTML = html;
        // window.location.href = `/game?gameId=${gameId}`


    } catch (error) {
        console.error('Error fetching game page:', error);
        window.location.href = '/dashboard';
    }
};

const staticFilesAPI = {
    validateAndRedirectToGame
};

export default staticFilesAPI;