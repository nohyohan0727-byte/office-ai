/* ═══════════════════════════════════════════════════════════
   가라온 브로즈 — Spotify 배경음악 플레이어
   모든 페이지에서 공유. 상단 고정 바 + 검색/프리셋 패널.
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── iframe 내부에서는 음악 플레이어 초기화 스킵 ── */
  if (window.self !== window.top) {
    // 서브 페이지가 iframe 안에 로드된 경우 — 부모의 플레이어 사용
    // <a> 홈 링크 클릭 인터셉트
    document.addEventListener('click', function (e) {
      const a = e.target.closest('a[href*="index.html"], a[href="./"]');
      if (a) { e.preventDefault(); window.parent.postMessage('gb-close-iframe', '*'); }
    });
    // location.href 할당 인터셉트 (onclick="location.href='./index.html'" 등)
    document.addEventListener('click', function (e) {
      const btn = e.target.closest('button[onclick*="index.html"], [onclick*="index.html"]');
      if (btn) { e.preventDefault(); e.stopPropagation(); btn.onclick = null; window.parent.postMessage('gb-close-iframe', '*'); }
    }, true);
    document.addEventListener('DOMContentLoaded', function () {
      document.body.style.paddingTop = '0px';
    });
    return;
  }

  /* ── 프리셋 플레이리스트 ── */
  const PRESETS = [
    { id: '37i9dQZF1DX9xImy3px1J2', name: 'Party 2026',           icon: '🎉', mood: '파티/신나는' },
    { id: '7s09coXLGbofhNrwSusr4G', name: 'Happy & Upbeat',       icon: '😊', mood: '밝은/기분좋은' },
    { id: '37i9dQZF1DWWQRwui0ExPn', name: 'Lofi Beats',           icon: '🎧', mood: '힐링/잔잔한' },
    { id: '74sUjcvpGfdOvCHvgzNEDO', name: 'Lofi Chill',           icon: '☕', mood: '집중/릴렉스' },
    { id: '1S1C78s8MhCOsxseF3wWyE', name: 'Board Game BGM',       icon: '🎲', mood: '보드게임' },
    { id: '33KEQYPkW8hmHqqauQ7fBe', name: 'Suspense & Mystery',   icon: '🔍', mood: '긴장감/추리' },
    { id: '1SQBCNypeE7acQxPjsROhl', name: '8-Bit Chiptune',       icon: '👾', mood: '레트로/8bit' },
    { id: '1n6FfiUkVKRjJcWzinm7ud9', name: 'Chiptune Arcade',     icon: '🕹️', mood: '아케이드' },
  ];

  const LS_KEY   = 'gb_music_state';
  const SPOTIFY_WEBHOOK = (typeof CONFIG !== 'undefined' && CONFIG.SPOTIFY_WEBHOOK)
    || 'https://jknetworks.app.n8n.cloud/webhook/spotify-search';

  /* ── 상태 ── */
  let state = loadState();
  let panelOpen = false;
  let iframePlaying = false;

  function loadState () {
    try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; }
    catch { return {}; }
  }
  function saveState () { localStorage.setItem(LS_KEY, JSON.stringify(state)); }

  /* ── embed URL 생성 ── */
  function embedUrl (spotifyUri, forceType) {
    let type = forceType || 'playlist', id = spotifyUri;

    const urlMatch = spotifyUri.match(/open\.spotify\.com\/(playlist|album|track|episode)\/([a-zA-Z0-9]+)/);
    if (urlMatch) { type = forceType || urlMatch[1]; id = urlMatch[2]; }

    const uriMatch = spotifyUri.match(/spotify:(playlist|album|track):([a-zA-Z0-9]+)/);
    if (uriMatch) { type = forceType || uriMatch[1]; id = uriMatch[2]; }

    if (/^[a-zA-Z0-9]{22}$/.test(id) && !forceType) { type = 'playlist'; }

    return `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0&autoplay=1`;
  }

  /* ── DOM 삽입 ── */
  function init () {
    injectCSS();
    injectHTML();
    bindEvents();
    // 이전 세션 복원
    if (state.currentId) {
      setPlaying(state.currentId, state.currentName || '', state.currentUri || '', false, state.currentType || 'playlist');
    }
  }

  /* ── CSS ── */
  function injectCSS () {
    const s = document.createElement('style');
    s.textContent = `
/* ── 음악 플레이어 바 ── */
#gb-music-bar {
  position: fixed; top: 0; left: 0; right: 0; z-index: 200;
  background: #0f0f20ee; backdrop-filter: blur(12px);
  border-bottom: 1px solid #00d4ff44;
  display: flex; align-items: center; gap: 8px;
  padding: 0 12px; height: 44px;
  max-width: 100%; font-family: 'Nunito', sans-serif;
  transition: box-shadow .25s;
}
#gb-music-bar.playing { box-shadow: 0 0 18px #00d4ff33; }
#gb-music-bar .m-icon { font-size: 22px; flex-shrink: 0; }
#gb-music-bar .m-name {
  flex: 1; font-size: 15px; font-weight: 700; color: #ccc;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
#gb-music-bar .m-name.active { color: #00ff88; }
#gb-music-bar .m-btn {
  background: transparent; border: 1px solid #333; color: #aaa;
  width: 36px; height: 36px; border-radius: 8px;
  font-size: 18px; cursor: pointer; display: flex;
  align-items: center; justify-content: center; flex-shrink: 0;
  transition: all .15s;
}
#gb-music-bar .m-btn:hover { border-color: #00d4ff; color: #00d4ff; }
#gb-music-bar .m-btn.on { border-color: #00ff88; color: #00ff88; background: #00ff8818; }

/* ── 패널 (검색 / 프리셋) ── */
#gb-music-panel {
  position: fixed; top: 44px; left: 0; right: 0; z-index: 199;
  background: #0b0b1af0; backdrop-filter: blur(14px);
  border-bottom: 2px solid #00d4ff44;
  max-height: 0; overflow: hidden;
  transition: max-height .35s ease, padding .35s ease;
  padding: 0 16px;
}
#gb-music-panel.open {
  max-height: 70vh; overflow-y: auto; padding: 16px;
}
.mp-section-title {
  font-family: 'Press Start 2P', monospace; font-size: 7px;
  color: #00d4ff; margin: 12px 0 8px; letter-spacing: .04em;
}
.mp-section-title:first-child { margin-top: 0; }

/* 검색 입력 */
.mp-search-row {
  display: flex; gap: 8px; margin-bottom: 14px;
}
.mp-search-input {
  flex: 1; background: #151526; border: 1px solid #333;
  color: #eee; padding: 10px 14px; border-radius: 10px;
  font-size: 14px; font-family: 'Nunito', sans-serif;
  outline: none; transition: border-color .2s;
}
.mp-search-input:focus { border-color: #00d4ff; }
.mp-search-input::placeholder { color: #555; }
.mp-search-btn {
  background: #00d4ff; color: #0b0b1a; border: none;
  border-radius: 10px; padding: 0 18px; font-weight: 900;
  font-size: 14px; cursor: pointer; white-space: nowrap;
}
.mp-search-btn:disabled { opacity: .4; cursor: default; }

/* 카테고리 탭 */
.mp-category-label {
  font-size: 10px; color: #888; font-weight: 700;
  padding: 6px 0 4px; margin-top: 8px; letter-spacing: .03em;
  border-bottom: 1px solid #222; display: flex; align-items: center; gap: 6px;
}
.mp-category-label span { font-size: 13px; }
.mp-result-type {
  font-size: 9px; color: #00d4ff; background: #00d4ff18;
  padding: 2px 6px; border-radius: 4px; font-weight: 700; flex-shrink: 0;
}
.mp-result-sub { font-size: 10px; color: #666; margin-top: 1px; }

/* 프리셋 그리드 */
.mp-preset-grid {
  display: grid; grid-template-columns: repeat(2, 1fr);
  gap: 8px; margin-bottom: 10px;
}
.mp-preset {
  background: #151526; border: 1.5px solid #222;
  border-radius: 12px; padding: 10px 12px; cursor: pointer;
  display: flex; align-items: center; gap: 10px;
  transition: all .18s; font-size: 13px;
}
.mp-preset:hover { border-color: #00d4ff66; background: #1a1a35; }
.mp-preset.active { border-color: #00ff88; background: #00ff8812; }
.mp-preset .pi { font-size: 20px; }
.mp-preset .pn { font-weight: 700; color: #ddd; line-height: 1.3; }
.mp-preset .pm { font-size: 10px; color: #888; }

/* 검색 결과 */
.mp-results { display: flex; flex-direction: column; gap: 8px; margin-bottom: 10px; }
.mp-result-item {
  background: #151526; border: 1.5px solid #222;
  border-radius: 12px; padding: 10px 12px; cursor: pointer;
  display: flex; align-items: center; gap: 12px;
  transition: all .18s;
}
.mp-result-item:hover { border-color: #00d4ff66; background: #1a1a35; }
.mp-result-img {
  width: 44px; height: 44px; border-radius: 8px;
  object-fit: cover; background: #222; flex-shrink: 0;
}
.mp-result-info { flex: 1; overflow: hidden; }
.mp-result-name { font-weight: 700; font-size: 13px; color: #eee;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.mp-result-owner { font-size: 11px; color: #888;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.mp-loading { text-align: center; color: #555; padding: 16px; font-size: 13px; }
.mp-error   { text-align: center; color: #ff4466; padding: 10px; font-size: 12px; }

/* ── Spotify iframe 영역 (배너: 항상 보임) ── */
#gb-music-embed {
  position: fixed; top: 44px; left: 0; right: 0; z-index: 198;
  max-height: 0; overflow: hidden; transition: max-height .3s ease;
  background: #0b0b1a;
}
#gb-music-embed.open { max-height: 160px; }
#gb-music-embed.open.expanded { max-height: 380px; }
#gb-music-embed iframe {
  width: 100%; height: 152px; border: none; border-radius: 0;
}
#gb-music-embed.open.expanded iframe {
  height: 352px;
}

/* ── body 여백 ── */
body { padding-top: 44px !important; }
body.music-banner { padding-top: 200px !important; }
body.music-banner-expanded { padding-top: 420px !important; }

/* ── 고정/sticky 요소 동적 조정 ── */
body.music-banner #visitor-fab,
body.music-banner .top-right-area { top: 210px !important; }
body.music-banner-expanded #visitor-fab,
body.music-banner-expanded .top-right-area { top: 430px !important; }
body.music-banner .header { top: 200px !important; }
body.music-banner-expanded .header { top: 420px !important; }
`;
    document.head.appendChild(s);
  }

  /* ── HTML ── */
  function injectHTML () {
    // 바
    const bar = document.createElement('div');
    bar.id = 'gb-music-bar';
    bar.innerHTML = `
      <span class="m-icon">🎵</span>
      <span class="m-name" id="m-track-name">음악을 선택하세요</span>
      <button class="m-btn" id="m-btn-embed" title="배너 보기/숨기기">🎵</button>
      <button class="m-btn" id="m-btn-list" title="재생목록 보기/숨기기">📋</button>
      <button class="m-btn" id="m-btn-stop" title="정지">⏹</button>
      <button class="m-btn" id="m-btn-panel" title="검색/선택">🔍</button>
    `;

    // embed
    const embed = document.createElement('div');
    embed.id = 'gb-music-embed';

    // 패널
    const panel = document.createElement('div');
    panel.id = 'gb-music-panel';
    panel.innerHTML = `
      <div class="mp-section-title">🔍 SPOTIFY 검색</div>
      <div class="mp-search-row">
        <input class="mp-search-input" id="mp-search-q" placeholder="곡, 앨범, 플레이리스트 검색..." />
        <button class="mp-search-btn" id="mp-search-go">검색</button>
      </div>
      <div id="mp-search-results" class="mp-results"></div>

      <div class="mp-section-title">🎲 추천 플레이리스트</div>
      <div class="mp-preset-grid" id="mp-preset-grid"></div>
    `;

    document.body.prepend(panel);
    document.body.prepend(embed);
    document.body.prepend(bar);

    // 프리셋 렌더
    const grid = document.getElementById('mp-preset-grid');
    PRESETS.forEach(p => {
      const el = document.createElement('div');
      el.className = 'mp-preset' + (state.currentId === p.id ? ' active' : '');
      el.dataset.id = p.id;
      el.dataset.name = p.name;
      el.innerHTML = `<span class="pi">${p.icon}</span><div><div class="pn">${p.name}</div><div class="pm">${p.mood}</div></div>`;
      el.onclick = () => setPlaying(p.id, p.name, `spotify:playlist:${p.id}`, true);
      grid.appendChild(el);
    });
  }

  /* ── 이벤트 ── */
  function bindEvents () {
    // 패널 토글
    document.getElementById('m-btn-panel').onclick = () => {
      panelOpen = !panelOpen;
      const panel = document.getElementById('gb-music-panel');
      const embedEl = document.getElementById('gb-music-embed');
      panel.classList.toggle('open', panelOpen);
      if (panelOpen) {
        embedEl.classList.remove('open', 'expanded');
        document.getElementById('m-btn-embed').classList.remove('on');
        document.getElementById('m-btn-list').classList.remove('on');
        updateBodyBanner();
      }
      document.getElementById('m-btn-panel').classList.toggle('on', panelOpen);
    };

    // 🎵 embed 배너 토글 (작은 플레이어)
    document.getElementById('m-btn-embed').onclick = () => {
      if (!iframePlaying) return;
      const embedEl = document.getElementById('gb-music-embed');
      const panel = document.getElementById('gb-music-panel');
      if (embedEl.classList.contains('open') && !embedEl.classList.contains('expanded')) {
        // 배너 닫기
        embedEl.classList.remove('open');
        updateBodyBanner();
        document.getElementById('m-btn-embed').classList.remove('on');
        return;
      }
      embedEl.classList.add('open');
      embedEl.classList.remove('expanded');
      panel.classList.remove('open'); panelOpen = false;
      document.getElementById('m-btn-panel').classList.remove('on');
      document.getElementById('m-btn-embed').classList.add('on');
      document.getElementById('m-btn-list').classList.remove('on');
      updateBodyBanner();
    };

    // 📋 재생목록 보기 (확장 — 트랙리스트 포함)
    document.getElementById('m-btn-list').onclick = () => {
      if (!iframePlaying) return;
      const embedEl = document.getElementById('gb-music-embed');
      const panel = document.getElementById('gb-music-panel');
      if (embedEl.classList.contains('open') && embedEl.classList.contains('expanded')) {
        // 확장 해제 → 배너 모드로
        embedEl.classList.remove('expanded');
        document.getElementById('m-btn-list').classList.remove('on');
        document.getElementById('m-btn-embed').classList.add('on');
        updateBodyBanner();
        return;
      }
      embedEl.classList.add('open', 'expanded');
      panel.classList.remove('open'); panelOpen = false;
      document.getElementById('m-btn-panel').classList.remove('on');
      document.getElementById('m-btn-list').classList.add('on');
      document.getElementById('m-btn-embed').classList.add('on');
      updateBodyBanner();
    };

    // 정지
    document.getElementById('m-btn-stop').onclick = stopPlaying;

    // 검색
    document.getElementById('mp-search-go').onclick = doSearch;
    document.getElementById('mp-search-q').onkeydown = e => { if (e.key === 'Enter') doSearch(); };
  }

  /* ── body 배너 클래스 동기화 ── */
  function updateBodyBanner () {
    const embedEl = document.getElementById('gb-music-embed');
    const isOpen = embedEl.classList.contains('open');
    const isExpanded = embedEl.classList.contains('expanded');
    document.body.classList.toggle('music-banner', isOpen && !isExpanded);
    document.body.classList.toggle('music-banner-expanded', isOpen && isExpanded);
  }

  /* ── 재생 ── */
  function setPlaying (id, name, uri, autoShow, type) {
    state.currentId   = id;
    state.currentName = name;
    state.currentUri  = uri;
    state.currentType = type || 'playlist';
    saveState();

    iframePlaying = true;
    document.getElementById('m-track-name').textContent = name || id;
    document.getElementById('m-track-name').classList.add('active');
    document.getElementById('gb-music-bar').classList.add('playing');

    // iframe
    const embedEl = document.getElementById('gb-music-embed');
    const isTrack = (type === 'track');
    embedEl.innerHTML = `<iframe src="${embedUrl(uri || id, type)}" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`;
    if (autoShow) {
      embedEl.classList.add('open');
      // 곡은 배너만, 앨범/플레이리스트는 확장(재생목록 보이게)
      if (isTrack) {
        embedEl.classList.remove('expanded');
        document.getElementById('m-btn-list').classList.remove('on');
      } else {
        embedEl.classList.add('expanded');
        document.getElementById('m-btn-list').classList.add('on');
      }
      document.getElementById('m-btn-embed').classList.add('on');
      document.getElementById('gb-music-panel').classList.remove('open');
      panelOpen = false;
      document.getElementById('m-btn-panel').classList.remove('on');
      updateBodyBanner();
    }

    // 프리셋 active 표시
    document.querySelectorAll('.mp-preset').forEach(el => {
      el.classList.toggle('active', el.dataset.id === id);
    });
  }

  function stopPlaying () {
    iframePlaying = false;
    state.currentId = null; state.currentName = null; state.currentUri = null;
    saveState();

    document.getElementById('m-track-name').textContent = '음악을 선택하세요';
    document.getElementById('m-track-name').classList.remove('active');
    document.getElementById('gb-music-bar').classList.remove('playing');
    const embedEl = document.getElementById('gb-music-embed');
    embedEl.innerHTML = '';
    embedEl.classList.remove('open', 'expanded');
    document.getElementById('m-btn-embed').classList.remove('on');
    document.getElementById('m-btn-list').classList.remove('on');
    updateBodyBanner();

    document.querySelectorAll('.mp-preset').forEach(el => el.classList.remove('active'));
  }

  /* ── Spotify 검색 (n8n 프록시) — 곡 + 앨범 + 플레이리스트 ── */
  async function doSearch () {
    const q = document.getElementById('mp-search-q').value.trim();
    if (!q) return;

    const results = document.getElementById('mp-search-results');
    const btn = document.getElementById('mp-search-go');
    btn.disabled = true;
    results.innerHTML = '<div class="mp-loading">검색 중...</div>';

    try {
      const res = await fetch(SPOTIFY_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, type: 'track,album,playlist', limit: 8 }),
      });
      if (!res.ok) throw new Error('검색 실패');
      const data = await res.json();

      const tracks    = data.tracks    || [];
      const albums    = data.albums    || [];
      const playlists = data.playlists || [];

      if (!tracks.length && !albums.length && !playlists.length) {
        results.innerHTML = '<div class="mp-loading">결과가 없습니다</div>';
        return;
      }

      results.innerHTML = '';

      // 곡 결과
      if (tracks.length) {
        results.innerHTML += '<div class="mp-category-label"><span>🎵</span> 곡</div>';
        tracks.forEach(t => {
          const el = document.createElement('div');
          el.className = 'mp-result-item';
          const img = (t.images && t.images[0] && t.images[0].url) || '';
          const dur = t.duration_ms ? Math.floor(t.duration_ms / 60000) + ':' + String(Math.floor((t.duration_ms % 60000) / 1000)).padStart(2, '0') : '';
          el.innerHTML = `
            ${img ? `<img class="mp-result-img" src="${img}" alt="">` : '<div class="mp-result-img"></div>'}
            <div class="mp-result-info">
              <div class="mp-result-name">${t.name || '알 수 없음'}</div>
              <div class="mp-result-owner">${t.artist || ''}${dur ? ' · ' + dur : ''}</div>
            </div>
            <span class="mp-result-type">곡</span>
          `;
          el.onclick = () => setPlaying(t.id, t.name, `spotify:track:${t.id}`, true, 'track');
          results.appendChild(el);
        });
      }

      // 앨범 결과
      if (albums.length) {
        const label = document.createElement('div');
        label.className = 'mp-category-label';
        label.innerHTML = '<span>💿</span> 앨범';
        results.appendChild(label);
        albums.forEach(a => {
          const el = document.createElement('div');
          el.className = 'mp-result-item';
          const img = (a.images && a.images[0] && a.images[0].url) || '';
          el.innerHTML = `
            ${img ? `<img class="mp-result-img" src="${img}" alt="">` : '<div class="mp-result-img"></div>'}
            <div class="mp-result-info">
              <div class="mp-result-name">${a.name || '알 수 없음'}</div>
              <div class="mp-result-owner">${a.artist || ''}${a.total_tracks ? ' · ' + a.total_tracks + '곡' : ''}</div>
            </div>
            <span class="mp-result-type">앨범</span>
          `;
          el.onclick = () => setPlaying(a.id, a.name, `spotify:album:${a.id}`, true, 'album');
          results.appendChild(el);
        });
      }

      // 플레이리스트 결과
      if (playlists.length) {
        const label = document.createElement('div');
        label.className = 'mp-category-label';
        label.innerHTML = '<span>📂</span> 플레이리스트';
        results.appendChild(label);
        playlists.forEach(p => {
          const el = document.createElement('div');
          el.className = 'mp-result-item';
          const img = (p.images && p.images[0] && p.images[0].url) || '';
          el.innerHTML = `
            ${img ? `<img class="mp-result-img" src="${img}" alt="">` : '<div class="mp-result-img"></div>'}
            <div class="mp-result-info">
              <div class="mp-result-name">${p.name || '알 수 없음'}</div>
              <div class="mp-result-owner">${p.owner || ''}</div>
            </div>
            <span class="mp-result-type">리스트</span>
          `;
          el.onclick = () => setPlaying(p.id, p.name, `spotify:playlist:${p.id}`, true, 'playlist');
          results.appendChild(el);
        });
      }
    } catch (err) {
      results.innerHTML = `<div class="mp-error">검색 오류: ${err.message}</div>`;
    } finally {
      btn.disabled = false;
    }
  }

  /* ── 시작 ── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
