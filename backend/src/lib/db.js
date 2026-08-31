import mongoose from "mongoose";
import { ENV } from "./env.js";

export const connectDB = async () => {
    try {
        const {MONGO_URL} = ENV;
        if(!MONGO_URL) throw new Error("MONGO_URL is not set");
        
        const conn = await mongoose.connect(ENV.MONGO_URL);
        console.log("MongoDB connected : ", conn.connection.host);
    } catch (error) {
        console.log("Error connection to MongoDB: ", error);
        process.exit(1); // 1 status code -> failure 0 mean sucess
    }
};