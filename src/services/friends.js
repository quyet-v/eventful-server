const UserSchema = require('../models/User');

const removeReceivedRequest = async (receiver, id) => {
  await UserSchema.findByIdAndUpdate(
    { _id: receiver },
    { $pull: { receivedRequests: { _id: id } } },
  );
};

const removeSentRequest = async (sender, id) => {
  await UserSchema.findByIdAndUpdate(
    { _id: sender },
    { $pull: { sentRequests: { _id: id } } },
  );
};

const addFriend = async (user1, user2) => {
  await UserSchema.findOneAndUpdate(
    { _id: user1 },
    { $push: { friends: user2 } },
  );
};

module.exports = { removeReceivedRequest, removeSentRequest, addFriend };
