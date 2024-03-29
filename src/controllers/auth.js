/* eslint-disable consistent-return */
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UserSchema = require('../models/User');
require('dotenv').config();

const signup = async (req, res) => {
  try {
    const pword = req.body.password;
    const salt = await bcrypt.genSalt(10);

    const hashedPassword = await bcrypt.hash(pword, salt);

    const newUser = new UserSchema({
      email: req.body.email,
      username: req.body.username,
      password: hashedPassword,
    });

    await newUser.save((error, user) => {
      if (error) {
        console.log(error.message);
        return res.status(401).json({ message: error.message });
      }

      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);

      return res.status(200).json({ message: 'Account created!', token, userId: user._id });
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const login = async (req, res) => {
  const { password } = req.body;
  const user = await UserSchema.findOne({ username: req.body.username });

  if (user == null) {
    return res.status(400).send('User not found!');
  }

  try {
    await bcrypt.compare(password, user.password, (err, result) => {
      if (err) {
        return res.status(400).json({ message: 'wrong username/password' });
      }

      if (result) {
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
        return res.status(200).json({ message: 'Login succeeded!', token });
      }
    });
  } catch (error) {
    return res.status(403).json({ message: error.message });
  }
};

const verify = (req, res) => {
  console.log('hi');
  return res.status(200).json({ message: 'User Verified!' });
};

module.exports = { signup, login, verify };
