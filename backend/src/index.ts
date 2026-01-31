import express from 'express';
import { Request, Response } from 'express';
import { serve } from "inngest/express";
import { inngest } from './inngest/client';
import { functions as inngestFunctions } from "./inngest/aiFunctions";
import { logger } from './utils/logger';
import { connectDB } from './utils/db';
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import authRoutes from "./routes/auth";
import chatRouter from "./routes/chat";
import moodRouter from "./routes/mood";
import activityRouter from "./routes/activity";
import { errorHandler } from './middleware/errorHandling';

dotenv.config();

const app = express();
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

// Inngest endpoint
app.use("/api/inngest", serve({ 
  client: inngest, 
  functions: inngestFunctions 
}));

// Routes
app.get("/", (req: Request, res: Response) => {
  res.send("Hello world");
});

app.use("/auth", authRoutes);
app.use("/chat", chatRouter);
app.use('/api/mood', moodRouter);
app.use('/api/activity', activityRouter);

// Error handling middleware
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    await connectDB();
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
      logger.info(`Inngest endpoint available at http://localhost:${PORT}/api/inngest`);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();