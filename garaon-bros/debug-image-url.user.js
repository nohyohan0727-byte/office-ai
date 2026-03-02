// ==UserScript==
// @name         가라온 브로즈 - 이미지 URL 디버거
// @namespace    garaon-bros-debug
// @version      1.0
// @description  게임 추가 시 이미지 URL 가져오기 과정을 콘솔에 상세 로깅
// @match        https://office-ai.app/garaon-bros/gbhq.html*
// @match        http://localhost*/garaon-bros/gbhq.html*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
  'use strict';

  const style = 'background:#a78bfa;color:#fff;padding:2px 8px;border-radius:4px;font-weight:bold;';
  const errStyle = 'background:#ff4466;color:#fff;padding:2px 8px;border-radius:4px;font-weight:bold;';
  const okStyle = 'background:#22c55e;color:#fff;padding:2px 8px;border-radius:4px;font-weight:bold;';

  console.log('%c🔍 이미지 URL 디버거 활성화', style);

  // fetch를 가로채서 n8n 웹훅 응답과 Wikipedia API 응답 로깅
  const origFetch = window.fetch;
  window.fetch = async function(...args) {
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';

    // n8n 게임 검색 웹훅
    if (url.includes('garaon-bg-search')) {
      console.log('%c[n8n 웹훅] 요청 전송', style, {
        url: url,
        body: args[1]?.body ? JSON.parse(args[1].body) : null
      });

      try {
        const res = await origFetch.apply(this, args);
        const clone = res.clone();
        const data = await clone.json();

        console.log('%c[n8n 웹훅] 응답 수신', style, {
          status: res.status,
          ok: res.ok,
          data: data
        });

        // 이미지 URL 체크
        if (data.image_url) {
          console.log('%c[n8n] ✅ image_url 있음', okStyle, data.image_url);
          // 이미지 로드 테스트
          testImageLoad('n8n', data.image_url);
        } else {
          console.log('%c[n8n] ❌ image_url 없음', errStyle, '→ Wikipedia fallback 시도 예정');
        }

        if (data.name_en) {
          console.log('%c[n8n] name_en:', style, data.name_en, '→ Wikipedia 검색에 사용');
        } else {
          console.log('%c[n8n] ❌ name_en 없음', errStyle, '→ Wikipedia 검색 불가');
        }

        return res;
      } catch(e) {
        console.log('%c[n8n] ❌ fetch 오류', errStyle, e.message);
        throw e;
      }
    }

    // Wikipedia API
    if (url.includes('wikipedia.org/api/rest_v1/page/summary')) {
      const searchTerm = decodeURIComponent(url.split('/page/summary/')[1] || '');
      console.log('%c[Wikipedia] 요청 전송', style, { searchTerm, url });

      try {
        const res = await origFetch.apply(this, args);
        const clone = res.clone();

        if (!res.ok) {
          console.log('%c[Wikipedia] ❌ HTTP 오류', errStyle, {
            status: res.status,
            statusText: res.statusText
          });
          return res;
        }

        const data = await clone.json();

        console.log('%c[Wikipedia] 응답 수신', style, {
          title: data.title,
          type: data.type,
          thumbnail: data.thumbnail,
          originalimage: data.originalimage,
          description: data.description
        });

        const imgUrl = data.thumbnail?.source || data.originalimage?.source;
        if (imgUrl) {
          console.log('%c[Wikipedia] ✅ 이미지 발견', okStyle, imgUrl);
          testImageLoad('Wikipedia', imgUrl);
        } else {
          console.log('%c[Wikipedia] ❌ 이미지 없음', errStyle, '해당 Wikipedia 페이지에 이미지가 없습니다');
        }

        // f-image 필드 현재값 체크
        const fImg = document.getElementById('f-image');
        if (fImg) {
          console.log('%c[Wikipedia] f-image 현재값:', style,
            fImg.value ? `"${fImg.value}" (이미 값 있으므로 덮어쓰지 않음)` : '(비어있음 → 값 설정됨)'
          );
        }

        return res;
      } catch(e) {
        console.log('%c[Wikipedia] ❌ fetch 오류', errStyle, e.message);
        throw e;
      }
    }

    return origFetch.apply(this, args);
  };

  // 이미지 로드 테스트
  function testImageLoad(source, url) {
    const img = new Image();
    img.onload = () => {
      console.log(`%c[${source}] ✅ 이미지 로드 성공`, okStyle, {
        url: url,
        width: img.naturalWidth,
        height: img.naturalHeight
      });
    };
    img.onerror = () => {
      console.log(`%c[${source}] ❌ 이미지 로드 실패`, errStyle, {
        url: url,
        reason: 'CORS, 404, 또는 서버 차단'
      });
    };
    img.src = url;
  }

  // 미리보기 업데이트 감시
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(m => {
      if (m.target.id === 'img-preview-el' && m.attributeName === 'src') {
        const src = m.target.src;
        console.log('%c[미리보기] src 변경됨', style, src);
      }
      if (m.target.id === 'img-preview' && m.attributeName === 'style') {
        const display = m.target.style.display;
        console.log('%c[미리보기] display 변경됨', style, display === 'none' ? '숨김 (이미지 로드 실패?)' : '표시됨');
      }
    });
  });

  // DOM 준비 후 observer 연결
  function attachObserver() {
    const preview = document.getElementById('img-preview');
    const previewEl = document.getElementById('img-preview-el');
    if (preview) observer.observe(preview, { attributes: true });
    if (previewEl) observer.observe(previewEl, { attributes: true });
  }

  // 게임 추가 모달이 열릴 때 observer 재연결
  const origOpen = window.openAddModal;
  if (origOpen) {
    window.openAddModal = function(...a) {
      const r = origOpen.apply(this, a);
      setTimeout(attachObserver, 200);
      return r;
    };
  }

  // 페이지 로드 시에도 시도
  setTimeout(attachObserver, 1000);

  console.log('%c사용법: 게임 추가 → 게임 이름 입력 → 콘솔(F12)에서 로그 확인', 'color:#888;font-size:11px;');
})();
