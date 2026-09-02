document.addEventListener('DOMContentLoaded', () => {
  const socket = io();

  const mainAppWindow = document.getElementById('main-app-window');
  const stationStatus = document.getElementById('station-status');
  const onlineUsersBadge = document.getElementById('online-users-badge');
  const chatLogs = document.getElementById('chat-logs');
  const chatInput = document.getElementById('chat-message');
  const usernameInput = document.getElementById('username');
  const userstatusInput = document.getElementById('userstatus');
  const btnSend = document.getElementById('btn-send');
  const trackTitle = document.getElementById('track-title');
  const trackArtist = document.getElementById('track-artist');
  const trackTimeCurrent = document.getElementById('track-time-current');
  const trackTimeTotal = document.getElementById('track-time-total');
  const trackProgressFill = document.getElementById('track-progress-fill');
  const playlistContainer = document.getElementById('playlist-container');
  const btnListen = document.getElementById('btn-listen');
  const displayTopic = document.getElementById('display-topic');
  const pinnedBanner = document.getElementById('pinned-banner');
  const pinnedText = document.getElementById('pinned-text');
  const typingIndicator = document.getElementById('typing-indicator');

  // Backup Radio Tuner
  const backupStationSelect = document.getElementById('backup-station-select');
  const backupAudioPlayer = document.getElementById('backup-audio-player');
  let currentHls = null;

  // DJ Elements
  const btnDjLogin = document.getElementById('btn-dj-login');
  const btnDjLogout = document.getElementById('btn-dj-logout');
  const djLoginSection = document.getElementById('dj-login-section');
  const djControlsSection = document.getElementById('dj-controls-section');
  const btnShowToggle = document.getElementById('btn-show-toggle');
  const djBroadcastTools = document.getElementById('dj-broadcast-tools');
  const djFileInput = document.getElementById('dj-file-input');
  const btnPlayMusic = document.getElementById('btn-play-music');
  const btnMic = document.getElementById('btn-mic');
  const djTopicInput = document.getElementById('dj-topic-input');
  const btnSaveTopic = document.getElementById('btn-save-topic');
  const djPinInput = document.getElementById('dj-pin-input');
  const btnPinMsg = document.getElementById('btn-pin-msg');
  const btnUnpinMsg = document.getElementById('btn-unpin-msg');
  const btnClearChat = document.getElementById('btn-clear-chat');

  // YouTube Control
  const djYtUrl = document.getElementById('dj-yt-url');
  const btnPlayYt = document.getElementById('btn-play-yt');

  // Nudge, Reactions, SFX
  const btnNudge = document.getElementById('btn-nudge');
  const btnHeartReaction = document.getElementById('btn-heart-reaction');
  const heartContainer = document.getElementById('heart-container');
  const sfxButtons = document.querySelectorAll('.sfx-btn');

  // Request Modal Elements
  const btnOpenRequestModal = document.getElementById('btn-open-request-modal');
  const requestModal = document.getElementById('request-modal');
  const reqSongInput = document.getElementById('req-song-input');
  const reqNoteInput = document.getElementById('req-note-input');
  const reqBtnSubmit = document.getElementById('req-btn-submit');
  const reqBtnCancel = document.getElementById('req-btn-cancel');
  const requestsList = document.getElementById('requests-list');
  const reqCountBadge = document.getElementById('req-count');

  // Mixer Sliders
  const sliderMusicVol = document.getElementById('slider-music-vol');
  const sliderMicVol = document.getElementById('slider-mic-vol');
  const labelMusicVol = document.getElementById('label-music-vol');
  const labelMicVol = document.getElementById('label-mic-vol');
  const btnDucking = document.getElementById('btn-ducking');

  // Modal
  const djModal = document.getElementById('dj-modal');
  const modalPassInput = document.getElementById('modal-pass-input');
  const modalBtnConfirm = document.getElementById('modal-btn-confirm');
  const modalBtnCancel = document.getElementById('modal-btn-cancel');
  const modalError = document.getElementById('modal-error');

  // Toolbar
  const btnBold = document.getElementById('btn-bold');
  const btnItalic = document.getElementById('btn-italic');
  const btnUnderline = document.getElementById('btn-underline');
  const btnEmoji = document.getElementById('btn-emoji');
  const emojiMenu = document.getElementById('emoji-menu');
  const chatColor = document.getElementById('chat-color');

  let currentStyle = { bold: false, italic: false, underline: false, color: '#000000' };
  let isShowLive = false;
  let isDucking = false;
  let previousMusicVol = 80;

  // ==========================================
  // 🎥 YouTube IFrame Background Player
  // ==========================================
  let ytPlayer = null;
  let isYtReady = false;

  window.onYouTubeIframeAPIReady = function() {
    ytPlayer = new YT.Player('yt-player-hidden', {
      height: '1',
      width: '1',
      playerVars: {
        'autoplay': 1,
        'controls': 0,
        'disablekb': 1,
        'fs': 0
      },
      events: {
        'onReady': () => { isYtReady = true; },
        'onStateChange': onPlayerStateChange
      }
    });
  };

  function extractYouTubeID(url) {
    const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/;
    const match = url.match(regExp);
    return match ? match[1] : null;
  }

  function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.PLAYING) {
      if (trackTimerInterval) clearInterval(trackTimerInterval);
      const duration = ytPlayer.getDuration();
      if (trackTimeTotal) trackTimeTotal.textContent = formatTime(duration);

      trackTimerInterval = setInterval(() => {
        if (!ytPlayer || typeof ytPlayer.getCurrentTime !== 'function') return;
        const current = ytPlayer.getCurrentTime();
        if (trackTimeCurrent) trackTimeCurrent.textContent = formatTime(current);
        if (trackProgressFill) {
          const percent = Math.min(100, (current / duration) * 100);
          trackProgressFill.style.width = `${percent}%`;
        }
      }, 1000);
    }
  }

  // กดปุ่มเพิ่ม YouTube เข้าคิว Playlist
  if (btnPlayYt) {
    btnPlayYt.addEventListener('click', async () => {
      const url = djYtUrl.value.trim();
      if (!url) return alert("กรุณาวางลิงก์ YouTube ก่อนครับ");
      
      const videoId = extractYouTubeID(url);
      if (!videoId) return alert("รูปแบบลิงก์ YouTube ไม่ถูกต้อง! ตัวอย่าง: https://youtu.be/xxxx หรือ https://www.youtube.com/watch?v=xxxx");

      let title = `YouTube Track (${videoId})`;
      try {
        const res = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
        const data = await res.json();
        if (data.title) title = data.title;
      } catch (e) {}

      playlist.push({ name: `▶ [YT] ${title}`, type: 'youtube', videoId: videoId });
      socket.emit('dj-add-youtube-to-playlist', { videoId, title: `▶ [YT] ${title}` });
      
      djYtUrl.value = '';
      alert(`เพิ่มเพลง "${title}" เข้าคิวเรียบร้อยแล้ว!`);
    });
  }

  socket.on('play-youtube-track', (data) => {
    initAudioContext();
    if (currentMusicSource) {
      currentMusicSource.stop();
      currentMusicSource = null;
    }
    if (isYtReady && ytPlayer) {
      ytPlayer.loadVideoById(data.videoId);
      ytPlayer.setVolume(sliderMusicVol ? parseInt(sliderMusicVol.value) : 80);
      ytPlayer.playVideo();
    }
  });

  socket.on('dj-stop-youtube', () => {
    if (isYtReady && ytPlayer && typeof ytPlayer.stopVideo === 'function') {
      ytPlayer.stopVideo();
    }
  });

  // ==========================================
  // 📻 Thai Radio Streams
  // ==========================================
  if (backupStationSelect) {
    backupStationSelect.addEventListener('change', (e) => {
      const streamUrl = e.target.value;
      if (!streamUrl) {
        if (currentHls) { currentHls.destroy(); currentHls = null; }
        backupAudioPlayer.pause();
        backupAudioPlayer.src = '';
        return;
      }

      if (streamUrl.includes('.m3u8')) {
        if (Hls.isSupported()) {
          if (currentHls) currentHls.destroy();
          currentHls = new Hls();
          currentHls.loadSource(streamUrl);
          currentHls.attachMedia(backupAudioPlayer);
          currentHls.on(Hls.Events.MANIFEST_PARSED, () => {
            backupAudioPlayer.play().catch(console.warn);
          });
        } else if (backupAudioPlayer.canPlayType('application/vnd.apple.mpegurl')) {
          backupAudioPlayer.src = streamUrl;
          backupAudioPlayer.play().catch(console.warn);
        }
      } else {
        if (currentHls) { currentHls.destroy(); currentHls = null; }
        backupAudioPlayer.src = streamUrl;
        backupAudioPlayer.play().catch(console.warn);
      }
    });
  }

  // ==========================================
  // ✨ Y2K Glitter Star Cursor
  // ==========================================
  const glitterCanvas = document.getElementById('glitter-canvas');
  const gCtx = glitterCanvas.getContext('2d');
  let particles = [];

  function resizeCanvas() {
    glitterCanvas.width = window.innerWidth;
    glitterCanvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  window.addEventListener('mousemove', (e) => {
    for (let i = 0; i < 3; i++) {
      particles.push({
        x: e.clientX + (Math.random() - 0.5) * 12,
        y: e.clientY + (Math.random() - 0.5) * 12,
        size: Math.random() * 4 + 2,
        color: `hsl(${Math.random() * 60 + 180}, 100%, 75%)`,
        alpha: 1,
        vy: Math.random() * 1.5 + 0.5,
        vx: (Math.random() - 0.5) * 1
      });
    }
  });

  function animateGlitter() {
    gCtx.clearRect(0, 0, glitterCanvas.width, glitterCanvas.height);
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.025;

      gCtx.fillStyle = p.color;
      gCtx.globalAlpha = Math.max(0, p.alpha);
      gCtx.beginPath();
      gCtx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
      gCtx.fill();

      if (p.alpha <= 0) {
        particles.splice(i, 1);
        i--;
      }
    }
    requestAnimationFrame(animateGlitter);
  }
  animateGlitter();

  // ==========================================
  // 💖 Floating Heart Reactions
  // ==========================================
  if (btnHeartReaction) {
    btnHeartReaction.addEventListener('click', () => {
      socket.emit('send-reaction', '❤️');
    });
  }

  socket.on('receive-reaction', (type) => {
    if (!heartContainer) return;
    const heart = document.createElement('div');
    heart.className = 'floating-heart';
    heart.textContent = type;
    heart.style.right = `${Math.random() * 60 + 10}px`;
    heartContainer.appendChild(heart);
    setTimeout(() => heart.remove(), 2300);
  });

  // ==========================================
  // 🔊 Web Audio & Winamp Visualizer
  // ==========================================
  let listenAudioCtx = null;
  let musicGainNode = null;
  let micGainNode = null;
  let analyserNode = null;
  let currentMusicSource = null;

  function initAudioContext() {
    if (!listenAudioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      listenAudioCtx = new AudioContext();

      analyserNode = listenAudioCtx.createAnalyser();
      analyserNode.fftSize = 64;

      musicGainNode = listenAudioCtx.createGain();
      musicGainNode.gain.value = 0.8;
      musicGainNode.connect(analyserNode);

      micGainNode = listenAudioCtx.createGain();
      micGainNode.gain.value = 1.0;
      micGainNode.connect(analyserNode);

      analyserNode.connect(listenAudioCtx.destination);
      startVisualizer();
    }
  }

  const vCanvas = document.getElementById('visualizer-canvas');
  const vCtx = vCanvas ? vCanvas.getContext('2d') : null;

  function startVisualizer() {
    if (!vCtx || !analyserNode) return;
    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function render() {
      requestAnimationFrame(render);
      analyserNode.getByteFrequencyData(dataArray);

      vCtx.fillStyle = '#060e1d';
      vCtx.fillRect(0, 0, vCanvas.width, vCanvas.height);

      const barWidth = (vCanvas.width / bufferLength) * 1.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * vCanvas.height;
        const grad = vCtx.createLinearGradient(0, vCanvas.height, 0, 0);
        grad.addColorStop(0, '#22c55e');
        grad.addColorStop(0.7, '#eab308');
        grad.addColorStop(1, '#ef4444');

        vCtx.fillStyle = grad;
        vCtx.fillRect(x, vCanvas.height - barHeight, barWidth - 1, barHeight);
        x += barWidth;
      }
    }
    render();
  }

  // ==========================================
  // 💥 MSN Nudge & Sound FX
  // ==========================================
  function playNudgeSound() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.35);

      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.38);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch(e){}
  }

  let canNudge = true;
  if (btnNudge) {
    btnNudge.addEventListener('click', () => {
      if (!canNudge) return alert("กรุณารอ 5 วินาทีก่อนส่งสะกิดใหม่อีกครั้ง!");
      const user = usernameInput.value.trim() || 'Guest';
      socket.emit('send-nudge', user);
      canNudge = false;
      setTimeout(() => canNudge = true, 5000);
    });
  }

  socket.on('receive-nudge', (data) => {
    if (mainAppWindow) {
      mainAppWindow.classList.remove('nudge-shake');
      void mainAppWindow.offsetWidth;
      mainAppWindow.classList.add('nudge-shake');
    }
    playNudgeSound();

    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble';
    bubble.innerHTML = `<div style="color: #b91c1c; font-weight: bold; font-size: 11px;">💥 ${data.user} ได้ส่งสัญญาณสะกิดหน้าจอคุณ!</div>`;
    chatLogs.appendChild(bubble);
    chatLogs.scrollTop = chatLogs.scrollHeight;
  });

  sfxButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const soundType = btn.getAttribute('data-sound');
      socket.emit('dj-play-sfx', soundType);
    });
  });

  socket.on('play-sfx', (type) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (type === 'airhorn') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(466.16, ctx.currentTime);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.65);
      } else if (type === 'rimshot') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(250, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else if (type === 'sad') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(140, ctx.currentTime + 0.6);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.65);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.7);
      } else if (type === 'laugh') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(500, ctx.currentTime);
        osc.frequency.setValueAtTime(700, ctx.currentTime + 0.1);
        osc.frequency.setValueAtTime(450, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.45);
      }
    } catch(e){}
  });

  // ==========================================
  // 📝 กล่องขอเพลง
  // ==========================================
  if (btnOpenRequestModal) {
    btnOpenRequestModal.addEventListener('click', () => {
      reqSongInput.value = '';
      reqNoteInput.value = '';
      requestModal.classList.remove('hide');
      reqSongInput.focus();
    });
  }

  if (reqBtnCancel) {
    reqBtnCancel.addEventListener('click', () => requestModal.classList.add('hide'));
  }

  if (reqBtnSubmit) {
    reqBtnSubmit.addEventListener('click', () => {
      const song = reqSongInput.value.trim();
      const note = reqNoteInput.value.trim();
      const user = usernameInput.value.trim() || 'ผู้ฟังทางบ้าน';
      if (!song) return alert("กรุณาใส่ชื่อเพลงด้วยครับ");

      socket.emit('submit-song-request', { user, song, note });
      requestModal.classList.add('hide');
      alert("ส่งคำขอเพลงถึงดีเจเรียบร้อยแล้ว! 📻");
    });
  }

  socket.on('requests-update', (reqs) => {
    if (reqCountBadge) reqCountBadge.textContent = reqs.length;
    if (!requestsList) return;
    requestsList.innerHTML = '';
    if (reqs.length === 0) {
      requestsList.innerHTML = '<li>ยังไม่มีคำขอเพลง</li>';
      return;
    }
    reqs.forEach(r => {
      const li = document.createElement('li');
      li.innerHTML = `
        <div style="overflow:hidden;text-overflow:ellipsis;">
          <strong>${r.song}</strong> (${r.user})<br>
          <span style="color:#666;font-size:10px;">${r.note || '-'}</span>
        </div>
        <button class="accept-req-btn" data-id="${r.id}">✅ รับ</button>
      `;
      requestsList.appendChild(li);
    });

    requestsList.querySelectorAll('.accept-req-btn').forEach(b => {
      b.onclick = () => {
        const id = parseInt(b.getAttribute('data-id'));
        socket.emit('dj-accept-request', id);
      };
    });
  });

  // ==========================================
  // 📌 ปักหมุดและล้างแชทโดยดีเจ
  // ==========================================
  if (btnPinMsg) {
    btnPinMsg.addEventListener('click', () => {
      const txt = djPinInput.value.trim();
      if (!txt) return;
      socket.emit('dj-pin-message', txt);
      djPinInput.value = '';
    });
  }

  if (btnUnpinMsg) {
    btnUnpinMsg.addEventListener('click', () => {
      socket.emit('dj-pin-message', '');
    });
  }

  if (btnClearChat) {
    btnClearChat.addEventListener('click', () => {
      if (confirm("ต้องการล้างประวัติแชททั้งหมดใช่หรือไม่?")) {
        socket.emit('dj-clear-chat');
      }
    });
  }

  socket.on('pinned-update', (msg) => {
    if (!pinnedBanner || !pinnedText) return;
    if (msg) {
      pinnedText.textContent = msg;
      pinnedBanner.classList.remove('hide');
    } else {
      pinnedBanner.classList.add('hide');
    }
  });

  function playNotificationSound() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1050, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.16);
    } catch (e) {}
  }

  socket.on('online-users-count', (count) => {
    if (onlineUsersBadge) onlineUsersBadge.textContent = `👥 ${count} คน`;
  });

  socket.on('volume-update', (vols) => {
    if (listenAudioCtx) {
      if (musicGainNode && vols.music !== undefined) {
        musicGainNode.gain.setValueAtTime(vols.music, listenAudioCtx.currentTime);
      }
      if (micGainNode && vols.mic !== undefined) {
        micGainNode.gain.setValueAtTime(vols.mic, listenAudioCtx.currentTime);
      }
    }
    if (isYtReady && ytPlayer && vols.music !== undefined) {
      ytPlayer.setVolume(Math.round(vols.music * 100));
    }
  });

  if (sliderMusicVol) {
    sliderMusicVol.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      if (labelMusicVol) labelMusicVol.textContent = `${val}%`;
      const floatVal = val / 100;
      socket.emit('dj-volume-change', { type: 'music', volume: floatVal });
      if (listenAudioCtx && musicGainNode) {
        musicGainNode.gain.setValueAtTime(floatVal, listenAudioCtx.currentTime);
      }
      if (isYtReady && ytPlayer) {
        ytPlayer.setVolume(val);
      }
    });
  }

  if (sliderMicVol) {
    sliderMicVol.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      if (labelMicVol) labelMicVol.textContent = `${val}%`;
      const floatVal = val / 100;
      socket.emit('dj-volume-change', { type: 'mic', volume: floatVal });
      if (listenAudioCtx && micGainNode) {
        micGainNode.gain.setValueAtTime(floatVal, listenAudioCtx.currentTime);
      }
    });
  }

  if (btnDucking) {
    btnDucking.addEventListener('click', () => {
      if (!isDucking) {
        previousMusicVol = parseInt(sliderMusicVol.value);
        sliderMusicVol.value = 20;
        if (labelMusicVol) labelMusicVol.textContent = "20%";
        socket.emit('dj-volume-change', { type: 'music', volume: 0.2 });
        if (listenAudioCtx && musicGainNode) musicGainNode.gain.setValueAtTime(0.2, listenAudioCtx.currentTime);
        if (isYtReady && ytPlayer) ytPlayer.setVolume(20);
        btnDucking.classList.add('active');
        btnDucking.textContent = "🔊 คืนระดับเสียงเพลงเดิม";
        isDucking = true;
      } else {
        sliderMusicVol.value = previousMusicVol;
        if (labelMusicVol) labelMusicVol.textContent = `${previousMusicVol}%`;
        const floatVal = previousMusicVol / 100;
        socket.emit('dj-volume-change', { type: 'music', volume: floatVal });
        if (listenAudioCtx && musicGainNode) musicGainNode.gain.setValueAtTime(floatVal, listenAudioCtx.currentTime);
        if (isYtReady && ytPlayer) ytPlayer.setVolume(previousMusicVol);
        btnDucking.classList.remove('active');
        btnDucking.textContent = "🔉 หรี่เพลงพูดไมค์ (Ducking)";
        isDucking = false;
      }
    });
  }

  socket.on('topic-update', (topic) => {
    if (displayTopic) displayTopic.textContent = topic;
  });

  if (btnSaveTopic) {
    btnSaveTopic.addEventListener('click', () => {
      const newTopic = djTopicInput.value.trim();
      if (!newTopic) return;
      socket.emit('dj-set-topic', newTopic);
      djTopicInput.value = '';
    });
  }

  socket.on('dj-status-update', (isLive) => {
    isShowLive = isLive;
    if (isLive) {
      stationStatus.textContent = "● On Air (Live)";
      stationStatus.className = "status-online";
    } else {
      stationStatus.textContent = "○ Offline";
      stationStatus.className = "status-offline";
    }
    updateShowButtonUI();
  });

  function updateShowButtonUI() {
    if (!btnShowToggle) return;
    if (isShowLive) {
      btnShowToggle.textContent = "⏹️ จบรายการ (End Show)";
      btnShowToggle.className = "y2k-btn off-air-btn";
      if (djBroadcastTools) djBroadcastTools.classList.remove('hide');
    } else {
      btnShowToggle.textContent = "🔴 เริ่มจัดรายการ (Go Live)";
      btnShowToggle.className = "y2k-btn on-air-btn";
      if (djBroadcastTools) djBroadcastTools.classList.add('hide');
    }
  }

  if (btnShowToggle) {
    btnShowToggle.addEventListener('click', () => {
      if (!isShowLive) {
        socket.emit('dj-start-show');
      } else {
        if (confirm("ต้องการจบรายการใช่หรือไม่?")) {
          socket.emit('dj-end-show');
        }
      }
    });
  }

  if (usernameInput) {
    if (localStorage.getItem('saved_username')) {
      usernameInput.value = localStorage.getItem('saved_username');
    }
    usernameInput.addEventListener('input', () => {
      localStorage.setItem('saved_username', usernameInput.value.trim());
    });
  }

  const savedDJKey = localStorage.getItem('dj_access_key');
  if (savedDJKey) {
    socket.emit('dj-auth', savedDJKey, (res) => {
      if (res.success) {
        unlockDJControls();
        isShowLive = res.isLive;
        updateShowButtonUI();
      } else {
        localStorage.removeItem('dj_access_key');
      }
    });
  }

  function unlockDJControls() {
    if (djLoginSection) djLoginSection.classList.add('hide');
    if (djControlsSection) djControlsSection.classList.remove('hide');
  }

  function lockDJControls() {
    if (djControlsSection) djControlsSection.classList.add('hide');
    if (djLoginSection) djLoginSection.classList.remove('hide');
  }

  if (btnDjLogout) {
    btnDjLogout.addEventListener('click', () => {
      if (confirm("ต้องการออกจากโหมดดีเจใช่หรือไม่?")) {
        if (isShowLive) socket.emit('dj-end-show');
        if (isBroadcastingMic && mediaRecorder) {
          mediaRecorder.stop();
          isBroadcastingMic = false;
        }
        localStorage.removeItem('dj_access_key');
        lockDJControls();
        window.location.reload();
      }
    });
  }

  if (btnDjLogin) {
    btnDjLogin.onclick = () => {
      modalPassInput.value = '';
      if (modalError) modalError.classList.add('hide');
      djModal.classList.remove('hide');
      modalPassInput.focus();
    };
  }

  if (modalBtnCancel) modalBtnCancel.onclick = () => djModal.classList.add('hide');
  if (modalBtnConfirm) modalBtnConfirm.onclick = () => verifyDJAuth(modalPassInput.value.trim());
  if (modalPassInput) {
    modalPassInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') verifyDJAuth(modalPassInput.value.trim());
    });
  }

  function verifyDJAuth(pass) {
    if (!pass) return;
    socket.emit('dj-auth', pass, (res) => {
      if (res.success) {
        localStorage.setItem('dj_access_key', pass);
        djModal.classList.add('hide');
        unlockDJControls();
        isShowLive = res.isLive;
        updateShowButtonUI();
      } else {
        if (modalError) {
          modalError.textContent = res.message;
          modalError.classList.remove('hide');
        }
      }
    });
  }

  let typingTimeout = null;
  if (chatInput) {
    chatInput.addEventListener('input', () => {
      const user = usernameInput.value.trim() || 'Guest';
      socket.emit('typing-start', user);
      clearTimeout(typingTimeout);
      typingTimeout = setTimeout(() => socket.emit('typing-stop'), 2000);
    });
  }

  function renderMessage(data) {
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble';

    const s = data.style || {};
    const textColor = s.color || '#000000';
    const textWeight = s.bold ? 'bold' : 'normal';
    const textStyle = s.italic ? 'italic' : 'normal';
    const textDecor = s.underline ? 'underline' : 'none';

    const djBadgeHTML = data.isDJ 
      ? `<span class="dj-badge-tag">🎧 DJ Admin</span>` 
      : '';

    const statusHTML = data.status 
      ? `<span class="msn-status-tag">(${data.status})</span>` 
      : '';

    bubble.innerHTML = `
      <div class="meta">
        <span class="user-name">${data.user}</span>${statusHTML}${djBadgeHTML}
        <span style="font-weight:normal;color:#888;font-size:11px;">(${data.time})</span>:
      </div>
      <div class="text" style="color: ${textColor} !important; font-weight: ${textWeight} !important; font-style: ${textStyle} !important; text-decoration: ${textDecor} !important;">
        ${data.text}
      </div>
    `;
    chatLogs.appendChild(bubble);
  }

  socket.on('chat-history', (history) => {
    chatLogs.innerHTML = '';
    history.forEach(msg => renderMessage(msg));
    chatLogs.scrollTop = chatLogs.scrollHeight;
  });

  socket.on('chat-message', (data) => {
    renderMessage(data);
    chatLogs.scrollTop = chatLogs.scrollHeight;
    playNotificationSound();
  });

  socket.on('chat-history-cleared', () => {
    chatLogs.innerHTML = '<div style="text-align:center;color:#888;padding:10px;">--- เริ่มต้นวันใหม่ / ล้างข้อความ ---</div>';
  });

  socket.on('user-typing', (data) => {
    if (!typingIndicator) return;
    if (data.isTyping) {
      typingIndicator.textContent = `✎ ${data.user} กำลังพิมพ์ข้อความ...`;
      typingIndicator.classList.remove('hide');
    } else {
      typingIndicator.textContent = '';
      typingIndicator.classList.add('hide');
    }
  });

  function sendMessage() {
    const text = chatInput.value.trim();
    const user = usernameInput.value.trim() || 'Guest';
    const status = userstatusInput ? userstatusInput.value.trim() : '';
    if (!text) return;

    clearTimeout(typingTimeout);
    socket.emit('typing-stop');

    socket.emit('chat-message', {
      user,
      status,
      text,
      style: { ...currentStyle }
    });

    chatInput.value = '';
    chatInput.focus();
  }

  if (btnSend) btnSend.onclick = sendMessage;
  if (chatInput) {
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        sendMessage();
      }
    });
  }

  if (btnBold) {
    btnBold.onclick = () => {
      currentStyle.bold = !currentStyle.bold;
      btnBold.classList.toggle('active', currentStyle.bold);
      chatInput.style.fontWeight = currentStyle.bold ? 'bold' : 'normal';
    };
  }

  if (btnItalic) {
    btnItalic.onclick = () => {
      currentStyle.italic = !currentStyle.italic;
      btnItalic.classList.toggle('active', currentStyle.italic);
      chatInput.style.fontStyle = currentStyle.italic ? 'italic' : 'normal';
    };
  }

  if (btnUnderline) {
    btnUnderline.onclick = () => {
      currentStyle.underline = !currentStyle.underline;
      btnUnderline.classList.toggle('active', currentStyle.underline);
      chatInput.style.textDecoration = currentStyle.underline ? 'underline' : 'none';
    };
  }

  if (btnEmoji && emojiMenu) {
    btnEmoji.onclick = (e) => {
      e.stopPropagation();
      emojiMenu.classList.toggle('hide');
    };

    emojiMenu.querySelectorAll('span').forEach(item => {
      item.onclick = () => {
        chatInput.value += item.textContent;
        emojiMenu.classList.add('hide');
        chatInput.focus();
      };
    });

    document.addEventListener('click', () => emojiMenu.classList.add('hide'));
  }

  if (chatColor) {
    chatColor.oninput = (e) => {
      currentStyle.color = e.target.value;
      chatInput.style.color = currentStyle.color;
    };
  }

  // ==========================================
  // ⏱️ Main Audio & Track Timer
  // ==========================================
  let isBroadcastingMic = false;
  let mediaRecorder = null;
  let playlist = [];
  let trackTimerInterval = null;

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  if (btnListen) {
    btnListen.onclick = async () => {
      initAudioContext();
      if (listenAudioCtx.state === 'suspended') {
        await listenAudioCtx.resume();
      }
      if (isYtReady && ytPlayer && typeof ytPlayer.playVideo === 'function') {
        ytPlayer.playVideo();
      }
      btnListen.textContent = "🔊 กำลังรับฟังสด";
      btnListen.style.filter = "hue-rotate(90deg)";
    };
  }

  socket.on('listener-audio-stream', async (data) => {
    initAudioContext();
    if (listenAudioCtx.state === 'suspended') await listenAudioCtx.resume();

    try {
      const isObject = data && data.buffer;
      const bufferData = isObject ? data.buffer : data;
      const streamType = isObject ? data.type : 'mic';

      const audioBuffer = await listenAudioCtx.decodeAudioData(bufferData.slice(0));
      const source = listenAudioCtx.createBufferSource();
      source.buffer = audioBuffer;

      if (streamType === 'music') {
        if (currentMusicSource) currentMusicSource.stop();
        currentMusicSource = source;
        source.connect(musicGainNode);

        if (trackTimerInterval) clearInterval(trackTimerInterval);
        const duration = audioBuffer.duration;
        if (trackTimeTotal) trackTimeTotal.textContent = formatTime(duration);
        let elapsed = 0;

        trackTimerInterval = setInterval(() => {
          elapsed += 1;
          if (trackTimeCurrent) trackTimeCurrent.textContent = formatTime(elapsed);
          if (trackProgressFill) {
            const percent = Math.min(100, (elapsed / duration) * 100);
            trackProgressFill.style.width = `${percent}%`;
          }
          if (elapsed >= duration) {
            clearInterval(trackTimerInterval);
          }
        }, 1000);
      } else {
        source.connect(micGainNode);
      }

      source.start();
    } catch (err) {
      console.error(err);
    }
  });

  socket.on('track-update', (track) => {
    if (trackTitle) trackTitle.textContent = track.title;
    if (trackArtist) trackArtist.textContent = track.artist;
    if (track.title === "รอเริ่มรายการ" || track.title === "จบรายการแล้ว" || track.title === "ดีเจออฟไลน์") {
      if (trackTimerInterval) clearInterval(trackTimerInterval);
      if (trackTimeCurrent) trackTimeCurrent.textContent = "00:00";
      if (trackTimeTotal) trackTimeTotal.textContent = "00:00";
      if (trackProgressFill) trackProgressFill.style.width = "0%";
    }
  });

  socket.on('playlist-update', (list) => {
    if (!playlistContainer) return;
    playlistContainer.innerHTML = '';
    if (!list || list.length === 0) {
      playlistContainer.innerHTML = '<li>ไม่มีรายการเพลง</li>';
      return;
    }
    list.forEach((t, index) => {
      const li = document.createElement('li');
      li.textContent = `${index + 1}. ${t.name}`;
      playlistContainer.appendChild(li);
    });
  });

  if (djFileInput) {
    djFileInput.onchange = (e) => {
      const files = Array.from(e.target.files).map(f => {
        f.type = 'mp3';
        return f;
      });
      playlist = playlist.concat(files);
      socket.emit('dj-update-playlist', playlist.map(f => ({ name: f.name, type: f.type, videoId: f.videoId })));
    };
  }

  // เล่นเพลงถัดไป รองรับทั้ง MP3 และ YouTube
  if (btnPlayMusic) {
    btnPlayMusic.onclick = async () => {
      if (playlist.length === 0) return alert('ไม่มีเพลงในคิว กรุณาเลือกไฟล์ MP3 หรือเพิ่มลิงก์ YouTube ก่อน');
      
      const item = playlist.shift();
      socket.emit('dj-update-playlist', playlist.map(f => ({ name: f.name, type: f.type, videoId: f.videoId })));

      if (item.type === 'youtube') {
        if (currentMusicSource) {
          currentMusicSource.stop();
          currentMusicSource = null;
        }
        socket.emit('dj-play-youtube', { videoId: item.videoId, title: item.name });
      } else {
        socket.emit('dj-stop-youtube');
        socket.emit('dj-update-track', { track: { title: item.name, artist: "DJ On Air (MP3)" } });
        const arrayBuffer = await item.arrayBuffer();
        socket.emit('dj-audio-stream', { type: 'music', buffer: arrayBuffer });
      }
    };
  }

  if (btnMic) {
    btnMic.onclick = async () => {
      if (!isBroadcastingMic) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          mediaRecorder = new MediaRecorder(stream);
          mediaRecorder.ondataavailable = async (e) => {
            if (e.data.size > 0) {
              const chunk = await e.data.arrayBuffer();
              socket.emit('dj-audio-stream', { type: 'mic', buffer: chunk });
            }
          };
          mediaRecorder.start(400);
          btnMic.textContent = "🛑 ปิดไมค์";
          btnMic.style.filter = "hue-rotate(280deg)";
          isBroadcastingMic = true;
        } catch (err) {
          alert("ไม่สามารถเข้าถึงไมค์: " + err.message);
        }
      } else {
        if (mediaRecorder) mediaRecorder.stop();
        btnMic.textContent = "🎙️ เปิดไมค์";
        btnMic.style.filter = "none";
        isBroadcastingMic = false;
      }
    };
  }
});