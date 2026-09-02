const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { maxHttpBufferSize: 1e7 });

app.use(express.static(path.join(__dirname, 'public')));

// รหัสผ่าน Super Admin
const ADMIN_SECRET_KEY = "0024252600";

let adminSocketId = null;
let currentBroadcaster = null;
let isDJLive = false;
let currentTrack = { title: "รอเริ่มรายการ", artist: "Offline", duration: 0, youtubeId: null };
let todayTopic = "ยินดีต้อนรับสู่ Y2K Radio! ขอเพลงกันเข้ามาได้เลย ✨";
let pinnedMessage = null;
let playlist = [];
let songRequests = [];
let djQueue = []; // [{ socketId, username, time }]

let onlineUsersCount = 0;
let currentVolumes = { music: 0.8, mic: 1.0 };

const CHAT_FILE = path.join(__dirname, 'chat_history.json');
let chatHistory = [];

const DJS_FILE = path.join(__dirname, 'djs_database.json');
let registeredDJs = {}; // { username: password }

function loadRegisteredDJs() {
  try {
    if (fs.existsSync(DJS_FILE)) {
      registeredDJs = JSON.parse(fs.readFileSync(DJS_FILE, 'utf-8'));
    } else {
      registeredDJs = {};
      saveRegisteredDJs();
    }
  } catch (err) {
    registeredDJs = {};
  }
}

function saveRegisteredDJs() {
  try {
    fs.writeFileSync(DJS_FILE, JSON.stringify(registeredDJs, null, 2), 'utf-8');
  } catch (err) {}
}
loadRegisteredDJs();

function getTodayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
let currentDay = getTodayString();

function loadChatHistory() {
  try {
    if (fs.existsSync(CHAT_FILE)) {
      const data = JSON.parse(fs.readFileSync(CHAT_FILE, 'utf-8'));
      if (data.savedDay === currentDay && Array.isArray(data.history)) chatHistory = data.history;
      else { chatHistory = []; saveChatHistory(); }
    }
  } catch (err) { chatHistory = []; }
}

function saveChatHistory() {
  try {
    fs.writeFileSync(CHAT_FILE, JSON.stringify({ savedDay: currentDay, history: chatHistory }, null, 2), 'utf-8');
  } catch (err) {}
}
loadChatHistory();

