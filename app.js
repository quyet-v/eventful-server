let express = require("express");
let mongoose = require("mongoose");
let cors = require("cors");
require("dotenv").config();

let app = express();

const PORT = 4000;

mongoose.connect(`mongodb://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0-shard-00-00.rqxh0.mongodb.net:27017,cluster0-shard-00-01.rqxh0.mongodb.net:27017,cluster0-shard-00-02.rqxh0.mongodb.net:27017/eventful?ssl=true&replicaSet=atlas-9boxhh-shard-0&authSource=admin&retryWrites=true&w=majority`, () => {
    console.log("database connected!")
})

app.use(cors())
app.use(express.json())

const verifyJWT = (req,res,next) => {
    
    const token = req.headers["authorization"].split(" ")[1]
    
    if(token) {
        jwt.verify(token,"thisistest", (err,result) => {
            if(err) return res.status(403).json({message: "Invalid Token"})        
            req.userID = result.userId 
            next()
        })
    }
}

const getUser = async (req,res,next) => {
    const currentUser = await UserSchema.findOne({_id: req.userID});

    if(currentUser) {
        req.currentUser = currentUser;
    }else {
        res.status(400).json({message: "User not found!"});
    }
    
    next();
}


app.post("/signup", async (req,res) => {
    let pword = req.body.password
    const salt = await bcrypt.genSalt(10)

    let hashedPassword = await bcrypt.hash(pword,salt)
    
    let newUser = new UserSchema({
        email: req.body.email,
        username: req.body.username,
        password: hashedPassword, 
    })

     await newUser.save((error,user) => {
        if(error) {
            console.log(error.message)
            return res.status(404).json({message: error.message})
        }
        
        let token = jwt.sign({userId: user._id}, "thisistest")
        
        return res.status(200).json({message:"Account created", token, userId: user._id})
     })
})

app.post("/login", async (req,res) => {
    let password = req.body.password
    let user = await UserSchema.findOne({username: req.body.username})
    
    if(user == null) {
        return res.status(400).send("User not found!")
    }

    try{
        await bcrypt.compare(req.body.password,user.password, (err,result) => {
            if(result) {
                let token = jwt.sign({userId: user._id}, "thisistest")
                return res.status(200).json({message: "Login succeeded!",token})
            }else if(!result) {
                return res.status(400).json({message: "wrong username/password"})
            }
        })
    }catch(error) {
        res.send(error.message)
    }
})

