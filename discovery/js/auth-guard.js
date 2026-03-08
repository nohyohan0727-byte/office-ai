// Discovery 관리자 인증 가드 — Supabase Auth 기반 (서버 사이드 JWT)
// 주의: env.js와 supabase CDN이 이 파일보다 먼저 로드되어야 합니다.
(async function() {
  // body를 즉시 숨겨 인증 전 화면 노출 방지
  document.documentElement.style.visibility = 'hidden';

  try {
    const _sb = supabase.createClient(DISC_ENV.SUPABASE_URL, DISC_ENV.SUPABASE_ANON_KEY);
    const { data: { session } } = await _sb.auth.getSession();

    if (!session) {
      const next = encodeURIComponent(location.pathname + location.search);
      location.replace('/discovery/login.html?next=' + next);
      return;
    }
  } catch(e) {
    location.replace('/discovery/login.html');
    return;
  }

  document.documentElement.style.visibility = '';
})();
