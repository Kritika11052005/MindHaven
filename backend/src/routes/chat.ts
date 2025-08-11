import express from "express"
import {
    sendMessage,
    getSessionHistory,
    getChatSession,
    getChatHistory,
    createChatSession,
    getAllChatSessions
} from "../controllers/chat"

import { auth } from "../middleware/auth"
const router=express.Router();
router.use(auth);
router.get("/sessions", getAllChatSessions);
router.post("/sessions",createChatSession)
router.get("/sessions/:sessionId",getChatSession);
router.post("/sessions/:sessionId/messages",sendMessage)
router.get("/sessions/:sessionId/history",getChatHistory)
export default router;

