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

app.listen( process.env.PORT || PORT,() => {
    console.log("Server started on port" + PORT)
})