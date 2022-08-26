const UserSchema = require("../models/User.js")
const {containsUser} = require("../helpers/functions")
const mongoose = require("mongoose");
const {
    removeSentRequest,
    removeReceivedRequest,
    addFriend
} = require("../services/friends.js")

const sendFriendRequest = async (req,res) => {
    const requestReceiverId = req.body.id;
    const requestSenderId = req.userID;

    const requestReceiver = await UserSchema.findOne({_id: requestReceiverId})
    const requestSender = await UserSchema.findOne({_id: requestSenderId})
    
    const sentRequests = requestSender.sentRequests;

    const friends = requestSender.friends;
    
    if(containsUser(requestReceiverId,sentRequests)) {
        const message = "Request already sent!";
        
        return res.status(403).json(message);
    } else if(containsUser(requestReceiverId,friends)) {
        const message = "Already friends!";
        
        return res.status(403).json(message);
    } else {
        await UserSchema.findOneAndUpdate({_id: requestReceiverId}, {
            $push: {receivedRequests: requestSender}
        })

        UserSchema.findByIdAndUpdate({_id: requestSenderId}, {
            $push: {sentRequests: requestReceiver}
        },{new: true}, (err,doc) => {
            if(err) {
                return res.status(403).json({message: "Error when send friend request!"});
            }
            
            return res.status(200).json({message: "Success", doc});
        })
    }
}

const acceptFriendRequest = async (req,res) => {

    const acceptedUser = req.params.id;
    const user = req.userID;

    removeSentRequest(req.userID,acceptedUser);
    removeReceivedRequest(req.userID,acceptedUser);

    addFriend(acceptedUser,user);
    addFriend(user,acceptedUser);

    res.redirect("/api/users/info");
    // if(client && acceptedUser) {
    //     let acceptedUserUpdate = await  UserSchema.findOneAndUpdate({_id: acceptedUser._id}, {
    //         $push: {friends: client._id},
    //         $pull: {requestsSent: client._id}
    //     })

    //     let clientUpdate = await  UserSchema.findByIdAndUpdate({_id: client._id}, {
    //         $push: {friends: acceptedUser._id},
    //         $pull: {requestsReceived: acceptedUser._id}
    //     })

    //     let userInfo = await UserSchema.find({_id: req.currentUser._id})
    //     console.log(userInfo)
        
    //     return res.status(200).json({message: "Request Sent",currentFriends: userInfo[0].friends,currentRequests: userInfo[0].requestsSent})
    // }
}

const rejectFriendRequest = async (req,res) => {
    try{

        const rejectedId = req.params.id;
        
        removeSentRequest(req.userID,rejectedId);
        removeReceivedRequest(req.userID,rejectedId)

        res.redirect("/api/users/info");
    }
    catch(error) {
        return res.status(403).json({message: error.message})
    }
    
    
    // if(returned == null) {
    //     return res.status(403).json({message: "Error!"})
    // }else {

    //     return res.status(200).json({content: returned});
    // }
    
}

const getFriends = async (req,res) => {
    try {
        
        const user = await UserSchema.findOne({_id: req.userID})
        const friends = user.friends;
        let toReturn = [];
        const stuff = await UserSchema.find({_id: {$in: friends}});
        for(let i = 0; i < stuff.length; i++) {
            toReturn.push({
                id: stuff[i]._id,
                username: stuff[i].username
            })
        }
        
        return res.status(200).json({content: toReturn})
    }
    catch(error) {
        return res.status(200).json({message: error.message})
    }
}

const getFriendRequests = async (req,res) => {
    
    const user = await UserSchema.findById({_id: req.userID});

    //const users = await UserSchema.find({_id: {$in: req.currentUser.requestsReceived}})
    return res.status(200).json({friendRequests: user.receivedRequests})
}

module.exports = {
    sendFriendRequest,
    getFriends,
    getFriendRequests,
    acceptFriendRequest,
    rejectFriendRequest
}