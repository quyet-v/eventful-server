let mongoose = require("mongoose")

let RoomSchema = new mongoose.Schema({
    users: [

    ],
    messages: [
        
    ]
    

})

let RoomModel = mongoose.model("Rooms", RoomSchema)

module.exports = RoomModel