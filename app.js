/* eslint-disable no-param-reassign */
/* eslint-disable no-plusplus */
/* eslint-disable no-undef */
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const { Server } = require('socket.io');
const HTTP = require('http');
const jwt = require('jsonwebtoken');
const UserSchema = require('./src/models/User');
const RoomSchema = require('./src/models/Room');
// const { containsUser } = require('./src/helpers/functions');
const authRoutes = require('./src/routes/auth');
const eventsRoutes = require('./src/routes/events');
const friendsRoutes = require('./src/routes/friends');
const userRoutes = require('./src/routes/user');
const emailRoutes = require('./src/routes/email');

const app = express();
app.use(cors());
app.use(express.json({ limit: '16mb' }));

const server = HTTP.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
});

mongoose.connect(
  process.env.DB_CONNECTION,
  { useNewUrlParser: true, useUnifiedTopology: true },
  () => {
    console.log('database connected!');
  },
);

io.on('connection', async (socket) => {
  console.log(`user has connected ${socket.id}`);
  let currentUser;
  let messagedUser;
  let foundRoom;

  socket.on('join', async (data) => {
    if (data.token) {
      jwt.verify(data.token, 'thisistest', (err, result) => {
        if (err) {
          console.log(err.message);
          return;
        }
        currentUser = result.userId;
        messagedUser = data.messagedUser._id;
      });
    }

    // Try to find a room with both chatting users
    foundRoom = await RoomSchema.find(
      {
        $and: [
          { users: mongoose.Types.ObjectId(currentUser) },
          { users: mongoose.Types.ObjectId(messagedUser) },
        ],
      },
    );

    // If room found, joins room
    // If room not found, create room and join room
    if (foundRoom.length > 0) {
      socket.join(foundRoom[0]._id.valueOf());
    } else {
      const usersArray = [
        mongoose.Types.ObjectId(currentUser),
        mongoose.Types.ObjectId(messagedUser),
      ];
      const newRoom = new RoomSchema({
        users: usersArray,
      });

      await newRoom.save((err, res) => {
        if (err) {
          console.log(err.message);
        } else {
          foundRoom = res;
          socket.join(res._id.valueOf());
        }
      });
    }
    socket.emit('returnmessages', { messages: foundRoom[0].messages });
  });

  socket.on('closeconnection', () => {
    if (foundRoom) {
      socket.leave(foundRoom._id);
      foundRoom = null;
      socket.disconnect();
    }
  });

  socket.on('sendmessage', async (message) => {
    if (foundRoom) {
      const senderObject = await UserSchema.findOne({ _id: mongoose.Types.ObjectId(currentUser) });
      const sentMessage = {
        user: senderObject,
        message,
      };
      RoomSchema.findOneAndUpdate({ _id: foundRoom[0]._id }, {
        $push: { messages: sentMessage },
      }, { new: true }, (err, result) => {
        if (err) {
          console.log(err);
        } else {
          io.sockets.in(foundRoom[0]._id.valueOf()).emit('giveback', result);
        }
      });
    }
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/friends', friendsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/email', emailRoutes);

server.listen(process.env.PORT || 4000, () => {
  console.log(`Server started on port ${4000}`);
});
