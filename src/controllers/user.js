
const UserSchema = require("../models/User")
const EventSchema = require("../models/Event")

const getInfo = async (req,res) => {
    const user = await UserSchema.findOne({_id: req.userID})

    const returnedObject = {
        username: user.username,
        friends: user.friends,
        sentRequests: user.sentRequests,
        receivedRequests: user.receivedRequests
    }


    if(user) {
        return res.status(200).json(returnedObject)
    }
}

const getUserEvents = async (req,res) => {
    let user = await UserSchema.findOne({_id: req.userID})

    if(user) {
        req.username = user.username
    }

    let userEvents = await EventSchema.find({host: req.username})
    
    if(userEvents) {
        return res.status(200).json({events: userEvents})
    }
}

const getAllUsers = async (req,res) => {
    const allUsers = await UserSchema.find();

    if(allUsers) {
        return res.status(200).json({allUsers})
    }else {
        return res.status(403).json({message: "Error"})
    }
}

module.exports = {getInfo,getUserEvents,getAllUsers}