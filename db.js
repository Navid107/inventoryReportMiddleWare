import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectToMongoDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error.message);
        throw error;
    }
};

export default connectToMongoDB; 