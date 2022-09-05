/* eslint-disable consistent-return */
const mongoose = require('mongoose');
const UserSchema = require('../models/User');
const EventSchema = require('../models/Event');

const getInfo = async (req, res) => {
  const user = await UserSchema.findOne({ _id: mongoose.Types.ObjectId(req.userID) });

  const returnedObject = {
    username: user.username,
    friends: user.friends,
    events: user.events,
    sentRequests: user.sentRequests,
    receivedRequests: user.receivedRequests,
  };

  if (user) {
    return res.status(200).json(returnedObject);
  }
};

const getUserEvents = async (req, res) => {
  const user = await UserSchema.findOne({ _id: req.userID });

  if (user) {
    req.username = user.username;
  }

  const userEvents = await EventSchema.find({ host: req.username });

  if (userEvents) {
    return res.status(200).json({ events: userEvents });
  }
};

const getAllUsers = async (req, res) => {
  const allUsers = await UserSchema.find();

  if (allUsers) {
    return res.status(200).json({ allUsers });
  }
  return res.status(403).json({ message: 'Error' });
};

const findUsers = async (req, res) => {
  const { input } = req.params;

  UserSchema.find({ username: { $regex: input } }, (err, result) => {
    if (err) return res.status(403).json({ err });
    return res.status(200).json({ result });
  });
};

module.exports = {
  getInfo, getUserEvents, getAllUsers, findUsers,
};
