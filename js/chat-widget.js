/**
 * ChatWidget — 범용 플로팅 채팅 위젯
 * AI(RAG) 자동 답변 + 텔레그램/알림 상담 연동
 *
 * 사용법:
 *   <script src="/js/chat-widget.js"></script>
 *   ChatWidget.init({
 *     webhookUrl: 'https://xxx/webhook/site-chat',
 *     pollUrl:    'https://xxx/webhook/site-chat-poll',
 *     title: 'AI 상담',
 *     subtitle: 'AI 자동 답변 · 담당자 연결',
 *     greeting: '안녕하세요! 무엇이든 물어보세요.',
 *     accentColor: '#6366f1',       // 기본 보라
 *     accentColorEnd: '#8b5cf6',    // 그라데이션 끝
 *     quickActions: [
 *       { icon: '📞', label: '유선 연락 요청', mode: 'instant',
 *         userMsg: '상담원에게 유선 연락을 요청합니다.',
 *         tgTemplate: '📞 {{name}}님이 유선 연락 요청\n연락처: {{phone}}' },
 *       { icon: '💼', label: '도입 상담 신청', mode: 'input',
 *         inputLabel: '💼 상담 내용을 간략히 적어주세요',
 *         inputPlaceholder: '예: 견적서 자동화 도입 문의',
 *         userMsgPrefix: '도입 상담 신청: ',
 *         tgTemplate: '💼 {{name}}님 도입 상담\n내용: {{desc}}\n연락처: {{phone}}' }
 *     ],
 *     infoFormTitle: '안녕하세요! 상담 시작 전<br>간단한 정보를 입력해주세요.',
 *     systemMsgSent: '담당자에게 전달했습니다. 잠시만 기다려주세요.',
 *     systemMsgQueued: '상담원 배정 후 연락드리겠습니다.',
 *     systemMsgError: '연결에 실패했습니다. 잠시 후 다시 시도해주세요.',
 *     pollInterval: 3000,
 *   });
 */
