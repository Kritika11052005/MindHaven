import { inngest } from "../inngest/client";
import { logger } from "./logger";

// Define proper interfaces for type safety
interface ActivityData {
  id: string;
  userId: string;
  duration?: number;
  difficulty?: string | number;
  feedback?: string;
  [key: string]: unknown; // Allow additional properties
}

interface SessionData {
  id: string;
  userId: string;
  requiresFollowUp?: boolean;
  type?: string;
  duration?: number;
  notes?: string;
  [key: string]: unknown; // Allow additional properties
}

interface MoodData {
  userId: string;
  mood: string | number;
  context?: string;
  activities?: string[];
  notes?: string;
  [key: string]: unknown; // Allow additional properties
}

export const sendActivityCompletionEvent = async (activityData: ActivityData) => {
  try {
    const { id, userId, duration, difficulty, feedback, ...restActivityData } = activityData;
    await inngest.send({
      name: "activity/completed",
      data: {
        userId,
        activityId: id,
        timestamp: new Date().toISOString(),
        duration,
        difficulty,
        feedback,
        // Spread remaining properties, but this will overwrite the above if they exist
        ...restActivityData,
      },
    });
    logger.info("Activity completion event sent successfully");
  } catch (error) {
    logger.error("Failed to send activity completion event:", error);
    throw error;
  }
};

export const sendTherapySessionEvent = async (sessionData: SessionData) => {
  try {
    const { id, userId, requiresFollowUp, type, duration, notes, ...restSessionData } = sessionData;
    await inngest.send({
      name: "therapy/session.created",
      data: {
        sessionId: id,
        userId,
        timestamp: new Date().toISOString(),
        requiresFollowUp: requiresFollowUp || false,
        sessionType: type,
        duration,
        notes,
        // Spread remaining properties, but this will overwrite the above if they exist
        ...restSessionData,
      },
    });
    logger.info("Therapy session event sent successfully");
  } catch (error) {
    logger.error("Failed to send therapy session event:", error);
    throw error;
  }
};

export const sendMoodUpdateEvent = async (moodData: MoodData) => {
  try {
    await inngest.send({
      name: "mood/updated",
      data: {
        timestamp: new Date().toISOString(),
        // Spread all properties from moodData, allowing them to override timestamp if needed
        ...moodData,
      },
    });
    logger.info("Mood update event sent successfully");
  } catch (error) {
    logger.error("Failed to send mood update event:", error);
    throw error;
  }
};