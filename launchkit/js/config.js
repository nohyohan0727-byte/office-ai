// LaunchKit 설정
// LK_ENV fallback: env.js가 없는 환경(Netlify 배포 등)에서도 동작
const _ENV = (typeof LK_ENV !== 'undefined') ? LK_ENV : {};
const LK_CONFIG = {
  // Supabase (garaon-bros 기존 프로젝트 공유 - lk_ 테이블 사용)
  SUPABASE_URL:  _ENV.SUPABASE_URL  || 'https://mkmxhmoocqnkltjxdfbm.supabase.co',
  SUPABASE_ANON: _ENV.SUPABASE_ANON || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rbXhobW9vY3Fua2x0anhkZmJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5MDE0ODIsImV4cCI6MjA4NzQ3NzQ4Mn0.tYPVpoEs_9Qbw3kcUzkImDv0d6lQ69wAZ5YKz2GqqM8',

  // n8n 웹훅 엔드포인트
  WEBHOOK_BASE: _ENV.WEBHOOK_BASE || 'https://jknetworks.app.n8n.cloud/webhook',
  WEBHOOKS: {
    REGISTER:         '/launchkit-register',
    LOGIN:            '/launchkit-login',
    CREATE_PROJECT:   '/launchkit-create-project',
    INTERVIEW:        '/launchkit-interview',
    GENERATE_IR:      '/launchkit-generate-ir',
    GENERATE_LANDING: '/launchkit-generate-landing',
    GET_PROJECTS:     '/launchkit-get-projects',
    GET_PROJECT:      '/launchkit-get-project',
    ADMIN:            '/launchkit-admin',
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

  // 플랜 가격 (월/연)
  PLAN_PRICE: {
    free:    { monthly: 0,     yearly: 0 },
    pro:     { monthly: 30000, yearly: 300000 },
    pro_max: { monthly: 50000, yearly: 500000 },
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
