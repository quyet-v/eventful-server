const express = require("express");
const router = express.Router();
const {sendFriendRequest,getFriends,getFriendRequests,addFriend,acceptFriendRequest} = require("../controllers/friends.js")


router.post("/requests/send/:id/",sendFriendRequest);
router.post("/requests/accept/:id/",acceptFriendRequest);

router.get("/requests",getFriendRequests)

router.get("/",getFriends)

router.post("/add/:id",addFriend)


module.exports = router;