// Dev Console - Main Application Controller

let currentTab = 'chat';
let currentProject = 'office-ai';

// ========== DEVICE FINGERPRINT ==========
function getDeviceFingerprint() {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.textBaseline = 'top';
  ctx.font = '14px Arial';
  ctx.fillText('DevConsole', 2, 2);
  const canvasHash = canvas.toDataURL().slice(-50);

  const parts = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || '',
    navigator.platform || '',
    canvasHash
  ];
  // Simple hash
  let hash = 0;
  const str = parts.join('|');
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + c;
    hash |= 0;
  }
  return 'fp_' + Math.abs(hash).toString(36);
}

function getDeviceInfo() {
  const ua = navigator.userAgent;
  let name = 'Unknown Device';
  if (/iPhone/.test(ua)) name = 'iPhone';
  else if (/iPad/.test(ua)) name = 'iPad';
  else if (/Android/.test(ua)) name = ua.match(/;\s*([^;)]+)\s*Build/)?.[1]?.trim() || 'Android';
  else if (/Mac/.test(ua)) name = 'Mac';
  else if (/Windows/.test(ua)) name = 'Windows PC';
  return {
    name,
    platform: navigator.platform || '',
    screenInfo: screen.width + 'x' + screen.height,
    userAgent: ua.slice(0, 200)
  };
}

// ========== AUTH (기기 등록 방식) ==========
async function doAuth() {
  const codeInput = document.getElementById('auth-code');
  const errorEl = document.getElementById('auth-error');
  const btn = document.getElementById('auth-btn');
  const code = codeInput.value.trim().toUpperCase();

  if (!code || code.length < 6) { showAuthError('6자리 등록 코드를 입력하세요'); return; }

  btn.textContent = 'Registering...';
  btn.disabled = true;
  errorEl.classList.add('hidden');

  try {
    const fingerprint = getDeviceFingerprint();
    const info = getDeviceInfo();
    const res = await fetch(CONFIG.MANAGER_URL + '/api/devices/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, fingerprint, deviceName: info.name, ...info }),
    });
    const data = await res.json();

    if (res.ok && data.success) {
      localStorage.setItem('dc_device_token', data.token);
      localStorage.setItem('dc_device_id', data.deviceId);
      showMainApp();
      toast('Device registered', 'success');
    } else {
      showAuthError(data.error || 'Registration failed');
    }
  } catch (e) {
    showAuthError('Server unreachable. Check network connection.');
  }

  btn.textContent = 'Register Device';
  btn.disabled = false;
}

function showAuthError(msg) {
  const el = document.getElementById('auth-error');
  el.textContent = msg;
  el.classList.remove('hidden');
}

function doLogout() {
  localStorage.removeItem('dc_device_token');
  localStorage.removeItem('dc_device_id');
  document.getElementById('auth-gate').classList.remove('hidden');
  document.getElementById('main-app').classList.add('hidden');
  stopLogPolling();
}

async function tryAutoAuth(retry = 0) {
  const token = localStorage.getItem('dc_device_token');
  if (!token) return;

  try {
    const res = await fetch(CONFIG.MANAGER_URL + '/api/mobile/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': token },
    });
    if (res.ok) {
      const data = await res.json();
      showMainApp();
      if (data.device) toast(`${data.device.name} connected`, 'success');
    } else {
      const data = await res.json().catch(() => ({}));
      if (data.needsRegistration) {
        // 기기가 서버에서 삭제/차단된 경우만 토큰 제거
        localStorage.removeItem('dc_device_token');
        localStorage.removeItem('dc_device_id');
      } else if (retry < 2) {
        // 일시적 오류면 재시도
        setTimeout(() => tryAutoAuth(retry + 1), 1500);
      }
    }
  } catch {
    // 서버 연결 불가 — 토큰 유지하고 재시도
    if (retry < 2) {
      setTimeout(() => tryAutoAuth(retry + 1), 2000);
    } else {
      showAuthError('서버에 연결할 수 없습니다. 네트워크를 확인하세요.');
    }
  }
}

function showMainApp() {
  document.getElementById('auth-gate').classList.add('hidden');
  document.getElementById('main-app').classList.remove('hidden');
  initTab(currentTab);
}

// ========== TAB ROUTING ==========
function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.getElementById(`section-${tab}`).classList.add('active');
  document.querySelectorAll('.tab-btn').forEach(b => {
    const isActive = b.dataset.tab === tab;
    b.classList.toggle('text-blue-400', isActive);
    b.classList.toggle('text-slate-400', !isActive);
  });
  initTab(tab);
}

function initTab(tab) {
  switch (tab) {
    case 'files': loadFileTree(); break;
    case 'logs': startLogPolling(); break;
    case 'commands': loadCommands(); break;
    case 'manager': loadManager(); break;
  }
  if (tab !== 'logs') stopLogPolling();
}

function switchProject(project) {
  currentProject = project;
  if (currentTab === 'files') loadFileTree();
}

// ========== TOAST ==========
function toast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  const colors = {
    success: 'bg-emerald-900/90 border-emerald-700 text-emerald-200',
    error: 'bg-red-900/90 border-red-700 text-red-200',
    info: 'bg-dc-card border-dc-border text-slate-200',
  };
  el.className = `${colors[type] || colors.info} border rounded-lg px-4 py-2.5 text-sm shadow-xl toast-enter`;
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => {
    el.classList.remove('toast-enter');
    el.classList.add('toast-exit');
    setTimeout(() => el.remove(), 300);
  }, 2800);
}

// ========== PULL TO REFRESH ==========
let touchStartY = 0;
let pullDist = 0;

document.addEventListener('touchstart', e => {
  const scrollable = document.querySelector('.section.active [class*="overflow-y"]') || document.querySelector('.section.active');
  if (scrollable && scrollable.scrollTop === 0) {
    touchStartY = e.touches[0].clientY;
  }
}, { passive: true });

document.addEventListener('touchmove', e => {
  if (!touchStartY) return;
  pullDist = e.touches[0].clientY - touchStartY;
  if (pullDist > 0 && pullDist < 100) {
    document.getElementById('pull-indicator').style.transform = `translateY(${Math.min(pullDist, 60)}px)`;
  }
}, { passive: true });

document.addEventListener('touchend', () => {
  if (pullDist > 50) {
    initTab(currentTab);
    toast('Refreshed', 'info');
  }
  pullDist = 0;
  touchStartY = 0;
  document.getElementById('pull-indicator').style.transform = '';
});

// ========== INIT ==========
document.getElementById('auth-code').addEventListener('keydown', e => {
  if (e.key === 'Enter') doAuth();
});

// URL에서 code 파라미터 자동 처리
(async function init() {
  const params = new URLSearchParams(window.location.search);
  const urlCode = params.get('code');
  if (urlCode) {
    // URL에서 code 제거 (히스토리)
    window.history.replaceState({}, '', window.location.pathname);
    // 이미 등록된 기기면 자동 로그인 시도
    const token = localStorage.getItem('dc_device_token');
    if (token) {
      await tryAutoAuth();
      return;
    }
    // 코드 자동 입력 후 바로 등록
    document.getElementById('auth-code').value = urlCode;
    doAuth();
  } else {
    tryAutoAuth();
  }
})();
