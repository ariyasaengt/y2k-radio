const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  maxHttpBufferSize: 1e7
});

app.use(express.static(path.join(__dirname, 'public')));

const DJ_SECRET_KEY = "1234";

let isDJLive = false;
let activeDJSockets = new Set();
let currentTrack = { title: "รอเริ่มรายการ", artist: "Offline", duration: 0, youtubeId: null };
let todayTopic = "ยินดีต้อนรับสู่ Y2K Radio! ขอเพลงกันเข้ามาได้เลย ✨";
let pinnedMessage = null;
let playlist = [];
let songRequests = [];

let onlineUsersCount = 0;
let currentVolumes = { music: 0.8, mic: 1.0 };

const CHAT_FILE = path.join(__dirname, 'chat_history.json');
let chatHistory = [];

function getTodayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

let currentDay = getTodayString();

function loadChatHistory() {
  try {
    if (fs.existsSync(CHAT_FILE)) {
      const data = JSON.parse(fs.readFileSync(CHAT_FILE, 'utf-8'));
      if (data.savedDay === currentDay && Array.isArray(data.history)) {
        chatHistory = data.history;
      } else {
        chatHistory = [];
        saveChatHistory();
      }
    }
  } catch (err) {
    console.error("Error reading chat file:", err);
    chatHistory = [];
  }
}

function saveChatHistory() {
  try {
    fs.writeFileSync(CHAT_FILE, JSON.stringify({
      savedDay: currentDay,
      history: chatHistory
    }, null, 2), 'utf-8');
  } catch (err) {
    console.error("Error writing chat file:", err);
  }
}

loadChatHistory();

function checkDayReset() {
  const today = getTodayString();
  if (today !== currentDay) {
    chatHistory = [];
    songRequests = [];
    pinnedMessage = null;
    currentDay = today;
    todayTopic = "วันนี้เปิดรับทุกแนวเพลง ทักทายกันได้นะ!";
    saveChatHistory();
    io.emit('chat-history-cleared');
    io.emit('topic-update', todayTopic);
    io.emit('requests-update', songRequests);
    io.emit('pinned-update', pinnedMessage);
  }
}

io.on('connection', (socket) => {
  onlineUsersCount++;
  io.emit('online-users-count', onlineUsersCount);

  checkDayReset();

  socket.emit('dj-status-update', isDJLive);
  socket.emit('track-update', currentTrack);
  socket.emit('topic-update', todayTopic);
  socket.emit('pinned-update', pinnedMessage);
  socket.emit('volume-update', currentVolumes);
  socket.emit('playlist-update', playlist);
  socket.emit('requests-update', songRequests);
  socket.emit('chat-history', chatHistory);

  socket.on('chat-message', (data) => {
    checkDayReset();
    const newMsg = {
      user: data.user || 'Guest',
      status: data.status || '',
      text: data.text,
      style: data.style || {},
      isDJ: socket.isDJ || false,
      isSystem: data.isSystem || false,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    chatHistory.push(newMsg);
    saveChatHistory();
    io.emit('chat-message', newMsg);
  });

  socket.on('send-reaction', (type) => io.emit('receive-reaction', type || '❤️'));
  socket.on('send-nudge', (username) => io.emit('receive-nudge', { user: username || 'ใครบางคน' }));

  socket.on('submit-song-request', (reqData) => {
    const item = {
      id: Date.now(),
      user: reqData.user || 'ผู้ฟังทางบ้าน',
      song: reqData.song,
      note: reqData.note || '',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    songRequests.push(item);
    io.emit('requests-update', songRequests);
  });

  socket.on('dj-accept-request', (reqId) => {
    if (!socket.isDJ) return;
    const reqIndex = songRequests.findIndex(r => r.id === reqId);
    if (reqIndex !== -1) {
      const r = songRequests[reqIndex];
      songRequests.splice(reqIndex, 1);
      io.emit('requests-update', songRequests);

      const announceMsg = {
        user: "🎧 DJ Station",
        status: "DJ On Air",
        text: `รับคิวเพลง "${r.song}" ของคุณ ${r.user} เรียบร้อยแล้ว! ${r.note ? `(ฝากบอก: ${r.note})` : ''}`,
        style: { bold: true, color: "#b91c1c" },
        isDJ: true,
        isSystem: true,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      chatHistory.push(announceMsg);
      saveChatHistory();
      io.emit('chat-message', announceMsg);
    }
  });

  socket.on('dj-pin-message', (msgText) => {
    if (!socket.isDJ) return;
    pinnedMessage = msgText ? msgText.trim() : null;
    io.emit('pinned-update', pinnedMessage);
  });

  socket.on('dj-clear-chat', () => {
    if (!socket.isDJ) return;
    chatHistory = [];
    saveChatHistory();
    io.emit('chat-history-cleared');
  });

  socket.on('dj-play-sfx', (fxType) => {
    if (!socket.isDJ) return;
    io.emit('play-sfx', fxType);
  });

  socket.on('typing-start', (username) => {
    socket.broadcast.emit('user-typing', { user: username || 'Guest', isTyping: true });
  });

  socket.on('typing-stop', () => {
    socket.broadcast.emit('user-typing', { isTyping: false });
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
    currentTrack = { title: "จบรายการแล้ว", artist: "Offline", duration: 0, youtubeId: null };
    io.emit('dj-status-update', false);
    io.emit('track-update', currentTrack);
    io.emit('dj-stop-youtube');
  });

  // เล่นเพลงผ่าน YouTube สำหรับผู้ฟังทุกคน
  socket.on('dj-play-youtube', (ytData) => {
    if (!socket.isDJ || !isDJLive) return;
    currentTrack = {
      title: ytData.title || "YouTube Audio",
      artist: "DJ Broadcast (YouTube)",
      duration: 0,
      youtubeId: ytData.videoId
    };
    io.emit('track-update', currentTrack);
    io.emit('play-youtube-track', ytData);
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

  socket.on('dj-audio-stream', (data) => {
    if (!socket.isDJ || !isDJLive) return;
    socket.broadcast.emit('listener-audio-stream', data);
  });

  socket.on('disconnect', () => {
    onlineUsersCount = Math.max(0, onlineUsersCount - 1);
    io.emit('online-users-count', onlineUsersCount);

    if (socket.isDJ) {
      activeDJSockets.delete(socket.id);
      if (activeDJSockets.size === 0 && isDJLive) {
        isDJLive = false;
        currentTrack = { title: "ดีเจออฟไลน์", artist: "Offline", duration: 0, youtubeId: null };
        io.emit('dj-status-update', false);
        io.emit('track-update', currentTrack);
        io.emit('dj-stop-youtube');
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});