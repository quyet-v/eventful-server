/* eslint-disable no-plusplus */
/* eslint-disable no-underscore-dangle */
/* eslint-disable consistent-return */
const UserSchema = require('../models/User');
const { containsUser } = require('../helpers/functions');
const {
  removeSentRequest,
  removeReceivedRequest,
  addFriend,
} = require('../services/friends');

const sendFriendRequest = async (req, res) => {
  const requestReceiverId = req.body.id;
  const requestSenderId = req.userID;

  const requestReceiver = await UserSchema.findOne({ _id: requestReceiverId });
  const requestSender = await UserSchema.findOne({ _id: requestSenderId });

  const { sentRequests } = requestSender;

  const { friends } = requestSender;

  if (containsUser(requestReceiverId, sentRequests)) {
    const message = 'Request already sent!';

    return res.status(403).json(message);
  } if (containsUser(requestReceiverId, friends)) {
    const message = 'Already friends!';

    return res.status(403).json(message);
  }
  await UserSchema.findOneAndUpdate({ _id: requestReceiverId }, {
    $push: { receivedRequests: requestSender },
  });

  UserSchema.findByIdAndUpdate({ _id: requestSenderId }, {
    $push: { sentRequests: requestReceiver },
  }, { new: true }, (err, doc) => {
    if (err) {
      return res.status(403).json({ message: 'Error when send friend request!' });
    }

    return res.status(200).json({ message: 'Success', doc });
  });
};

const acceptFriendRequest = async (req, res) => {
  const acceptedUser = await UserSchema.findOne({ _id: req.body.id });
  const user = await UserSchema.findOne({ _id: req.userID });

  await removeSentRequest(acceptedUser._id, user._id);
  await removeReceivedRequest(user._id, acceptedUser._id);

  await addFriend(acceptedUser._id, user);
  await addFriend(user._id, acceptedUser);

  res.redirect('/api/users/info');
  // if(client && acceptedUser) {
  //     let acceptedUserUpdate = await  UserSchema.findOneAndUpdate({_id: acceptedUser._id}, {
  //         $push: {friends: client._id},
  //         $pull: {requestsSent: client._id}
  //     })

  //     let clientUpdate = await  UserSchema.findByIdAndUpdate({_id: client._id}, {
  //         $push: {friends: acceptedUser._id},
  //         $pull: {requestsReceived: acceptedUser._id}
  //     })

  //     let userInfo = await UserSchema.find({_id: req.currentUser._id})
  //     console.log(userInfo)

  //     return res.status(200).json(
  //        {message: "Request Sent",
  //         currentFriends: userInfo[0].friends,currentRequests: userInfo[0].requestsSent})
  // }
};

const rejectFriendRequest = async (req, res) => {
  try {
    const rejectedId = req.params.id;

    removeSentRequest(req.userID, rejectedId);
    removeReceivedRequest(req.userID, rejectedId);

    res.redirect('/api/users/info');
  } catch (error) {
    return res.status(403).json({ message: error.message });
  }

  // if(returned == null) {
  //     return res.status(403).json({message: "Error!"})
  // }else {

  //     return res.status(200).json({content: returned});
  // }
};

const getFriends = async (req, res) => {
  try {
    const user = await UserSchema.findOne({ _id: req.userID });
    const { friends } = user;
    const toReturn = [];
    const stuff = await UserSchema.find({ _id: { $in: friends } });
    for (let i = 0; i < stuff.length; i++) {
      toReturn.push({
        id: stuff[i]._id,
        username: stuff[i].username,
      });
    }

    return res.status(200).json({ content: toReturn });
  } catch (error) {
    return res.status(200).json({ message: error.message });
  }
};

const getFriendRequests = async (req, res) => {
  const user = await UserSchema.findById({ _id: req.userID });

  // const users = await UserSchema.find({_id: {$in: req.currentUser.requestsReceived}})
  return res.status(200).json({ friendRequests: user.receivedRequests });
};

module.exports = {
  sendFriendRequest,
  getFriends,
  getFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
};
