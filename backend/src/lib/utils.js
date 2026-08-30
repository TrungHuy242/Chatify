import jwt from "jsonwebtoken";

export const generateToken = (userId, res) => {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: '7d',
    });

    res.cookie("jwt", token, {
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
        httpOnly: true, // prevent access from client-side js
        sameSite: "strict", // prevent CSRF attacks
        secure: process.env.NODE_ENV !== "development" ? false : true, // only send over https in production
    });

    return token;
};