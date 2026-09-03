import express from "express";
import { getAllContacts, getMessagesByUserId, sendMessage, getChatPartners, markMessagesAsRead, revokeMessage, reactToMessage, togglePinMessage, editMessage, deleteMessageForMe, setNickname } from "../controllers/message.controller.js";
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
router.post("/:id/react", reactToMessage);
router.put("/:id/pin", togglePinMessage);
router.put("/:id/edit", editMessage);
router.post("/:id/delete-for-me", deleteMessageForMe);
router.post("/nickname/:id", setNickname);

export default router;