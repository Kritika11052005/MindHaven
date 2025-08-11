import mongoose from 'mongoose'
import {logger} from './logger'


const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://Kritika_benjwal:LPkOwsTISw37cPEd@ai-therapist-agent.xtxhznr.mongodb.net/ai-therapist-agent?retryWrites=true&w=majority&appName=ai-therapist-agent";

export const connectDB=async()=>{
    try{
        await mongoose.connect(MONGODB_URI);
        logger.info("Connected to MongoDB Atlas")
    }catch(error){
        logger.error("MongoDB connection error:",error)
        process.exit(1);
    }
}