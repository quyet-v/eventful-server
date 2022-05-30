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

app.listen( process.env.PORT || PORT,() => {
    console.log("Server started on port" + PORT)
})