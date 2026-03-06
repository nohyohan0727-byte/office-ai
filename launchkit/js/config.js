// LaunchKit 설정
// LK_ENV fallback: env.js가 없는 환경(Netlify 배포 등)에서도 동작
const _ENV = (typeof LK_ENV !== 'undefined') ? LK_ENV : {};
const LK_CONFIG = {
  // Supabase (garaon-bros 기존 프로젝트 공유 - lk_ 테이블 사용)
  SUPABASE_URL:  _ENV.SUPABASE_URL  || 'https://mkmxhmoocqnkltjxdfbm.supabase.co',
  SUPABASE_ANON: _ENV.SUPABASE_ANON || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rbXhobW9vY3Fua2x0anhkZmJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5MDE0ODIsImV4cCI6MjA4NzQ3NzQ4Mn0.tYPVpoEs_9Qbw3kcUzkImDv0d6lQ69wAZ5YKz2GqqM8',

  // Service Manager Public API (우선 시도, 실패 시 Supabase fallback)
  SM_API_URL: _ENV.SM_API_URL || '',

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

  // 플랜별 토큰 (기본값, fetchPlans로 동적 갱신)
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

  // 플랜 가격 (기본값, fetchPlans로 동적 갱신)
  PLAN_PRICE: {
    free:    { monthly: 0,     yearly: 0 },
    pro:     { monthly: 30000, yearly: 300000 },
    pro_max: { monthly: 50000, yearly: 500000 },
  },

  // 플랜 원본 데이터 (fetchPlans 후 채워짐)
  PLANS_DATA: [],
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

// ─── 플랜 데이터 로드 (SM Public API → Supabase fallback) ───
async function lkFetchPlans() {
  // 1) SM Public API 시도
  if (LK_CONFIG.SM_API_URL) {
    try {
      const res = await fetch(LK_CONFIG.SM_API_URL + '/api/public/plans/launchkit', { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const data = await res.json();
        const plans = data.plans || [];
        if (plans.length) { _applyPlans(plans); return plans; }
      }
    } catch (e) { /* SM 접속 불가 → fallback */ }
  }
  // 2) Supabase 직접 조회 (fallback)
  const res = await fetch(LK_CONFIG.SUPABASE_URL + '/rest/v1/lk_plans?select=*&is_active=eq.true&order=sort_order.asc', {
    headers: { apikey: LK_CONFIG.SUPABASE_ANON }
  });
  const plans = await res.json();
  if (Array.isArray(plans)) { _applyPlans(plans); return plans; }
  return [];
}

function _applyPlans(plans) {
  LK_CONFIG.PLANS_DATA = plans;
  for (const p of plans) {
    LK_CONFIG.PLAN_TOKENS[p.plan_key] = p.tokens || 0;
    LK_CONFIG.PLAN_PRICE[p.plan_key] = {
      monthly: p.price_monthly || 0,
      yearly: p.price_yearly || 0,
      discount_monthly: p.discount_monthly || 0,
      discount_yearly: p.discount_yearly || 0,
    };
  }
}

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
