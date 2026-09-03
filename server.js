const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { maxHttpBufferSize: 1e7 });

app.set('trust proxy', true);
app.use(express.static(path.join(__dirname, 'public')));

const ADMIN_SECRET_KEY = "0024252600";

let adminSocketId = null;
let currentBroadcaster = null;
let isDJLive = false;
let currentTrack = { title: "รอเริ่มรายการ", artist: "Offline", duration: 0, youtubeId: null, startedAt: null };
let todayTopic = "ยินดีต้อนรับสู่ Y2K Radio! ขอเพลงกันเข้ามาได้เลย ✨";
let pinnedMessage = null;
let playlist = [];
let songRequests = [];
let djQueue = [];

let onlineUsersCount = 0;
let totalHitsCount = 1337;
let currentVolumes = { music: 0.8, mic: 1.0 };

// Auto-DJ Playlist (เพลงฮิตยุค 2000s)
const AUTO_DJ_PLAYLIST = [
  { videoId: '5qap5aO4i9A', title: 'Lofi Hip Hop - Chill Beats 2000s' },
  { videoId: 'jfKfPfyJRdk', title: 'Lofi Girl - Relaxing Radio' },
  { videoId: '7NOSDKb0HlU', title: 'Retro Y2K Pop Melodies' }
];
let autoDjIndex = 0;

// โพลเพลงสด (Music Battle)
let activePoll = null;

