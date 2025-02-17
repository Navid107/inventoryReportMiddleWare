import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

export const getAccessToken = async () => {
    try {
        const authUrl = 'https://api.amazon.com/auth/o2/token';
        const payload = {
            grant_type: 'refresh_token',
            refresh_token: process.env.AMZ_REFRESH_TOKEN,
            client_id: process.env.AMZ_CLIENT_ID,
            client_secret: process.env.AMZ_CLIENT_SECRET
        };

        const response = await axios.post(authUrl, new URLSearchParams(payload), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        return response.data.access_token;
    } catch (error) {
        console.error('Error getting access token:', error.response?.data || error.message);
        throw error;
    }
};

// Example usage
const main = async () => {
    try {
        const accessToken = await getAccessToken();
        console.log('Access Token:', accessToken);
        return accessToken;
    } catch (error) {
        console.error('Main error:', error.message);
        throw error;
    }
};

// Only run main if this file is run directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
    main();
} 
