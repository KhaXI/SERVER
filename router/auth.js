const express = require("express");
const AuthController = require("../controllers/auth");

const api = express.Router();

api.post("/auth/register", AuthController.register);
api.post("/auth/login", AuthController.login);
api.post("/auth/refresh_access_token", AuthController.refreshAccessToken);
api.get("/auth/logout/:id", async (req, res) => {
    const resp = await AuthController.logOut(req)
    res.status(resp.status).send(resp.data)
});

module.exports = api;