function getThaiTime() {
  return new Date().toLocaleTimeString('th-TH', {
    timeZone: 'Asia/Bangkok',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

function getTodayString() {
  const d = new Date();
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
}
let currentDay = getTodayString();

const BANNED_FILE = path.join(__dirname, 'banned_users.json');
let bannedList = [];

function loadBannedList() {
  try {
    if (fs.existsSync(BANNED_FILE)) bannedList = JSON.parse(fs.readFileSync(BANNED_FILE, 'utf-8'));
    else { bannedList = []; saveBannedList(); }
  } catch (err) { bannedList = []; }
}
function saveBannedList() {
  try { fs.writeFileSync(BANNED_FILE, JSON.stringify(bannedList, null, 2), 'utf-8'); } catch (err) {}
}
loadBannedList();

const CHAT_FILE = path.join(__dirname, 'chat_history.json');
let chatHistory = [];

const DJS_FILE = path.join(__dirname, 'djs_database.json');
let registeredDJs = {};

function loadRegisteredDJs() {
  try {
    if (fs.existsSync(DJS_FILE)) registeredDJs = JSON.parse(fs.readFileSync(DJS_FILE, 'utf-8'));
    else { registeredDJs = {}; saveRegisteredDJs(); }
  } catch (err) { registeredDJs = {}; }
}
function saveRegisteredDJs() {
  try { fs.writeFileSync(DJS_FILE, JSON.stringify(registeredDJs, null, 2), 'utf-8'); } catch (err) {}
}
loadRegisteredDJs();

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
  try { fs.writeFileSync(CHAT_FILE, JSON.stringify({ savedDay: currentDay, history: chatHistory }, null, 2), 'utf-8'); } catch (err) {}
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

// เริ่มเล่น Auto-DJ อัตโนมัติถ้าไม่มีดีเจสด
function startAutoDJ() {
  if (isDJLive) return;
  const track = AUTO_DJ_PLAYLIST[autoDjIndex % AUTO_DJ_PLAYLIST.length];
  autoDjIndex++;
  const startedAt = Date.now();
  currentTrack = {
    title: `[Auto-DJ] ${track.title}`,
    artist: "Y2K Bot Station",
    duration: 0,
    youtubeId: track.videoId,
    startedAt: startedAt
  };
  io.emit('track-update', currentTrack);
  io.emit('play-youtube-track', {
    videoId: track.videoId,
    title: currentTrack.title,
    seekTo: 0
  });
}

// ส่ง Sync Pulse ทุก 3 วินาที
setInterval(() => {
  if (currentTrack.youtubeId && currentTrack.startedAt) {
    const currentSeconds = Math.max(0, (Date.now() - currentTrack.startedAt) / 1000);
    io.emit('radio-sync-pulse', {
      videoId: currentTrack.youtubeId,
      currentTime: currentSeconds
    });
  }
}, 3000);

function getClientIp(socket) {
  const forwarded = socket.handshake.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return socket.handshake.address || socket.conn.remoteAddress;
}

io.on('connection', (socket) => {
  const clientIp = getClientIp(socket);

  if (bannedList.some(b => b.ip === clientIp)) {
    socket.emit('banned-notice', { reason: "คุณถูกระงับการเข้าใช้งานสถานีชั่วคราว" });
    socket.disconnect(true);
    return;
  }

  onlineUsersCount++;
  totalHitsCount++;
  io.emit('online-users-count', onlineUsersCount);
  io.emit('hit-counter-update', totalHitsCount);
  checkDayReset();

  socket.emit('dj-status-update', isDJLive);

  let trackToSend = { ...currentTrack };
  if (currentTrack.youtubeId && currentTrack.startedAt) {
    trackToSend.seekTo = Math.max(0, (Date.now() - currentTrack.startedAt) / 1000);
  }
  socket.emit('track-update', trackToSend);

  if (currentTrack.youtubeId) {
    socket.emit('play-youtube-track', {
      videoId: currentTrack.youtubeId,
      title: currentTrack.title,
      seekTo: trackToSend.seekTo || 0
    });
  }

  socket.emit('topic-update', todayTopic);
  socket.emit('pinned-update', pinnedMessage);
  socket.emit('volume-update', currentVolumes);
  socket.emit('playlist-update', playlist);
  socket.emit('requests-update', songRequests);
  socket.emit('chat-history', chatHistory);
  if (activePoll) socket.emit('poll-update', activePoll);

  // แชทส่วนรวม
  socket.on('chat-message', (data) => {
    checkDayReset();
    const newMsg = {
      id: Date.now() + Math.random().toString(36).substring(2, 5),
      senderSocketId: socket.id,
      user: data.user || 'Guest',
      status: data.status || '',
      text: data.text,
      style: data.style || {},
      role: socket.userRole || 'listener',
      time: getThaiTime()
    };
    chatHistory.push(newMsg);
    saveChatHistory();
    io.emit('chat-message', newMsg);
  });

  // แชทกระซิบส่วนตัว (Private Whisper)
  socket.on('private-whisper', (data) => {
    const targetSocket = io.sockets.sockets.get(data.targetSocketId);
    const whisperPayload = {
      senderSocketId: socket.id,
      fromUser: data.fromUser || 'Guest',
      toUser: data.toUser,
      text: data.text,
      time: getThaiTime()
    };
    if (targetSocket) {
      targetSocket.emit('receive-whisper', whisperPayload);
      socket.emit('receive-whisper', whisperPayload);
    }
  });

  // ส่ง MSN Winks (แอนิเมชันเต็มจอ)
  socket.on('send-wink', (winkType) => {
    io.emit('receive-wink', {
      user: socket.djName || 'ใครบางคน',
      type: winkType
    });
  });

  // ระบบโพลเพลงสด (Music Battle)
  socket.on('dj-create-poll', (pollData) => {
    if (socket.userRole !== 'admin' && socket.userRole !== 'dj') return;
    activePoll = {
      title: pollData.title || "Music Battle!",
      songA: pollData.songA,
      songB: pollData.songB,
      votesA: 0,
      votesB: 0,
      voters: []
    };
    io.emit('poll-update', activePoll);
  });

  socket.on('cast-vote', (option) => {
    if (!activePoll) return;
    if (activePoll.voters.includes(socket.id)) return;
    activePoll.voters.push(socket.id);
    if (option === 'A') activePoll.votesA++;
    if (option === 'B') activePoll.votesB++;
    io.emit('poll-update', activePoll);
  });

  socket.on('dj-end-poll', () => {
    if (socket.userRole !== 'admin' && socket.userRole !== 'dj') return;
    if (!activePoll) return;
    const winner = activePoll.votesA >= activePoll.votesB ? activePoll.songA : activePoll.songB;
    io.emit('system-announcement', `🏆 ผลโหวตชนะเลิศ: "${winner}" ได้รับคะแนนสูงสุด!`);
    playlist.unshift({ name: `▶ [โหวตชนะ] ${winner}`, type: 'youtube', videoId: '' });
    io.emit('playlist-update', playlist);
    activePoll = null;
    io.emit('poll-update', null);
  });

  // ขอเพลงนิรนาม / สารภาพรัก
  socket.on('submit-secret-dedication', (data) => {
    const item = {
      id: Date.now(),
      user: "💌 ผู้ไม่ประสงค์ออกนาม (ความลับ)",
      song: data.song,
      note: `[สารภาพรัก/ข้อความลับ]: ${data.note || ''}`,
      time: getThaiTime()
    };
    songRequests.push(item);
    io.emit('requests-update', songRequests);
  });

  // Moderation: Kick / Ban
  socket.on('admin-kick-user', (targetSocketId) => {
    if (socket.userRole !== 'admin' && socket.userRole !== 'dj') return;
    const target = io.sockets.sockets.get(targetSocketId);
    if (target) {
      if (target.userRole === 'admin') return;
      target.emit('kicked-notice', { reason: "คุณถูกเตะออกจากห้องสนทนาโดยผู้ดูแลระบบ" });
      target.disconnect(true);
      io.emit('system-announcement', `👢 สมาชิกคนหนึ่งถูกเชิญออกจากห้องสนทนา`);
    }
  });

  socket.on('admin-ban-user', (targetSocketId) => {
    if (socket.userRole !== 'admin' && socket.userRole !== 'dj') return;
    const target = io.sockets.sockets.get(targetSocketId);
    if (target) {
      if (target.userRole === 'admin') return;
      const targetIp = getClientIp(target);
      const targetName = target.djName || 'Guest';

      if (!bannedList.some(b => b.ip === targetIp)) {
        bannedList.push({
          ip: targetIp,
          username: targetName,
          reason: "ถูกระงับสิทธิ์การใช้งานโดยผู้ดูแลระบบ",
          bannedAt: new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })
        });
        saveBannedList();
      }

      target.emit('banned-notice', { reason: "คุณถูกแบนออกจากระบบอย่างถาวร" });
      target.disconnect(true);
      io.emit('system-announcement', `🚫 [ระบบ] ผู้ใช้ "${targetName}" ถูกแบนออกจากสถานี`);
      if (adminSocketId) io.to(adminSocketId).emit('admin-banned-list-update', bannedList);
    }
  });

  socket.on('admin-unban-ip', (ipToUnban) => {
    if (socket.userRole !== 'admin') return;
    bannedList = bannedList.filter(b => b.ip !== ipToUnban);
    saveBannedList();
    socket.emit('admin-banned-list-update', bannedList);
  });

  socket.on('dj-register', (data, callback) => {
    const cleanUser = (data.username || '').trim();
    const cleanPass = (data.password || '').trim();
    if (!cleanUser || !cleanPass) return callback({ success: false, message: "กรุณากรอกชื่อและรหัสผ่าน!" });
    if (cleanUser.toLowerCase() === 'admin' || cleanPass === ADMIN_SECRET_KEY) return callback({ success: false, message: "ชื่อนี้สงวนไว้สำหรับแอดมิน!" });
    if (registeredDJs[cleanUser]) return callback({ success: false, message: "ชื่อจัดรายการนี้มีผู้ใช้งานแล้ว!" });

    registeredDJs[cleanUser] = cleanPass;
    saveRegisteredDJs();
    if (adminSocketId) io.to(adminSocketId).emit('admin-registered-djs-update', Object.keys(registeredDJs));
    callback({ success: true, message: "สมัครบัญชีดีเจสำเร็จ!" });
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
      socket.emit('admin-banned-list-update', bannedList);
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
      djQueue.push({ socketId: socket.id, username: socket.djName, time: getThaiTime() });
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
    currentTrack = { title: "จบรายการแล้ว", artist: "Offline", duration: 0, youtubeId: null, startedAt: null };
    io.emit('dj-status-update', false);
    io.emit('track-update', currentTrack);
    io.emit('dj-stop-youtube');
    // ถอยกลับมาเล่น Auto-DJ ต่อเนื่อง
    startAutoDJ();
  });

  socket.on('dj-play-youtube', (ytData) => {
    if (!isDJLive) return;
    if (socket.userRole !== 'admin' && socket.userRole !== 'dj') return;

    const startedAt = Date.now();
    currentTrack = {
      title: ytData.title || "YouTube Audio",
      artist: socket.userRole === 'admin' ? "Super Admin" : `DJ ${socket.djName}`,
      duration: 0,
      youtubeId: ytData.videoId,
      startedAt: startedAt
    };

    io.emit('track-update', currentTrack);
    io.emit('play-youtube-track', {
      videoId: ytData.videoId,
      title: ytData.title,
      seekTo: 0
    });
  });

  socket.on('dj-add-youtube-to-playlist', async (item) => {
    if (socket.userRole !== 'admin' && socket.userRole !== 'dj') return;

    let songTitle = `YouTube Track [${item.videoId}]`;
    const ytUrl = `https://www.youtube.com/watch?v=${item.videoId}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const response = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(ytUrl)}&format=json`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const info = await response.json();
        if (info && info.title) songTitle = info.title;
      }
    } catch (err) {}

    playlist.push({
      name: `▶ [YT] ${songTitle}`,
      type: 'youtube',
      videoId: item.videoId
    });

    io.emit('playlist-update', playlist);
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
      time: getThaiTime()
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
        time: getThaiTime()
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
      io.emit('dj-status-update', false);
      io.emit('dj-stop-youtube');
      startAutoDJ();
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  // เริ่มต้น Auto-DJ
  startAutoDJ();
});