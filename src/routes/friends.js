const express = require("express");
const router = express.Router();
const {verifyJWT} = require("../helpers/functions")
const {
    sendFriendRequest,
    getFriends,
    getFriendRequests,
    addFriend,
    acceptFriendRequest,
    rejectFriendRequest
} = require("../controllers/friends.js")

router.post("/requests/send/:id/",verifyJWT,sendFriendRequest);
router.post("/requests/accept/:id/",verifyJWT,acceptFriendRequest);
router.post("/requests/reject/:id/",verifyJWT,rejectFriendRequest);
router.get("/requests",verifyJWT,getFriendRequests)
router.get("/",verifyJWT,getFriends)



module.exports = router;