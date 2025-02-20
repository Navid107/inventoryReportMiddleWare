import mongoose from 'mongoose';

const inventoryReportSchema = new mongoose.Schema({
    token: String, // Ensure this field is defined
    content: Object,
    createdAt: { type: Date, default: Date.now }
});

const InventoryReport = mongoose.model('InventoryReport', inventoryReportSchema);

export default InventoryReport;