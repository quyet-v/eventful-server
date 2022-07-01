
const sendFriendRequest = async (req,res) => {
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
}

const acceptFriendRequest = async (req,res) => {
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
}

const getFriends = async (req,res) => {
    try {
        const friends = await UserSchema.find({_id: {$in: req.currentUser.friends}})
        res.status(200).json({friends})
    }catch(error) {
        return res.status(200).json({message: error.message})
    }
}

const getFriendRequests = async (req,res) => {
    const users = await UserSchema.find({_id: {$in: req.currentUser.requestsReceived}})
    return res.status(200).json({friendRequests: users})
}

const addFriend = async (req,res) => {
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
}

module.exports = {sendFriendRequest,getFriends,getFriendRequests,addFriend,acceptFriendRequest}