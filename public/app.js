document.addEventListener('DOMContentLoaded', () => {
  const socket = io();

  const chatLogs = document.getElementById('chat-logs');
  const chatInput = document.getElementById('chat-message');
  const usernameInput = document.getElementById('username');
  const btnSend = document.getElementById('btn-send');
  const trackTitle = document.getElementById('track-title');
  const trackArtist = document.getElementById('track-artist');
  const playlistContainer = document.getElementById('playlist-container');
  const btnListen = document.getElementById('btn-listen');

  const btnDjLogin = document.getElementById('btn-dj-login');
  const djLoginSection = document.getElementById('dj-login-section');
  const djControlsSection = document.getElementById('dj-controls-section');
  const djFileInput = document.getElementById('dj-file-input');
  const btnPlayMusic = document.getElementById('btn-play-music');
  const btnMic = document.getElementById('btn-mic');

  const djModal = document.getElementById('dj-modal');
  const modalPassInput = document.getElementById('modal-pass-input');
  const modalBtnConfirm = document.getElementById('modal-btn-confirm');
  const modalBtnCancel = document.getElementById('modal-btn-cancel');
  const modalError = document.getElementById('modal-error');

  const btnBold = document.getElementById('btn-bold');
  const btnItalic = document.getElementById('btn-italic');
  const btnUnderline = document.getElementById('btn-underline');
  const btnEmoji = document.getElementById('btn-emoji');
  const emojiMenu = document.getElementById('emoji-menu');
  const chatColor = document.getElementById('chat-color');

  let currentStyle = { bold: false, italic: false, underline: false, color: '#000000' };

  // --- จดจำชื่อเล่นผู้ใช้งาน ---
  if (localStorage.getItem('saved_username')) {
    usernameInput.value = localStorage.getItem('saved_username');
  }
  usernameInput.addEventListener('input', () => {
    localStorage.setItem('saved_username', usernameInput.value.trim());
  });

  // --- ระบบตรวจสิทธิ์ DJ อัตโนมัติเมื่อรีเฟรชหน้าเว็บ ---
  const savedDJKey = localStorage.getItem('dj_access_key');
  if (savedDJKey) {
    socket.emit('dj-auth', savedDJKey, (res) => {
      if (res.success) unlockDJControls();
      else localStorage.removeItem('dj_access_key');
    });
  }

  function unlockDJControls() {
    if (djLoginSection) djLoginSection.classList.add('hide');
    if (djControlsSection) djControlsSection.classList.remove('hide');
  }

  if (btnDjLogin) {
    btnDjLogin.onclick = () => {
      if (djModal) {
        modalPassInput.value = '';
        if (modalError) modalError.classList.add('hide');
        djModal.classList.remove('hide');
        modalPassInput.focus();
      } else {
        const pass = prompt("กรุณากรอกรหัสผ่านประจำตัวดีเจ (1234):");
        if (pass) verifyDJAuth(pass);
      }
    };
  }

  if (modalBtnCancel) modalBtnCancel.onclick = () => djModal.classList.add('hide');

  if (modalBtnConfirm) {
    modalBtnConfirm.onclick = () => verifyDJAuth(modalPassInput.value.trim());
  }

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
        if (djModal) djModal.classList.add('hide');
        unlockDJControls();
      } else {
        if (modalError) {
          modalError.textContent = res.message;
          modalError.classList.remove('hide');
        } else {
          alert(res.message);
        }
      }
    });
  }

  // --- ฟังก์ชันสร้างกล่องข้อความ ---
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

  // รับประวัติข้อความทั้งหมดที่เคยคุยกันในวันนั้น
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
    chatLogs.innerHTML = '<div style="text-align:center;color:#888;padding:10px;">--- เริ่มต้นวันใหม่ (ประวัติแชทถูกรีเซ็ต) ---</div>';
  });

  // --- จัดการการส่งแชท ---
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

  if (btnSend) btnSend.onclick = sendMessage;
  if (chatInput) {
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        sendMessage();
      }
    });
  }

  // Toolbar Formatting
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

  // --- Audio & DJ Streaming ---
  let listenAudioCtx = null;
  let isBroadcastingMic = false;
  let mediaRecorder = null;
  let playlist = [];

  if (btnListen) {
    btnListen.onclick = async () => {
      if (!listenAudioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        listenAudioCtx = new AudioContext();
        await listenAudioCtx.resume();
        btnListen.textContent = "🔊 กำลังรับฟังสด";
        btnListen.style.filter = "hue-rotate(90deg)";
      } else if (listenAudioCtx.state === 'suspended') {
        await listenAudioCtx.resume();
      }
    };
  }

  socket.on('listener-audio-stream', async (arrayBuffer) => {
    if (!listenAudioCtx) return;
    try {
      const audioBuffer = await listenAudioCtx.decodeAudioData(arrayBuffer.slice(0));
      const source = listenAudioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(listenAudioCtx.destination);
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

  if (djFileInput) {
    djFileInput.onchange = (e) => {
      playlist = Array.from(e.target.files);
      socket.emit('dj-update-playlist', playlist.map(f => ({ name: f.name })));
    };
  }

  if (btnPlayMusic) {
    btnPlayMusic.onclick = async () => {
      if (playlist.length === 0) return alert('กรุณาเลือกไฟล์เพลงก่อน');
      const file = playlist.shift();
      socket.emit('dj-update-track', { track: { title: file.name, artist: "DJ On Air" } });
      const arrayBuffer = await file.arrayBuffer();
      socket.emit('dj-audio-stream', arrayBuffer);
    };
  }

  if (btnMic) {
    btnMic.onclick = async () => {
      if (!isBroadcastingMic) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          mediaRecorder = new MediaRecorder(stream);
          mediaRecorder.ondataavailable = async (e) => {
            if (e.data.size > 0) socket.emit('dj-audio-stream', await e.data.arrayBuffer());
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