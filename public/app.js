document.addEventListener('DOMContentLoaded', () => {
  const socket = io();

  let myRole = 'listener';
  let myDJName = '';
  let isListeningToMain = false;
  let activeTab = 'general';
  let currentConfirmedNick = '';

  const mainAppWindow = document.getElementById('main-app-window');
  const stationStatus = document.getElementById('station-status');
  const onlineUsersBadge = document.getElementById('online-users-badge');
  const hitCounterDigits = document.getElementById('hit-counter-digits');
  const msnToastContainer = document.getElementById('msn-toast-container');
  const winksOverlayContainer = document.getElementById('winks-overlay-container');
  const winampSkinSelect = document.getElementById('winamp-skin-select');

  const chatTabsHeader = document.getElementById('chat-tabs-header');
  const chatLogs = document.getElementById('chat-logs');
  const chatInput = document.getElementById('chat-message');
  const usernameInput = document.getElementById('username');
  const userstatusInput = document.getElementById('userstatus');
  const userOnlineStatus = document.getElementById('user-online-status');
  const chkMsnSound = document.getElementById('chk-msn-sound');
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

  // Music Battle Elements
  const musicBattleBox = document.getElementById('music-battle-box');
  const pollQuestion = document.getElementById('poll-question');
  const pollTitleA = document.getElementById('poll-title-a');
  const pollTitleB = document.getElementById('poll-title-b');
  const pollVotesA = document.getElementById('poll-votes-a');
  const pollVotesB = document.getElementById('poll-votes-b');
  const btnVoteA = document.getElementById('btn-vote-a');
  const btnVoteB = document.getElementById('btn-vote-b');

  // Modals
  const btnOpenRequestModal = document.getElementById('btn-open-request-modal');
  const requestModal = document.getElementById('request-modal');
  const reqSongInput = document.getElementById('req-song-input');
  const reqNoteInput = document.getElementById('req-note-input');
  const reqBtnSubmit = document.getElementById('req-btn-submit');
  const reqBtnCancel = document.getElementById('req-btn-cancel');
  const requestsList = document.getElementById('requests-list');
  const reqCountBadge = document.getElementById('req-count');

  const btnOpenSecretModal = document.getElementById('btn-open-secret-modal');
  const secretModal = document.getElementById('secret-modal');
  const secSongInput = document.getElementById('sec-song-input');
  const secNoteInput = document.getElementById('sec-note-input');
  const secBtnSubmit = document.getElementById('sec-btn-submit');
  const secBtnCancel = document.getElementById('sec-btn-cancel');

  const btnOpenBattleModal = document.getElementById('btn-open-battle-modal');
  const battleModal = document.getElementById('battle-modal');
  const battleTitleInput = document.getElementById('battle-title-input');
  const battleSongA = document.getElementById('battle-song-a');
  const battleSongB = document.getElementById('battle-song-b');
  const battleBtnStart = document.getElementById('battle-btn-start');
  const battleBtnCancel = document.getElementById('battle-btn-cancel');

  // DJ Controls
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
  const btnRecordShow = document.getElementById('btn-record-show');
  
  const adminApprovalPanel = document.getElementById('admin-approval-panel');
  const djApprovalList = document.getElementById('dj-approval-list');
  const djQueueCount = document.getElementById('dj-queue-count');

  const adminRegisteredDjsBox = document.getElementById('admin-registered-djs-box');
  const registeredDjsList = document.getElementById('registered-djs-list');
  const regDjCount = document.getElementById('reg-dj-count');

  const adminBannedUsersBox = document.getElementById('admin-banned-users-box');
  const bannedUsersList = document.getElementById('banned-users-list');
  const banUserCount = document.getElementById('ban-user-count');

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
  const sfxButtons = document.querySelectorAll('.sfx-btn:not(.gift-btn)');
  const giftButtons = document.querySelectorAll('.gift-btn');

  const btnWinksMenu = document.getElementById('btn-winks-menu');
  const winksPicker = document.getElementById('winks-picker');

  const sliderMusicVol = document.getElementById('slider-music-vol');
  const sliderMicVol = document.getElementById('slider-mic-vol');
  const labelMusicVol = document.getElementById('label-music-vol');
  const labelMicVol = document.getElementById('label-mic-vol');
  const btnDucking = document.getElementById('btn-ducking');

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

  // ========================================================
  // 📱 Device Token Generator (นับผู้ชมจริงแยกคอมกับมือถือ)
  // ========================================================
  let visitorToken = localStorage.getItem('y2k_device_token');
  if (!visitorToken) {
    visitorToken = 'dev_' + Math.random().toString(36).substring(2, 9) + Date.now();
    localStorage.setItem('y2k_device_token', visitorToken);
  }
  socket.emit('register-visitor', visitorToken);

  // ========================================================
  // 🚫 ระบบตรวจสอบและเปลี่ยนชื่อเล่น (ป้องกันชื่อซ้ำ)
  // ========================================================
  if (usernameInput) {
    const savedName = localStorage.getItem('saved_username');
    const initialName = savedName ? savedName : 'Guest_' + Math.floor(Math.random() * 899 + 100);
    
    socket.emit('check-or-set-username', initialName, (res) => {
      if (res.success) {
        usernameInput.value = res.name;
        currentConfirmedNick = res.name;
        localStorage.setItem('saved_username', res.name);
      } else {
        const altName = 'Guest_' + Math.floor(Math.random() * 8999 + 1000);
        socket.emit('check-or-set-username', altName, (r2) => {
          usernameInput.value = r2.name;
          currentConfirmedNick = r2.name;
          localStorage.setItem('saved_username', r2.name);
        });
      }
    });

    usernameInput.addEventListener('change', () => {
      const wantName = usernameInput.value.trim();
      if (!wantName) {
        usernameInput.value = currentConfirmedNick;
        return;
      }
      socket.emit('check-or-set-username', wantName, (res) => {
        if (res.success) {
          currentConfirmedNick = res.name;
          usernameInput.value = res.name;
          localStorage.setItem('saved_username', res.name);
          showMsnToast("Profile", `เปลี่ยนชื่อเป็น "${res.name}" เรียบร้อยแล้ว!`);
        } else {
          alert(`⚠️ ${res.message}`);
          usernameInput.value = currentConfirmedNick;
          usernameInput.focus();
        }
      });
    });
  }

  socket.on('name-conflict-alert', (msg) => {
    alert(`⚠️ ${msg}`);
    if (usernameInput) {
      usernameInput.value = currentConfirmedNick;
      usernameInput.focus();
    }
  });

  // ========================================================
  // 🎨 Winamp Skin Switcher
  // ========================================================
  if (winampSkinSelect) {
    winampSkinSelect.addEventListener('change', (e) => {
      document.body.className = e.target.value;
      localStorage.setItem('winamp_skin', e.target.value);
    });
    const savedSkin = localStorage.getItem('winamp_skin');
    if (savedSkin) {
      document.body.className = savedSkin;
      winampSkinSelect.value = savedSkin;
    }
  }

  function showMsnToast(title, message) {
    if (!msnToastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'msn-toast';
    toast.innerHTML = `
      <div class="msn-toast-title">💬 ${title}</div>
      <div class="msn-toast-body">${message}</div>
    `;
    msnToastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.transition = "opacity 0.5s ease";
      toast.style.opacity = "0";
      setTimeout(() => toast.remove(), 500);
    }, 4500);
  }

  socket.on('hit-counter-update', (hits) => {
    if (hitCounterDigits) hitCounterDigits.textContent = String(hits).padStart(6, '0');
  });

  function extractYouTubeID(url) {
    if (!url) return null;
    const cleanUrl = url.trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(cleanUrl)) return cleanUrl;
    const regExp = /(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?.*v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = cleanUrl.match(regExp);
    return (match && match[1]) ? match[1] : null;
  }

  if (btnPlayYt) {
    btnPlayYt.addEventListener('click', () => {
      const url = djYtUrl.value.trim();
      if (!url) return alert("กรุณาวางลิงก์ YouTube ก่อนครับ");
      const videoId = extractYouTubeID(url);
      if (!videoId) return alert("รูปแบบลิงก์ YouTube ไม่ถูกต้อง!");

      socket.emit('dj-add-youtube-to-playlist', { videoId: videoId });
      djYtUrl.value = '';
      showMsnToast("Playlist Manager", "เพิ่มเพลงเข้าคิวแล้วเรียบร้อย!");
    });
  }

  // ==========================================
  // 🎥 YouTube Direct Embed
  // ==========================================
  let currentYtVideoId = null;
  let ytTrackDuration = 0;
  let ytTrackElapsed = 0;
  const ytScreenWrapper = document.getElementById('yt-screen-wrapper');

  function sendIframeCommand(func, args = []) {
    const iframe = document.querySelector('#yt-screen-wrapper iframe');
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage(JSON.stringify({
        event: 'command',
        func: func,
        args: args
      }), '*');
    }
  }

  function playYouTubeTrack(videoId, title, seekTo = 0) {
    if (!videoId) return;
    currentYtVideoId = videoId;

    if (ytScreenWrapper) {
      ytScreenWrapper.classList.remove('hide');
      const startSec = Math.floor(seekTo || 0);
      const isMuted = !isListeningToMain ? 1 : 0;
      
      ytScreenWrapper.innerHTML = `
        <iframe id="active-yt-iframe"
          width="100%" height="140"
          src="https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1&playsinline=1&controls=1&rel=0&start=${startSec}&mute=${isMuted}&origin=${encodeURIComponent(window.location.origin)}"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen>
        </iframe>
      `;
    }

    if (trackTitle) trackTitle.textContent = title || "YouTube Track";
    if (trackArtist) trackArtist.textContent = isShowLive ? "DJ Live On-Air" : "Auto-DJ Stream";

    showMsnToast("Now Playing", `${title.replace('▶ [YT] ', '')}`);

    if (isListeningToMain && userstatusInput && (!userstatusInput.value || userstatusInput.value.startsWith('🎵 กำลังฟัง:'))) {
      userstatusInput.value = `🎵 กำลังฟัง: ${title.replace('▶ [YT] ', '')}`;
    }

    if (trackTimerInterval) clearInterval(trackTimerInterval);
    ytTrackElapsed = Math.floor(seekTo || 0);
    ytTrackDuration = 240;

    trackTimerInterval = setInterval(() => {
      ytTrackElapsed++;
      if (trackTimeCurrent) trackTimeCurrent.textContent = formatTime(ytTrackElapsed);
      if (trackTimeTotal) trackTimeTotal.textContent = formatTime(ytTrackDuration);
      if (trackProgressFill) trackProgressFill.style.width = `${Math.min(100, (ytTrackElapsed / ytTrackDuration) * 100)}%`;

      if (ytTrackDuration > 0 && ytTrackElapsed >= ytTrackDuration) {
        clearInterval(trackTimerInterval);
        if ((myRole === 'admin' || myRole === 'dj') && isShowLive && playlist.length > 0) {
          playItemAtIndex(0);
        }
      }
    }, 1000);
  }

  window.addEventListener('message', (e) => {
    try {
      if (typeof e.data !== 'string') return;
      const data = JSON.parse(e.data);
      if (data.event === 'infoDelivery' && data.info) {
        if (data.info.duration && data.info.duration > 0) {
          ytTrackDuration = Math.floor(data.info.duration);
          if (trackTimeTotal) trackTimeTotal.textContent = formatTime(ytTrackDuration);
        }
        if (data.info.currentTime !== undefined) {
          ytTrackElapsed = Math.floor(data.info.currentTime);
          if (trackTimeCurrent) trackTimeCurrent.textContent = formatTime(ytTrackElapsed);
        }
        if (data.info.playerState === 0) {
          if (trackTimerInterval) clearInterval(trackTimerInterval);
          if ((myRole === 'admin' || myRole === 'dj') && isShowLive && playlist.length > 0) {
            playItemAtIndex(0);
          }
        }
      }
    } catch(err) {}
  });

  socket.on('radio-sync-pulse', (data) => {
    if (currentYtVideoId === data.videoId) {
      if (Math.abs(ytTrackElapsed - data.currentTime) > 3) {
        ytTrackElapsed = Math.floor(data.currentTime);
        sendIframeCommand('seekTo', [data.currentTime, true]);
      }
    }
  });

  socket.on('play-youtube-track', (data) => {
    initAudioContext();
    if (currentMusicSource) { currentMusicSource.stop(); currentMusicSource = null; }
    playYouTubeTrack(data.videoId, data.title, data.seekTo || 0);
  });

  socket.on('dj-stop-youtube', () => {
    currentYtVideoId = null;
    if (ytScreenWrapper) {
      ytScreenWrapper.innerHTML = '';
      ytScreenWrapper.classList.add('hide');
    }
    if (trackTimerInterval) clearInterval(trackTimerInterval);
  });

  // ========================================================
  // ✨ MSN Winks System
  // ========================================================
  if (btnWinksMenu && winksPicker) {
    btnWinksMenu.onclick = (e) => {
      e.stopPropagation();
      winksPicker.classList.toggle('hide');
    };
    winksPicker.querySelectorAll('span').forEach(item => {
      item.onclick = () => {
        const winkType = item.getAttribute('data-wink');
        socket.emit('send-wink', winkType);
        winksPicker.classList.add('hide');
      };
    });
    document.addEventListener('click', () => winksPicker.classList.add('hide'));
  }

  socket.on('receive-wink', (data) => {
    if (!winksOverlayContainer) return;
    winksOverlayContainer.classList.remove('hide');
    winksOverlayContainer.innerHTML = '';

    const winkEl = document.createElement('div');
    winkEl.className = 'wink-item';

    if (data.type === 'kiss') {
      winkEl.textContent = '💋';
      playKissSound();
    } else if (data.type === 'bomb') {
      winkEl.textContent = '💣';
      playBombSound();
    } else if (data.type === 'water') {
      winkEl.textContent = '🌊';
      playWaterSound();
    }

    winksOverlayContainer.appendChild(winkEl);
    showMsnToast("MSN Wink", `${data.user} ส่ง Wink แฟลชเต็มจอ!`);

    setTimeout(() => {
      winksOverlayContainer.classList.add('hide');
      winksOverlayContainer.innerHTML = '';
    }, 2500);
  });

  function playKissSound() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.type = 'triangle'; osc.frequency.setValueAtTime(450, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.22);
    } catch(e) {}
  }

  function playBombSound() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.type = 'sawtooth'; osc.frequency.setValueAtTime(100, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(30, ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.55);
    } catch(e) {}
  }

  function playWaterSound() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.type = 'sine'; osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(150, ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.45);
    } catch(e) {}
  }

  // ========================================================
  // ⚔️ Music Battle
  // ========================================================
  if (btnOpenBattleModal && battleModal) {
    btnOpenBattleModal.onclick = () => battleModal.classList.remove('hide');
    battleBtnCancel.onclick = () => battleModal.classList.add('hide');
    battleBtnStart.onclick = () => {
      const title = battleTitleInput.value.trim();
      const songA = battleSongA.value.trim();
      const songB = battleSongB.value.trim();
      if (!songA || !songB) return alert("กรุณาใส่ชื่อเพลงทั้งสองเพลง!");
      socket.emit('dj-create-poll', { title, songA, songB });
      battleModal.classList.add('hide');
    };
  }

  socket.on('poll-update', (poll) => {
    if (!musicBattleBox) return;
    if (!poll) {
      musicBattleBox.classList.add('hide');
      return;
    }
    musicBattleBox.classList.remove('hide');
    pollQuestion.textContent = poll.title;
    pollTitleA.textContent = poll.songA;
    pollTitleB.textContent = poll.songB;
    pollVotesA.textContent = poll.votesA;
    pollVotesB.textContent = poll.votesB;
  });

  if (btnVoteA) btnVoteA.onclick = () => socket.emit('cast-vote', 'A');
  if (btnVoteB) btnVoteB.onclick = () => socket.emit('cast-vote', 'B');

  // ========================================================
  // 💌 Secret Dedication
  // ========================================================
  if (btnOpenSecretModal && secretModal) {
    btnOpenSecretModal.onclick = () => secretModal.classList.remove('hide');
    secBtnCancel.onclick = () => secretModal.classList.add('hide');
    secBtnSubmit.onclick = () => {
      const song = secSongInput.value.trim();
      const note = secNoteInput.value.trim();
      if (!song) return alert("กรุณาใส่ชื่อเพลง!");
      socket.emit('submit-secret-dedication', { song, note });
      secretModal.classList.add('hide');
      showMsnToast("Secret Dedication", "ส่งข้อความลับถึงสถานีเรียบร้อยแล้ว!");
      secSongInput.value = ''; secNoteInput.value = '';
    };
  }

  // ========================================================
  // 🎙️ Broadcast Recorder
  // ========================================================
  let showMediaRecorder = null;
  let recordedAudioChunks = [];
  let isRecordingShow = false;

  if (btnRecordShow) {
    btnRecordShow.onclick = async () => {
      if (!isRecordingShow) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          recordedAudioChunks = [];
          showMediaRecorder = new MediaRecorder(stream);
          showMediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) recordedAudioChunks.push(e.data);
          };
          showMediaRecorder.onstop = () => {
            const blob = new Blob(recordedAudioChunks, { type: 'audio/webm' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Y2K_Radio_Live_${Date.now()}.webm`;
            a.click();
            showMsnToast("Recorder", "ดาวน์โหลดเทปบันทึกรายการแล้ว!");
          };
          showMediaRecorder.start();
          isRecordingShow = true;
          btnRecordShow.textContent = "⏹️ หยุดอัด & โหลดเทป";
          btnRecordShow.classList.add('danger-btn');
          showMsnToast("Recorder", "กำลังบันทึกเสียงจัดรายการสด...");
        } catch(err) {
          alert("ไม่สามารถอัดเสียงได้: " + err.message);
        }
      } else {
        if (showMediaRecorder) showMediaRecorder.stop();
        isRecordingShow = false;
        btnRecordShow.textContent = "⏺️ บันทึกรายการสด";
        btnRecordShow.classList.remove('danger-btn');
      }
    };
  }

  // ========================================================
  // 💬 Tabs & Whisper
  // ========================================================
  function switchChatTab(tabName) {
    activeTab = tabName;
    document.querySelectorAll('#chat-tabs-header .tab').forEach(t => {
      t.classList.toggle('active', t.getAttribute('data-tab') === tabName);
    });
    document.querySelectorAll('.tab-pane').forEach(p => {
      p.classList.toggle('active', p.id === (tabName === 'general' ? 'chat-logs' : `whisper-logs-${tabName}`));
    });
  }

  chatTabsHeader.addEventListener('click', (e) => {
    const tabEl = e.target.closest('.tab');
    if (tabEl) switchChatTab(tabEl.getAttribute('data-tab'));
  });

  function createWhisperTab(targetSocketId, targetUser) {
    let existingTab = document.querySelector(`.tab[data-tab="${targetSocketId}"]`);
    if (!existingTab) {
      const newTab = document.createElement('div');
      newTab.className = 'tab';
      newTab.setAttribute('data-tab', targetSocketId);
      newTab.textContent = `💬 ${targetUser}`;
      chatTabsHeader.appendChild(newTab);

      const newPane = document.createElement('div');
      newPane.id = `whisper-logs-${targetSocketId}`;
      newPane.className = 'chat-logs tab-pane';
      document.getElementById('chat-logs-container').appendChild(newPane);
    }
    switchChatTab(targetSocketId);
  }

  socket.on('receive-whisper', (data) => {
    const isMe = data.senderSocketId === socket.id;
    const chatPartnerId = isMe ? activeTab : data.senderSocketId;
    const partnerName = isMe ? data.toUser : data.fromUser;

    createWhisperTab(chatPartnerId, partnerName);
    const targetPane = document.getElementById(`whisper-logs-${chatPartnerId}`);
    if (targetPane) {
      const b = document.createElement('div');
      b.className = 'chat-bubble';
      b.innerHTML = `
        <div class="meta" style="color:#7c3aed;">
          🔒 [กระซิบ] ${data.fromUser} (${data.time}):
        </div>
        <div class="text">${parseMSNPlusCodes(data.text)}</div>
      `;
      targetPane.appendChild(b);
      targetPane.scrollTop = targetPane.scrollHeight;
    }
  });

  function parseMSNPlusCodes(text) {
    const colorMap = {
      '0': '#ffffff', '1': '#000000', '2': '#000080', '3': '#008000',
      '4': '#ff0000', '5': '#800000', '6': '#800080', '7': '#ffa500',
      '8': '#ffff00', '9': '#00ff00', '10': '#008080', '11': '#00ffff',
      '12': '#0000ff', '13': '#ff00ff', '14': '#808080', '15': '#c0c0c0'
    };

    let result = text.replace(/·\$(\d{1,2})([^·]+)/g, (match, code, content) => {
      const col = colorMap[code] || '#000';
      return `<span style="color:${col};font-weight:bold;">${content}</span>`;
    });

    return parseMSNEmoticons(result);
  }

  function parseMSNEmoticons(text) {
    return text
      .replace(/\(H\)/gi, '😎')
      .replace(/\(K\)/gi, '💋')
      .replace(/\(P\)/gi, '📷')
      .replace(/\(F\)/gi, '🌹')
      .replace(/\(M\)/gi, '💬')
      .replace(/\(L\)/gi, '❤️');
  }

  function renderMessage(data) {
    if (!chatLogs) return;
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble';
    const s = data.style || {};

    let roleTag = '';
    if (data.role === 'admin') roleTag = `<span class="role-badge-admin">👑 Super Admin</span>`;
    else if (data.role === 'dj') roleTag = `<span class="role-badge-dj">🎧 On-Air DJ</span>`;

    let modButtons = '';
    if ((myRole === 'admin' || myRole === 'dj') && data.senderSocketId && data.role !== 'admin' && data.senderSocketId !== socket.id) {
      modButtons = `
        <span class="mod-action-group">
          <button class="mod-btn kick-btn" data-sid="${data.senderSocketId}" title="เตะ">เตะ</button>
          <button class="mod-btn ban-btn" data-sid="${data.senderSocketId}" title="แบน">แบน</button>
        </span>
      `;
    }

    const statusHTML = data.status ? `<span class="msn-status-tag">(${data.status})</span>` : '';
    bubble.innerHTML = `
      <div class="meta">
        <span class="user-name user-clickable" data-sid="${data.senderSocketId}" data-name="${data.user}">${data.user}</span>${statusHTML}${roleTag}${modButtons}
        <span style="font-weight:normal;color:#888;font-size:11px;">(${data.time})</span>:
      </div>
      <div class="text" style="color: ${s.color || '#000'} !important; font-weight: ${s.bold ? 'bold' : 'normal'} !important; font-style: ${s.italic ? 'italic' : 'normal'} !important; text-decoration: ${s.underline ? 'underline' : 'none'} !important;">
        ${parseMSNPlusCodes(data.text)}
      </div>
    `;

    const userClickable = bubble.querySelector('.user-clickable');
    if (userClickable) {
      userClickable.onclick = () => {
        const sid = userClickable.getAttribute('data-sid');
        const name = userClickable.getAttribute('data-name');
        if (sid && sid !== socket.id) createWhisperTab(sid, name);
      };
    }

    const btnKick = bubble.querySelector('.kick-btn');
    if (btnKick) {
      btnKick.onclick = (e) => {
        e.stopPropagation();
        const sid = btnKick.getAttribute('data-sid');
        if (confirm(`ต้องการเตะคุณ "${data.user}" ออกจากห้องใช่หรือไม่?`)) socket.emit('admin-kick-user', sid);
      };
    }

    const btnBan = bubble.querySelector('.ban-btn');
    if (btnBan) {
      btnBan.onclick = (e) => {
        e.stopPropagation();
        const sid = btnBan.getAttribute('data-sid');
        if (confirm(`ต้องการแบน IP ของ "${data.user}" ถาวรใช่หรือไม่?`)) socket.emit('admin-ban-user', sid);
      };
    }

    chatLogs.appendChild(bubble);
  }

  function sendMessage() {
    if (!chatInput) return;
    const text = chatInput.value.trim();
    const user = (usernameInput && usernameInput.value.trim()) ? usernameInput.value.trim() : 'Guest';
    
    let status = userstatusInput ? userstatusInput.value.trim() : '';
    if (userOnlineStatus && userOnlineStatus.value) {
      status = `${userOnlineStatus.value} ${status}`.trim();
    }

    if (!text) return;
    clearTimeout(typingTimeout); socket.emit('typing-stop');

    if (activeTab !== 'general') {
      const activeTabEl = document.querySelector(`.tab[data-tab="${activeTab}"]`);
      const partnerName = activeTabEl ? activeTabEl.textContent.replace('💬 ', '') : 'User';
      socket.emit('private-whisper', {
        targetSocketId: activeTab,
        fromUser: user,
        toUser: partnerName,
        text: text
      });
    } else {
      socket.emit('chat-message', { user, status, text, style: { ...currentStyle } });
    }

    chatInput.value = ''; chatInput.focus();
  }

  if (btnSend) btnSend.onclick = sendMessage;
  if (chatInput) chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); sendMessage(); } });

  // ========================================================
  // 🔊 Audio Engine
  // ========================================================
  let listenAudioCtx = null, musicGainNode = null, micGainNode = null, analyserNode = null, currentMusicSource = null;
  let nextMicPlayTime = 0;

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
      vCtx.fillStyle = '#000000';
      vCtx.fillRect(0, 0, vCanvas.width, vCanvas.height);

      const barWidth = (vCanvas.width / bufferLength) * 1.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * vCanvas.height;
        const grad = vCtx.createLinearGradient(0, vCanvas.height, 0, 0);
        grad.addColorStop(0, '#15803d');
        grad.addColorStop(0.6, '#22c55e');
        grad.addColorStop(0.85, '#eab308');
        grad.addColorStop(1, '#ef4444');

        vCtx.fillStyle = grad;
        vCtx.fillRect(x, vCanvas.height - barHeight, barWidth - 1, barHeight);
        if (barHeight > 4) {
          vCtx.fillStyle = '#f87171';
          vCtx.fillRect(x, vCanvas.height - barHeight - 1, barWidth - 1, 1);
        }
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
      } else if (type === 'scratch') {
        osc.type = 'sawtooth'; osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.08);
        osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.16);
        gain.gain.setValueAtTime(0.35, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.connect(gain); gain.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + 0.22);
      } else if (type === 'tape') {
        osc.type = 'sine'; osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(40, ctx.currentTime + 0.45);
        gain.gain.setValueAtTime(0.35, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
        osc.connect(gain); gain.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + 0.5);
      }
    } catch(e){}
  });

  function formatTime(s) { return `${Math.floor(s/60).toString().padStart(2, '0')}:${Math.floor(s%60).toString().padStart(2, '0')}`; }

  function startListeningMainStation() {
    initAudioContext();
    if (listenAudioCtx.state === 'suspended') listenAudioCtx.resume();
    if (backupAudioPlayer) backupAudioPlayer.pause();

    sendIframeCommand('unMute');
    sendIframeCommand('setVolume', [sliderMusicVol ? parseInt(sliderMusicVol.value) : 80]);

    isListeningToMain = true;
    if (btnListen) {
      btnListen.textContent = "🔊 กำลังรับฟังสด";
      btnListen.style.filter = "hue-rotate(90deg)";
    }
  }

  function stopListeningMainStation() {
    if (listenAudioCtx && listenAudioCtx.state === 'running') listenAudioCtx.suspend();
    sendIframeCommand('mute');

    isListeningToMain = false;
    if (btnListen) {
      btnListen.textContent = "▶ ฟังสถานีหลัก";
      btnListen.style.filter = "none";
    }
  }

  if (btnListen) {
    btnListen.onclick = () => {
      if (!isListeningToMain) startListeningMainStation();
      else stopListeningMainStation();
    };
  }

  socket.on('listener-audio-stream', async (data) => {
    if (!isListeningToMain) return;
    initAudioContext();
    if (listenAudioCtx.state === 'suspended') await listenAudioCtx.resume();

    if (data.type === 'mic' && data.pcmData) {
      try {
        const floatData = new Float32Array(data.pcmData);
        const audioBuffer = listenAudioCtx.createBuffer(1, floatData.length, data.sampleRate || 44100);
        audioBuffer.copyToChannel(floatData, 0);

        const source = listenAudioCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(micGainNode);

        const currentTime = listenAudioCtx.currentTime;
        if (nextMicPlayTime < currentTime) nextMicPlayTime = currentTime;
        source.start(nextMicPlayTime);
        nextMicPlayTime += audioBuffer.duration;
      } catch (err) {}
      return;
    }

    if (data.type === 'music') {
      try {
        const bufferData = data.buffer || data;
        const audioBuffer = await listenAudioCtx.decodeAudioData(bufferData.slice(0));
        const source = listenAudioCtx.createBufferSource();
        source.buffer = audioBuffer;

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
        if (trackTimeTotal) trackTimeTotal.textContent = formatTime(duration);
        let elapsed = 0;
        trackTimerInterval = setInterval(() => {
          elapsed++;
          if (trackTimeCurrent) trackTimeCurrent.textContent = formatTime(elapsed);
          if (trackProgressFill) trackProgressFill.style.width = `${Math.min(100, (elapsed / duration) * 100)}%`;
          if (elapsed >= duration) clearInterval(trackTimerInterval);
        }, 1000);

        source.start();
      } catch (e) {}
    }
  });

  socket.on('track-update', (t) => {
    if (trackTitle) trackTitle.textContent = t.title;
    if (trackArtist) trackArtist.textContent = t.artist;
    if (["รอเริ่มรายการ", "จบรายการแล้ว", "ดีเจออฟไลน์"].includes(t.title)) {
      if (trackTimerInterval) clearInterval(trackTimerInterval);
      if (trackTimeCurrent) trackTimeCurrent.textContent = "00:00";
      if (trackTimeTotal) trackTimeTotal.textContent = "00:00";
      if (trackProgressFill) trackProgressFill.style.width = "0%";
      if (ytScreenWrapper) {
        ytScreenWrapper.innerHTML = '';
        ytScreenWrapper.classList.add('hide');
      }
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

  if (djFileInput) {
    djFileInput.onchange = (e) => {
      const files = Array.from(e.target.files).map(f => { f.type = 'mp3'; return f; });
      playlist = playlist.concat(files);
      socket.emit('dj-update-playlist', playlist.map(f => ({ name: f.name, type: f.type, videoId: f.videoId })));
      showMsnToast("Playlist", `เพิ่ม ${files.length} เพลง MP3 เข้าคิวแล้ว!`);
    };
  }

  if (btnPlayMusic) {
    btnPlayMusic.onclick = () => {
      if (!isShowLive) return alert("⚠️ กรุณากดปุ่ม '🔴 เริ่มจัดรายการ (Go Live)' ก่อนครับ!");
      if (playlist.length === 0) return alert('ไม่มีเพลงในคิว');
      playItemAtIndex(0);
    };
  }

  // ========================================================
  // 🎙️ ไมค์ดีเจ
  // ========================================================
  let micStream = null;
  let micAudioCtx = null;
  let micProcessorNode = null;
  let isBroadcastingMic = false;

  if (btnMic) {
    btnMic.onclick = async () => {
      if (!isBroadcastingMic) {
        try {
          micStream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
          });

          const AudioContext = window.AudioContext || window.webkitAudioContext;
          micAudioCtx = new AudioContext();
          const micSourceNode = micAudioCtx.createMediaStreamSource(micStream);

          micProcessorNode = micAudioCtx.createScriptProcessor(4096, 1, 1);
          micProcessorNode.onaudioprocess = (e) => {
            if (!isBroadcastingMic) return;
            const inputData = e.inputBuffer.getChannelData(0);
            socket.emit('dj-audio-stream', {
              type: 'mic',
              pcmData: inputData.buffer,
              sampleRate: micAudioCtx.sampleRate
            });
          };

          micSourceNode.connect(micProcessorNode);
          micProcessorNode.connect(micAudioCtx.destination);

          btnMic.textContent = "🛑 ปิดไมค์";
          btnMic.style.filter = "hue-rotate(280deg)";
          isBroadcastingMic = true;
        } catch (err) {
          alert("ไม่สามารถเข้าถึงไมโครโฟนได้: " + err.message);
        }
      } else {
        if (micProcessorNode) { micProcessorNode.disconnect(); micProcessorNode = null; }
        if (micAudioCtx) { micAudioCtx.close(); micAudioCtx = null; }
        if (micStream) { micStream.getTracks().forEach(track => track.stop()); micStream = null; }

        btnMic.textContent = "🎙️ เปิดไมค์";
        btnMic.style.filter = "none";
        isBroadcastingMic = false;
      }
    };
  }

  // Modals & Auth Events
  if (btnOpenLoginModal && loginModal) {
    btnOpenLoginModal.onclick = () => {
      loginUserInput.value = ''; loginPassInput.value = ''; 
      if (loginError) loginError.classList.add('hide');
      loginModal.classList.remove('hide'); 
      loginUserInput.focus();
    };
  }
  if (loginBtnCancel && loginModal) loginBtnCancel.onclick = () => loginModal.classList.add('hide');

  if (btnOpenRegisterModal && registerModal) {
    btnOpenRegisterModal.onclick = () => {
      regUserInput.value = ''; regPassInput.value = ''; 
      if (regError) regError.classList.add('hide');
      registerModal.classList.remove('hide'); 
      regUserInput.focus();
    };
  }
  if (regBtnCancel && registerModal) regBtnCancel.onclick = () => registerModal.classList.add('hide');

  if (btnOpenRequestModal && requestModal) {
    btnOpenRequestModal.onclick = () => {
      reqSongInput.value = ''; reqNoteInput.value = '';
      requestModal.classList.remove('hide');
      reqSongInput.focus();
    };
  }
  if (reqBtnCancel && requestModal) reqBtnCancel.onclick = () => requestModal.classList.add('hide');

  giftButtons.forEach(btn => {
    btn.onclick = () => {
      const giftType = btn.getAttribute('data-gift');
      const sender = usernameInput ? (usernameInput.value.trim() || 'ผู้ฟังทางบ้าน') : 'ผู้ฟังทางบ้าน';
      socket.emit('send-reaction', giftType.split(' ')[0]);
      socket.emit('chat-message', {
        user: sender,
        status: userstatusInput ? userstatusInput.value.trim() : '',
        text: `🎁 ได้ส่งของขวัญ "${giftType}" ให้กับสถานีและดีเจ!`,
        style: { bold: true, color: '#b45309' }
      });
    };
  });

  socket.on('kicked-notice', (data) => {
    alert(`⚠️ ${data.reason}`);
    window.location.reload();
  });

  socket.on('banned-notice', (data) => {
    document.body.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;background:#0000aa;color:#fff;font-family:monospace;padding:20px;text-align:center;">
        <h1 style="font-size:32px;background:#fff;color:#0000aa;padding:4px 10px;margin-bottom:20px;">*** SYSTEM HALTED ***</h1>
        <p style="font-size:18px;margin-bottom:10px;">คุณถูกแบนและระงับการเข้าถึงสถานีวิทยุแห่งนี้</p>
        <p style="color:#ffff55;font-size:14px;">เหตุผล: ${data.reason}</p>
      </div>
    `;
  });

  socket.on('system-announcement', (msg) => {
    if (!chatLogs) return;
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble';
    bubble.innerHTML = `<div style="color:#d97706;font-size:11px;font-weight:bold;text-align:center;padding:4px;background:#fffbeb;border-radius:3px;">${msg}</div>`;
    chatLogs.appendChild(bubble);
    chatLogs.scrollTop = chatLogs.scrollHeight;
  });

  if (backupStationSelect) {
    backupStationSelect.addEventListener('change', (e) => {
      const streamUrl = e.target.value;
      if (!streamUrl) {
        backupAudioPlayer.pause();
        backupAudioPlayer.removeAttribute('src');
        backupAudioPlayer.load();
        return;
      }
      if (isListeningToMain) stopListeningMainStation();
      backupAudioPlayer.pause();
      backupAudioPlayer.src = streamUrl;
      backupAudioPlayer.load();
      backupAudioPlayer.play().catch(() => {});
    });
  }

  if (regBtnConfirm) {
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
  }

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
          if (adminBannedUsersBox) adminBannedUsersBox.classList.remove('hide');
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

  if (loginBtnConfirm) loginBtnConfirm.onclick = () => executeLogin();
  if (loginPassInput) loginPassInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') executeLogin(); });

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
            if (adminBannedUsersBox) adminBannedUsersBox.classList.remove('hide');
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

  if (btnRequestToLive) btnRequestToLive.onclick = () => socket.emit('dj-request-queue');
  socket.on('dj-queue-waiting', () => {
    if (btnRequestToLive) btnRequestToLive.classList.add('hide');
    if (djPortalWaitingText) djPortalWaitingText.classList.remove('hide');
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
        if (confirm(`ต้องการลบบัญชีดีเจ "${target}" ออกจากระบบใช่หรือไม่?`)) socket.emit('admin-delete-dj', target);
      };
    });
  });

  socket.on('admin-banned-list-update', (bList) => {
    if (myRole !== 'admin' || !bannedUsersList) return;
    banUserCount.textContent = bList.length;
    bannedUsersList.innerHTML = '';
    if (bList.length === 0) {
      bannedUsersList.innerHTML = '<li>ไม่มีรายชื่อถูกแบน</li>';
      return;
    }
    bList.forEach(item => {
      const li = document.createElement('li');
      li.innerHTML = `
        <div><strong>${item.username}</strong><br><span style="font-size:10px;color:#888;">IP: ${item.ip} (${item.bannedAt})</span></div>
        <button class="accept-req-btn unban-btn" data-ip="${item.ip}">ปลดแบน</button>
      `;
      bannedUsersList.appendChild(li);
    });
    bannedUsersList.querySelectorAll('.unban-btn').forEach(b => {
      b.onclick = () => {
        const ip = b.getAttribute('data-ip');
        if (confirm(`ต้องการปลดแบน IP "${ip}" หรือไม่?`)) socket.emit('admin-unban-ip', ip);
      };
    });
  });

  socket.on('dj-approved', (djName) => {
    myRole = 'dj';
    myDJName = djName;
    if (djPortalSection) djPortalSection.classList.add('hide');
    if (djControlsSection) djControlsSection.classList.remove('hide');
    if (roleBadge) {
      roleBadge.textContent = `🎧 DJ ${djName}`;
      roleBadge.style.background = "#fef08a";
      roleBadge.style.color = "#713f12";
      roleBadge.style.borderColor = "#ca8a04";
    }
    if (adminApprovalPanel) adminApprovalPanel.classList.add('hide');
    if (adminRegisteredDjsBox) adminRegisteredDjsBox.classList.add('hide');
    renderPlaylist();
    alert(`🎉 แอดมินอนุมัติให้คุณ ${djName} ขึ้นจัดรายการสดแล้ว!`);
  });

  socket.on('dj-rejected', () => {
    if (btnRequestToLive) btnRequestToLive.classList.remove('hide');
    if (djPortalWaitingText) djPortalWaitingText.classList.add('hide');
    alert("❌ แอดมินปฏิเสธคำขอขึ้นจัดรายการในขณะนี้");
  });

  function performLogout() {
    if (confirm("ต้องการออกจากระบบใช่หรือไม่?")) {
      if (isShowLive) socket.emit('dj-end-show');
      localStorage.removeItem('auth_session');
      window.location.reload();
    }
  }

  if (btnDjLogout) btnDjLogout.onclick = performLogout;
  if (btnDjPortalLogout) btnDjPortalLogout.onclick = performLogout;

  const glitterCanvas = document.getElementById('glitter-canvas');
  const gCtx = glitterCanvas ? glitterCanvas.getContext('2d') : null;
  let particles = [];
  function resizeCanvas() { 
    if (!glitterCanvas) return;
    glitterCanvas.width = window.innerWidth; 
    glitterCanvas.height = window.innerHeight; 
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  window.addEventListener('mousemove', (e) => {
    for (let i = 0; i < 3; i++) {
      particles.push({
        x: e.clientX + (Math.random() - 0.5) * 14,
        y: e.clientY + (Math.random() - 0.5) * 14,
        size: Math.random() * 4 + 2,
        color: `hsl(${Math.random() * 80 + 160}, 100%, 75%)`,
        alpha: 1, vy: Math.random() * 1.5 + 0.5, vx: (Math.random() - 0.5) * 1.2
      });
    }
  });

  function animateGlitter() {
    if (!gCtx) return;
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

  if (btnHeartReaction) btnHeartReaction.onclick = () => socket.emit('send-reaction', '❤️');
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
  if (btnNudge) {
    btnNudge.onclick = () => {
      if (!canNudge) return alert("กรุณารอ 5 วินาที!");
      socket.emit('send-nudge', usernameInput.value.trim() || 'Guest');
      canNudge = false;
      setTimeout(() => canNudge = true, 5000);
    };
  }

  socket.on('receive-nudge', (data) => {
    if (mainAppWindow) {
      mainAppWindow.classList.remove('nudge-shake');
      void mainAppWindow.offsetWidth;
      mainAppWindow.classList.add('nudge-shake');
    }
    playNudgeSound();
    showMsnToast("MSN Nudge", `${data.user} ได้เขย่าสะกิดหน้าจอคุณ!`);
    if (chatLogs) {
      const b = document.createElement('div');
      b.className = 'chat-bubble';
      b.innerHTML = `<div style="color: #b91c1c; font-weight: bold; font-size: 11px;">💥 ${data.user} ได้ส่งสัญญาณสะกิดหน้าจอคุณ!</div>`;
      chatLogs.appendChild(b);
      chatLogs.scrollTop = chatLogs.scrollHeight;
    }
  });

  if (reqBtnSubmit) {
    reqBtnSubmit.onclick = () => {
      const song = reqSongInput.value.trim(), note = reqNoteInput.value.trim(), user = usernameInput.value.trim() || 'ผู้ฟังทางบ้าน';
      if (!song) return alert("กรุณาใส่ชื่อเพลง!");
      socket.emit('submit-song-request', { user, song, note });
      requestModal.classList.add('hide');
      alert("ส่งคำขอเพลงแล้ว! 📻");
    };
  }

  socket.on('requests-update', (reqs) => {
    if (!reqCountBadge || !requestsList) return;
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

  if (btnPinMsg) btnPinMsg.onclick = () => { const t = djPinInput.value.trim(); if (t) { socket.emit('dj-pin-message', t); djPinInput.value = ''; } };
  if (btnUnpinMsg) btnUnpinMsg.onclick = () => socket.emit('dj-pin-message', '');
  if (btnClearChat) btnClearChat.onclick = () => { if (confirm("ต้องการล้างประวัติแชททั้งหมดใช่หรือไม่?")) socket.emit('dj-clear-chat'); };

  socket.on('pinned-update', (msg) => {
    if (!pinnedText || !pinnedBanner) return;
    if (msg) { pinnedText.textContent = msg; pinnedBanner.classList.remove('hide'); }
    else pinnedBanner.classList.add('hide');
  });

  function playNotificationSound() {
    if (chkMsnSound && !chkMsnSound.checked) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.type = 'sine'; osc.frequency.setValueAtTime(800, ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(1050, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.12, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(gain); gain.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + 0.16);
    } catch (e) {}
  }

  function playNudgeSound() {
    if (chkMsnSound && !chkMsnSound.checked) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, ctx.currentTime); osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.3, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.connect(gain); gain.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + 0.28);
    } catch(e) {}
  }

  socket.on('online-users-count', (c) => { if (onlineUsersBadge) onlineUsersBadge.textContent = `👥 ${c} คน`; });
  socket.on('volume-update', (vols) => {
    if (listenAudioCtx) {
      if (musicGainNode && vols.music !== undefined) musicGainNode.gain.setValueAtTime(vols.music, listenAudioCtx.currentTime);
      if (micGainNode && vols.mic !== undefined) micGainNode.gain.setValueAtTime(vols.mic, listenAudioCtx.currentTime);
    }
  });

  if (sliderMusicVol) {
    sliderMusicVol.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      if (labelMusicVol) labelMusicVol.textContent = `${val}%`;
      socket.emit('dj-volume-change', { type: 'music', volume: val / 100 });
      if (listenAudioCtx && musicGainNode) musicGainNode.gain.setValueAtTime(val / 100, listenAudioCtx.currentTime);
      sendIframeCommand('setVolume', [val]);
    });
  }

  if (sliderMicVol) {
    sliderMicVol.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      if (labelMicVol) labelMicVol.textContent = `${val}%`;
      socket.emit('dj-volume-change', { type: 'mic', volume: val / 100 });
      if (listenAudioCtx && micGainNode) micGainNode.gain.setValueAtTime(val / 100, listenAudioCtx.currentTime);
    });
  }

  if (btnDucking) {
    btnDucking.onclick = () => {
      if (!isDucking) {
        previousMusicVol = parseInt(sliderMusicVol.value);
        sliderMusicVol.value = 20; if (labelMusicVol) labelMusicVol.textContent = "20%";
        socket.emit('dj-volume-change', { type: 'music', volume: 0.2 });
        if (listenAudioCtx && musicGainNode) musicGainNode.gain.setValueAtTime(0.2, listenAudioCtx.currentTime);
        sendIframeCommand('setVolume', [20]);
        btnDucking.classList.add('active'); btnDucking.textContent = "🔊 คืนระดับเสียงเดิม"; isDucking = true;
      } else {
        sliderMusicVol.value = previousMusicVol; if (labelMusicVol) labelMusicVol.textContent = `${previousMusicVol}%`;
        socket.emit('dj-volume-change', { type: 'music', volume: previousMusicVol / 100 });
        if (listenAudioCtx && musicGainNode) musicGainNode.gain.setValueAtTime(previousMusicVol / 100, listenAudioCtx.currentTime);
        sendIframeCommand('setVolume', [previousMusicVol]);
        btnDucking.classList.remove('active'); btnDucking.textContent = "🔉 หรี่เพลงพูดไมค์ (Ducking)"; isDucking = false;
      }
    };
  }

  socket.on('topic-update', (t) => { if (displayTopic) displayTopic.textContent = t; });
  if (btnSaveTopic) btnSaveTopic.onclick = () => { const t = djTopicInput.value.trim(); if (t) { socket.emit('dj-set-topic', t); djTopicInput.value = ''; } };

  socket.on('dj-status-update', (isLive) => {
    isShowLive = isLive;
    if (stationStatus) {
      stationStatus.textContent = isLive ? "● On Air (Live)" : "○ Offline (Auto-DJ)";
      stationStatus.className = isLive ? "status-online" : "status-offline";
    }
    if (btnShowToggle) {
      if (isShowLive) {
        btnShowToggle.textContent = "⏹️ จบรายการ (End Show)"; btnShowToggle.className = "y2k-btn off-air-btn";
        if (djBroadcastTools) djBroadcastTools.classList.remove('hide');
      } else {
        btnShowToggle.textContent = "🔴 เริ่มจัดรายการ (Go Live)"; btnShowToggle.className = "y2k-btn on-air-btn";
        if (djBroadcastTools) djBroadcastTools.classList.add('hide');
      }
    }
  });

  if (btnShowToggle) {
    btnShowToggle.onclick = () => {
      if (!isShowLive) socket.emit('dj-start-show');
      else if (confirm("ต้องการจบรายการใช่หรือไม่?")) socket.emit('dj-end-show');
    };
  }

  let typingTimeout = null;
  if (chatInput) {
    chatInput.addEventListener('input', () => {
      socket.emit('typing-start', usernameInput.value.trim() || 'Guest');
      clearTimeout(typingTimeout);
      typingTimeout = setTimeout(() => socket.emit('typing-stop'), 2000);
    });
  }

  socket.on('chat-history', (h) => { 
    if (!chatLogs) return;
    chatLogs.innerHTML = ''; 
    h.forEach(renderMessage); 
    chatLogs.scrollTop = chatLogs.scrollHeight; 
  });

  socket.on('chat-message', (data) => { 
    renderMessage(data); 
    if (chatLogs) chatLogs.scrollTop = chatLogs.scrollHeight; 
    playNotificationSound(); 
  });

  socket.on('chat-history-cleared', () => {
    if (chatLogs) chatLogs.innerHTML = '<div style="text-align:center;color:#888;padding:10px;">--- เริ่มต้นวันใหม่ / ล้างข้อความ ---</div>';
  });

  socket.on('user-typing', (data) => {
    if (!typingIndicator) return;
    if (data.isTyping) { typingIndicator.textContent = `✎ ${data.user} กำลังพิมพ์...`; typingIndicator.classList.remove('hide'); }
    else { typingIndicator.textContent = ''; typingIndicator.classList.add('hide'); }
  });

  if (btnBold) btnBold.onclick = () => { currentStyle.bold = !currentStyle.bold; btnBold.classList.toggle('active', currentStyle.bold); if (chatInput) chatInput.style.fontWeight = currentStyle.bold ? 'bold' : 'normal'; };
  if (btnItalic) btnItalic.onclick = () => { currentStyle.italic = !currentStyle.italic; btnItalic.classList.toggle('active', currentStyle.italic); if (chatInput) chatInput.style.fontStyle = currentStyle.italic ? 'italic' : 'normal'; };
  if (btnUnderline) btnUnderline.onclick = () => { currentStyle.underline = !currentStyle.underline; btnUnderline.classList.toggle('active', currentStyle.underline); if (chatInput) chatInput.style.textDecoration = currentStyle.underline ? 'underline' : 'none'; };
  
  if (btnEmoji && emojiMenu) {
    btnEmoji.onclick = (e) => { e.stopPropagation(); emojiMenu.classList.toggle('hide'); };
    emojiMenu.querySelectorAll('span').forEach(item => item.onclick = () => { if (chatInput) { chatInput.value += item.textContent; emojiMenu.classList.add('hide'); chatInput.focus(); } });
    document.addEventListener('click', () => emojiMenu.classList.add('hide'));
  }
  if (chatColor) chatColor.oninput = (e) => { currentStyle.color = e.target.value; if (chatInput) chatInput.style.color = currentStyle.color; };
});