let mongoose = require("mongoose")

let EventSchema = new mongoose.Schema({
    host: {
        type: String,
    },
    name: {
        type: String,
    },
    description: {
        type: String
    },
    date: {
        type: Date
    },
    time: {
        type: String
    },
    location: {
        type: String
    },
    users: [
        
    ],
    img: {
        type: Buffer
    }
})

let EventModel = mongoose.model("Events", EventSchema)

module.exports = EventModel