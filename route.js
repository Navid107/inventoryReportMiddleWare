import express from 'express';
import connectToMongoDB from './db.js';
import InventoryReport from './models/InventoryReport.js';
import { getReport } from './inventoryreport.js';

const router = express.Router();

// Connect to MongoDB
connectToMongoDB();

// GET /inventory-report
router.get('/inventory-report', async (req, res) => {
    try {
        await getReport();
        res.status(200).send('Inventory report requested and saved to database.');
    } catch (error) {
        res.status(500).send('Error requesting inventory report.');
    }
});

// GET /send-inventory-data
router.get('/exctracted-report', async (req, res) => {
    try {
        const reports = await InventoryReport.find();
        res.status(200).json(reports);
    } catch (error) {
        res.status(500).send('Error retrieving inventory data.');
    }
});

export default router;
