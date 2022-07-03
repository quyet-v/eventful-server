
const UserSchema = require("../models/User.js")
const mongoose = require("mongoose")

const removeReceivedRequest = async (sender,rejectedId) => {
   
    await UserSchema.findByIdAndUpdate({_id: sender},
        {$pull: {"receivedRequests": {$in: [mongoose.Types.ObjectId(rejectedId)]}}}
    )
}

const removeSentRequest = async (sender,rejectedId) => {
    await UserSchema.findByIdAndUpdate({_id: rejectedId},
        {$pull: {"sentRequests": {$in: [mongoose.Types.ObjectId(sender)]}}}
    )
}

const addFriend = async (user1,user2) => {
    await UserSchema.findOneAndUpdate({_id: mongoose.Types.ObjectId(user1)},
        {$push: {"friends": mongoose.Types.ObjectId(user2)}}
    )
}

module.exports = {removeReceivedRequest,removeSentRequest,addFriend}