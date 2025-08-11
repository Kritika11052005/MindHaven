import { Document, Schema, model, Types } from "mongoose";

// Define proper interface for analysis data
interface IAnalysis {
  sentiment?: string;
  emotions?: string[];
  keyTopics?: string[];
  riskFactors?: string[];
  recommendations?: string[];
  [key: string]: unknown; // Allow additional properties
}

export interface IChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  metadata?: {
    analysis?: IAnalysis; // Use proper typing instead of 'any'
    currentGoal?: string | null;
    progress?: {
      emotionalState?: string;
      riskLevel?: number;
    };
  };
}

export interface IChatSession extends Document {
  _id: Types.ObjectId;
  sessionId: string;
  userId: Types.ObjectId;
  startTime: Date;
  status: "active" | "completed" | "archived";
  messages: IChatMessage[];
}

const chatMessageSchema = new Schema<IChatMessage>({
  role: { type: String, required: true, enum: ["user", "assistant"] },
  content: { type: String, required: true },
  timestamp: { type: Date, required: true },
  metadata: {
    analysis: Schema.Types.Mixed, // Keep as Mixed for MongoDB flexibility
    currentGoal: String,
    progress: {
      emotionalState: String,
      riskLevel: Number,
    },
  },
});

const chatSessionSchema = new Schema<IChatSession>({
  sessionId: { type: String, required: true, unique: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  startTime: { type: Date, required: true },
  status: {
    type: String,
    required: true,
    enum: ["active", "completed", "archived"],
  },
  messages: [chatMessageSchema],
});

export const ChatSession = model<IChatSession>(
  "ChatSession",
  chatSessionSchema
);