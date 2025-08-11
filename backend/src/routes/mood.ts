import express from "express"
import { auth } from "../middleware/auth"
import { createdMood, getMoodData, getMoodHistory } from "../controllers/moodController";

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// POST /api/mood - Create new mood entry
router.post("/", createdMood);

// GET /api/mood - Get mood data (today's data by default, or filtered by date)
// Query params: ?date=YYYY-MM-DD or ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
router.get("/", getMoodData);

// GET /api/mood/history - Get mood history for charts/trends
// Query params: ?days=30 or ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
router.get("/history", getMoodHistory);

export default router;