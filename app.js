// ── Mobile detection ─────────────────────────────
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  || (navigator.userAgentData && navigator.userAgentData.mobile);
if (isMobile) document.body.classList.add('is-mobile');

// ── Constants ────────────────────────────────────
const MAX_ARRIVAL_H = 8, MAX_ARRIVAL_M = 30;
const STORAGE_KEY = 'waktuBalik_session';

// ── State ────────────────────────────────────────
let hour = 8, minute = 0, second = 0;
let countdownInterval = null;
let targetSecondsToday = 0, totalWorkSeconds = 0;
let holdTimer = null, holdInterval = null;
let calculated = false;
let reminderTargetTime = null;
let reminderFired = false;
let reminderPollInterval = null;
let notifEnabled = false;

// ── localStorage helpers ─────────────────────────
function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
}

function saveSession() {
  const data = {
    date: todayKey(),
    hour, minute, second,
    isThursday: document.getElementById('thursday').checked,
    isRamadan:  document.getElementById('ramadan').checked,
    notifEnabled,
    calculated
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    // Expire if not today
    if (data.date !== todayKey()) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return data;
  } catch(e) {
    return null;
  }
}

function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}

// ── Notification toggle UI ───────────────────────
function updateNotifToggleUI() {
  const btn = document.getElementById('reminderBtn');
  if (!btn) return;
  if (notifEnabled) {
    btn.querySelector('.left').innerHTML = '🔔 <span>Notifikasi Aktif</span>';
    btn.querySelector('span:last-child').textContent = '✅';
    btn.style.borderColor = 'var(--accent-border)';
    btn.style.color = 'var(--accent)';
  } else {
    btn.querySelector('.left').innerHTML = '🔔 <span>Tetapkan Peringatan Pulang</span>';
    btn.querySelector('span:last-child').textContent = '›';
    btn.style.borderColor = '';
    btn.style.color = '';
  }
}

// ── Clock ────────────────────────────────────────
function updateClock() {
  const now = new Date();
  let h = now.getHours(), m = now.getMinutes(), ampm = h >= 12 ? 'PM' : 'AM';
  let dh = h % 12 || 12;
  document.getElementById('liveClock').innerText = `${dh}:${m.toString().padStart(2,'0')} ${ampm}`;
}
updateClock();
setInterval(updateClock, 1000);

// ── Khamis banner ────────────────────────────────
function updateBanner() {
  const isThu = new Date().getDay() === 4;
  document.getElementById('khamisBanner').classList.toggle('show', isThu);
}
updateBanner();

// ── Toggle helper ────────────────────────────────
function toggleCheck(id) {
  const el = document.getElementById(id);
  el.checked = !el.checked;
  if (calculated) {
    calculate(false); // recalculate but don't reset reminder
  }
}

// ── Time formatting ──────────────────────────────
function fmtTime(h, m, s = '') {
  const ampm = h >= 12 ? 'PM' : 'AM';
  const dh = h % 12 || 12;
  if (s !== '') return `${dh}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')} ${ampm}`;
  return `${dh}:${m.toString().padStart(2,'0')} ${ampm}`;
}

