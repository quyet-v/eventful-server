const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const {Server} = require("socket.io");
const HTTP = require("http");
const bcrypt = require("bcrypt");
const UserSchema = require("./src/models/User.js")
const EventSchema = require("./src/models/Event.js")
const RoomSchema = require("./src/models/Room.js")
const jwt = require("jsonwebtoken")
const {containsUser,verifyJWT,getUser} = require("./src/helpers/functions")
const auth_routes = require("./src/routes/auth.js")
const events_routes = require("./src/routes/events.js")
const friends_routes = require("./src/routes/friends.js")
const user_routes = require("./src/routes/user.js")
const email_routes = require("./src/routes/email.js")

const app = express()
app.use(cors())
app.use(express.json({limit: '16mb'}));

let server = HTTP.createServer(app)
let io = new Server(server, {
    cors:{origin: "*"}
});

const PORT = 4000;

mongoose.connect(process.env.DB_CONNECTION,{useNewUrlParser: true,useUnifiedTopology: true}, () => {
    console.log("database connected!");
})


io.on("connection", async (socket) => {
    console.log(`user has connected ${socket.id}`)

    let roomFound;
    let currentUser;
    let currentUsername;

    socket.on("join", async (data) => {
        if(data.token) {
            jwt.verify(data.token,"thisistest", (err,result) => {
                
                if(err) {
                    console.log(err.message);
                    return;
                } 
                
                socket.user = result.userId
                currentUser = result.userId
            })
        }

        currentUsername = await UserSchema.findOne({_id: data.user});
        console.log(currentUsername)

        //Get all rooms
        let allRooms = await RoomSchema.find();

        //Search through all rooms to see if user is in room
        for(i = 0; i < allRooms.length; i++) {
            if(containsUser(data.user,allRooms[i].users) && containsUser(currentUser,allRooms[i].users)) {
                roomFound = allRooms[i];
                break;
            }
        }
        
        //If room found, joins room
        //If room not found, create room and join room
        if(roomFound) {
            console.log("room joined!")
            socket.join(roomFound._id.valueOf());
        }else {
            let usersArray = [mongoose.Types.ObjectId(data.user),mongoose.Types.ObjectId(socket.user)]
            let newRoom = new RoomSchema({
                users: usersArray
            })

            await newRoom.save((err,res) => {
                if(err) {
                    console.log(err.message);
                }else {
                    console.log("room created and joined!")
                    roomFound = res
                    socket.join(res._id.valueOf());
                }
            })
        }

        socket.emit("returnmessages", {roomFound,currentUsername})
    })

    socket.on("closeconnection", () => {
        if(roomFound) {
            socket.leave(roomFound._id)
            roomFound = null
            socket.disconnect()
        } 
    })

    socket.on("sendmessage", async message => {
        if(roomFound) {
            let senderObject = await UserSchema.findOne({_id: mongoose.Types.ObjectId(currentUser)});
            console.log({sender: senderObject.username,message}) 
            
            let room = await RoomSchema.findOne({_id: roomFound._id})
            await room.messages.push({sender: senderObject.username,message})
            await room.save()
            let room2 = await RoomSchema.findOne({_id: roomFound._id})
            io.sockets.in(roomFound._id.valueOf()).emit("giveback", room2)
        }
    })
})


app.use("/api/auth",auth_routes);
app.use("/api/events",events_routes);
app.use("/api/friends",friends_routes);
app.use("/api/users",user_routes);
app.use("/api/email",email_routes);

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

app.listen(process.env.PORT || 4000,() => {
    console.log("Server started on port " + 4000);
})