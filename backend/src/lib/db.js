import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URL);
        console.log("MongoDB connected : ", conn.connection.host);
    } catch (error) {
        console.log("Error connection to MongoDB: ", error);
        process.exit(1); // 1 status code -> failure 0 mean sucess
    }
};