import express from "express";
import cookieParser from "cookie-parser";
import path from "path";

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import { connectDB } from "./lib/db.js";
import { ENV } from "./lib/env.js";



const app = express();
const __dirname = path.resolve();

const PORT = ENV.PORT || 3000;

app.use(express.json()); // req.body
app.use(cookieParser()); // req.cookies



app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);


//make ready for development
if (ENV.NODE_ENV == "production") {
    app.use(express.static(path.join(__dirname, "../frontend/dist")));

    app.get("*", (req, res) => {
        res.sendFile(path.resolve(__dirname, "../frontend", "dist", "index.html"))
    });
}

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
    connectDB();
});