function checkDayReset() {
  const today = getTodayString();
  if (today !== currentDay) {
    chatHistory = []; songRequests = []; pinnedMessage = null; currentDay = today;
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
      role: socket.userRole || 'listener',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    chatHistory.push(newMsg);
    saveChatHistory();
    io.emit('chat-message', newMsg);
  });

  socket.on('dj-register', (data, callback) => {
    const cleanUser = (data.username || '').trim();
    const cleanPass = (data.password || '').trim();

    if (!cleanUser || !cleanPass) {
      return callback({ success: false, message: "กรุณากรอกชื่อจัดรายการและรหัสผ่านให้ครบถ้วน!" });
    }
    if (cleanUser.toLowerCase() === 'admin' || cleanPass === ADMIN_SECRET_KEY) {
      return callback({ success: false, message: "ชื่อหรือรหัสนี้สงวนไว้สำหรับแอดมิน!" });
    }
    if (registeredDJs[cleanUser]) {
      return callback({ success: false, message: "ชื่อจัดรายการนี้มีผู้ใช้งานแล้ว กรุณาใช้ชื่ออื่น!" });
    }

    registeredDJs[cleanUser] = cleanPass;
    saveRegisteredDJs();
    if (adminSocketId) io.to(adminSocketId).emit('admin-registered-djs-update', Object.keys(registeredDJs));
    callback({ success: true, message: "สมัครบัญชีดีเจสำเร็จ! เข้าสู่ระบบเพื่อขอจัดรายการได้เลย" });
  });

  socket.on('auth-login', (data, callback) => {
    const cleanUser = (data.username || '').trim();
    const cleanPass = (data.password || '').trim();

    if (cleanPass === ADMIN_SECRET_KEY) {
      socket.userRole = 'admin';
      socket.djName = cleanUser || 'Super Admin';
      adminSocketId = socket.id;
      callback({ success: true, role: 'admin', name: socket.djName });
      socket.emit('admin-dj-queue-update', djQueue);
      socket.emit('admin-registered-djs-update', Object.keys(registeredDJs));
      return;
    }

    if (registeredDJs[cleanUser] && registeredDJs[cleanUser] === cleanPass) {
      socket.userRole = 'dj_member';
      socket.djName = cleanUser;
      callback({ success: true, role: 'dj_member', name: cleanUser });
      return;
    }

    callback({ success: false, message: "ชื่อหรือรหัสผ่านไม่ถูกต้อง!" });
  });

  socket.on('admin-delete-dj', (djNameToDelete) => {
    if (socket.userRole !== 'admin') return;
    delete registeredDJs[djNameToDelete];
    saveRegisteredDJs();
    socket.emit('admin-registered-djs-update', Object.keys(registeredDJs));
  });

  socket.on('dj-request-queue', () => {
    if (socket.userRole !== 'dj_member') return;
    if (!djQueue.some(q => q.socketId === socket.id)) {
      djQueue.push({
        socketId: socket.id,
        username: socket.djName,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    }
    socket.emit('dj-queue-waiting');
    if (adminSocketId) io.to(adminSocketId).emit('admin-dj-queue-update', djQueue);
  });

  socket.on('admin-approve-dj', (djSocketId) => {
    if (socket.userRole !== 'admin') return;
    const djIdx = djQueue.findIndex(q => q.socketId === djSocketId);
    if (djIdx !== -1) {
      const approvedDj = djQueue.splice(djIdx, 1)[0];
      const targetSocket = io.sockets.sockets.get(djSocketId);
      if (targetSocket) {
        targetSocket.userRole = 'dj';
        targetSocket.emit('dj-approved', approvedDj.username);
      }
      io.to(adminSocketId).emit('admin-dj-queue-update', djQueue);
    }
  });

  socket.on('admin-reject-dj', (djSocketId) => {
    if (socket.userRole !== 'admin') return;
    djQueue = djQueue.filter(q => q.socketId !== djSocketId);
    const targetSocket = io.sockets.sockets.get(djSocketId);
    if (targetSocket) {
      targetSocket.userRole = 'dj_member';
      targetSocket.emit('dj-rejected');
    }
    io.to(adminSocketId).emit('admin-dj-queue-update', djQueue);
  });

  socket.on('dj-start-show', () => {
    if (socket.userRole !== 'admin' && socket.userRole !== 'dj') return;
    isDJLive = true;
    currentBroadcaster = { socketId: socket.id, role: socket.userRole, username: socket.djName };
    io.emit('dj-status-update', true);
  });

  socket.on('dj-end-show', () => {
    if (socket.userRole !== 'admin' && socket.userRole !== 'dj') return;
    isDJLive = false;
    currentBroadcaster = null;
    currentTrack = { title: "จบรายการแล้ว", artist: "Offline", duration: 0, youtubeId: null };
    io.emit('dj-status-update', false);
    io.emit('track-update', currentTrack);
    io.emit('dj-stop-youtube');
  });

  socket.on('dj-play-youtube', (ytData) => {
    if (!isDJLive || (socket.userRole !== 'admin' && socket.userRole !== 'dj')) return;
    currentTrack = {
      title: ytData.title || "YouTube Audio",
      artist: socket.userRole === 'admin' ? "Super Admin" : `DJ ${socket.djName}`,
      duration: 0,
      youtubeId: ytData.videoId
    };
    io.emit('track-update', currentTrack);
    io.emit('play-youtube-track', ytData);
  });

  socket.on('dj-audio-stream', (data) => {
    if (!isDJLive || (socket.userRole !== 'admin' && socket.userRole !== 'dj')) return;
    socket.broadcast.emit('listener-audio-stream', data);
  });

  socket.on('dj-update-track', (data) => {
    if (!isDJLive || (socket.userRole !== 'admin' && socket.userRole !== 'dj')) return;
    currentTrack = data.track;
    io.emit('track-update', currentTrack);
  });

  socket.on('dj-add-youtube-to-playlist', (item) => {
    if (socket.userRole !== 'admin' && socket.userRole !== 'dj') return;
    playlist.push({ name: item.title, type: 'youtube', videoId: item.videoId });
    io.emit('playlist-update', playlist);
  });

  socket.on('dj-update-playlist', (list) => {
    if (socket.userRole !== 'admin' && socket.userRole !== 'dj') return;
    playlist = list;
    io.emit('playlist-update', playlist);
  });

  socket.on('dj-volume-change', (data) => {
    if (socket.userRole !== 'admin' && socket.userRole !== 'dj') return;
    if (data.type === 'music') currentVolumes.music = data.volume;
    if (data.type === 'mic') currentVolumes.mic = data.volume;
    io.emit('volume-update', currentVolumes);
  });

  socket.on('dj-set-topic', (newTopic) => {
    if (socket.userRole !== 'admin' && socket.userRole !== 'dj') return;
    todayTopic = newTopic.trim() || "เปิดเพลงสบายๆ สไตล์ Y2K";
    io.emit('topic-update', todayTopic);
  });

  socket.on('dj-pin-message', (msgText) => {
    if (socket.userRole !== 'admin' && socket.userRole !== 'dj') return;
    pinnedMessage = msgText ? msgText.trim() : null;
    io.emit('pinned-update', pinnedMessage);
  });

  socket.on('dj-clear-chat', () => {
    if (socket.userRole !== 'admin' && socket.userRole !== 'dj') return;
    chatHistory = [];
    saveChatHistory();
    io.emit('chat-history-cleared');
  });

  socket.on('dj-play-sfx', (fxType) => {
    if (socket.userRole !== 'admin' && socket.userRole !== 'dj') return;
    io.emit('play-sfx', fxType);
  });

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
    if (socket.userRole !== 'admin' && socket.userRole !== 'dj') return;
    const reqIndex = songRequests.findIndex(r => r.id === reqId);
    if (reqIndex !== -1) {
      const r = songRequests.splice(reqIndex, 1)[0];
      io.emit('requests-update', songRequests);
      const announceMsg = {
        user: "🎧 Studio",
        status: "On Air",
        text: `รับคิวเพลง "${r.song}" ของคุณ ${r.user} เรียบร้อยแล้ว!`,
        style: { bold: true, color: "#b91c1c" },
        role: socket.userRole,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      chatHistory.push(announceMsg);
      saveChatHistory();
      io.emit('chat-message', announceMsg);
    }
  });

  socket.on('send-reaction', (type) => io.emit('receive-reaction', type || '❤️'));
  socket.on('send-nudge', (username) => io.emit('receive-nudge', { user: username || 'ใครบางคน' }));
  socket.on('typing-start', (username) => socket.broadcast.emit('user-typing', { user: username || 'Guest', isTyping: true }));
  socket.on('typing-stop', () => socket.broadcast.emit('user-typing', { isTyping: false }));

  socket.on('disconnect', () => {
    onlineUsersCount = Math.max(0, onlineUsersCount - 1);
    io.emit('online-users-count', onlineUsersCount);

    djQueue = djQueue.filter(q => q.socketId !== socket.id);
    if (adminSocketId) io.to(adminSocketId).emit('admin-dj-queue-update', djQueue);

    if (currentBroadcaster && currentBroadcaster.socketId === socket.id) {
      isDJLive = false;
      currentBroadcaster = null;
      currentTrack = { title: "ดีเจออฟไลน์", artist: "Offline", duration: 0, youtubeId: null };
      io.emit('dj-status-update', false);
      io.emit('track-update', currentTrack);
      io.emit('dj-stop-youtube');
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));