(function () {
  'use strict';

  const DEFAULTS = {
    webhookUrl: '',
    pollUrl: '',
    pollInterval: 3000,
    title: 'AI 상담',
    subtitle: 'AI 자동 답변 · 담당자 연결',
    greeting: '안녕하세요! 무엇이든 물어보세요.\nAI가 먼저 답변드리고, 필요하면 담당자에게 연결해드립니다.',
    accentColor: '#6366f1',
    accentColorEnd: '#8b5cf6',
    quickActions: [
      {
        icon: '📞', label: '유선 연락 요청', mode: 'instant',
        userMsg: '상담원에게 유선 연락을 요청합니다.',
        tgTemplate: '📞 {{name}}님이 유선 연락을 요청했습니다.\n연락처: {{phone}}'
      },
      {
        icon: '💼', label: '도입 상담 신청', mode: 'input',
        inputLabel: '💼 상담 내용을 간략히 적어주세요',
        inputPlaceholder: '예: 견적서 자동화 도입 문의',
        userMsgPrefix: '도입 상담 신청: ',
        tgTemplate: '💼 {{name}}님이 도입 상담을 신청했습니다.\n내용: {{desc}}\n연락처: {{phone}}'
      }
    ],
    infoFormTitle: '안녕하세요! 상담 시작 전<br>간단한 정보를 입력해주세요.',
    infoFormNameLabel: '이름 *',
    infoFormNamePlaceholder: '홍길동',
    infoFormPhoneLabel: '연락처',
    infoFormPhonePlaceholder: '010-0000-0000',
    infoFormSubmitText: '상담 시작하기',
    infoFormDesc: '입력하신 정보는 상담 목적으로만 사용됩니다.',
    systemMsgSent: '담당자에게 전달했습니다. 잠시만 기다려주세요.',
    systemMsgQueued: '상담원 배정 후 연락드리겠습니다.',
    systemMsgError: '연결에 실패했습니다. 잠시 후 다시 시도해주세요.',
    labelAi: '🤖 AI',
    labelHuman: '👤 담당자',
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

  /* ── Helpers ── */
  function esc(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
  }
  function formatTime(ts) {
    try { return new Date(ts).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }); }
    catch (_) { return ''; }
  }
  function tpl(template, vars) {
    return template.replace(/\{\{(\w+)\}\}/g, function (_, k) { return vars[k] || ''; });
  }

  /* ── CSS ── */
  function injectStyles() {
    if (document.getElementById('cw-styles')) return;
    var ac = _cfg.accentColor;
    var ace = _cfg.accentColorEnd;
    // Parse hex to rgba for shadows
    var r = parseInt(ac.slice(1, 3), 16), g = parseInt(ac.slice(3, 5), 16), b = parseInt(ac.slice(5, 7), 16);
    var s = document.createElement('style');
    s.id = 'cw-styles';
    s.textContent = `
/* Chat Widget Button */
.cw-btn{position:fixed;bottom:2rem;right:2rem;width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,${ac},${ace});color:#fff;border:none;cursor:pointer;z-index:10001;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 24px rgba(${r},${g},${b},.5);transition:transform .2s,box-shadow .2s;font-size:1.6rem}
.cw-btn:hover{transform:translateY(-2px);box-shadow:0 6px 32px rgba(${r},${g},${b},.65)}
.cw-btn.cw-open{transform:rotate(90deg)}
.cw-badge{position:absolute;top:-4px;right:-4px;min-width:20px;height:20px;border-radius:10px;background:#ef4444;color:#fff;font-size:11px;font-weight:700;display:none;align-items:center;justify-content:center;padding:0 5px;line-height:20px}
.cw-badge.show{display:flex}

/* Panel */
.cw-panel{position:fixed;bottom:6.5rem;right:2rem;width:380px;max-height:520px;background:#1a1a2e;border-radius:16px;box-shadow:0 8px 40px rgba(0,0,0,.45);z-index:10001;display:flex;flex-direction:column;overflow:hidden;transform:scale(0);transform-origin:bottom right;opacity:0;transition:transform .25s ease,opacity .2s ease;font-family:'Pretendard',system-ui,sans-serif}
.cw-panel.cw-show{transform:scale(1);opacity:1}

/* Header */
.cw-header{padding:14px 16px;background:linear-gradient(135deg,${ac},${ace});display:flex;align-items:center;justify-content:space-between;flex-shrink:0}
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
.cw-info-input:focus{border-color:rgba(${r},${g},${b},.5)}
.cw-info-input::placeholder{color:rgba(255,255,255,.25)}
.cw-info-desc{color:rgba(255,255,255,.35);font-size:.72rem;text-align:center;margin-top:2px}
.cw-info-btn{padding:12px;border:none;border-radius:10px;background:linear-gradient(135deg,${ac},${ace});color:#fff;font-weight:700;font-size:.9rem;cursor:pointer;transition:opacity .2s}
.cw-info-btn:disabled{opacity:.4;cursor:default}

/* Messages */
.cw-msgs{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;min-height:200px;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.1) transparent}
.cw-msgs::-webkit-scrollbar{width:4px}
.cw-msgs::-webkit-scrollbar-thumb{background:rgba(255,255,255,.15);border-radius:4px}
.cw-msg{max-width:85%;padding:10px 14px;border-radius:14px;font-size:.88rem;line-height:1.5;word-break:break-word;white-space:pre-wrap}
.cw-msg-user{align-self:flex-end;background:linear-gradient(135deg,${ac},${ace});color:#fff;border-bottom-right-radius:4px}
.cw-msg-ai{align-self:flex-start;background:rgba(255,255,255,.08);color:#e2e8f0;border-bottom-left-radius:4px}
.cw-msg-human{align-self:flex-start;background:rgba(16,185,129,.15);color:#6ee7b7;border-bottom-left-radius:4px;border-left:3px solid #10b981}
.cw-msg-system{align-self:center;background:rgba(255,255,255,.05);color:rgba(255,255,255,.5);font-size:.78rem;padding:6px 12px;border-radius:20px}
.cw-msg-label{font-size:.7rem;margin-bottom:2px;opacity:.6}
.cw-msg-time{font-size:.65rem;opacity:.4;margin-top:4px;text-align:right}

/* Typing */
.cw-typing{display:flex;gap:4px;padding:10px 14px;align-self:flex-start}
.cw-typing span{width:6px;height:6px;background:rgba(255,255,255,.3);border-radius:50%;animation:cw-bounce .6s infinite alternate}
.cw-typing span:nth-child(2){animation-delay:.2s}
.cw-typing span:nth-child(3){animation-delay:.4s}
@keyframes cw-bounce{to{opacity:.2;transform:translateY(-4px)}}

/* Quick Actions */
.cw-quick-actions{padding:6px 12px;display:flex;gap:6px;flex-shrink:0;border-top:1px solid rgba(255,255,255,.06)}
.cw-quick-btn{flex:1;padding:8px 6px;border:1px solid rgba(${r},${g},${b},.3);border-radius:8px;background:rgba(${r},${g},${b},.08);color:#a5b4fc;font-size:.78rem;font-weight:600;cursor:pointer;font-family:inherit;transition:background .2s,border-color .2s}
.cw-quick-btn:hover{background:rgba(${r},${g},${b},.18);border-color:rgba(${r},${g},${b},.5)}

/* Quick Input Overlay */
.cw-quick-input{display:none;padding:10px 12px;border-top:1px solid rgba(255,255,255,.06);background:rgba(${r},${g},${b},.06);flex-shrink:0}
.cw-quick-input.cw-active{display:block}
.cw-quick-input-label{color:#a5b4fc;font-size:.78rem;font-weight:600;margin-bottom:6px;display:flex;align-items:center;justify-content:space-between}
.cw-quick-input-label button{background:none;border:none;color:rgba(255,255,255,.4);font-size:.85rem;cursor:pointer;padding:2px 6px}
.cw-quick-input-label button:hover{color:rgba(255,255,255,.7)}
.cw-quick-input-row{display:flex;gap:6px}
.cw-quick-textarea{flex:1;background:rgba(255,255,255,.07);border:1px solid rgba(${r},${g},${b},.3);border-radius:8px;padding:8px 12px;color:#e2e8f0;font-size:.85rem;font-family:inherit;resize:none;outline:none;min-height:36px;max-height:60px}
.cw-quick-textarea:focus{border-color:rgba(${r},${g},${b},.5)}
.cw-quick-textarea::placeholder{color:rgba(255,255,255,.25)}
.cw-quick-send{padding:8px 14px;border:none;border-radius:8px;background:linear-gradient(135deg,${ac},${ace});color:#fff;font-size:.82rem;font-weight:600;cursor:pointer;white-space:nowrap;font-family:inherit}
.cw-quick-send:disabled{opacity:.4;cursor:default}

/* Input */
.cw-input-area{padding:10px 12px;border-top:1px solid rgba(255,255,255,.08);display:flex;gap:8px;flex-shrink:0;background:rgba(0,0,0,.15)}
.cw-input{flex:1;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:10px 14px;color:#e2e8f0;font-size:.88rem;font-family:inherit;resize:none;outline:none;max-height:80px;transition:border-color .2s}
.cw-input:focus{border-color:rgba(${r},${g},${b},.5)}
.cw-input::placeholder{color:rgba(255,255,255,.25)}
.cw-send{width:40px;height:40px;border-radius:10px;border:none;background:linear-gradient(135deg,${ac},${ace});color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:opacity .2s}
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
    var sid = sessionStorage.getItem('cw_session');
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

  /* ── Build Quick Action Buttons HTML ── */
  function buildQuickActionsHtml() {
    if (!_cfg.quickActions || !_cfg.quickActions.length) return '';
    var btns = _cfg.quickActions.map(function (qa, i) {
      return '<button class="cw-quick-btn" data-qa-idx="' + i + '">' + esc(qa.icon + ' ' + qa.label) + '</button>';
    }).join('');
    return '<div class="cw-quick-actions">' + btns + '</div>';
  }

  /* ── Build DOM ── */
  function buildUI() {
    // Floating button
    _btn = document.createElement('button');
    _btn.className = 'cw-btn';
    _btn.setAttribute('aria-label', _cfg.title);
    _btn.innerHTML = '<span>💬</span>';
    _badge = document.createElement('span');
    _badge.className = 'cw-badge';
    _btn.appendChild(_badge);
    document.body.appendChild(_btn);

    // Panel
    _panel = document.createElement('div');
    _panel.className = 'cw-panel';
    _panel.innerHTML =
      '<div class="cw-header">' +
        '<div class="cw-header-left">' +
          '<span class="cw-header-icon">🤖</span>' +
          '<div>' +
            '<div class="cw-header-title">' + esc(_cfg.title) + '</div>' +
            '<div class="cw-header-sub">' + esc(_cfg.subtitle) + '</div>' +
          '</div>' +
        '</div>' +
        '<button class="cw-close" aria-label="닫기">✕</button>' +
      '</div>' +
      '<div class="cw-info-form" id="cw-info-form">' +
        '<div style="color:#e2e8f0;font-size:.9rem;line-height:1.5;margin-bottom:4px">' + _cfg.infoFormTitle + '</div>' +
        '<div class="cw-info-group">' +
          '<label>' + esc(_cfg.infoFormNameLabel) + '</label>' +
          '<input type="text" class="cw-info-input" id="cw-info-name" placeholder="' + esc(_cfg.infoFormNamePlaceholder) + '" required>' +
        '</div>' +
        '<div class="cw-info-group">' +
          '<label>' + esc(_cfg.infoFormPhoneLabel) + '</label>' +
          '<input type="tel" class="cw-info-input" id="cw-info-phone" placeholder="' + esc(_cfg.infoFormPhonePlaceholder) + '">' +
        '</div>' +
        '<button class="cw-info-btn" id="cw-info-submit" disabled>' + esc(_cfg.infoFormSubmitText) + '</button>' +
        '<div class="cw-info-desc">' + esc(_cfg.infoFormDesc) + '</div>' +
      '</div>' +
      '<div class="cw-chat-body" id="cw-chat-body">' +
        '<div class="cw-msgs"></div>' +
        buildQuickActionsHtml() +
        '<div class="cw-quick-input" id="cw-quick-input">' +
          '<div class="cw-quick-input-label">' +
            '<span id="cw-quick-input-title"></span>' +
            '<button id="cw-quick-cancel" title="취소">✕</button>' +
          '</div>' +
          '<div class="cw-quick-input-row">' +
            '<textarea class="cw-quick-textarea" id="cw-quick-text" rows="1"></textarea>' +
            '<button class="cw-quick-send" id="cw-quick-submit" disabled>전송</button>' +
          '</div>' +
        '</div>' +
        '<div class="cw-input-area">' +
          '<textarea class="cw-input" placeholder="메시지를 입력하세요..." rows="1"></textarea>' +
          '<button class="cw-send" disabled aria-label="전송">' +
            '<svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M22 2L11 13"/><path d="M22 2L15 22L11 13L2 9L22 2Z"/></svg>' +
          '</button>' +
        '</div>' +
      '</div>';
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

    // Quick action buttons (data-driven)
    var quickInputPanel = _panel.querySelector('#cw-quick-input');
    var quickInputTitle = _panel.querySelector('#cw-quick-input-title');
    var quickText = _panel.querySelector('#cw-quick-text');
    var quickSubmit = _panel.querySelector('#cw-quick-submit');
    var quickCancel = _panel.querySelector('#cw-quick-cancel');
    var _activeQa = null; // track which quick action opened input

    _panel.querySelectorAll('.cw-quick-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var idx = parseInt(btn.dataset.qaIdx);
        var qa = _cfg.quickActions[idx];
        if (!qa) return;
        var vars = { name: _visitorName, phone: _visitorPhone || '미입력' };

        if (qa.mode === 'instant') {
          doQuickAction(qa.userMsg, tpl(qa.tgTemplate, vars));
        } else if (qa.mode === 'input') {
          _activeQa = qa;
          quickInputTitle.textContent = qa.inputLabel || '';
          quickText.placeholder = qa.inputPlaceholder || '';
          quickText.value = '';
          quickSubmit.disabled = true;
          quickInputPanel.classList.add('cw-active');
          quickText.focus();
        }
      });
    });

    quickText.addEventListener('input', function () {
      quickSubmit.disabled = !quickText.value.trim();
    });
    quickText.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); quickSubmit.click(); }
    });
    quickCancel.addEventListener('click', function () {
      quickInputPanel.classList.remove('cw-active');
      _activeQa = null;
    });
    quickSubmit.addEventListener('click', function () {
      var desc = quickText.value.trim();
      if (!desc || !_activeQa) return;
      quickInputPanel.classList.remove('cw-active');
      var qa = _activeQa;
      _activeQa = null;
      var vars = { name: _visitorName, phone: _visitorPhone || '미입력', desc: desc };
      doQuickAction((qa.userMsgPrefix || '') + desc, tpl(qa.tgTemplate, vars));
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

    if (_infoCollected) showChatView();
  }

  function showChatView() {
    _infoForm.style.display = 'none';
    _panel.querySelector('#cw-chat-body').classList.add('cw-active');
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
      if (_infoCollected) _input.focus();
      else { var ni = _panel.querySelector('#cw-info-name'); if (ni) ni.focus(); }
      scrollBottom();
      startPolling();
    } else {
      stopPolling();
    }
  }

  /* ── Messages ── */
  function addMessage(content, role, time) {
    var wrap = document.createElement('div');
    var cls = 'cw-msg ';
    var label = '';
    if (role === 'user') cls += 'cw-msg-user';
    else if (role === 'human') { cls += 'cw-msg-human'; label = _cfg.labelHuman; }
    else if (role === 'system') cls += 'cw-msg-system';
    else { cls += 'cw-msg-ai'; label = _cfg.labelAi; }
    wrap.className = cls;
    var html = '';
    if (label) html += '<div class="cw-msg-label">' + label + '</div>';
    html += esc(content);
    if (time) html += '<div class="cw-msg-time">' + formatTime(time) + '</div>';
    wrap.innerHTML = html;
    _msgs.appendChild(wrap);
    scrollBottom();
  }

  function showTyping() {
    var el = document.createElement('div');
    el.className = 'cw-typing'; el.id = 'cw-typing';
    el.innerHTML = '<span></span><span></span><span></span>';
    _msgs.appendChild(el); scrollBottom();
  }
  function hideTyping() { var el = document.getElementById('cw-typing'); if (el) el.remove(); }
  function scrollBottom() { requestAnimationFrame(function () { _msgs.scrollTop = _msgs.scrollHeight; }); }

  /* ── Send ── */
  async function send() {
    var text = _input.value.trim();
    if (!text || _isSending) return;
    _isSending = true;
    _sendBtn.disabled = true;
    _input.value = '';
    _input.style.height = 'auto';
    addMessage(text, 'user');
    showTyping();
    try {
      var res = await fetch(_cfg.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: _sessionId, message: text, visitor_name: _visitorName, visitor_phone: _visitorPhone })
      });
      var data = await res.json();
      hideTyping();
      if (data.response) addMessage(data.response, data.role || 'ai');
      if (data.tg_sent) addMessage(_cfg.systemMsgSent, 'system');
      if (data.last_ts) _lastTs = data.last_ts;
      startPolling();
    } catch (err) {
      hideTyping();
      addMessage(_cfg.systemMsgError, 'system');
    }
    _isSending = false;
  }

  /* ── Quick Action ── */
  async function doQuickAction(userMsg, tgText) {
    if (_isSending) return;
    _isSending = true;
    addMessage(userMsg, 'user');
    showTyping();
    try {
      var res = await fetch(_cfg.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: _sessionId, message: tgText, visitor_name: _visitorName, visitor_phone: _visitorPhone, force_human: true })
      });
      var data = await res.json();
      hideTyping();
      addMessage(_cfg.systemMsgQueued, 'system');
      if (data.last_ts) _lastTs = data.last_ts;
      startPolling();
    } catch (err) {
      hideTyping();
      addMessage(_cfg.systemMsgError, 'system');
    }
    _isSending = false;
  }

  /* ── Polling ── */
  function startPolling() {
    if (_pollTimer || !_cfg.pollUrl) return;
    _pollTimer = setInterval(poll, _cfg.pollInterval);
  }
  function stopPolling() { if (_pollTimer) { clearInterval(_pollTimer); _pollTimer = null; } }

  async function poll() {
    if (!_lastTs) return;
    try {
      var url = _cfg.pollUrl + '?session_id=' + encodeURIComponent(_sessionId) + '&after=' + encodeURIComponent(_lastTs);
      var res = await fetch(url);
      var data = await res.json();
      if (data.messages && data.messages.length) {
        data.messages.forEach(function (m) {
          if (m.role === 'human') {
            addMessage(m.content, m.role, m.created_at);
            if (!_isOpen) { _unread++; _badge.textContent = _unread; _badge.classList.add('show'); }
          }
        });
        var last = data.messages[data.messages.length - 1];
        if (last.created_at) _lastTs = last.created_at;
      }
    } catch (_) { /* silent */ }
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
