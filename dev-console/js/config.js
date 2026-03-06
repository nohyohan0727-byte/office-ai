// Dev Console Configuration
const CONFIG = {
  MANAGER_URL: window.location.origin,  // 자동 감지: 현재 접속한 서버 주소 사용
  ADMIN_KEY: (typeof DC_ENV !== 'undefined' && DC_ENV.ADMIN_KEY) || '',
  N8N_WEBHOOK: (typeof DC_ENV !== 'undefined' && DC_ENV.N8N_WEBHOOK) || '',
  RAG_API_KEY: (typeof DC_ENV !== 'undefined' && DC_ENV.RAG_API_KEY) || '',
};

// API 유틸리티
async function api(path, options = {}) {
  const token = localStorage.getItem('dc_device_token') || '';
  const url = CONFIG.MANAGER_URL + path;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Device-Token': token,
      ...(options.headers || {}),
    },
    body: options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : undefined,
  });
  if (res.status === 401 || res.status === 403) {
    const data = await res.json();
    if (data.needsRegistration) {
      doLogout();
      throw new Error('DeviceRegistrationRequired');
    }
    doLogout();
    throw new Error('Unauthorized');
  }
  return res.json();
}

function apiGet(path) { return api(path); }
function apiPost(path, body) { return api(path, { method: 'POST', body }); }
