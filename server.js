import express from 'express';
import dotenv from 'dotenv';
import router from './route.js';
import authMiddleware from './authMiddleware.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT;

// Use JSON middleware
app.use(express.json());

// Use the router
app.use('/', router);

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 