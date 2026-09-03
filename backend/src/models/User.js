import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    fullName: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    profilePic: {
        type: String,
        default: "",
    },
    nicknames: [
        {
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
            nickname: {
                type: String,
                trim: true,
            },
        },
    ],
}, {
    timestamps: true // createdAt, updatedAt
});
// last login

const User = mongoose.model("User", userSchema);
export default User