import express from 'express';
import connectToMongoDB from './db.js';
import InventoryReport from './models/InventoryReport.js';
import { getInventoryReport, getSalesReport  } from './inventoryreport.js';
import authMiddleware from './authMiddleware.js';

const router = express.Router();

// Connect to MongoDB
connectToMongoDB();
// create a route for home page
router.get('/', (req, res) => {
    res.send('Welcome to the inventory report API');
});
// GET /inventory-report
// route.js
router.post('/inventory-report', async (req, res) => {
    try {
        const result = await getInventoryReport(req);
        if (result.error) {
            // Send the error response back to the client
            return res.status(400).json({ error: result.error });
        }
        // Send the success response with the token
        res.status(200).json({ message: 'Inventory report requested and saved to database.', token: result.token });
    } catch (error) {
        // Handle unexpected errors
        res.status(500).send('Error requesting inventory report.');
    }
});
router.post('/sales-report', async (req, res) => {
    try {
        const result = await getSalesReport(req);
        if (result.error) {
            // Send the error response back to the client
            return res.status(400).json({ error: result.error });
        }
        // Send the success response with the token
        res.status(200).json({ message: 'Inventory report requested and saved to database.', token: result.token });
    } catch (error) {
        // Handle unexpected errors
        res.status(500).send('Error requesting inventory report.');
    }
});

// GET /extracted-report
router.get('/extracted-report', authMiddleware, async (req, res) => {
    try {
        const userToken = req.headers['token'];
        const report = await InventoryReport.findOne({ token: userToken });
        if (!report) {
            return res.status(404).send('No report found for the provided token');
        }

        res.status(200).json(report.content);
    } catch (error) {
        res.status(500).send('Error retrieving inventory data.');
    }
});

export default router;
