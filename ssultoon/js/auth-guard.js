// 썰툰 관리자 인증 가드 — sessionStorage 기반
(function() {
  if (sessionStorage.getItem('st_auth') !== 'true') {
    const next = encodeURIComponent(location.pathname + location.search);
    location.replace('/ssultoon/login.html?next=' + next);
  }
})();
