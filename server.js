const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  maxHttpBufferSize: 1e7
});

app.use(express.static(path.join(__dirname, 'public')));

const DJ_SECRET_KEY = "1234";

let currentTrack = { title: "รอเริ่มรายการ", artist: "Offline" };
let playlist = [];

// ตัวแปรเก็บประวัติข้อความแชทประจำวัน
let chatHistory = [];
let currentDay = new Date().toLocaleDateString('th-TH');

// ฟังก์ชันล้างข้อความอัตโนมัติเมื่อขึ้นวันใหม่
function checkDayReset() {
  const today = new Date().toLocaleDateString('th-TH');
  if (today !== currentDay) {
    chatHistory = [];
    currentDay = today;
    io.emit('chat-history-cleared');
  }
}

io.on('connection', (socket) => {
  checkDayReset();

  // ส่งสถานะเพลง คิวเพลง และประวัติแชททั้งหมดให้คนที่เพิ่งเปิดเว็บเข้ามา
  socket.emit('track-update', currentTrack);
  socket.emit('playlist-update', playlist);
  socket.emit('chat-history', chatHistory);

  // ระบบแชท
  socket.on('chat-message', (data) => {
    checkDayReset();

    const newMsg = {
      user: data.user || 'Guest',
      text: data.text,
      style: data.style || {},
      isDJ: socket.isDJ || false,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    chatHistory.push(newMsg);
    io.emit('chat-message', newMsg);
  });

  // ตรวจสอบและยืนยันสิทธิ์ดีเจ
  socket.on('dj-auth', (key, callback) => {
    if (key === DJ_SECRET_KEY) {
      socket.isDJ = true;
      callback({ success: true });
    } else {
      callback({ success: false, message: "รหัสผ่านดีเจไม่ถูกต้อง!" });
    }
  });

  socket.on('dj-update-track', (data) => {
    if (!socket.isDJ) return;
    currentTrack = data.track;
    io.emit('track-update', currentTrack);
  });

  socket.on('dj-update-playlist', (list) => {
    if (!socket.isDJ) return;
    playlist = list;
    io.emit('playlist-update', playlist);
  });

  socket.on('dj-audio-stream', (audioChunk) => {
    if (!socket.isDJ) return;
    socket.broadcast.emit('listener-audio-stream', audioChunk);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});