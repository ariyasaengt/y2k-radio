document.addEventListener('DOMContentLoaded', () => {
  const socket = io();

  let myRole = 'listener';
  let myDJName = '';
  let isListeningToMain = false; // มีเสียงเมื่อกดปุ่มรับฟังสถานีหลักเท่านั้น

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

  const backupStationSelect = document.getElementById('backup-station-select');
  const backupAudioPlayer = document.getElementById('backup-audio-player');

  // สิทธิ์ / Portal / แผงดีเจ
  const btnOpenLoginModal = document.getElementById('btn-open-login-modal');
  const btnOpenRegisterModal = document.getElementById('btn-open-register-modal');
  const djLoginSection = document.getElementById('dj-login-section');
  const djPortalSection = document.getElementById('dj-portal-section');
  const djPortalName = document.getElementById('dj-portal-name');
  const btnRequestToLive = document.getElementById('btn-request-to-live');
  const djPortalWaitingText = document.getElementById('dj-portal-waiting-text');
  const btnDjPortalLogout = document.getElementById('btn-dj-portal-logout');

  const djControlsSection = document.getElementById('dj-controls-section');
  const btnDjLogout = document.getElementById('btn-dj-logout');
  const roleBadge = document.getElementById('role-badge');
  
  const adminApprovalPanel = document.getElementById('admin-approval-panel');
  const djApprovalList = document.getElementById('dj-approval-list');
  const djQueueCount = document.getElementById('dj-queue-count');

  const adminRegisteredDjsBox = document.getElementById('admin-registered-djs-box');
  const registeredDjsList = document.getElementById('registered-djs-list');
  const regDjCount = document.getElementById('reg-dj-count');

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

  const djYtUrl = document.getElementById('dj-yt-url');
  const btnPlayYt = document.getElementById('btn-play-yt');

  const btnNudge = document.getElementById('btn-nudge');
  const btnHeartReaction = document.getElementById('btn-heart-reaction');
  const heartContainer = document.getElementById('heart-container');
  const sfxButtons = document.querySelectorAll('.sfx-btn');

  const btnOpenRequestModal = document.getElementById('btn-open-request-modal');
  const requestModal = document.getElementById('request-modal');
  const reqSongInput = document.getElementById('req-song-input');
  const reqNoteInput = document.getElementById('req-note-input');
  const reqBtnSubmit = document.getElementById('req-btn-submit');
  const reqBtnCancel = document.getElementById('req-btn-cancel');
  const requestsList = document.getElementById('requests-list');
  const reqCountBadge = document.getElementById('req-count');

  const sliderMusicVol = document.getElementById('slider-music-vol');
  const sliderMicVol = document.getElementById('slider-mic-vol');
  const labelMusicVol = document.getElementById('label-music-vol');
  const labelMicVol = document.getElementById('label-mic-vol');
  const btnDucking = document.getElementById('btn-ducking');

  // Modals
  const loginModal = document.getElementById('login-modal');
  const loginUserInput = document.getElementById('login-user-input');
  const loginPassInput = document.getElementById('login-pass-input');
  const loginBtnConfirm = document.getElementById('login-btn-confirm');
  const loginBtnCancel = document.getElementById('login-btn-cancel');
  const loginError = document.getElementById('login-error');

  const registerModal = document.getElementById('register-modal');
  const regUserInput = document.getElementById('reg-user-input');
  const regPassInput = document.getElementById('reg-pass-input');
  const regBtnConfirm = document.getElementById('reg-btn-confirm');
  const regBtnCancel = document.getElementById('reg-btn-cancel');
  const regError = document.getElementById('reg-error');

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
  let playlist = [];

  // ==========================================
  // 🎥 YouTube IFrame Player (ระบบ Sync ล็อกเวลา)
  // ==========================================
  let ytPlayer = null;
  let isYtReady = false;
  let pendingVideoId = null;
  let pendingSeekTime = 0;
  const ytScreenWrapper = document.getElementById('yt-screen-wrapper');

  window.onYouTubeIframeAPIReady = function() {
    ytPlayer = new YT.Player('yt-player-element', {
      height: '140',
      width: '100%',
      playerVars: {
        'autoplay': 1,
        'controls': 1,
        'rel': 0,
        'playsinline': 1
      },
      events: {
        'onReady': () => {
          isYtReady = true;
          if (pendingVideoId) {
            playYouTubeTrack(pendingVideoId, trackTitle.textContent, pendingSeekTime);
            pendingVideoId = null;
          }
        },
        'onStateChange': (e) => {
          if (e.data === YT.PlayerState.PLAYING) {
            if (trackTimerInterval) clearInterval(trackTimerInterval);
            const duration = ytPlayer.getDuration();
            if (trackTimeTotal) trackTimeTotal.textContent = formatTime(duration);
            trackTimerInterval = setInterval(() => {
              if (!ytPlayer || typeof ytPlayer.getCurrentTime !== 'function') return;
              const current = ytPlayer.getCurrentTime();
              if (trackTimeCurrent) trackTimeCurrent.textContent = formatTime(current);
              if (trackProgressFill) trackProgressFill.style.width = `${Math.min(100, (current / duration) * 100)}%`;
            }, 1000);
          }

          // เมื่อคลิปจบ ดีเจ/แอดมิน ดึงเพลงถัดไปจากคิวอัตโนมัติ
          if (e.data === YT.PlayerState.ENDED) {
            if (trackTimerInterval) clearInterval(trackTimerInterval);
            if ((myRole === 'admin' || myRole === 'dj') && isShowLive && playlist.length > 0) {
              playItemAtIndex(0);
            }
          }
        }
      }
    });
  };

  function playYouTubeTrack(videoId, title, seekTo = 0) {
    if (ytScreenWrapper) ytScreenWrapper.classList.remove('hide');
    if (trackTitle) trackTitle.textContent = title || "YouTube Track";
    if (trackArtist) trackArtist.textContent = "YouTube Broadcast";

    if (isYtReady && ytPlayer && typeof ytPlayer.loadVideoById === 'function') {
      ytPlayer.loadVideoById({
        videoId: videoId,
        startSeconds: Math.floor(seekTo)
      });

      // สั่งข้ามไปยังวินาทีที่กำหนดซ้ำเพื่อความแม่นยำ
      setTimeout(() => {
        if (ytPlayer && typeof ytPlayer.seekTo === 'function') {
          ytPlayer.seekTo(seekTo, true);
        }
      }, 500);

      if (!isListeningToMain) {
        ytPlayer.mute();
      } else {
        ytPlayer.unMute();
        ytPlayer.setVolume(sliderMusicVol ? parseInt(sliderMusicVol.value) : 80);
      }
      ytPlayer.playVideo();
    } else {
      pendingVideoId = videoId;
      pendingSeekTime = seekTo;
    }
  }

  // ตัวดักรับ Sync Pulse จากเซิร์ฟเวอร์ทุก 3 วินาที (แก้ปัญหาทุกคนฟังไม่ตรงกัน)
  socket.on('radio-sync-pulse', (data) => {
    if (!isYtReady || !ytPlayer || typeof ytPlayer.getCurrentTime !== 'function') return;
    
    // ตรวจสอบว่ากำลังเล่นคลิปเดียวกันหรือไม่
    const currentUrl = ytPlayer.getVideoUrl ? ytPlayer.getVideoUrl() : '';
    if (currentUrl.includes(data.videoId)) {
      const myTime = ytPlayer.getCurrentTime();
      // หากเวลาในเครื่องคลาดเคลื่อนจากเวลาเซิร์ฟเวอร์เกิน 2.5 วินาที ให้กระโดดไปเวลาจริงทันที
      if (Math.abs(myTime - data.currentTime) > 2.5) {
        ytPlayer.seekTo(data.currentTime, true);
      }
    }
  });

  socket.on('play-youtube-track', (data) => {
    initAudioContext();
    if (currentMusicSource) { currentMusicSource.stop(); currentMusicSource = null; }
    playYouTubeTrack(data.videoId, data.title, data.seekTo || 0);
  });

  socket.on('dj-stop-youtube', () => {
    if (ytScreenWrapper) ytScreenWrapper.classList.add('hide');
    if (isYtReady && ytPlayer && typeof ytPlayer.stopVideo === 'function') {
      ytPlayer.stopVideo();
    }
  });

  function extractYouTubeID(url) {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match ? match[1] : null;
  }

  if (btnPlayYt) {
    btnPlayYt.addEventListener('click', () => {
      const url = djYtUrl.value.trim();
      if (!url) return alert("กรุณาวางลิงก์ YouTube ก่อนครับ");
      const videoId = extractYouTubeID(url);
      if (!videoId) return alert("รูปแบบลิงก์ YouTube ไม่ถูกต้อง!");

      socket.emit('dj-add-youtube-to-playlist', { videoId: videoId });
      djYtUrl.value = '';
    });
  }

  // ========================================================
  // 📻 Thai Radio Streams (Direct Stream)
  // ========================================================
  if (backupStationSelect) {
    backupStationSelect.addEventListener('change', (e) => {
      const streamUrl = e.target.value;
      if (!streamUrl) {
        backupAudioPlayer.pause();
        backupAudioPlayer.removeAttribute('src');
        backupAudioPlayer.load();
        return;
      }

      if (isListeningToMain) {
        stopListeningMainStation();
      }

      backupAudioPlayer.pause();
      backupAudioPlayer.src = streamUrl;
      backupAudioPlayer.load();

      const playPromise = backupAudioPlayer.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }
    });
  }

  // ==========================================
  // 🔐 ระบบสมัคร / ล็อกอิน / จัดการดีเจ
  // ==========================================
  if (usernameInput) {
    if (localStorage.getItem('saved_username')) usernameInput.value = localStorage.getItem('saved_username');
    usernameInput.addEventListener('input', () => localStorage.setItem('saved_username', usernameInput.value.trim()));
  }

  btnOpenRegisterModal.onclick = () => {
    regUserInput.value = ''; regPassInput.value = ''; regError.classList.add('hide');
    registerModal.classList.remove('hide'); regUserInput.focus();
  };
  regBtnCancel.onclick = () => registerModal.classList.add('hide');

  regBtnConfirm.onclick = () => {
    const username = regUserInput.value.trim(), password = regPassInput.value.trim();
    if (!username || !password) {
      regError.textContent = "กรุณากรอกชื่อและรหัสผ่านให้ครบถ้วน";
      regError.classList.remove('hide');
      return;
    }
    socket.emit('dj-register', { username, password }, (res) => {
      if (res.success) {
        alert(res.message);
        registerModal.classList.add('hide');
        loginUserInput.value = username;
        loginModal.classList.remove('hide');
        loginPassInput.focus();
      } else {
        regError.textContent = res.message;
        regError.classList.remove('hide');
      }
    });
  };

  btnOpenLoginModal.onclick = () => {
    loginUserInput.value = ''; loginPassInput.value = ''; loginError.classList.add('hide');
    loginModal.classList.remove('hide'); loginUserInput.focus();
  };
  loginBtnCancel.onclick = () => loginModal.classList.add('hide');

  loginBtnConfirm.onclick = () => executeLogin();
  loginPassInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') executeLogin(); });

  function executeLogin() {
    const username = loginUserInput.value.trim(), password = loginPassInput.value.trim();
    if (!password) {
      loginError.textContent = "กรุณากรอกรหัสผ่าน!";
      loginError.classList.remove('hide');
      return;
    }

    socket.emit('auth-login', { username, password }, (res) => {
      if (res.success) {
        loginModal.classList.add('hide');
        myRole = res.role;
        myDJName = res.name;
        localStorage.setItem('auth_session', JSON.stringify({ user: username, pass: password }));

        if (res.role === 'admin') {
          djLoginSection.classList.add('hide');
          djPortalSection.classList.add('hide');
          djControlsSection.classList.remove('hide');
          roleBadge.textContent = "👑 Super Admin";
          roleBadge.style.background = "#fee2e2";
          roleBadge.style.color = "#991b1b";
          roleBadge.style.borderColor = "#ef4444";
          adminApprovalPanel.classList.remove('hide');
          if (adminRegisteredDjsBox) adminRegisteredDjsBox.classList.remove('hide');
        } else if (res.role === 'dj_member') {
          djLoginSection.classList.add('hide');
          djPortalSection.classList.remove('hide');
          djPortalName.textContent = res.name;
          usernameInput.value = res.name;
        }
        renderPlaylist();
      } else {
        loginError.textContent = res.message;
        loginError.classList.remove('hide');
      }
    });
  }

  const savedSession = localStorage.getItem('auth_session');
  if (savedSession) {
    try {
      const parsed = JSON.parse(savedSession);
      socket.emit('auth-login', { username: parsed.user, password: parsed.pass }, (res) => {
        if (res.success) {
          myRole = res.role;
          myDJName = res.name;
          if (res.role === 'admin') {
            djLoginSection.classList.add('hide');
            djControlsSection.classList.remove('hide');
            roleBadge.textContent = "👑 Super Admin";
            roleBadge.style.background = "#fee2e2";
            roleBadge.style.color = "#991b1b";
            roleBadge.style.borderColor = "#ef4444";
            adminApprovalPanel.classList.remove('hide');
            if (adminRegisteredDjsBox) adminRegisteredDjsBox.classList.remove('hide');
          } else if (res.role === 'dj_member') {
            djLoginSection.classList.add('hide');
            djPortalSection.classList.remove('hide');
            djPortalName.textContent = res.name;
            usernameInput.value = res.name;
          }
          renderPlaylist();
        } else {
          localStorage.removeItem('auth_session');
        }
      });
    } catch(e) {}
  }

  btnRequestToLive.onclick = () => socket.emit('dj-request-queue');
  socket.on('dj-queue-waiting', () => {
    btnRequestToLive.classList.add('hide');
    djPortalWaitingText.classList.remove('hide');
  });

  socket.on('admin-dj-queue-update', (queue) => {
    if (myRole !== 'admin' || !djApprovalList) return;
    djQueueCount.textContent = queue.length;
    djApprovalList.innerHTML = '';
    if (queue.length === 0) {
      djApprovalList.innerHTML = '<li>ไม่มีดีเจรออนุมัติ</li>';
      return;
    }
    queue.forEach(q => {
      const li = document.createElement('li');
      li.innerHTML = `
        <div><strong>${q.username}</strong> (${q.time})</div>
        <div>
          <button class="accept-req-btn approve-dj-btn" data-id="${q.socketId}">อนุมัติ</button>
          <button class="accept-req-btn reject-btn reject-dj-btn" data-id="${q.socketId}">ปฏิเสธ</button>
        </div>
      `;
      djApprovalList.appendChild(li);
    });

    djApprovalList.querySelectorAll('.approve-dj-btn').forEach(b => {
      b.onclick = () => socket.emit('admin-approve-dj', b.getAttribute('data-id'));
    });
    djApprovalList.querySelectorAll('.reject-dj-btn').forEach(b => {
      b.onclick = () => socket.emit('admin-reject-dj', b.getAttribute('data-id'));
    });
  });

  socket.on('admin-registered-djs-update', (djList) => {
    if (myRole !== 'admin' || !registeredDjsList) return;
    regDjCount.textContent = djList.length;
    registeredDjsList.innerHTML = '';
    if (djList.length === 0) {
      registeredDjsList.innerHTML = '<li>ยังไม่มีดีเจลงทะเบียน</li>';
      return;
    }
    djList.forEach(name => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span>🎧 ${name}</span>
        <button class="accept-req-btn reject-btn del-dj-btn" data-name="${name}">ลบ</button>
      `;
      registeredDjsList.appendChild(li);
    });
    registeredDjsList.querySelectorAll('.del-dj-btn').forEach(btn => {
      btn.onclick = () => {
        const target = btn.getAttribute('data-name');
        if (confirm(`ต้องการลบบัญชีดีเจ "${target}" ออกจากระบบใช่หรือไม่?`)) {
          socket.emit('admin-delete-dj', target);
        }
      };
    });
  });

  socket.on('dj-approved', (djName) => {
    myRole = 'dj';
    myDJName = djName;
    djPortalSection.classList.add('hide');
    djControlsSection.classList.remove('hide');
    roleBadge.textContent = `🎧 DJ ${djName}`;
    roleBadge.style.background = "#fef08a";
    roleBadge.style.color = "#713f12";
    roleBadge.style.borderColor = "#ca8a04";
    adminApprovalPanel.classList.add('hide');
    if (adminRegisteredDjsBox) adminRegisteredDjsBox.classList.add('hide');
    renderPlaylist();
    alert(`🎉 แอดมินอนุมัติให้คุณ ${djName} ขึ้นจัดรายการสดแล้ว!`);
  });

  socket.on('dj-rejected', () => {
    btnRequestToLive.classList.remove('hide');
    djPortalWaitingText.classList.add('hide');
    alert("❌ แอดมินปฏิเสธคำขอขึ้นจัดรายการในขณะนี้");
  });

  function performLogout() {
    if (confirm("ต้องการออกจากระบบใช่หรือไม่?")) {
      if (isShowLive) socket.emit('dj-end-show');
      localStorage.removeItem('auth_session');
      window.location.reload();
    }
  }

  btnDjLogout.onclick = performLogout;
  btnDjPortalLogout.onclick = performLogout;

  // ==========================================
  // ✨ Glitter & Reactions & Nudge
  // ==========================================
  const glitterCanvas = document.getElementById('glitter-canvas');
  const gCtx = glitterCanvas.getContext('2d');
  let particles = [];
  function resizeCanvas() { glitterCanvas.width = window.innerWidth; glitterCanvas.height = window.innerHeight; }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  window.addEventListener('mousemove', (e) => {
    for (let i = 0; i < 3; i++) {
      particles.push({
        x: e.clientX + (Math.random() - 0.5) * 12,
        y: e.clientY + (Math.random() - 0.5) * 12,
        size: Math.random() * 4 + 2,
        color: `hsl(${Math.random() * 60 + 180}, 100%, 75%)`,
        alpha: 1, vy: Math.random() * 1.5 + 0.5, vx: (Math.random() - 0.5) * 1
      });
    }
  });

  function animateGlitter() {
    gCtx.clearRect(0, 0, glitterCanvas.width, glitterCanvas.height);
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx; p.y += p.vy; p.alpha -= 0.025;
      gCtx.fillStyle = p.color; gCtx.globalAlpha = Math.max(0, p.alpha);
      gCtx.beginPath(); gCtx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2); gCtx.fill();
      if (p.alpha <= 0) { particles.splice(i, 1); i--; }
    }
    requestAnimationFrame(animateGlitter);
  }
  animateGlitter();

  btnHeartReaction.onclick = () => socket.emit('send-reaction', '❤️');
  socket.on('receive-reaction', (type) => {
    if (!heartContainer) return;
    const heart = document.createElement('div');
    heart.className = 'floating-heart';
    heart.textContent = type;
    heart.style.right = `${Math.random() * 60 + 10}px`;
    heartContainer.appendChild(heart);
    setTimeout(() => heart.remove(), 2300);
  });

  let canNudge = true;
  btnNudge.onclick = () => {
    if (!canNudge) return alert("กรุณารอ 5 วินาที!");
    socket.emit('send-nudge', usernameInput.value.trim() || 'Guest');
    canNudge = false;
    setTimeout(() => canNudge = true, 5000);
  };

  socket.on('receive-nudge', (data) => {
    if (mainAppWindow) {
      mainAppWindow.classList.remove('nudge-shake');
      void mainAppWindow.offsetWidth;
      mainAppWindow.classList.add('nudge-shake');
    }
    const b = document.createElement('div');
    b.className = 'chat-bubble';
    b.innerHTML = `<div style="color: #b91c1c; font-weight: bold; font-size: 11px;">💥 ${data.user} ได้ส่งสัญญาณสะกิดหน้าจอคุณ!</div>`;
    chatLogs.appendChild(b);
    chatLogs.scrollTop = chatLogs.scrollHeight;
  });

  // ==========================================
  // 🔊 Audio & Visualizer & SFX
  // ==========================================
  let listenAudioCtx = null, musicGainNode = null, micGainNode = null, analyserNode = null, currentMusicSource = null;

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
        grad.addColorStop(0, '#22c55e'); grad.addColorStop(0.7, '#eab308'); grad.addColorStop(1, '#ef4444');
        vCtx.fillStyle = grad;
        vCtx.fillRect(x, vCanvas.height - barHeight, barWidth - 1, barHeight);
        x += barWidth;
      }
    }
    render();
  }

  sfxButtons.forEach(btn => btn.onclick = () => socket.emit('dj-play-sfx', btn.getAttribute('data-sound')));
  socket.on('play-sfx', (type) => {
    if (!isListeningToMain) return;

    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      if (type === 'airhorn') {
        osc.type = 'sawtooth'; osc.frequency.setValueAtTime(466.16, ctx.currentTime);
        gain.gain.setValueAtTime(0.3, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
        osc.connect(gain); gain.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + 0.65);
      } else if (type === 'rimshot') {
        osc.type = 'triangle'; osc.frequency.setValueAtTime(250, ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.4, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.connect(gain); gain.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + 0.25);
      } else if (type === 'sad') {
        osc.type = 'sine'; osc.frequency.setValueAtTime(320, ctx.currentTime); osc.frequency.linearRampToValueAtTime(140, ctx.currentTime + 0.6);
        gain.gain.setValueAtTime(0.25, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.65);
        osc.connect(gain); gain.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + 0.7);
      } else if (type === 'laugh') {
        osc.type = 'square'; osc.frequency.setValueAtTime(500, ctx.currentTime); osc.frequency.setValueAtTime(700, ctx.currentTime + 0.1); osc.frequency.setValueAtTime(450, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.15, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.connect(gain); gain.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + 0.45);
      }
    } catch(e){}
  });

  btnOpenRequestModal.onclick = () => { reqSongInput.value = ''; reqNoteInput.value = ''; requestModal.classList.remove('hide'); reqSongInput.focus(); };
  reqBtnCancel.onclick = () => requestModal.classList.add('hide');
  reqBtnSubmit.onclick = () => {
    const song = reqSongInput.value.trim(), note = reqNoteInput.value.trim(), user = usernameInput.value.trim() || 'ผู้ฟังทางบ้าน';
    if (!song) return alert("กรุณาใส่ชื่อเพลง!");
    socket.emit('submit-song-request', { user, song, note });
    requestModal.classList.add('hide');
    alert("ส่งคำขอเพลงแล้ว! 📻");
  };

  socket.on('requests-update', (reqs) => {
    reqCountBadge.textContent = reqs.length;
    requestsList.innerHTML = '';
    if (reqs.length === 0) { requestsList.innerHTML = '<li>ยังไม่มีคำขอเพลง</li>'; return; }
    reqs.forEach(r => {
      const li = document.createElement('li');
      li.innerHTML = `<div><strong>${r.song}</strong> (${r.user})<br><span style="color:#666;font-size:10px;">${r.note || '-'}</span></div><button class="accept-req-btn" data-id="${r.id}">✅ รับ</button>`;
      requestsList.appendChild(li);
    });
    requestsList.querySelectorAll('.accept-req-btn').forEach(b => b.onclick = () => socket.emit('dj-accept-request', parseInt(b.getAttribute('data-id'))));
  });

  btnPinMsg.onclick = () => { const t = djPinInput.value.trim(); if (t) { socket.emit('dj-pin-message', t); djPinInput.value = ''; } };
  btnUnpinMsg.onclick = () => socket.emit('dj-pin-message', '');
  btnClearChat.onclick = () => { if (confirm("ต้องการล้างประวัติแชททั้งหมดใช่หรือไม่?")) socket.emit('dj-clear-chat'); };
  socket.on('pinned-update', (msg) => {
    if (msg) { pinnedText.textContent = msg; pinnedBanner.classList.remove('hide'); }
    else pinnedBanner.classList.add('hide');
  });

  function playNotificationSound() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.type = 'sine'; osc.frequency.setValueAtTime(800, ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(1050, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.12, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(gain); gain.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + 0.16);
    } catch (e) {}
  }

  socket.on('online-users-count', (c) => onlineUsersBadge.textContent = `👥 ${c} คน`);
  socket.on('volume-update', (vols) => {
    if (listenAudioCtx) {
      if (musicGainNode && vols.music !== undefined) musicGainNode.gain.setValueAtTime(vols.music, listenAudioCtx.currentTime);
      if (micGainNode && vols.mic !== undefined) micGainNode.gain.setValueAtTime(vols.mic, listenAudioCtx.currentTime);
    }
    if (isYtReady && ytPlayer && vols.music !== undefined && isListeningToMain) {
      ytPlayer.setVolume(Math.round(vols.music * 100));
    }
  });

  sliderMusicVol.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    labelMusicVol.textContent = `${val}%`;
    socket.emit('dj-volume-change', { type: 'music', volume: val / 100 });
    if (listenAudioCtx && musicGainNode) musicGainNode.gain.setValueAtTime(val / 100, listenAudioCtx.currentTime);
    if (isYtReady && ytPlayer && isListeningToMain) ytPlayer.setVolume(val);
  });

  sliderMicVol.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    labelMicVol.textContent = `${val}%`;
    socket.emit('dj-volume-change', { type: 'mic', volume: val / 100 });
    if (listenAudioCtx && micGainNode) micGainNode.gain.setValueAtTime(val / 100, listenAudioCtx.currentTime);
  });

  btnDucking.onclick = () => {
    if (!isDucking) {
      previousMusicVol = parseInt(sliderMusicVol.value);
      sliderMusicVol.value = 20; labelMusicVol.textContent = "20%";
      socket.emit('dj-volume-change', { type: 'music', volume: 0.2 });
      if (listenAudioCtx && musicGainNode) musicGainNode.gain.setValueAtTime(0.2, listenAudioCtx.currentTime);
      if (isYtReady && ytPlayer && isListeningToMain) ytPlayer.setVolume(20);
      btnDucking.classList.add('active'); btnDucking.textContent = "🔊 คืนระดับเสียงเดิม"; isDucking = true;
    } else {
      sliderMusicVol.value = previousMusicVol; labelMusicVol.textContent = `${previousMusicVol}%`;
      socket.emit('dj-volume-change', { type: 'music', volume: previousMusicVol / 100 });
      if (listenAudioCtx && musicGainNode) musicGainNode.gain.setValueAtTime(previousMusicVol / 100, listenAudioCtx.currentTime);
      if (isYtReady && ytPlayer && isListeningToMain) ytPlayer.setVolume(previousMusicVol);
      btnDucking.classList.remove('active'); btnDucking.textContent = "🔉 หรี่เพลงพูดไมค์ (Ducking)"; isDucking = false;
    }
  };

  socket.on('topic-update', (t) => displayTopic.textContent = t);
  btnSaveTopic.onclick = () => { const t = djTopicInput.value.trim(); if (t) { socket.emit('dj-set-topic', t); djTopicInput.value = ''; } };

  socket.on('dj-status-update', (isLive) => {
    isShowLive = isLive;
    stationStatus.textContent = isLive ? "● On Air (Live)" : "○ Offline";
    stationStatus.className = isLive ? "status-online" : "status-offline";
    if (isShowLive) {
      btnShowToggle.textContent = "⏹️ จบรายการ (End Show)"; btnShowToggle.className = "y2k-btn off-air-btn";
      djBroadcastTools.classList.remove('hide');
    } else {
      btnShowToggle.textContent = "🔴 เริ่มจัดรายการ (Go Live)"; btnShowToggle.className = "y2k-btn on-air-btn";
      djBroadcastTools.classList.add('hide');
    }
  });

  btnShowToggle.onclick = () => {
    if (!isShowLive) socket.emit('dj-start-show');
    else if (confirm("ต้องการจบรายการใช่หรือไม่?")) socket.emit('dj-end-show');
  };

  // ==========================================
  // 💬 แชท
  // ==========================================
  let typingTimeout = null;
  chatInput.addEventListener('input', () => {
    socket.emit('typing-start', usernameInput.value.trim() || 'Guest');
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => socket.emit('typing-stop'), 2000);
  });

  function renderMessage(data) {
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble';
    const s = data.style || {};

    let roleTag = '';
    if (data.role === 'admin') roleTag = `<span class="role-badge-admin">👑 Super Admin</span>`;
    else if (data.role === 'dj') roleTag = `<span class="role-badge-dj">🎧 On-Air DJ</span>`;

    const statusHTML = data.status ? `<span class="msn-status-tag">(${data.status})</span>` : '';
    bubble.innerHTML = `
      <div class="meta">
        <span class="user-name">${data.user}</span>${statusHTML}${roleTag}
        <span style="font-weight:normal;color:#888;font-size:11px;">(${data.time})</span>:
      </div>
      <div class="text" style="color: ${s.color || '#000'} !important; font-weight: ${s.bold ? 'bold' : 'normal'} !important; font-style: ${s.italic ? 'italic' : 'normal'} !important; text-decoration: ${s.underline ? 'underline' : 'none'} !important;">
        ${data.text}
      </div>
    `;
    chatLogs.appendChild(bubble);
  }

  socket.on('chat-history', (h) => { chatLogs.innerHTML = ''; h.forEach(renderMessage); chatLogs.scrollTop = chatLogs.scrollHeight; });
  socket.on('chat-message', (data) => { renderMessage(data); chatLogs.scrollTop = chatLogs.scrollHeight; playNotificationSound(); });
  socket.on('chat-history-cleared', () => chatLogs.innerHTML = '<div style="text-align:center;color:#888;padding:10px;">--- เริ่มต้นวันใหม่ / ล้างข้อความ ---</div>');

  socket.on('user-typing', (data) => {
    if (data.isTyping) { typingIndicator.textContent = `✎ ${data.user} กำลังพิมพ์...`; typingIndicator.classList.remove('hide'); }
    else { typingIndicator.textContent = ''; typingIndicator.classList.add('hide'); }
  });

  function sendMessage() {
    const text = chatInput.value.trim(), user = usernameInput.value.trim() || 'Guest', status = userstatusInput.value.trim();
    if (!text) return;
    clearTimeout(typingTimeout); socket.emit('typing-stop');
    socket.emit('chat-message', { user, status, text, style: { ...currentStyle } });
    chatInput.value = ''; chatInput.focus();
  }

  btnSend.onclick = sendMessage;
  chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); sendMessage(); } });

  btnBold.onclick = () => { currentStyle.bold = !currentStyle.bold; btnBold.classList.toggle('active', currentStyle.bold); chatInput.style.fontWeight = currentStyle.bold ? 'bold' : 'normal'; };
  btnItalic.onclick = () => { currentStyle.italic = !currentStyle.italic; btnItalic.classList.toggle('active', currentStyle.italic); chatInput.style.fontStyle = currentStyle.italic ? 'italic' : 'normal'; };
  btnUnderline.onclick = () => { currentStyle.underline = !currentStyle.underline; btnUnderline.classList.toggle('active', currentStyle.underline); chatInput.style.textDecoration = currentStyle.underline ? 'underline' : 'none'; };
  btnEmoji.onclick = (e) => { e.stopPropagation(); emojiMenu.classList.toggle('hide'); };
  emojiMenu.querySelectorAll('span').forEach(item => item.onclick = () => { chatInput.value += item.textContent; emojiMenu.classList.add('hide'); chatInput.focus(); });
  document.addEventListener('click', () => emojiMenu.classList.add('hide'));
  chatColor.oninput = (e) => { currentStyle.color = e.target.value; chatInput.style.color = currentStyle.color; };

  // ==========================================
  // ⏱️ Audio Streaming & ควบคุมปุ่มฟังสถานีหลัก
  // ==========================================
  let isBroadcastingMic = false, mediaRecorder = null, trackTimerInterval = null;
  function formatTime(s) { return `${Math.floor(s/60).toString().padStart(2, '0')}:${Math.floor(s%60).toString().padStart(2, '0')}`; }

  function startListeningMainStation() {
    initAudioContext();
    if (listenAudioCtx.state === 'suspended') {
      listenAudioCtx.resume();
    }

    if (backupAudioPlayer) {
      backupAudioPlayer.pause();
    }

    if (isYtReady && ytPlayer) {
      ytPlayer.unMute();
      ytPlayer.setVolume(sliderMusicVol ? parseInt(sliderMusicVol.value) : 80);
      
      // เมื่อกดเปิดฟัง ให้คำนวณเวลา ณ ปัจจุบันของเซิร์ฟเวอร์ทันที
      if (lastKnownTrack && lastKnownTrack.startedAt) {
        const syncSec = Math.max(0, (Date.now() - lastKnownTrack.startedAt) / 1000);
        ytPlayer.seekTo(syncSec, true);
      }
    }

    isListeningToMain = true;
    btnListen.textContent = "🔊 กำลังรับฟังสด";
    btnListen.style.filter = "hue-rotate(90deg)";
  }

  function stopListeningMainStation() {
    if (listenAudioCtx && listenAudioCtx.state === 'running') {
      listenAudioCtx.suspend();
    }

    if (isYtReady && ytPlayer && typeof ytPlayer.mute === 'function') {
      ytPlayer.mute();
    }

    isListeningToMain = false;
    btnListen.textContent = "▶ ฟังสถานีหลัก";
    btnListen.style.filter = "none";
  }

  btnListen.onclick = () => {
    if (!isListeningToMain) {
      startListeningMainStation();
    } else {
      stopListeningMainStation();
    }
  };

  socket.on('listener-audio-stream', async (data) => {
    if (!isListeningToMain) return;

    initAudioContext();
    if (listenAudioCtx.state === 'suspended') await listenAudioCtx.resume();
    try {
      const bufferData = data.buffer || data;
      const streamType = data.type || 'mic';
      const audioBuffer = await listenAudioCtx.decodeAudioData(bufferData.slice(0));
      const source = listenAudioCtx.createBufferSource();
      source.buffer = audioBuffer;

      if (streamType === 'music') {
        if (currentMusicSource) currentMusicSource.stop();
        currentMusicSource = source; 
        source.connect(musicGainNode);

        source.onended = () => {
          if (trackTimerInterval) clearInterval(trackTimerInterval);
          if ((myRole === 'admin' || myRole === 'dj') && isShowLive && playlist.length > 0) {
            playItemAtIndex(0);
          }
        };

        if (trackTimerInterval) clearInterval(trackTimerInterval);
        const duration = audioBuffer.duration;
        trackTimeTotal.textContent = formatTime(duration);
        let elapsed = 0;
        trackTimerInterval = setInterval(() => {
          elapsed++;
          trackTimeCurrent.textContent = formatTime(elapsed);
          trackProgressFill.style.width = `${Math.min(100, (elapsed / duration) * 100)}%`;
          if (elapsed >= duration) clearInterval(trackTimerInterval);
        }, 1000);
      } else {
        source.connect(micGainNode);
      }
      source.start();
    } catch (e) {}
  });

  let lastKnownTrack = null;
  socket.on('track-update', (t) => {
    lastKnownTrack = t;
    trackTitle.textContent = t.title; trackArtist.textContent = t.artist;
    if (["รอเริ่มรายการ", "จบรายการแล้ว", "ดีเจออฟไลน์"].includes(t.title)) {
      if (trackTimerInterval) clearInterval(trackTimerInterval);
      trackTimeCurrent.textContent = "00:00"; trackTimeTotal.textContent = "00:00"; trackProgressFill.style.width = "0%";
      if (ytScreenWrapper) ytScreenWrapper.classList.add('hide');
    }
  });

  function renderPlaylist() {
    if (!playlistContainer) return;
    playlistContainer.innerHTML = '';
    if (!playlist || playlist.length === 0) {
      playlistContainer.innerHTML = '<li>ไม่มีรายการเพลง</li>';
      return;
    }
    playlist.forEach((t, i) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 210px;">${i + 1}. ${t.name}</span>
        ${(myRole === 'admin' || myRole === 'dj') ? `<button class="play-now-pill" data-idx="${i}">▶ เล่น</button>` : ''}
      `;
      playlistContainer.appendChild(li);
    });

    playlistContainer.querySelectorAll('.play-now-pill').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.getAttribute('data-idx'));
        playItemAtIndex(idx);
      };
    });
  }

  function playItemAtIndex(idx) {
    if (!playlist[idx]) return;

    if (!isShowLive) {
      alert("⚠️ กรุณากดปุ่ม '🔴 เริ่มจัดรายการ (Go Live)' ก่อนเปิดเพลงครับ!");
      return;
    }

    const item = playlist.splice(idx, 1)[0];
    socket.emit('dj-update-playlist', playlist);

    if (item.type === 'youtube') {
      if (currentMusicSource) { currentMusicSource.stop(); currentMusicSource = null; }
      socket.emit('dj-play-youtube', { videoId: item.videoId, title: item.name });
    } else {
      socket.emit('dj-stop-youtube');
      socket.emit('dj-update-track', { track: { title: item.name, artist: myRole === 'admin' ? "Super Admin (MP3)" : `DJ ${myDJName} (MP3)` } });
      if (item.arrayBuffer) {
        item.arrayBuffer().then(ab => {
          socket.emit('dj-audio-stream', { type: 'music', buffer: ab });
        });
      }
    }
  }

  socket.on('playlist-update', (list) => {
    playlist = list || [];
    renderPlaylist();
  });

  djFileInput.onchange = (e) => {
    const files = Array.from(e.target.files).map(f => { f.type = 'mp3'; return f; });
    playlist = playlist.concat(files);
    socket.emit('dj-update-playlist', playlist.map(f => ({ name: f.name, type: f.type, videoId: f.videoId })));
  };

  btnPlayMusic.onclick = () => {
    if (!isShowLive) return alert("⚠️ กรุณากดปุ่ม '🔴 เริ่มจัดรายการ (Go Live)' ก่อนครับ!");
    if (playlist.length === 0) return alert('ไม่มีเพลงในคิว');
    playItemAtIndex(0);
  };

  btnMic.onclick = async () => {
    if (!isBroadcastingMic) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = async (e) => {
          if (e.data.size > 0) socket.emit('dj-audio-stream', { type: 'mic', buffer: await e.data.arrayBuffer() });
        };
        mediaRecorder.start(400);
        btnMic.textContent = "🛑 ปิดไมค์"; btnMic.style.filter = "hue-rotate(280deg)"; isBroadcastingMic = true;
      } catch (err) { alert("ไม่สามารถเข้าถึงไมค์: " + err.message); }
    } else {
      if (mediaRecorder) mediaRecorder.stop();
      btnMic.textContent = "🎙️ เปิดไมค์"; btnMic.style.filter = "none"; isBroadcastingMic = false;
    }
  };
});