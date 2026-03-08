// 썰툰 관리자 인증 가드 — Supabase Auth 기반
(async function() {
  document.documentElement.style.visibility = 'hidden';
  try {
    const _sb = supabase.createClient(ST_ENV.SUPABASE_URL, ST_ENV.SUPABASE_ANON_KEY);
    const { data: { session } } = await _sb.auth.getSession();
    if (!session) {
      const next = encodeURIComponent(location.pathname + location.search);
      location.replace('/ssultoon/login.html?next=' + next);
      return;
    }
  } catch(e) {
    location.replace('/ssultoon/login.html');
    return;
  }
  document.documentElement.style.visibility = '';
})();
