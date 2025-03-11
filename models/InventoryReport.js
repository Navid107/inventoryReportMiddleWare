import mongoose from 'mongoose';

const inventoryReportSchema = new mongoose.Schema({
    token: String, // Ensure this field is defined
    content: Object,
    createdAt: { type: Date, default: Date.now }
});

const salesReportSchema = new mongoose.Schema({
    token: String, // Ensure this field is defined
    content: Object,
    createdAt: { type: Date, default: Date.now }
});

// Create the models
const InventoryReport = mongoose.model('InventoryReport', inventoryReportSchema);
const SalesReport = mongoose.model('SalesReport', salesReportSchema);

// Export InventoryReport as the default export 
export default InventoryReport;
// Also export SalesReport as a named export
export { SalesReport };