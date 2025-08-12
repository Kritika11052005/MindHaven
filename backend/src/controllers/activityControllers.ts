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

// Log a new activity - FIXED VERSION
export const logActivity = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("logActivity req.user:", req.user);
    console.log("Body received:", req.body);
    
    const { type, name, description, duration, difficulty, feedback } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Validate required fields
    if (!type || !name) {
      return res.status(400).json({ 
        success: false,
        message: "Type and name are required fields" 
      });
    }

    const activity = new Activity({
      userId,
      type,
      name,
      description: description || '', // Provide default empty string
      duration: duration || 0, // Provide default value
      difficulty: difficulty || 1, // Provide default value
      feedback: feedback || '', // Provide default empty string
      timestamp: new Date(),
    });

    console.log("Saving activity:", activity);
    await activity.save();
    console.log("✅ Activity saved successfully");
    
    logger.info(`Activity logged for user ${userId}`);

    // Send activity completion event to Inngest with better error handling
    try {
      await sendActivityCompletionEvent({
        userId: userId.toString(), // Convert to string
        id: activity.id, // Mongoose provides this as a string getter
        type,
        name,
        duration: duration || 0,
        difficulty: difficulty || 1,
        feedback: feedback || '',
        timestamp: activity.timestamp,
      });
      console.log("✅ Inngest event sent successfully");
    } catch (inngestError) {
      console.warn("⚠️ Inngest event failed (continuing):", inngestError);
      // Don't fail the request if Inngest fails
    }

    console.log("✅ Sending success response");
    res.status(201).json({
      success: true,
      message: "Activity logged successfully",
      data: activity,
    });

  } catch (error) {
    console.error("❌ ACTIVITY ERROR DETAILS:", error);
    console.error("❌ ERROR MESSAGE:", error instanceof Error ? error.message : 'Unknown error');
    console.error("❌ ERROR STACK:", error instanceof Error ? error.stack : 'No stack trace');
    
    // Handle the error properly instead of using next(error)
    res.status(500).json({
      success: false,
      message: "Failed to log activity",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
};