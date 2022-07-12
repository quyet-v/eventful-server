const EventSchema = require("../models/Event.js")
const UserSchema = require("../models/User.js")


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

        let results = newEvent.save((err,res) => {
            if(err) return res.status(403).json({message: "A error occured while saving the event!"})
        })
        
        if(results == null) return res.status(403).json({message: "A error occured while saving the event!"})

        let updateResults = await UserSchema.updateOne({_id: req.userID},{
            $push: {events: results._id}
        })

        if(updateResults == null) return res.status(403).json({message: "A error occured while updating the event!"})

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
        if(event.users[i].username == user.username) return res.status(400).json({message: "Event already joined"})
    }
    
    if(user && event) {
        let addUser = await EventSchema.updateOne({_id: event._id}, {
            $push: {users: user}
        })
        
        if(addUser) {
            return res.status(200).json({message: "Event joined!"})
        }
    }
}

const getEventInfo = async (req,res) => {
    let eventID = mongoose.Types.ObjectId(req.params.id)
    let invited = false
    
    if(eventID) {
        let event = await EventSchema.findOne({_id: eventID})

        for(let i = 0; i < event.users.length; i++) {
            if(req.userID == event.users[i]._id) {
                invited = true;
                break;
            }
        }

        if(event) {
            return res.status(200).json({message: "Event retrieved", event, invited})
        }else {
            return res.status(403).json({message: "Failed to retrieve"})
        }
    }
}

const removeEvent = async (req,res) => {
    const id = req.params
    const request = EventSchema.deleteOne({_id: mongoose.Types.ObjectId(id)}, (err,res) => {
        if(err) return res.status(400).json({message: err})
    })
    const request2 = UserSchema.updateOne({_id: req.currentUser._id}, {
        $pull: {events: mongoose.Types.ObjectId(id)}
    }, (err,res) => {
        if(err) return res.status(400).json({message: err})
        
    })

    const userEvents = await EventSchema.find({host: req.currentUser.username})
    console.log(userEvents)
    if(userEvents) {
        return res.status(200).json({message:"succss",events: userEvents})
    }   
}

const leaveEvent = async (req,res) => {
    let eventID = req.body.eventID
    let user = await UserSchema.findOne({_id: req.userID})
    
    EventSchema.findOneAndUpdate({_id: mongoose.Types.ObjectId(eventID)}, {
        $pull: {users: {_id: user._id}}
    }, {new:true}, (error, results) => {
        if(error) return res.status(400).json({message: error.message})

        return res.status(200).json({message: results})
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