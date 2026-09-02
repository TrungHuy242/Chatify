import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import Message from "../models/Message.js";
import User from "../models/User.js";

export const getAllContacts = async (req, res) => {
    try {
        const loggedInUserId = req.user._id;
        const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

        res.status(200).json(filteredUsers);
    } catch (error) {
        console.log("Error in getAllContacts:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const getMessagesByUserId = async (req, res) => {
    try {
        const myId = req.user._id;
        const { id: userToChatId } = req.params;

        const { cursor } = req.query;
        
        const query = {
            $or: [
                { senderId: myId, receiverId: userToChatId },
                { senderId: userToChatId, receiverId: myId },
            ],
        };

        if (cursor) {
            query.createdAt = { $lt: new Date(cursor) };
        }

        const limit = 50;
        
        let messages = await Message.find(query)
            .sort({ createdAt: -1 })
            .limit(limit + 1);

        const hasMore = messages.length > limit;
        if (hasMore) {
            messages.pop(); // Remove the extra message used for hasMore check
        }

        messages = messages.reverse(); // Reverse to return chronologically

        res.status(200).json({ messages, hasMore });
    } catch (error) {
        console.log("Error in getMessages controller: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const sendMessage = async (req, res) => {
    try {
        const { text, image } = req.body;
        const { id: receiverId } = req.params;
        const senderId = req.user._id;

        if (!text && !image) {
            return res.status(400).json({ message: "Text or image is required." });
        }
        if (senderId.equals(receiverId)) {
            return res.status(400).json({ message: "Cannot send messages to yourself." });
        }
        const receiverExists = await User.exists({ _id: receiverId });
        if (!receiverExists) {
            return res.status(404).json({ message: "Receiver not found." });
        }

        let imageUrl;
        if (image) {
            // upload base64 image to cloudinary
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }

        const receiverSocketId = getReceiverSocketId(receiverId);
        
        let initialStatus = "sent";
        if (receiverSocketId) {
            initialStatus = "delivered";
        }

        const newMessage = new Message({
            senderId,
            receiverId,
            text,
            image: imageUrl,
            status: initialStatus,
        });

        await newMessage.save();

        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }

        res.status(201).json(newMessage);
    } catch (error) {
        console.log("Error in sendMessage controller: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getChatPartners = async (req, res) => {
    try {
        const loggedInUserId = req.user._id;

        // find all the messages where the logged-in user is either sender or receiver
        const messages = await Message.find({
            $or: [{ senderId: loggedInUserId }, { receiverId: loggedInUserId }],
        });

        const chatPartnerIds = [
            ...new Set(
                messages.map((msg) =>
                    msg.senderId.toString() === loggedInUserId.toString()
                        ? msg.receiverId.toString()
                        : msg.senderId.toString()
                )
            ),
        ];

        const chatPartners = await User.find({ _id: { $in: chatPartnerIds } }).select("-password");

        res.status(200).json(chatPartners);
    } catch (error) {
        console.error("Error in getChatPartners: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const markMessagesAsRead = async (req, res) => {
    try {
        const myId = req.user._id;
        const { id: senderId } = req.params;

        // Update all unread messages from this sender to me
        await Message.updateMany(
            { senderId, receiverId: myId, status: { $ne: "read" } },
            { $set: { status: "read" } }
        );

        // Tell the sender that we read their messages
        const senderSocketId = getReceiverSocketId(senderId);
        if (senderSocketId) {
            io.to(senderSocketId).emit("messagesRead", { readerId: myId });
        }

        res.status(200).json({ message: "Messages marked as read" });
    } catch (error) {
        console.log("Error in markMessagesAsRead controller: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};