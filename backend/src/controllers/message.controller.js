import cloudinary from "../lib/cloudinary.js";
import Message from "../models/Message.js";
import User from "../models/User.js";

export const getAllContacts = async (req, res) => {
    try {

        const loggedInUserId = req.user.id;
        const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password")

        res.status(200).json(filteredUsers);

    } catch (error) {
        console.error("Error in getAllContacts:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const getMessagesByUserId = async (req, res) => {
    try{
        const myId = req.user.id;
        const {id:userToChatId} = req.params;

        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: userToChatId },
                { senderId: userToChatId, receiverId: myId }
            ]
        });

        res.status(200).json(messages);
    } catch (error) {
        console.log("Error in getMessages Controller:", error.message);
        res.status(500).json({ error: "Internal Server error" });
    }
};

export const sendMessage = async (req, res) => {
    try  {
        const {text, image} = req.body;
        const {id:receiverId} = req.params;
        const senderId = req.user.id;

        let imageUrl;
        if (image) {
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }

        const newMessage = new Message({
            senderId,
            receiverId,
            text,
            image: imageUrl,
        });

        await newMessage.save();

        res.status(201).json(newMessage);


    } catch (error) {
        console.log("Error in sendMessage Controller:", error.message);
        res.status(500).json({ error: "Internal Server error" })
    }
};

export const getChatPartners = async (req, res) => {
    try {
        const loggedInUserId = req.user.id;


        //find all messages where the logged-in user is either the sender or receiver
        const messages = await Message.find({
            $or: [{ senderId: loggedInUserId }, { receiverId: loggedInUserId }]
        });


        const chatPartnerIds = [
            ...new  Set(
                messages.map((msg) => 
                    msg.senderId.toString() === loggedInUserId.toString()
                        ? msg.receiverId.toString() 
                        : msg.senderId.toString()
                )
            )
        ]; 

        const chatPartners = await User.find({ _id: { $in:chatPartnerIds } }).select("-password");

        res.status(200).json(chatPartners);

    } catch (error) {
        console.error("Error in getChatPartners:", error.message);
        res.status(500).json({ message: "Internal Server error" });
    }
};