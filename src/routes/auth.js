const express = require("express");
const router = express.Router();
const {signup,login,verify} = require("../controllers/auth.js");
const { verifyJWT } = require("../helpers/functions.js");

router.post("/signup",signup)

router.post("/login",login)

router.get("/verify",verifyJWT, verify)

module.exports = router
