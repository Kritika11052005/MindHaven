import { Request, Response, NextFunction } from "express";
import { Activity } from "../models/Activity";
import { logger } from "../utils/logger";
import { sendActivityCompletionEvent } from "../utils/inngestEvents";

export const getActivities = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Fetch all activities for the user from database
    const activities = await Activity.find({ userId }).sort({ timestamp: -1 });
    
    res.json(activities);
  } catch (error) {
    console.error("Error fetching activities:", error);
    res.status(500).json({ message: "Failed to fetch activities" });
  }
};

// ADD THIS NEW FUNCTION
export const getTodayActivities = async (req: Request, res: Response) => {
  try {
    console.log("Fetching today's activities for user:", req.user?._id);
    
    const userId = req.user?._id;
    
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Get today's date range (start and end of today)
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    // Fetch activities for today using your Activity model
    const activities = await Activity.find({
      userId: userId,
      timestamp: {  // Using 'timestamp' field as seen in your logActivity function
        $gte: startOfDay,
        $lt: endOfDay
      }
    }).sort({ timestamp: -1 }); // Sort by newest first
    
    console.log(`Found ${activities.length} activities for today`);
    res.json(activities);
    
  } catch (error) {
    console.error("Error fetching today's activities:", error);
    res.status(500).json({ message: "Failed to fetch today's activities" });
  }
};

// Log a new activity
export const logActivity = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("logActivity req.user:", req.user);
    console.log("Body received:", req.body);
    const { type, name, description, duration, difficulty, feedback } =
      req.body;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const activity = new Activity({
      userId,
      type,
      name,
      description,
      duration,
      difficulty,
      feedback,
      timestamp: new Date(),
    });

    await activity.save();
    logger.info(`Activity logged for user ${userId}`);

    // Send activity completion event to Inngest - Convert ObjectIds to strings
    await sendActivityCompletionEvent({
      userId: userId.toString(), // Convert to string
      id: activity.id, // Mongoose provides this as a string getter
      type,
      name,
      duration,
      difficulty,
      feedback,
      timestamp: activity.timestamp,
    });

    res.status(201).json({
      success: true,
      data: activity,
    });
  } catch (error) {
    next(error);
  }
};