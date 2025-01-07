import authApi from '../api/authApi.js';

const login = async () => {
            document.addEventListener('DOMContentLoaded', async () => {
            const loginForm = document.getElementById('login-form');
            const errorMessage = document.getElementById('error-message');
            loginForm.addEventListener('submit', async (event) => {
                event.preventDefault();
                // const username = document.getElementById('username').value;
                // const password = document.getElementById('password').value;
                console.log(loginForm);

                const playerName = document.getElementById('player-name').value;

                const playerNameTrimmed = playerName.trim();
                
                if (playerNameTrimmed === '') {
                    errorMessage.textContent = `Please fill in a valid name.  Please try again!`;
                    errorMessage.style.display = 'block';
                    return;
                }
                if (playerNameTrimmed.length > 20) {
                    errorMessage.textContent = `No more than 20 characters allowed. Please try again!`;
                    errorMessage.style.display = 'block';
                    return;
                }

                try {
                    await authApi.login(playerName.trim());
                    window.location.href = '/dashboard';
                } catch (error) {
                    // console.error(error);
                    errorMessage.textContent = `Login failed: ${error.message.toLowerCase()}!`;
                    errorMessage.style.display = 'block';
                }

            });
        });
    };

export default login;
