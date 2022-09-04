const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  host: {
    type: String,
  },
  name: {
    type: String,
  },
  description: {
    type: String,
  },
  date: {
    type: Date,
  },
  time: {
    type: String,
  },
  location: {
    type: String,
  },
  users: [

  ],
  img: {
    type: Buffer,
  },
});

const EventModel = mongoose.model('Events', EventSchema);

module.exports = EventModel;
