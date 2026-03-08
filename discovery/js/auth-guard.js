// Discovery 관리자 인증 가드 — 세션 기반 (브라우저 닫으면 로그아웃)
(function() {
  if (!sessionStorage.getItem('disc_auth')) {
    const next = encodeURIComponent(location.pathname + location.search);
    location.replace('/discovery/login.html?next=' + next);
  }
})();
