import express from "express";


const route = express.Router();

route.get("/send", (req, res) => {
    res.send("Send message endpoint");
})

route.get("/get", (req, res) => {
    res.send("Get message");
})

route.get("/delete", (req, res) => {
    res.send("Delete message");
})

export default route;