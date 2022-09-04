const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
  },
  username: {
    type: String,
    unique: true,
  },
  password: {
    type: String,
  },
  events: [

  ],
  friends: [

  ],
  sentRequests: [
  ],
  receivedRequests: [
  ],

});

const UserModel = mongoose.model('Users', UserSchema);

module.exports = UserModel;
