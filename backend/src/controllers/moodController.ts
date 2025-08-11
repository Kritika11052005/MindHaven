import {Request, Response, NextFunction} from "express"
import {Mood} from "../models/Mood"
import {logger} from "../utils/logger"

// Create mood entry (existing function - keep as is)
export const createdMood = async(
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const {score, note, context, activities} = req.body
        const userId = req.user?._id;
        
        if(!userId){
            return res.status(401).json({message:"User not authenticated"});
        }
        
        const mood = new Mood({
            userId,
            score,
            note,
            context,
            activities,
            timestamp: new Date(),
        });
        
        await mood.save();
        logger.info(`Mood logged for user ${userId}`)
        
        res.status(201).json({
            success: true,
            data: mood,
        })
    } catch (error) {
        next(error)
    }
}

// NEW: Get mood data (add this function)
export const getMoodData = async(
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?._id;
        
        if(!userId){
            return res.status(401).json({message:"User not authenticated"});
        }

        // Get query parameters for filtering
        const { date, startDate, endDate } = req.query;

        const query: any = { userId };

        // If specific date is provided
        if (date) {
            const targetDate = new Date(date as string);
            const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
            const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);
            
            query.timestamp = {
                $gte: startOfDay,
                $lte: endOfDay
            };
        }
        // If date range is provided
        else if (startDate && endDate) {
            query.timestamp = {
                $gte: new Date(startDate as string),
                $lte: new Date(endDate as string)
            };
        }
        // Default: today's data
        else {
            const today = new Date();
            const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);
            
            query.timestamp = {
                $gte: startOfDay,
                $lte: endOfDay
            };
        }

        const moods = await Mood.find(query).sort({ timestamp: -1 });
        
        logger.info(`Retrieved ${moods.length} mood entries for user ${userId}`);
        
        res.status(200).json({
            success: true,
            data: moods,
            count: moods.length
        });
        
    } catch (error) {
        next(error)
    }
}

// NEW: Get mood history (add this function)
export const getMoodHistory = async(
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?._id;
        
        if(!userId){
            return res.status(401).json({message:"User not authenticated"});
        }

        // Default to last 30 days if no date range provided
        const { startDate, endDate, days = 30 } = req.query;
        
        let query: any = { userId };
        
        if (startDate && endDate) {
            query.timestamp = {
                $gte: new Date(startDate as string),
                $lte: new Date(endDate as string)
            };
        } else {
            // Get last N days
            const endOfToday = new Date();
            const startOfPeriod = new Date();
            startOfPeriod.setDate(startOfPeriod.getDate() - Number(days));
            
            query.timestamp = {
                $gte: startOfPeriod,
                $lte: endOfToday
            };
        }

        const moods = await Mood.find(query).sort({ timestamp: 1 });
        
        logger.info(`Retrieved mood history: ${moods.length} entries for user ${userId}`);
        
        res.status(200).json({
            success: true,
            data: moods,
            count: moods.length
        });
        
    } catch (error) {
        next(error)
    }
}