const express = require("express");
const router = express.Router();
const {verifyJWT} = require("../helpers/functions.js")
const {createEvent,joinEvent,getEventInfo,removeEvent,leaveEvent, getAllEvents} = require("../controllers/events.js")

router.post("/create",verifyJWT,createEvent)

router.post("/join",verifyJWT,joinEvent)

router.post("/leave",verifyJWT,leaveEvent)

router.get("/info/:id",verifyJWT,getEventInfo)

router.delete("/remove/:id",verifyJWT,removeEvent)

router.get("/all",verifyJWT,getAllEvents);






module.exports = router;