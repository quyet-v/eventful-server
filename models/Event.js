let mongoose = require("mongoose")

let EventSchema = new mongoose.Schema({
    host: {
        type: String,
        
    },
    name: {
        type: String,
        unique: true
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
        
    ]
    

})

let EventModel = mongoose.model("Events", EventSchema)

module.exports = EventModel