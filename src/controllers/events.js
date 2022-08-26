const EventSchema = require("../models/Event.js")
const UserSchema = require("../models/User.js")
const mongoose = require("mongoose")
const schedule = require("node-schedule");

const createEvent = async (req,res) => {
    try {
        const user = await UserSchema.findOne({_id: req.userID})

        if(user == null) return res.status(403).json({message: "User not found"})
    
        const imgString = req.body.img.split(",");
        const buffer = Buffer.from(imgString[1],"base64")
     
        const newEvent = new EventSchema({
            host: user.username,
            name: req.body.name,
            description: req.body.description,
            date: req.body.date,
            time: req.body.time,
            location: req.body.location,
            img: buffer
        })

        const results = await newEvent.save();

        UserSchema.updateOne({_id: req.userID},{
            $push: {events: results._id}
        }, (err,result) => {
            if(err) return res.status(403).json({message: "A error occured while updating the event!"})
        })

        return res.status(200).json({message: "Event saved and updated"})
    }
    catch(error) {
        return res.status(403).json({message: error.message})
    }
    
}

const joinEvent = async (req,res) => {
    
    let user = await UserSchema.findOne({_id: req.userID})
    let event = await EventSchema.findOne({_id: req.body.eventID})
    
    if(user.username == event.host) return res.status(400).json({message: "You are the owner, you can't join!"});
    
    for(let i = 0; i < event.users.length; i++) {
        if(event.users[i].username === user.username) return res.status(400).json({message: "Event already joined"})
    }
    
    await EventSchema.updateOne({_id: event._id}, {
        $push: {users: user}
    })

    UserSchema.findOneAndUpdate({_id: user._id}, {
        $push: {events: event}
    },{new:true},(err,result) => {
        if(err) return res.status(403).json(err);

        return res.status(200).json({data:result});
    })
    
    
        
    
}

const getEventInfo = async (req,res) => {
    const eventID = req.params.id;
    let invited = false
   
    EventSchema.findOne({_id: mongoose.Types.ObjectId(eventID)}, (err,result) => {
        if(err) return res.status(403).json(err)
        return res.status(200).json(result)
    })
}

const removeEvent = async (req,res) => {
    const id = req.params;

    await EventSchema.deleteOne({_id: mongoose.Types.ObjectId(id)});
    
    await UserSchema.updateOne({_id: req.userID}, {
        $pull: {events: mongoose.Types.ObjectId(id)}
    });

    EventSchema.find((err,result) => {
        if (err) return res.status(403).json({message: err});
        return res.status(200).json(result);
    });
}

const leaveEvent = async (req,res) => {
    let event = await EventSchema.findOne({_id: req.body.eventID})
    let user = await UserSchema.findOne({_id: req.userID})
    
    await EventSchema.updateOne({_id: event._id}, {
        $pull: {users: {_id: user._id}}
    })

    UserSchema.findOneAndUpdate({_id: user._id}, {
        $pull: {events: {_id: event._id}}
    },{new:true},(err,result) => {
        if(err) return res.status(403).json(err);

        return res.status(200).json({data:result});
    })


}

const getAllEvents = async (req,res) => {
    let userEvents = await EventSchema.find()
    
    if(userEvents) {
        return res.status(200).json({events: userEvents})
    }
}

const getUserEvents = async (req,res) => {
    const user = await UserSchema.findOne({_id: req.userID})

    const events = await EventSchema.find({host: user.username})

    return res.status(200).json({events})
}




module.exports = {createEvent,joinEvent,getEventInfo,removeEvent,leaveEvent,getAllEvents,getUserEvents}