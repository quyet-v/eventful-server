const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  users: [

  ],
  messages: [

  ],

});

const RoomModel = mongoose.model('Rooms', RoomSchema);

module.exports = RoomModel;