app.post("/createEvent",verifyJWT ,async (req,res) => {
    
    let user = await UserSchema.findOne({_id: req.userID})

    if(user == null) return res.status(403).json({message: "User not found"})
   
    let newEvent = new EventSchema({
        host: user.username,
        name: req.body.name,
        description: req.body.description,
        date: req.body.date,
        time: req.body.time,
        location: req.body.location,
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
})

app.post("/joinEvent",verifyJWT, async (req,res) => {
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
})

app.get("/eventInfo/:id", verifyJWT, async (req,res) => {
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
})

app.delete("/event/:id", verifyJWT,getUser, async (req,res) => {
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
})

app.get("/getUserEvents",verifyJWT, async (req,res) => {
    let user = await UserSchema.findOne({_id: req.userID})

    if(user) {
        req.username = user.username
    }

    let userEvents = await EventSchema.find({host: req.username})
    
    if(userEvents) {
        return res.status(200).json({events: userEvents})
    }
})

app.get("/getAllUserEvents",verifyJWT, async (req,res) => {
    let userEvents = await EventSchema.find()
    
    if(userEvents) {
        return res.status(200).json({events: userEvents})
    }
})

app.post("/leaveEvent", verifyJWT, async (req,res) => {
    let eventID = req.body.eventID
    let user = await UserSchema.findOne({_id: req.userID})
    
    EventSchema.findOneAndUpdate({_id: mongoose.Types.ObjectId(eventID)}, {
        $pull: {users: {_id: user._id}}
    }, {new:true}, (error, results) => {
        if(error) return res.status(400).json({message: error.message})

        return res.status(200).json({message: results})
    })
})

app.post("/findUsers", verifyJWT, getUser , async (req,res) => {
    const searchedUser = req.body.input
    const result = await UserSchema.find({username: {$regex: searchedUser}})

    const checkName = (user) => {
        return user.username != req.currentUser.username;
    }

    const resultsFilter = result.filter(checkName)
    const requestsSent = req.currentUser.requestsSent
    
    if(result) {
        res.status(200).json({message: "Users found!", resultsFilter,currentFriends: req.currentUser.friends, requestsSent})
    }
})

app.post("/addFriend", verifyJWT, getUser, async (req,res) => {
    
    const friendID = await UserSchema.findOne({_id: req.body.ID})
    const friend = req.currentUser[0].friends
    
    for(i = 0; i < friend.length; i++) {
        if(friend[i].valueOf() == friendID._id.valueOf()) {
            
            return res.status(400).json({message: "User already friend!"})
        }
    }

    if(user) {
        let addFriend = await UserSchema.updateOne({_id: req.userID}, {
            $push: {friends: friendID._id}
        })
        
        if(addFriend) {
            return res.status(200).json({message: "Friend Added"})
        }
    }
})

app.post("/sendFriendRequest", verifyJWT, getUser, async (req,res) => {
    const friendID = await UserSchema.findOne({_id: req.body.ID})
    const currentUser = req.currentUser
    let currentFriends = currentUser.friends
    let currentRequests = currentUser.requestsSent
    
    // const friend = req.currentUser[0].friends
    
    // for(i = 0; i < friend.length; i++) {
    //     if(friend[i].valueOf() == friendID._id.valueOf()) {
            
    //         return res.status(400).json({message: "User already friend!"})
    //     }
    // }
    if(currentUser && friendID) {
        let sendRequest = await  UserSchema.findOneAndUpdate({_id: req.body.ID}, {
            $push: {requestsReceived: req.currentUser._id}
        })

        let saveRequest = await  UserSchema.findByIdAndUpdate({_id: req.currentUser._id}, {
            $push: {requestsSent: friendID._id}
        })
        let userInfo = await UserSchema.find({_id: req.currentUser._id})
        return res.status(200).json({message: "Request Sent",currentFriends: userInfo[0].friends,currentRequests: userInfo[0].requestsSent})
    }
})

app.get("/getFriendRequests", verifyJWT, getUser, async (req,res) => {
    const users = await UserSchema.find({_id: {$in: req.currentUser.requestsReceived}})
    return res.status(200).json({friendRequests: users})
})

app.get("/getFriends", verifyJWT,getUser, async (req,res) => {
    const friends = await UserSchema.find({_id: {$in: req.currentUser.friends}})
    res.status(200).json({friends})
})

app.post("/acceptFriendRequest", verifyJWT,getUser, async (req,res) => {
    const acceptedUser = await UserSchema.findOne({_id: req.body.user})

    const client = req.currentUser

    if(client && acceptedUser) {
        let acceptedUserUpdate = await  UserSchema.findOneAndUpdate({_id: acceptedUser._id}, {
            $push: {friends: client._id},
            $pull: {requestsSent: client._id}
        })

        let clientUpdate = await  UserSchema.findByIdAndUpdate({_id: client._id}, {
            $push: {friends: acceptedUser._id},
            $pull: {requestsReceived: acceptedUser._id}
        })

        let userInfo = await UserSchema.find({_id: req.currentUser._id})
        console.log(userInfo)
        
        return res.status(200).json({message: "Request Sent",currentFriends: userInfo[0].friends,currentRequests: userInfo[0].requestsSent})
    }
})


app.listen( process.env.PORT || PORT,() => {
    console.log("Server started on port" + PORT)
})