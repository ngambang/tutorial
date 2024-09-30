const fs = require('fs');
const https = require('https');
const express = require('express');
const socketIo = require('socket.io');

// Membaca sertifikat dan kunci privat
const options = {
  key: fs.readFileSync('selfsigned.key'),
  cert: fs.readFileSync('selfsigned.crt')
};

const app = express();

// Membuat server HTTPS
const server = https.createServer(options, app);
const io = socketIo(server);

app.use(express.static('public'));

const rooms = new Map();

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('create or join', (room) => {
    console.log(`User ${socket.id} requested to join room ${room}`);

    if (!rooms.has(room)) {
      rooms.set(room, new Set([socket.id]));
      socket.join(room);
      socket.emit('created', room);
    } else if (rooms.get(room).size < 2) {
      rooms.get(room).add(socket.id);
      socket.join(room);
      socket.emit('joined', room);
      io.to(room).emit('ready');
    } else {
      socket.emit('full', room);
    }
  });

  socket.on('ready', (room) => {
    socket.broadcast.to(room).emit('ready');
  });

  socket.on('message', (message) => {
    console.log('Message received:', message);
    socket.broadcast.to(message.room).emit('message', message);
  });

  socket.on('disconnect', () => {
    rooms.forEach((clients, room) => {
      if (clients.delete(socket.id) && clients.size === 0) {
        rooms.delete(room);
      }
    });
    console.log('User disconnected:', socket.id);
  });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server running on https://localhost:${port}`);
});
