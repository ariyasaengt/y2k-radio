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

let isDJLive = false; // เช็กสถานะว่าเริ่มรายการแล้วหรือยัง
let activeDJSockets = new Set(); // เก็บ socket ของดีเจที่ออนไลน์

let currentTrack = { title: "รอเริ่มรายการ", artist: "Offline" };
let playlist = [];
let chatHistory = [];
let currentDay = new Date().toLocaleDateString('th-TH');

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

  // ส่งสถานะปัจจุบันให้ผู้ฟัง
  socket.emit('dj-status-update', isDJLive);
  socket.emit('track-update', currentTrack);
  socket.emit('playlist-update', playlist);
  socket.emit('chat-history', chatHistory);

  // แชท
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

  // ยืนยันสิทธิ์ดีเจ
  socket.on('dj-auth', (key, callback) => {
    if (key === DJ_SECRET_KEY) {
      socket.isDJ = true;
      activeDJSockets.add(socket.id);
      callback({ success: true, isLive: isDJLive });
    } else {
      callback({ success: false, message: "รหัสผ่านดีเจไม่ถูกต้อง!" });
    }
  });

  // ดีเจกดเริ่มจัดรายการ
  socket.on('dj-start-show', () => {
    if (!socket.isDJ) return;
    isDJLive = true;
    io.emit('dj-status-update', true);
  });

  // ดีเจกดจบรายการ
  socket.on('dj-end-show', () => {
    if (!socket.isDJ) return;
    isDJLive = false;
    currentTrack = { title: "จบรายการแล้ว", artist: "Offline" };
    io.emit('dj-status-update', false);
    io.emit('track-update', currentTrack);
  });

  socket.on('dj-update-track', (data) => {
    if (!socket.isDJ || !isDJLive) return;
    currentTrack = data.track;
    io.emit('track-update', currentTrack);
  });

  socket.on('dj-update-playlist', (list) => {
    if (!socket.isDJ) return;
    playlist = list;
    io.emit('playlist-update', playlist);
  });

  socket.on('dj-audio-stream', (audioChunk) => {
    if (!socket.isDJ || !isDJLive) return;
    socket.broadcast.emit('listener-audio-stream', audioChunk);
  });

  // เมื่อดีเจปิดหน้าเว็บ หรือเน็ตหลุด
  socket.on('disconnect', () => {
    if (socket.isDJ) {
      activeDJSockets.delete(socket.id);
      if (activeDJSockets.size === 0 && isDJLive) {
        isDJLive = false;
        currentTrack = { title: "ดีเจออฟไลน์", artist: "Offline" };
        io.emit('dj-status-update', false);
        io.emit('track-update', currentTrack);
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});