/**
 * Office-AI 홈페이지 채팅 위젯
 * - AI(RAG) 자동 답변 + 텔레그램 상담 연동
 * - 방문자 이름/연락처 수집 후 채팅 시작
 * - 사용법: ChatWidget.init({ webhookUrl, pollUrl })
 */
(function () {
  'use strict';

  const DEFAULTS = {
    webhookUrl: '',
    pollUrl: '',
    pollInterval: 3000,
    title: 'AI 상담',
    greeting: '안녕하세요! 무엇이든 물어보세요.\nAI가 먼저 답변드리고, 필요하면 담당자에게 연결해드립니다.',
  };

  let _cfg = {};
  let _sessionId = '';
  let _lastTs = '';
  let _pollTimer = null;
  let _isOpen = false;
  let _isSending = false;
  let _unread = 0;
  let _visitorName = '';
  let _visitorPhone = '';
  let _infoCollected = false;

  // DOM refs
  let _btn, _panel, _msgs, _input, _sendBtn, _badge, _infoForm;

  /* ── CSS ── */
  function injectStyles() {
    if (document.getElementById('cw-styles')) return;
    const s = document.createElement('style');
    s.id = 'cw-styles';
    s.textContent = `
/* Chat Widget Button */
.cw-btn{position:fixed;bottom:2rem;right:2rem;width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;border:none;cursor:pointer;z-index:10001;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 24px rgba(99,102,241,.5);transition:transform .2s,box-shadow .2s;font-size:1.6rem}
.cw-btn:hover{transform:translateY(-2px);box-shadow:0 6px 32px rgba(99,102,241,.65)}
.cw-btn.cw-open{transform:rotate(90deg)}
.cw-badge{position:absolute;top:-4px;right:-4px;min-width:20px;height:20px;border-radius:10px;background:#ef4444;color:#fff;font-size:11px;font-weight:700;display:none;align-items:center;justify-content:center;padding:0 5px;line-height:20px}
.cw-badge.show{display:flex}

/* Panel */
.cw-panel{position:fixed;bottom:6.5rem;right:2rem;width:380px;max-height:520px;background:#1a1a2e;border-radius:16px;box-shadow:0 8px 40px rgba(0,0,0,.45);z-index:10001;display:flex;flex-direction:column;overflow:hidden;transform:scale(0);transform-origin:bottom right;opacity:0;transition:transform .25s ease,opacity .2s ease;font-family:'Pretendard',system-ui,sans-serif}
.cw-panel.cw-show{transform:scale(1);opacity:1}

/* Header */
.cw-header{padding:14px 16px;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:space-between;flex-shrink:0}
.cw-header-left{display:flex;align-items:center;gap:8px}
.cw-header-icon{font-size:1.2rem}
.cw-header-title{color:#fff;font-weight:700;font-size:.95rem}
.cw-header-sub{color:rgba(255,255,255,.7);font-size:.7rem}
.cw-close{background:none;border:none;color:rgba(255,255,255,.8);font-size:1.3rem;cursor:pointer;padding:4px 8px;border-radius:6px}
.cw-close:hover{background:rgba(255,255,255,.15)}

/* Info Form */
.cw-info-form{padding:20px 16px;display:flex;flex-direction:column;gap:12px}
.cw-info-form label{color:rgba(255,255,255,.6);font-size:.75rem;font-weight:600;margin-bottom:2px}
.cw-info-group{display:flex;flex-direction:column;gap:4px}
.cw-info-input{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:10px;padding:10px 14px;color:#e2e8f0;font-size:.88rem;font-family:inherit;outline:none;transition:border-color .2s}
.cw-info-input:focus{border-color:rgba(99,102,241,.5)}
.cw-info-input::placeholder{color:rgba(255,255,255,.25)}
.cw-info-desc{color:rgba(255,255,255,.35);font-size:.72rem;text-align:center;margin-top:2px}
.cw-info-btn{padding:12px;border:none;border-radius:10px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;font-weight:700;font-size:.9rem;cursor:pointer;transition:opacity .2s}
.cw-info-btn:disabled{opacity:.4;cursor:default}

/* Messages */
.cw-msgs{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;min-height:200px;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.1) transparent}
.cw-msgs::-webkit-scrollbar{width:4px}
.cw-msgs::-webkit-scrollbar-thumb{background:rgba(255,255,255,.15);border-radius:4px}

.cw-msg{max-width:85%;padding:10px 14px;border-radius:14px;font-size:.88rem;line-height:1.5;word-break:break-word;white-space:pre-wrap}
.cw-msg-user{align-self:flex-end;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;border-bottom-right-radius:4px}
.cw-msg-ai{align-self:flex-start;background:rgba(255,255,255,.08);color:#e2e8f0;border-bottom-left-radius:4px}
.cw-msg-human{align-self:flex-start;background:rgba(16,185,129,.15);color:#6ee7b7;border-bottom-left-radius:4px;border-left:3px solid #10b981}
.cw-msg-system{align-self:center;background:rgba(255,255,255,.05);color:rgba(255,255,255,.5);font-size:.78rem;padding:6px 12px;border-radius:20px}

.cw-msg-label{font-size:.7rem;margin-bottom:2px;opacity:.6}
.cw-msg-time{font-size:.65rem;opacity:.4;margin-top:4px;text-align:right}

/* Typing indicator */
.cw-typing{display:flex;gap:4px;padding:10px 14px;align-self:flex-start}
.cw-typing span{width:6px;height:6px;background:rgba(255,255,255,.3);border-radius:50%;animation:cw-bounce .6s infinite alternate}
.cw-typing span:nth-child(2){animation-delay:.2s}
.cw-typing span:nth-child(3){animation-delay:.4s}
@keyframes cw-bounce{to{opacity:.2;transform:translateY(-4px)}}

/* Quick Actions */
.cw-quick-actions{padding:6px 12px;display:flex;gap:6px;flex-shrink:0;border-top:1px solid rgba(255,255,255,.06)}
.cw-quick-btn{flex:1;padding:8px 6px;border:1px solid rgba(99,102,241,.3);border-radius:8px;background:rgba(99,102,241,.08);color:#a5b4fc;font-size:.78rem;font-weight:600;cursor:pointer;font-family:inherit;transition:background .2s,border-color .2s}
.cw-quick-btn:hover{background:rgba(99,102,241,.18);border-color:rgba(99,102,241,.5)}

/* Input */
.cw-input-area{padding:10px 12px;border-top:1px solid rgba(255,255,255,.08);display:flex;gap:8px;flex-shrink:0;background:rgba(0,0,0,.15)}
.cw-input{flex:1;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:10px 14px;color:#e2e8f0;font-size:.88rem;font-family:inherit;resize:none;outline:none;max-height:80px;transition:border-color .2s}
.cw-input:focus{border-color:rgba(99,102,241,.5)}
.cw-input::placeholder{color:rgba(255,255,255,.25)}
.cw-send{width:40px;height:40px;border-radius:10px;border:none;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:opacity .2s}
.cw-send:disabled{opacity:.4;cursor:default}
.cw-send svg{width:18px;height:18px}

.cw-chat-body{display:none;flex-direction:column;flex:1;overflow:hidden}
.cw-chat-body.cw-active{display:flex}

/* Mobile */
@media(max-width:480px){
  .cw-panel{bottom:0;right:0;left:0;width:100%;max-height:100dvh;border-radius:0}
  .cw-btn{bottom:1.2rem;right:1.2rem;width:54px;height:54px;font-size:1.4rem}
}
`;
    document.head.appendChild(s);
  }

  /* ── Session ── */
  function getSession() {
    let sid = sessionStorage.getItem('cw_session');
    if (!sid) {
      sid = 'cw-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
      sessionStorage.setItem('cw_session', sid);
    }
    return sid;
  }

  function loadVisitorInfo() {
    _visitorName = sessionStorage.getItem('cw_name') || '';
    _visitorPhone = sessionStorage.getItem('cw_phone') || '';
    _infoCollected = !!_visitorName;
  }

  function saveVisitorInfo(name, phone) {
    _visitorName = name;
    _visitorPhone = phone;
    _infoCollected = true;
    sessionStorage.setItem('cw_name', name);
    sessionStorage.setItem('cw_phone', phone);
  }

  /* ── Build DOM ── */
  function buildUI() {
    // Floating button
    _btn = document.createElement('button');
    _btn.className = 'cw-btn';
    _btn.setAttribute('aria-label', '채팅 상담');
    _btn.innerHTML = '<span>💬</span>';
    _badge = document.createElement('span');
    _badge.className = 'cw-badge';
    _btn.appendChild(_badge);
    document.body.appendChild(_btn);

    // Panel
    _panel = document.createElement('div');
    _panel.className = 'cw-panel';
    _panel.innerHTML = `
      <div class="cw-header">
        <div class="cw-header-left">
          <span class="cw-header-icon">🤖</span>
          <div>
            <div class="cw-header-title">${_cfg.title}</div>
            <div class="cw-header-sub">AI 자동 답변 · 담당자 연결</div>
          </div>
        </div>
        <button class="cw-close" aria-label="닫기">✕</button>
      </div>
      <div class="cw-info-form" id="cw-info-form">
        <div style="color:#e2e8f0;font-size:.9rem;line-height:1.5;margin-bottom:4px">
          안녕하세요! 상담 시작 전<br>간단한 정보를 입력해주세요.
        </div>
        <div class="cw-info-group">
          <label>이름 *</label>
          <input type="text" class="cw-info-input" id="cw-info-name" placeholder="홍길동" required>
        </div>
        <div class="cw-info-group">
          <label>연락처</label>
          <input type="tel" class="cw-info-input" id="cw-info-phone" placeholder="010-0000-0000">
        </div>
        <button class="cw-info-btn" id="cw-info-submit" disabled>상담 시작하기</button>
        <div class="cw-info-desc">입력하신 정보는 상담 목적으로만 사용됩니다.</div>
      </div>
      <div class="cw-chat-body" id="cw-chat-body">
        <div class="cw-msgs"></div>
        <div class="cw-quick-actions">
          <button class="cw-quick-btn" data-action="call">📞 유선 연락 요청</button>
          <button class="cw-quick-btn" data-action="consult">💼 도입 상담 신청</button>
        </div>
        <div class="cw-input-area">
          <textarea class="cw-input" placeholder="메시지를 입력하세요..." rows="1"></textarea>
          <button class="cw-send" disabled aria-label="전송">
            <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M22 2L11 13"/><path d="M22 2L15 22L11 13L2 9L22 2Z"/></svg>
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(_panel);

    _infoForm = _panel.querySelector('#cw-info-form');
    var chatBody = _panel.querySelector('#cw-chat-body');
    _msgs = chatBody.querySelector('.cw-msgs');
    _input = chatBody.querySelector('.cw-input');
    _sendBtn = chatBody.querySelector('.cw-send');

    // Info form events
    var nameInput = _panel.querySelector('#cw-info-name');
    var phoneInput = _panel.querySelector('#cw-info-phone');
    var infoSubmitBtn = _panel.querySelector('#cw-info-submit');

    nameInput.addEventListener('input', function () {
      infoSubmitBtn.disabled = !nameInput.value.trim();
    });

    infoSubmitBtn.addEventListener('click', function () {
      var name = nameInput.value.trim();
      var phone = phoneInput.value.trim();
      if (!name) return;
      saveVisitorInfo(name, phone);
      showChatView();
    });

    nameInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); phoneInput.focus(); }
    });
    phoneInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); infoSubmitBtn.click(); }
    });

    // Quick action buttons
    _panel.querySelectorAll('.cw-quick-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var action = btn.dataset.action;
        if (action === 'call') {
          quickAction('상담원에게 유선 연락을 요청합니다.', '📞 ' + _visitorName + '님이 유선 연락을 요청했습니다.\n연락처: ' + (_visitorPhone || '미입력'));
        } else if (action === 'consult') {
          quickAction('도입 상담을 신청합니다.', '💼 ' + _visitorName + '님이 도입 상담을 신청했습니다.\n연락처: ' + (_visitorPhone || '미입력'));
        }
      });
    });

    // Chat events
    _btn.addEventListener('click', toggle);
    _panel.querySelector('.cw-close').addEventListener('click', toggle);
    _sendBtn.addEventListener('click', send);
    _input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
    });
    _input.addEventListener('input', function () {
      _sendBtn.disabled = !_input.value.trim();
      _input.style.height = 'auto';
      _input.style.height = Math.min(_input.scrollHeight, 80) + 'px';
    });

    // If info already collected, go straight to chat
    if (_infoCollected) {
      showChatView();
    }
  }

  function showChatView() {
    _infoForm.style.display = 'none';
    var chatBody = _panel.querySelector('#cw-chat-body');
    chatBody.classList.add('cw-active');
    addMessage(_cfg.greeting, 'ai');
    _input.focus();
  }

  /* ── Toggle ── */
  function toggle() {
    _isOpen = !_isOpen;
    _panel.classList.toggle('cw-show', _isOpen);
    _btn.classList.toggle('cw-open', _isOpen);
    if (_isOpen) {
      _unread = 0;
      _badge.classList.remove('show');
      if (_infoCollected) {
        _input.focus();
      } else {
        var nameInput = _panel.querySelector('#cw-info-name');
        if (nameInput) nameInput.focus();
      }
      scrollBottom();
      startPolling();
    } else {
      stopPolling();
    }
  }

  /* ── Messages ── */
  function addMessage(content, role, time) {
    const wrap = document.createElement('div');
    let cls = 'cw-msg ';
    let label = '';
    if (role === 'user') { cls += 'cw-msg-user'; }
    else if (role === 'human') { cls += 'cw-msg-human'; label = '👤 담당자'; }
    else if (role === 'system') { cls += 'cw-msg-system'; }
    else { cls += 'cw-msg-ai'; label = '🤖 AI'; }

    wrap.className = cls;
    let html = '';
    if (label) html += '<div class="cw-msg-label">' + label + '</div>';
    html += escapeHtml(content);
    if (time) html += '<div class="cw-msg-time">' + formatTime(time) + '</div>';
    wrap.innerHTML = html;
    _msgs.appendChild(wrap);
    scrollBottom();
  }

  function showTyping() {
    const el = document.createElement('div');
    el.className = 'cw-typing';
    el.id = 'cw-typing';
    el.innerHTML = '<span></span><span></span><span></span>';
    _msgs.appendChild(el);
    scrollBottom();
  }
  function hideTyping() {
    const el = document.getElementById('cw-typing');
    if (el) el.remove();
  }

  function scrollBottom() {
    requestAnimationFrame(function () {
      _msgs.scrollTop = _msgs.scrollHeight;
    });
  }

  /* ── Send ── */
  async function send() {
    const text = _input.value.trim();
    if (!text || _isSending) return;

    _isSending = true;
    _sendBtn.disabled = true;
    _input.value = '';
    _input.style.height = 'auto';

    addMessage(text, 'user');
    showTyping();

    try {
      const payload = {
        session_id: _sessionId,
        message: text,
        visitor_name: _visitorName,
        visitor_phone: _visitorPhone
      };
      const res = await fetch(_cfg.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      hideTyping();

      if (data.response) {
        addMessage(data.response, data.role || 'ai');
      }
      if (data.tg_sent) {
        addMessage('담당자에게 전달했습니다. 잠시만 기다려주세요.', 'system');
      }
      // Update last_ts to prevent duplicate from polling
      if (data.last_ts) {
        _lastTs = data.last_ts;
      }
      startPolling();
    } catch (err) {
      hideTyping();
      addMessage('연결에 실패했습니다. 잠시 후 다시 시도해주세요.', 'system');
    }

    _isSending = false;
  }

  /* ── Quick Action ── */
  async function quickAction(userMsg, tgText) {
    if (_isSending) return;
    _isSending = true;

    addMessage(userMsg, 'user');
    showTyping();

    try {
      const res = await fetch(_cfg.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: _sessionId,
          message: tgText,
          visitor_name: _visitorName,
          visitor_phone: _visitorPhone,
          force_human: true
        })
      });
      const data = await res.json();
      hideTyping();
      addMessage('상담원 배정 후 연락드리겠습니다.', 'system');
      if (data.last_ts) _lastTs = data.last_ts;
      startPolling();
    } catch (err) {
      hideTyping();
      addMessage('연결에 실패했습니다. 잠시 후 다시 시도해주세요.', 'system');
    }
    _isSending = false;
  }

  /* ── Polling ── */
  function startPolling() {
    if (_pollTimer) return;
    if (!_cfg.pollUrl) return;
    _pollTimer = setInterval(poll, _cfg.pollInterval);
  }
  function stopPolling() {
    if (_pollTimer) { clearInterval(_pollTimer); _pollTimer = null; }
  }

  async function poll() {
    if (!_lastTs) return;
    try {
      const url = _cfg.pollUrl + '?session_id=' + encodeURIComponent(_sessionId) + '&after=' + encodeURIComponent(_lastTs);
      const res = await fetch(url);
      const data = await res.json();
      if (data.messages && data.messages.length) {
        // Only show human replies (ai messages are already shown from webhook response)
        data.messages.forEach(function (m) {
          if (m.role === 'human') {
            addMessage(m.content, m.role, m.created_at);
            if (!_isOpen) {
              _unread++;
              _badge.textContent = _unread;
              _badge.classList.add('show');
            }
          }
        });
        // Always update last_ts to latest message
        const last = data.messages[data.messages.length - 1];
        if (last.created_at) _lastTs = last.created_at;
      }
    } catch (_) { /* silent */ }
  }

  /* ── Helpers ── */
  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
  }
  function formatTime(ts) {
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    } catch (_) { return ''; }
  }

  /* ── Public API ── */
  window.ChatWidget = {
    init: function (opts) {
      _cfg = Object.assign({}, DEFAULTS, opts);
      _sessionId = getSession();
      _lastTs = new Date().toISOString();
      loadVisitorInfo();
      injectStyles();
      buildUI();
    }
  };
})();
