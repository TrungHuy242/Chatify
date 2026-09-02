import express from "express";
import { getAllContacts, getMessagesByUserId, sendMessage, getChatPartners, markMessagesAsRead, revokeMessage } from "../controllers/message.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { arcjetProtection } from "../middleware/arcjet.middleware.js";
const router = express.Router();

router.use(arcjetProtection, protectRoute);

router.get("/contacts", getAllContacts); 
router.get("/chats", getChatPartners);
router.get("/:id", getMessagesByUserId);
router.post("/send/:id", sendMessage);
router.put("/:id/read", markMessagesAsRead);
router.delete("/:id/revoke", revokeMessage);

export default router;