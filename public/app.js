const socket = io();

// Element Selections
const chatLogs = document.getElementById('chat-logs');
const chatInput = document.getElementById('chat-message');
const usernameInput = document.getElementById('username');
const btnSend = document.getElementById('btn-send');
const trackTitle = document.getElementById('track-title');
const trackArtist = document.getElementById('track-artist');
const playlistContainer = document.getElementById('playlist-container');
const btnListen = document.getElementById('btn-listen');

// DJ Controls
const djFileInput = document.getElementById('dj-file-input');
const btnPlayMusic = document.getElementById('btn-play-music');
const btnMic = document.getElementById('btn-mic');

let playlist = [];
let audioContext, mediaStreamDestination;
let isBroadcastingMic = false;

// --- ระบบแชท Real-time ---
function sendMessage() {
  const text = chatInput.value.trim();
  const user = usernameInput.value.trim() || 'Guest';
  if (!text) return;

  socket.emit('chat-message', { user, text });
  chatInput.value = '';
}

btnSend.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});

socket.on('chat-message', (data) => {
  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble';
  bubble.innerHTML = `<span class="meta">${data.user} (${data.time}):</span> <span class="text">${data.text}</span>`;
  chatLogs.appendChild(bubble);
  chatLogs.scrollTop = chatLogs.scrollHeight;
});

// --- การรับสตรีมเสียง (ฝั่งผู้ฟัง) ---
let audioQueue = [];
let isPlayingAudio = false;
let listenAudioCtx;

btnListen.addEventListener('click', () => {
  if (!listenAudioCtx) {
    listenAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    btnListen.textContent = "🔊 รับฟังสดอยู่";
    btnListen.style.filter = "hue-rotate(90deg)";
  }
});

socket.on('listener-audio-stream', async (arrayBuffer) => {
  if (!listenAudioCtx) return;
  const audioBuffer = await listenAudioCtx.decodeAudioData(arrayBuffer);
  const source = listenAudioCtx.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(listenAudioCtx.destination);
  source.start();
});

socket.on('track-update', (track) => {
  trackTitle.textContent = track.title;
  trackArtist.textContent = track.artist;
});

socket.on('playlist-update', (list) => {
  playlistContainer.innerHTML = '';
  if (list.length === 0) {
    playlistContainer.innerHTML = '<li>ไม่มีเพลงในคิว</li>';
    return;
  }
  list.forEach((t, index) => {
    const li = document.createElement('li');
    li.textContent = `${index + 1}. ${t.name}`;
    playlistContainer.appendChild(li);
  });
});

// --- DJ / Admin Studio Mode ---
djFileInput.addEventListener('change', (e) => {
  playlist = Array.from(e.target.files);
  const serializableList = playlist.map(f => ({ name: f.name }));
  socket.emit('dj-update-playlist', serializableList);
});

// ส่งสัญญาณเสียงเข้าห้องออกอากาศ
function sendAudioChunk(arrayBuffer) {
  socket.emit('dj-audio-stream', arrayBuffer);
}

btnPlayMusic.addEventListener('click', async () => {
  if (playlist.length === 0) return alert('กรุณาเลือกไฟล์เพลงก่อน');
  const file = playlist.shift();
  socket.emit('dj-update-track', { title: file.name, artist: "DJ Live Mix" });
  
  const arrayBuffer = await file.arrayBuffer();
  sendAudioChunk(arrayBuffer); // กระจายเสียงไปยังผู้ฟัง
});

btnMic.addEventListener('click', async () => {
  if (!isBroadcastingMic) {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    
    mediaRecorder.ondataavailable = async (e) => {
      const buffer = await e.data.arrayBuffer();
      sendAudioChunk(buffer);
    };
    
    mediaRecorder.start(250); // ส่งท่อนเสียงทุก 250ms
    window.currentRecorder = mediaRecorder;
    btnMic.textContent = "🛑 ปิดไมค์";
    isBroadcastingMic = true;
  } else {
    window.currentRecorder.stop();
    btnMic.textContent = "🎙️ เปิดไมค์";
    isBroadcastingMic = false;
  }
});