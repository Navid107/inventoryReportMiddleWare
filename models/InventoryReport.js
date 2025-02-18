import mongoose from 'mongoose';

const inventoryReportSchema = new mongoose.Schema({
    // Define the fields based on the structure of your report
    // Example fields:
    reportId: String,
    documentId: String,
    content: Object,
    createdAt: { type: Date, default: Date.now }
});

const InventoryReport = mongoose.model('InventoryReport', inventoryReportSchema);

export default InventoryReport; 