document.addEventListener('DOMContentLoaded', () => {
  const socket = io();

  const stationStatus = document.getElementById('station-status');
  const chatLogs = document.getElementById('chat-logs');
  const chatInput = document.getElementById('chat-message');
  const usernameInput = document.getElementById('username');
  const btnSend = document.getElementById('btn-send');
  const trackTitle = document.getElementById('track-title');
  const trackArtist = document.getElementById('track-artist');
  const playlistContainer = document.getElementById('playlist-container');
  const btnListen = document.getElementById('btn-listen');
  const displayTopic = document.getElementById('display-topic');

  // Backup Radio Tuner
  const backupStationSelect = document.getElementById('backup-station-select');
  const backupAudioPlayer = document.getElementById('backup-audio-player');

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

  // --- AudioContext & GainNodes สำหรับแยกปรับเสียงเพลงและไมค์ ---
  let listenAudioCtx = null;
  let musicGainNode = null;
  let micGainNode = null;
  let currentMusicSource = null;

  function initAudioContext() {
    if (!listenAudioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      listenAudioCtx = new AudioContext();

      // แยก Gain Node สำหรับเสียงเพลง
      musicGainNode = listenAudioCtx.createGain();
      musicGainNode.gain.value = 0.8;
      musicGainNode.connect(listenAudioCtx.destination);

      // แยก Gain Node สำหรับเสียงไมค์
      micGainNode = listenAudioCtx.createGain();
      micGainNode.gain.value = 1.0;
      micGainNode.connect(listenAudioCtx.destination);
    }
  }

  // รับระดับเสียงที่อัปเดตจากดีเจ
  socket.on('volume-update', (vols) => {
    if (listenAudioCtx) {
      if (musicGainNode && vols.music !== undefined) {
        musicGainNode.gain.setValueAtTime(vols.music, listenAudioCtx.currentTime);
      }
      if (micGainNode && vols.mic !== undefined) {
        micGainNode.gain.setValueAtTime(vols.mic, listenAudioCtx.currentTime);
      }
    }
  });

  // สไลเดอร์ปรับเสียงเพลง
  sliderMusicVol.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    labelMusicVol.textContent = `${val}%`;
    const floatVal = val / 100;
    socket.emit('dj-volume-change', { type: 'music', volume: floatVal });
    if (listenAudioCtx && musicGainNode) {
      musicGainNode.gain.setValueAtTime(floatVal, listenAudioCtx.currentTime);
    }
  });

  // สไลเดอร์ปรับเสียงไมค์
  sliderMicVol.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    labelMicVol.textContent = `${val}%`;
    const floatVal = val / 100;
    socket.emit('dj-volume-change', { type: 'mic', volume: floatVal });
    if (listenAudioCtx && micGainNode) {
      micGainNode.gain.setValueAtTime(floatVal, listenAudioCtx.currentTime);
    }
  });

  // ปุ่ม Ducking (หรี่เพลงด่วนเหลือ 20% เพื่อพูดไมค์)
  btnDucking.addEventListener('click', () => {
    if (!isDucking) {
      previousMusicVol = parseInt(sliderMusicVol.value);
      sliderMusicVol.value = 20;
      labelMusicVol.textContent = "20%";
      socket.emit('dj-volume-change', { type: 'music', volume: 0.2 });
      if (listenAudioCtx && musicGainNode) musicGainNode.gain.setValueAtTime(0.2, listenAudioCtx.currentTime);
      btnDucking.classList.add('active');
      btnDucking.textContent = "🔊 คืนระดับเสียงเพลงเดิม";
      isDucking = true;
    } else {
      sliderMusicVol.value = previousMusicVol;
      labelMusicVol.textContent = `${previousMusicVol}%`;
      const floatVal = previousMusicVol / 100;
      socket.emit('dj-volume-change', { type: 'music', volume: floatVal });
      if (listenAudioCtx && musicGainNode) musicGainNode.gain.setValueAtTime(floatVal, listenAudioCtx.currentTime);
      btnDucking.classList.remove('active');
      btnDucking.textContent = "🔉 หรี่เพลงพูดไมค์ (Ducking)";
      isDucking = false;
    }
  });

  // --- อัปเดตหัวข้อประจำวัน ---
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

  // --- ระบบคลื่นสำรอง ---
  backupStationSelect.addEventListener('change', (e) => {
    const streamUrl = e.target.value;
    if (streamUrl) {
      backupAudioPlayer.src = streamUrl;
      backupAudioPlayer.play();
    } else {
      backupAudioPlayer.pause();
      backupAudioPlayer.src = '';
    }
  });

  // --- สถานะ On Air / Offline ---
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
      djBroadcastTools.classList.remove('hide');
    } else {
      btnShowToggle.textContent = "🔴 เริ่มจัดรายการ (Go Live)";
      btnShowToggle.className = "y2k-btn on-air-btn";
      djBroadcastTools.classList.add('hide');
    }
  }

  btnShowToggle.addEventListener('click', () => {
    if (!isShowLive) {
      socket.emit('dj-start-show');
    } else {
      if (confirm("ต้องการจบรายการใช่หรือไม่?")) {
        socket.emit('dj-end-show');
      }
    }
  });

  // --- สิทธิ์ดีเจ และ Username ---
  if (localStorage.getItem('saved_username')) {
    usernameInput.value = localStorage.getItem('saved_username');
  }
  usernameInput.addEventListener('input', () => {
    localStorage.setItem('saved_username', usernameInput.value.trim());
  });

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

  btnDjLogin.onclick = () => {
    modalPassInput.value = '';
    if (modalError) modalError.classList.add('hide');
    djModal.classList.remove('hide');
    modalPassInput.focus();
  };

  modalBtnCancel.onclick = () => djModal.classList.add('hide');
  modalBtnConfirm.onclick = () => verifyDJAuth(modalPassInput.value.trim());
  modalPassInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') verifyDJAuth(modalPassInput.value.trim());
  });

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
        modalError.textContent = res.message;
        modalError.classList.remove('hide');
      }
    });
  }

  // --- แชทและข้อความ ---
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

    bubble.innerHTML = `
      <div class="meta">
        <span class="user-name">${data.user}</span>${djBadgeHTML}
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
  });

  socket.on('chat-history-cleared', () => {
    chatLogs.innerHTML = '<div style="text-align:center;color:#888;padding:10px;">--- เริ่มต้นวันใหม่ ---</div>';
  });

  function sendMessage() {
    const text = chatInput.value.trim();
    const user = usernameInput.value.trim() || 'Guest';
    if (!text) return;

    socket.emit('chat-message', {
      user,
      text,
      style: { ...currentStyle }
    });

    chatInput.value = '';
    chatInput.focus();
  }

  btnSend.onclick = sendMessage;
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendMessage();
    }
  });

  // Toolbar Formatting
  btnBold.onclick = () => {
    currentStyle.bold = !currentStyle.bold;
    btnBold.classList.toggle('active', currentStyle.bold);
    chatInput.style.fontWeight = currentStyle.bold ? 'bold' : 'normal';
  };

  btnItalic.onclick = () => {
    currentStyle.italic = !currentStyle.italic;
    btnItalic.classList.toggle('active', currentStyle.italic);
    chatInput.style.fontStyle = currentStyle.italic ? 'italic' : 'normal';
  };

  btnUnderline.onclick = () => {
    currentStyle.underline = !currentStyle.underline;
    btnUnderline.classList.toggle('active', currentStyle.underline);
    chatInput.style.textDecoration = currentStyle.underline ? 'underline' : 'none';
  };

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

  chatColor.oninput = (e) => {
    currentStyle.color = e.target.value;
    chatInput.style.color = currentStyle.color;
  };

  // --- Main Audio Player ---
  let isBroadcastingMic = false;
  let mediaRecorder = null;
  let playlist = [];

  btnListen.onclick = async () => {
    initAudioContext();
    if (listenAudioCtx.state === 'suspended') {
      await listenAudioCtx.resume();
    }
    btnListen.textContent = "🔊 กำลังรับฟังสด";
    btnListen.style.filter = "hue-rotate(90deg)";
  };

  // รับสัญญาณเสียง (แยกสายเสียงระหว่างเพลงและไมค์เข้า GainNode ของแต่ละอัน)
  socket.on('listener-audio-stream', async (data) => {
    initAudioContext();
    if (listenAudioCtx.state === 'suspended') await listenAudioCtx.resume();

    try {
      // ตรวจสอบว่าส่งมาเป็น Object แยกประเภทหรือ ArrayBuffer ตรงๆ
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

  djFileInput.onchange = (e) => {
    playlist = Array.from(e.target.files);
    socket.emit('dj-update-playlist', playlist.map(f => ({ name: f.name })));
  };

  btnPlayMusic.onclick = async () => {
    if (playlist.length === 0) return alert('กรุณาเลือกไฟล์เพลงก่อน');
    const file = playlist.shift();
    socket.emit('dj-update-track', { track: { title: file.name, artist: "DJ On Air" } });
    const arrayBuffer = await file.arrayBuffer();
    
    // ส่งระบุ type: 'music' เพื่อให้เข้าช่อง musicGainNode
    socket.emit('dj-audio-stream', { type: 'music', buffer: arrayBuffer });
  };

  btnMic.onclick = async () => {
    if (!isBroadcastingMic) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = async (e) => {
          if (e.data.size > 0) {
            const chunk = await e.data.arrayBuffer();
            // ส่งระบุ type: 'mic' เพื่อให้เข้าช่อง micGainNode
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
});

// ฟังก์ชันสลับกลับเป็นโหมดผู้ฟังทั่วไป
  function lockDJControls() {
    if (djControlsSection) djControlsSection.classList.add('hide');
    if (djLoginSection) djLoginSection.classList.remove('hide');
  }

  // ระบบล็อกเอาท์ดีเจ
  if (btnDjLogout) {
    btnDjLogout.addEventListener('click', () => {
      if (confirm("ต้องการออกจากโหมดดีเจใช่หรือไม่?")) {
        // หากจัดรายการอยู่ ให้จบรายการก่อน
        if (isShowLive) {
          socket.emit('dj-end-show');
        }
        // ปิดไมค์ถ้าเปิดค้างไว้
        if (isBroadcastingMic && mediaRecorder) {
          mediaRecorder.stop();
          isBroadcastingMic = false;
          if (btnMic) {
            btnMic.textContent = "🎙️ เปิดไมค์";
            btnMic.style.filter = "none";
          }
        }
        
        localStorage.removeItem('dj_access_key');
        lockDJControls();
        alert("ออกจากระบบดีเจเรียบร้อยแล้ว");
        window.location.reload(); // รีเฟรชเพื่อรีเซ็ต socket connection กลับเป็นผู้ฟังปกติ
      }
    });
  }