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

let isDJLive = false;
let activeDJSockets = new Set();
let currentTrack = { title: "รอเริ่มรายการ", artist: "Offline" };
let todayTopic = "ยินดีต้อนรับสู่ Y2K Radio! ขอเพลงกันเข้ามาได้เลย ✨";
let playlist = [];
let chatHistory = [];
let currentDay = new Date().toLocaleDateString('th-TH');

// บันทึกระดับเสียงเริ่มต้น
let currentVolumes = { music: 0.8, mic: 1.0 };

function checkDayReset() {
  const today = new Date().toLocaleDateString('th-TH');
  if (today !== currentDay) {
    chatHistory = [];
    currentDay = today;
    todayTopic = "วันนี้เปิดรับทุกแนวเพลง ทักทายกันได้นะ!";
    io.emit('chat-history-cleared');
    io.emit('topic-update', todayTopic);
  }
}

io.on('connection', (socket) => {
  checkDayReset();

  socket.emit('dj-status-update', isDJLive);
  socket.emit('track-update', currentTrack);
  socket.emit('topic-update', todayTopic);
  socket.emit('volume-update', currentVolumes);
  socket.emit('playlist-update', playlist);
  socket.emit('chat-history', chatHistory);

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

  socket.on('dj-auth', (key, callback) => {
    if (key === DJ_SECRET_KEY) {
      socket.isDJ = true;
      activeDJSockets.add(socket.id);
      callback({ success: true, isLive: isDJLive, volumes: currentVolumes });
    } else {
      callback({ success: false, message: "รหัสผ่านดีเจไม่ถูกต้อง!" });
    }
  });

  socket.on('dj-set-topic', (newTopic) => {
    if (!socket.isDJ) return;
    todayTopic = newTopic.trim() || "เปิดเพลงสบายๆ สไตล์ Y2K";
    io.emit('topic-update', todayTopic);
  });

  // ปรับระดับเสียงจากดีเจแบบ Real-time
  socket.on('dj-volume-change', (data) => {
    if (!socket.isDJ) return;
    if (data.type === 'music') currentVolumes.music = data.volume;
    if (data.type === 'mic') currentVolumes.mic = data.volume;
    io.emit('volume-update', currentVolumes);
  });

  socket.on('dj-start-show', () => {
    if (!socket.isDJ) return;
    isDJLive = true;
    io.emit('dj-status-update', true);
  });

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

  // ส่งสัญญาณเสียง (รองรับทั้งเพลงและไมค์)
  socket.on('dj-audio-stream', (data) => {
    if (!socket.isDJ || !isDJLive) return;
    socket.broadcast.emit('listener-audio-stream', data);
  });

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

  // รับสัญญาณเริ่มพิมพ์ข้อความ
  socket.on('typing-start', (username) => {
    socket.broadcast.emit('user-typing', { user: username || 'Guest', isTyping: true });
  });

  // รับสัญญาณหยุดพิมพ์ข้อความ
  socket.on('typing-stop', () => {
    socket.broadcast.emit('user-typing', { isTyping: false });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});