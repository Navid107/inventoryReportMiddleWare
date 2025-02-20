import crypto from 'crypto';
import InventoryReport from './models/InventoryReport.js';

// Function to generate a random token
export const generateToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

// Function to generate a token, save it in the database, and send it to the user
export const createAndSendToken = async (req, res, reportData) => {
    try {
        const token = generateToken();

        // Save the token and report data to the database
        const report = new InventoryReport({
            token: token,
            content: reportData,
        });
        await report.save();

        // Send the token back to the user
        res.status(200).json({ message: 'Token generated and saved.', token: token });
    } catch (error) {
        console.error('Error generating or saving token:', error.message);
        res.status(500).send('Error generating or saving token.');
    }
};
