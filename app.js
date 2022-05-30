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

app.listen( process.env.PORT || PORT,() => {
    console.log("Server started on port" + PORT)
})