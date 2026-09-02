const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  maxHttpBufferSize: 1e7 // รองรับ buffer เสียงขนาด 10MB
});

app.use(express.static(path.join(__dirname, 'public')));

let currentTrack = { title: "กำลังรอสัญญาณจากดีเจ...", artist: "Offline" };
let playlist = [];

io.on('connection', (socket) => {
  // ส่งสถานะปัจจุบันให้ผู้ฟังที่เพิ่งเข้า
  socket.emit('track-update', currentTrack);
  socket.emit('playlist-update', playlist);

  // ส่งข้อความแชท
  socket.on('chat-message', (data) => {
    io.emit('chat-message', {
      user: data.user || 'Guest',
      text: data.text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  });

  // อัปเดตเพลงจากดีเจ
  socket.on('dj-update-track', (track) => {
    currentTrack = track;
    io.emit('track-update', currentTrack);
  });

  socket.on('dj-update-playlist', (list) => {
    playlist = list;
    io.emit('playlist-update', playlist);
  });

  // ถ่ายทอดสัญญาณเสียงจากดีเจไปยังผู้ฟัง
  socket.on('dj-audio-stream', (audioChunk) => {
    socket.broadcast.emit('listener-audio-stream', audioChunk);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});