const containsUser = (userID,array) => {
    for(a = 0; a < array.length; a++) {
        if(array[a].valueOf() == userID) {
            return true;
        }
    }
    return false;
}

const verifyJWT = (req,res,next) => {
    
    const token = req.headers["authorization"].split(" ")[1]
    
    if(token) {
        jwt.verify(token,process.env.JWT_TOKEN, (err,result) => {
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

module.exports = {containsUser,verifyJWT,getUser}