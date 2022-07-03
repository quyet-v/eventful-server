const express = require("express");
const router = express.Router();
const {getInfo,getUserEvents,getAllUsers} = require("../controllers/user.js")

const {verifyJWT} = require("../helpers/functions")

router.get("/info",verifyJWT,getInfo)

router.get("/all",getAllUsers)

router.get("/events",verifyJWT,getUserEvents)

module.exports = router