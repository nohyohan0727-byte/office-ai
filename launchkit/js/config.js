// LaunchKit 설정
const LK_CONFIG = {
  // Supabase (새 프로젝트 생성 후 교체)
  SUPABASE_URL:  'YOUR_SUPABASE_URL',
  SUPABASE_ANON: 'YOUR_SUPABASE_ANON_KEY',

  // n8n 웹훅 엔드포인트
  WEBHOOK_BASE: 'https://jknetworks.app.n8n.cloud/webhook',
  WEBHOOKS: {
    REGISTER:         '/launchkit-register',
    LOGIN:            '/launchkit-login',
    INTERVIEW:        '/launchkit-interview',
    GENERATE_IR:      '/launchkit-generate-ir',
    GENERATE_LANDING: '/launchkit-generate-landing',
    GET_PROJECTS:     '/launchkit-get-projects',
    GET_PROJECT:      '/launchkit-get-project',
  },

  // 플랜별 토큰
  PLAN_TOKENS: {
    free:    100,
    pro:     500,
    pro_max: 2500,
  },

  // 작업별 토큰 소비량
  TOKEN_COST: {
    ir_simple:       80,
    ir_detail:      200,
    landing_simple: 120,
    landing_detail: 300,
  },

  // 플랜 가격
  PLAN_PRICE: {
    free:    0,
    pro:     30000,
    pro_max: 50000,
  },
};

// ─── 세션 관리 ───────────────────────────────
const LK_Auth = {
  getToken() { return localStorage.getItem('lk_session'); },
  setToken(t) { localStorage.setItem('lk_session', t); },
  clear()     { localStorage.removeItem('lk_session'); localStorage.removeItem('lk_user'); },
  getUser()   {
    try { return JSON.parse(localStorage.getItem('lk_user') || 'null'); } catch { return null; }
  },
  setUser(u)  { localStorage.setItem('lk_user', JSON.stringify(u)); },
  isLoggedIn(){ return !!this.getToken(); },
  requireLogin() {
    if (!this.isLoggedIn()) { window.location.href = '/launchkit/auth.html'; return false; }
    return true;
  },
};

// ─── API 호출 헬퍼 ────────────────────────────
async function lkFetch(webhook, body = {}) {
  const token = LK_Auth.getToken();
  const res = await fetch(LK_CONFIG.WEBHOOK_BASE + webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_token: token, ...body }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