// ── Contenteditable input ────────────────────────
function selectAll(el) {
  const range = document.createRange();
  range.selectNodeContents(el);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

function handleKey(e, type) {
  if (e.key === 'Enter')     { e.preventDefault(); e.target.blur(); return; }
  if (e.key === 'ArrowUp')   { e.preventDefault(); changeTime(type, 1); return; }
  if (e.key === 'ArrowDown') { e.preventDefault(); changeTime(type, -1); return; }
  if (e.key === 'Tab')       { commitInput(type); return; }
  if (!/^\d$/.test(e.key) && !['Backspace','Delete','ArrowLeft','ArrowRight'].includes(e.key)) {
    e.preventDefault();
  }
}

function handleInput(e, type) {
  const el = e.target;
  const raw = el.innerText.replace(/\D/g,'').slice(0, 2);
  const max = type === 'h' ? 23 : 59;
  const val = Math.min(parseInt(raw) || 0, max);
  if (type === 'h') hour = val;
  if (type === 'm') minute = val;
  if (type === 's') second = val;
  updateDisplayExcept(type);
}

function commitInput(type) {
  const el = document.getElementById(type === 'h' ? 'hour' : type === 'm' ? 'minute' : 'second');
  const val = type === 'h' ? hour : type === 'm' ? minute : second;
  el.innerText = val.toString().padStart(2,'0');
  updateDisplay();
}

function updateDisplayExcept(skip) {
  if (skip !== 'h') document.getElementById('hour').innerText   = hour.toString().padStart(2,'0');
  if (skip !== 'm') document.getElementById('minute').innerText = minute.toString().padStart(2,'0');
  if (skip !== 's') document.getElementById('second').innerText = second.toString().padStart(2,'0');
  document.getElementById('arrivalDisplay').innerText = fmtTime(hour, minute, second);
  checkArrivalCap();
  if (calculated) calculate(false);
}

function updateDisplay() {
  const focused = document.activeElement;
  if (focused !== document.getElementById('hour'))   document.getElementById('hour').innerText   = hour.toString().padStart(2,'0');
  if (focused !== document.getElementById('minute')) document.getElementById('minute').innerText = minute.toString().padStart(2,'0');
  if (focused !== document.getElementById('second')) document.getElementById('second').innerText = second.toString().padStart(2,'0');
  document.getElementById('arrivalDisplay').innerText = fmtTime(hour, minute, second);
  checkArrivalCap();
  if (calculated) calculate(false);
}

function checkArrivalCap() {
  const arrivalSec = hour * 3600 + minute * 60 + second;
  const capSec = MAX_ARRIVAL_H * 3600 + MAX_ARRIVAL_M * 60;
  const wBox = document.getElementById('warningBox');
  if (arrivalSec > capSec) {
    document.getElementById('warningText').innerText = 'Melebihi had 8:30 AM — kiraan guna 8:30 AM';
    wBox.classList.add('show');
  } else {
    wBox.classList.remove('show');
  }
}

function changeTime(type, amount) {
  if (type === 'h') hour   = (hour   + amount + 24) % 24;
  if (type === 'm') minute = (minute + amount + 60) % 60;
  if (type === 's') second = (second + amount + 60) % 60;
  updateDisplay();
}

function startHold(type, amount) {
  stopHold();
  holdTimer = setTimeout(() => {
    holdInterval = setInterval(() => changeTime(type, amount), 80);
  }, 400);
}
function stopHold() { clearTimeout(holdTimer); clearInterval(holdInterval); }

function preset(h, m) { hour = h; minute = m; second = 0; updateDisplay(); }

// ── Calculate ────────────────────────────────────
// resetReminder=true when user explicitly clicks "Kira Waktu Pulang"
function calculate(resetReminder = true) {
  calculated = true;
  document.getElementById('resultSection').style.display = 'block';

  if (resetReminder) {
    // User clicked button — reset notification state
    notifEnabled = false;
    if (reminderPollInterval) clearInterval(reminderPollInterval);
    reminderTargetTime = null;
    reminderFired = false;
    updateNotifToggleUI();
  }

  const isRamadan  = document.getElementById('ramadan').checked;
  const isThursday = document.getElementById('thursday').checked;

  let workHours = isRamadan ? (isThursday ? 7 : 8.5) : (isThursday ? 7.5 : 9);
  totalWorkSeconds = workHours * 3600;

  const arrivalSec = Math.min(hour * 3600 + minute * 60 + second, MAX_ARRIVAL_H * 3600 + MAX_ARRIVAL_M * 60);
  targetSecondsToday = arrivalSec + totalWorkSeconds;

  // Pulang time
  const tH = Math.floor(targetSecondsToday / 3600) % 24;
  const tM = Math.floor((targetSecondsToday % 3600) / 60);
  const tS = Math.floor(targetSecondsToday % 60);
  document.getElementById('outTime').innerText = fmtTime(tH, tM, tS);

  // Stats
  const effH = Math.floor(arrivalSec / 3600), effM = Math.floor((arrivalSec % 3600) / 60), effS = Math.floor(arrivalSec % 60);
  document.getElementById('statTiba').innerText = fmtTime(effH, effM, effS);
  const wh = Math.floor(workHours), wm = Math.round((workHours - wh) * 60);
  document.getElementById('statTempoh').innerText = `${wh}j${wm ? ` ${wm}m` : ''}`;

  // Tags
  const tagsRow = document.getElementById('tagsRow');
  tagsRow.innerHTML = '';
  if (isThursday) {
    const t = document.createElement('div');
    t.className = 'tag orange'; t.textContent = '📅 Khamis';
    tagsRow.appendChild(t);
  }
  if (hour * 3600 + minute * 60 + second > MAX_ARRIVAL_H * 3600 + MAX_ARRIVAL_M * 60) {
    const t = document.createElement('div');
    t.className = 'tag red'; t.textContent = '⚠ Had 8:30 AM';
    tagsRow.appendChild(t);
  }

  if (countdownInterval) clearInterval(countdownInterval);
  countdownInterval = setInterval(updateCountdown, 1000);
  updateCountdown();

  // Save to localStorage
  saveSession();
}

// ── Countdown ────────────────────────────────────
function updateCountdown() {
  const now = new Date();
  const current = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  let diff = targetSecondsToday - current;
  const banner = document.getElementById('statusBanner');
  const statusText = document.getElementById('statusText');

  if (diff <= 0) {
    document.getElementById('statLagi').innerText = '00:00:00';
    document.getElementById('progressFill').style.width = '100%';
    document.getElementById('progressPct').innerText = '100%';
    banner.className = 'status-banner done';
    statusText.innerText = 'BALIK WOI 🎉';
    clearInterval(countdownInterval);
    if (notifEnabled) notify();
    return;
  }

  let h = Math.floor(diff / 3600), m = Math.floor((diff % 3600) / 60), s = diff % 60;
  document.getElementById('statLagi').innerText = `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;

  const elapsed = totalWorkSeconds - diff;
  const pct = Math.max(0, Math.min(100, Math.round((elapsed / totalWorkSeconds) * 100)));
  document.getElementById('progressFill').style.width = pct + '%';
  document.getElementById('progressPct').innerText = pct + '%';

  banner.className = 'status-banner';
  statusText.innerText = 'Masih waktu bekerja';
}

// ── Notifications ─────────────────────────────────
function notify() {
  if (Notification.permission !== 'granted') return;
  const title = '🎉 Waktu Balik!';
  const opts = {
    body: 'Dah boleh balik sekarang. Jangan lupa punch out!',
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    tag: 'waktu-balik',
    renotify: true,
    requireInteraction: true,
    vibrate: [200, 100, 200, 100, 400],
    actions: [
      { action: 'open',    title: '📲 Buka App' },
      { action: 'dismiss', title: '✕ Tutup' }
    ],
    data: { url: './index.html' }
  };
  navigator.serviceWorker?.getRegistration()
    .then(reg => {
      if (reg && reg.active) reg.showNotification(title, opts);
      else new Notification(title, { body: opts.body, icon: opts.icon });
    })
    .catch(() => new Notification(title, { body: opts.body, icon: opts.icon }));
}

function startReminderPoll() {
  if (reminderPollInterval) clearInterval(reminderPollInterval);
  reminderFired = false;
  reminderPollInterval = setInterval(() => {
    if (reminderFired) return;
    if (reminderTargetTime && Date.now() >= reminderTargetTime) {
      reminderFired = true;
      clearInterval(reminderPollInterval);
      notify();
    }
  }, 1000);
}

// Toggle notification on/off
function setReminder() {
  if (!calculated) {
    showToast('⚠️ Kira waktu pulang dahulu.');
    return;
  }

  if (notifEnabled) {
    // Disable
    notifEnabled = false;
    reminderTargetTime = null;
    reminderFired = false;
    if (reminderPollInterval) clearInterval(reminderPollInterval);
    updateNotifToggleUI();
    saveSession();
    showToast('🔕 Peringatan dimatikan.');
    return;
  }

  // Enable
  Notification.requestPermission().then(perm => {
    if (perm !== 'granted') {
      showToast('⚠️ Sila benarkan notifikasi dalam tetapan browser.');
      return;
    }

    notifEnabled = true;

    const now = new Date();
    const target = new Date();
    target.setHours(Math.floor(targetSecondsToday / 3600) % 24);
    target.setMinutes(Math.floor((targetSecondsToday % 3600) / 60));
    target.setSeconds(Math.floor(targetSecondsToday % 60));
    target.setMilliseconds(0);
    if (target <= now) target.setDate(target.getDate() + 1);

    reminderTargetTime = target.getTime();
    startReminderPoll();

    // SW backup for phone background
    navigator.serviceWorker?.getRegistration().then(reg => {
      if (reg && reg.active) {
        reg.active.postMessage({
          type: 'SCHEDULE_NOTIFY',
          delay: reminderTargetTime - Date.now(),
          title: '🎉 Waktu Balik!',
          body: 'Dah boleh balik sekarang. Jangan lupa punch out!'
        });
      }
    });

    updateNotifToggleUI();
    saveSession();
    const pulangTime = document.getElementById('outTime').innerText;
    showToast(`⏰ Peringatan ditetapkan — ${pulangTime}`);
  });
}

// ── Toast ─────────────────────────────────────────
function showToast(msg) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.style.cssText = `
      position:fixed; bottom:80px; left:50%; transform:translateX(-50%);
      background:#1c2230; border:1px solid rgba(0,229,160,0.3);
      color:#f0f4f8; padding:10px 18px; border-radius:20px;
      font-size:13px; font-weight:500; z-index:9999;
      box-shadow:0 4px 20px rgba(0,0,0,0.4);
      opacity:0; transition:opacity 0.3s; white-space:nowrap;
    `;
    document.body.appendChild(t);
  }
  t.innerText = msg;
  t.style.opacity = '1';
  clearTimeout(t._hide);
  t._hide = setTimeout(() => { t.style.opacity = '0'; }, 3500);
}

// ── PWA ───────────────────────────────────────────
let deferredPrompt = null;

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('SW registered:', reg.scope))
      .catch(err => console.log('SW failed:', err));
  });
}

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;
  document.getElementById('installBanner').classList.add('show');
});

window.addEventListener('appinstalled', () => {
  document.getElementById('installBanner').classList.remove('show');
  deferredPrompt = null;
});

function installPWA() {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then(() => {
    document.getElementById('installBanner').classList.remove('show');
    deferredPrompt = null;
  });
}

function dismissInstall() {
  document.getElementById('installBanner').classList.remove('show');
}

// ── Offline detection ─────────────────────────────
function updateOnlineStatus() {
  document.getElementById('offlinePill').classList.toggle('show', !navigator.onLine);
}
window.addEventListener('online',  updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);
updateOnlineStatus();

// ── Init: restore session or defaults ─────────────
(function init() {
  // Auto Thursday
  if (new Date().getDay() === 4) {
    document.getElementById('thursday').checked = true;
  }

  const session = loadSession();
  if (session) {
    hour   = session.hour;
    minute = session.minute;
    second = session.second;
    document.getElementById('thursday').checked = session.isThursday;
    document.getElementById('ramadan').checked  = session.isRamadan;
    notifEnabled = session.notifEnabled || false;

    updateDisplay();

    if (session.calculated) {
      calculate(false); // restore result without resetting notif

      // Re-arm reminder poll if it was enabled
      if (notifEnabled) {
        const now = new Date();
        const target = new Date();
        target.setHours(Math.floor(targetSecondsToday / 3600) % 24);
        target.setMinutes(Math.floor((targetSecondsToday % 3600) / 60));
        target.setSeconds(Math.floor(targetSecondsToday % 60));
        target.setMilliseconds(0);
        if (target <= now) {
          // Already past — notif would have fired, just disable
          notifEnabled = false;
          saveSession();
        } else {
          reminderTargetTime = target.getTime();
          startReminderPoll();
        }
        updateNotifToggleUI();
      }
    }
    showToast('📂 Data hari ini dipulihkan');
  } else {
    updateDisplay();
  }
})();
