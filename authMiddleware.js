// authMiddleware.js
import dotenv from 'dotenv';
import InventoryReport from './models/InventoryReport.js';

dotenv.config();

const authMiddleware = async (req, res, next) => {
    const userToken = req.headers['token'];
    console.log("Token received in request:", userToken);
    if (!userToken) {
        return res.status(401).send('Token is required');
    }

    try {
        // Use async/await to find the report
        const report = await InventoryReport.findOne({ token: userToken });
        if (!report) {
            return res.status(401).send('Invalid token');
        }
        // Token is valid, proceed to the next middleware or route handler
        next();
    } catch (err) {
        console.error('Error validating token:', err.message);
        return res.status(500).send('Internal server error');
    }
};

export default authMiddleware;