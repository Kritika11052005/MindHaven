// In src/routes/activity.ts
import express from "express"
import { auth } from "../middleware/auth"
import { logActivity, getActivities, getTodayActivities } from "../controllers/activityControllers"

const router = express.Router();
router.use(auth);

router.get("/", getActivities);           // GET /api/activities/
router.get("/today", getTodayActivities); // GET /api/activities/today
router.post("/", logActivity);            // POST /api/activities/ ← ADD THIS LINE

export default router;