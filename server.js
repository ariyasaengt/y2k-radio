const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  maxHttpBufferSize: 1e7 // รองรับ buffer เสียง 10MB
});

app.use(express.static(path.join(__dirname, 'public')));

// กำหนดรหัสผ่านของดีเจ/แอดมินตรงนี้
const DJ_SECRET_KEY = "1234";

let currentTrack = { title: "รอเริ่มรายการ", artist: "Offline" };
let playlist = [];

io.on('connection', (socket) => {
  // ส่งสถานะปัจจุบันให้ผู้ฟัง
  socket.emit('track-update', currentTrack);
  socket.emit('playlist-update', playlist);


  // ระบบส่งข้อความแชท (ตรวจจับยศดีเจจากเซิร์ฟเวอร์)
  socket.on('chat-message', (data) => {
    io.emit('chat-message', {
      user: data.user || 'Guest',
      text: data.text,
      style: data.style || {},
      isDJ: socket.isDJ || false, // ตรวจสอบว่าคนส่งคือดีเจที่ยืนยันรหัสผ่านแล้วหรือไม่
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  });

  // ตรวจสอบรหัสผ่านดีเจ
  socket.on('dj-auth', (key, callback) => {
    if (key === DJ_SECRET_KEY) {
      socket.isDJ = true;
      callback({ success: true });
    } else {
      callback({ success: false, message: "รหัสผ่านดีเจไม่ถูกต้อง!" });
    }
  });

  // อัปเดตเพลง (เฉพาะคนที่มีสิทธิ์ดีเจ)
  socket.on('dj-update-track', (data) => {
    if (!socket.isDJ) return;
    currentTrack = data.track;
    io.emit('track-update', currentTrack);
  });

  // อัปเดตเพลย์ลิสต์ (เฉพาะดีเจ)
  socket.on('dj-update-playlist', (list) => {
    if (!socket.isDJ) return;
    playlist = list;
    io.emit('playlist-update', playlist);
  });

  // สตรีมเสียง (เฉพาะดีเจ)
  socket.on('dj-audio-stream', (audioChunk) => {
    if (!socket.isDJ) return;
    socket.broadcast.emit('listener-audio-stream', audioChunk);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});