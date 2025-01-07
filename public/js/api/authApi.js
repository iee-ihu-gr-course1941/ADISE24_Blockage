
import { BASE_URL_API } from '../../config.js';

/**
 * Logs in a user by sending credentials to the backend API.
 * @param {string} playerName - The user's name.
 * @returns {Promise<object>} - Returns a promise with the server response.
 */

const login = async (playerName) => {
  try {
    const response = await fetch(`${BASE_URL_API}/auth/guest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ playerName }),
    });

    const data = await response.json();
    console.log(data);

    if (!response.ok) {
      throw new Error(`${data.error}`);
    }
    // Save the JWT token in sessionStorage & playerName
    
    // TODO: Do no cache the playerName in session storage
    sessionStorage.setItem('playerName', playerName)
    sessionStorage.setItem('authToken', data.token);
    return data;
  } catch (error) {
    // console.error('Login failed:', error);
    throw error;
  }
};


/**
 * Logs out the user by clearing the JWT token from sessionStorage.
 */
const logout = () => {
  sessionStorage.removeItem('authToken');
};

/**
 * Retrieves the stored JWT token.
 * @returns {string|null} - The JWT token or null if not available.
 */
const getToken = () => {
  return sessionStorage.getItem('authToken');
};

/**
 * Validates if a user is authenticated by checking the token.
 * @returns {boolean} - Returns true if the user is authenticated.
 */
const isAuthenticated = () => {
  return !!sessionStorage.getItem('authToken');
};

const authApi = {
  login,
  logout,
  getToken,
  isAuthenticated
};

export default authApi;
