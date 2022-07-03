const { ObjectId } = require("mongodb")
let mongoose = require("mongoose")

let UserSchema = new mongoose.Schema({
    email: {
        type: String,
        unique: true
    },
    username: {
        type: String,
        unique: true
    },
    password: {
        type: String
    },
    events: [
        
    ],
    friends: [
        
    ],
    sentRequests: [
    ],
    receivedRequests: [
    ]
    

})

let UserModel = mongoose.model("Users", UserSchema)

module.exports = UserModel