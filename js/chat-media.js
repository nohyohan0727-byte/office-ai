/**
 * ChatMedia - 이미지 첨부 & 음성인식 공통 모듈
 * 사용법: ChatMedia.init({ inputAreaSelector, textInputSelector, sendBtnSelector, ... })
 */
window.ChatMedia = (function () {
  'use strict';

  // ── State ──
  let _config = {};
  let _images = [];        // [{base64, mime_type, filename}]
  let _recognition = null;
  let _isRecording = false;
  let _recTimer = null;
  let _recSeconds = 0;
  let _finalTranscript = '';
  let _styleInjected = false;

  // ── DOM refs ──
  let _inputArea = null;
  let _textInput = null;
  let _sendBtn = null;
  let _fileInput = null;
  let _previewStrip = null;
  let _attachBtn = null;
  let _micBtn = null;
  let _recIndicator = null;

  // ── SVG Icons ──
  const ICON_ATTACH = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>';
  const ICON_MIC = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>';
  const ICON_MIC_ON = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2" fill="none" stroke-width="2"/><line x1="12" y1="19" x2="12" y2="23" fill="none" stroke-width="2"/><line x1="8" y1="23" x2="16" y2="23" fill="none" stroke-width="2"/></svg>';

  // ── Styles ──
  function injectStyles() {
    if (_styleInjected) return;
    _styleInjected = true;
    const style = document.createElement('style');
    style.textContent = `
      .cm-toolbar{display:flex;align-items:flex-end;gap:0.35rem;}
      .cm-btn{
        width:40px;height:40px;border-radius:10px;
        background:transparent;border:1px solid var(--border, rgba(255,255,255,0.08));
        color:var(--text-dim, #94a3b8);cursor:pointer;
        display:flex;align-items:center;justify-content:center;
        transition:all 0.2s;flex-shrink:0;padding:0;
      }
      .cm-btn:hover{color:var(--text-white, #f8fafc);border-color:rgba(255,255,255,0.2);background:rgba(255,255,255,0.04);}
      .cm-btn.cm-recording{
        background:rgba(239,68,68,0.15);border-color:rgba(239,68,68,0.4);
        color:#ef4444;animation:cm-pulse 1.5s infinite;
      }
      @keyframes cm-pulse{
        0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.4);}
        50%{box-shadow:0 0 0 8px rgba(239,68,68,0);}
      }
      .cm-preview{
        display:flex;gap:0.5rem;padding:0.5rem 0.5rem 0.25rem;
        flex-wrap:wrap;border-bottom:1px solid var(--border, rgba(255,255,255,0.08));
      }
      .cm-preview:empty{display:none;}
      .cm-thumb{
        position:relative;width:64px;height:64px;
        border-radius:8px;overflow:hidden;
        border:1px solid var(--border, rgba(255,255,255,0.08));
        flex-shrink:0;
      }
      .cm-thumb img{width:100%;height:100%;object-fit:cover;display:block;}
      .cm-thumb-remove{
        position:absolute;top:2px;right:2px;
        width:20px;height:20px;border-radius:50%;
        background:rgba(0,0,0,0.7);color:white;
        font-size:12px;border:none;cursor:pointer;
        display:flex;align-items:center;justify-content:center;
        line-height:1;
      }
      .cm-thumb-remove:hover{background:rgba(239,68,68,0.8);}
      .cm-thumb-name{
        position:absolute;bottom:0;left:0;right:0;
        background:rgba(0,0,0,0.6);color:#fff;
        font-size:9px;padding:1px 3px;text-align:center;
        white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
      }
      .cm-rec-indicator{
        display:flex;align-items:center;gap:0.4rem;
        font-size:0.75rem;color:#ef4444;padding:0.25rem 0.5rem;
      }
      .cm-rec-dot{
        width:8px;height:8px;border-radius:50%;
        background:#ef4444;animation:cm-blink 1s infinite;
      }
      @keyframes cm-blink{0%,100%{opacity:1;}50%{opacity:0.3;}}
      .cm-drop-active{
        outline:2px dashed var(--primary, #3b82f6) !important;
        outline-offset:-2px;
        background:rgba(59,130,246,0.05) !important;
      }
      .cm-modal{
        position:fixed;inset:0;background:rgba(0,0,0,0.88);
        display:flex;align-items:center;justify-content:center;
        z-index:99999;cursor:pointer;
      }
      .cm-modal img{max-width:92vw;max-height:92vh;border-radius:8px;object-fit:contain;}
      .cm-bubble-images{display:flex;flex-wrap:wrap;gap:0.4rem;margin-bottom:0.5rem;}
      .cm-bubble-img{
        max-width:260px;max-height:180px;border-radius:8px;
        cursor:pointer;object-fit:cover;
        border:1px solid var(--border, rgba(255,255,255,0.08));
      }
      .cm-hidden{display:none !important;}
      .cm-file-input{position:absolute;width:0;height:0;overflow:hidden;opacity:0;}
    `;
    document.head.appendChild(style);
  }

  // ── Image Utils ──
  function resizeAndConvert(file) {
    return new Promise(function (resolve, reject) {
      var maxDim = 2000;
      var quality = 0.85;
      var reader = new FileReader();
      reader.onerror = reject;
      reader.onload = function () {
        var img = new Image();
        img.onerror = function () { reject(new Error('이미지 로드 실패')); };
        img.onload = function () {
          var w = img.width, h = img.height;
          if (w > maxDim || h > maxDim) {
            var ratio = Math.min(maxDim / w, maxDim / h);
            w = Math.round(w * ratio);
            h = Math.round(h * ratio);
          }
          var canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          var ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          var mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          var base64 = canvas.toDataURL(mime, quality);
          resolve({
            base64: base64,
            mime_type: mime,
            filename: file.name
          });
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function toast(msg, type) {
    if (_config.showToast) {
      _config.showToast(msg, type || 'error');
    }
  }

  // ── Preview Rendering ──
  function renderPreviews() {
    if (!_previewStrip) return;
    _previewStrip.innerHTML = '';
    _images.forEach(function (img, idx) {
      var thumb = document.createElement('div');
      thumb.className = 'cm-thumb';

      var imgEl = document.createElement('img');
      imgEl.src = img.base64;
      imgEl.alt = img.filename;
      thumb.appendChild(imgEl);

      var nameEl = document.createElement('div');
      nameEl.className = 'cm-thumb-name';
      nameEl.textContent = img.filename.length > 12 ? img.filename.slice(0, 10) + '..' : img.filename;
      thumb.appendChild(nameEl);

      var removeBtn = document.createElement('button');
      removeBtn.className = 'cm-thumb-remove';
      removeBtn.textContent = '\u00d7';
      removeBtn.setAttribute('data-idx', idx);
      removeBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        _images.splice(idx, 1);
        renderPreviews();
      });
      thumb.appendChild(removeBtn);

      _previewStrip.appendChild(thumb);
    });
  }

  // ── File Handling ──
  function handleFiles(files) {
    var maxSize = (_config.maxImageSizeMB || 2) * 1024 * 1024;
    var maxCount = _config.maxImages || 3;
    var validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];

    var fileArr = Array.from(files);
    var promises = [];

    for (var i = 0; i < fileArr.length; i++) {
      if (_images.length + promises.length >= maxCount) {
        toast('최대 ' + maxCount + '장까지 첨부할 수 있습니다');
        break;
      }
      var f = fileArr[i];
      if (validTypes.indexOf(f.type) === -1) {
        toast(f.name + ': 지원하지 않는 이미지 형식입니다');
        continue;
      }
      if (f.size > maxSize) {
        toast(f.name + ': ' + (_config.maxImageSizeMB || 2) + 'MB 이하만 가능합니다');
        continue;
      }
      promises.push(resizeAndConvert(f));
    }

    if (promises.length === 0) return;

    Promise.all(promises).then(function (results) {
      results.forEach(function (r) {
        if (_images.length < maxCount) _images.push(r);
      });
      renderPreviews();
    }).catch(function (err) {
      console.error('[ChatMedia]', err);
      toast('이미지 처리 중 오류가 발생했습니다');
    });
  }

  // ── Drag & Drop ──
  function setupDragDrop() {
    if (!_inputArea) return;
    var dragCount = 0;

    _inputArea.addEventListener('dragenter', function (e) {
      e.preventDefault();
      dragCount++;
      _inputArea.classList.add('cm-drop-active');
    });
    _inputArea.addEventListener('dragleave', function (e) {
      e.preventDefault();
      dragCount--;
      if (dragCount <= 0) {
        dragCount = 0;
        _inputArea.classList.remove('cm-drop-active');
      }
    });
    _inputArea.addEventListener('dragover', function (e) {
      e.preventDefault();
    });
    _inputArea.addEventListener('drop', function (e) {
      e.preventDefault();
      dragCount = 0;
      _inputArea.classList.remove('cm-drop-active');
      if (e.dataTransfer && e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    });
  }

  // ── Speech Recognition ──
  function setupSpeechRecognition() {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return false;

    _recognition = new SR();
    _recognition.lang = _config.lang || 'ko-KR';
    _recognition.interimResults = true;
    _recognition.continuous = true;

    _recognition.onresult = function (event) {
      var interim = '';
      for (var i = event.resultIndex; i < event.results.length; i++) {
        var t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          _finalTranscript += t + ' ';
        } else {
          interim += t;
        }
      }
      if (_textInput) {
        var existing = _textInput.getAttribute('data-cm-original') || '';
        _textInput.value = existing + _finalTranscript + interim;
        autoResize(_textInput);
      }
    };

    _recognition.onerror = function (event) {
      switch (event.error) {
        case 'not-allowed':
          toast('마이크 권한이 필요합니다. 브라우저 설정에서 허용해주세요.');
          break;
        case 'no-speech':
          toast('음성이 감지되지 않았습니다. 다시 시도해주세요.');
          break;
        case 'network':
          toast('네트워크 오류로 음성 인식이 실패했습니다.');
          break;
        default:
          toast('음성 인식 오류가 발생했습니다.');
      }
      doStopRecording();
    };

    _recognition.onend = function () {
      if (_isRecording) {
        // auto-restart if still in recording mode (continuous mode may stop)
        try { _recognition.start(); } catch (e) { doStopRecording(); }
      }
    };

    return true;
  }

  function autoResize(el) {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 140) + 'px';
  }

  function startRecording() {
    if (!_recognition || _isRecording) return;
    _isRecording = true;
    _recSeconds = 0;
    _finalTranscript = '';

    // Save current text
    if (_textInput) {
      _textInput.setAttribute('data-cm-original', _textInput.value);
    }

    try {
      _recognition.start();
    } catch (e) {
      _isRecording = false;
      toast('음성 인식을 시작할 수 없습니다.');
      return;
    }

    // Update mic button
    if (_micBtn) {
      _micBtn.classList.add('cm-recording');
      _micBtn.innerHTML = ICON_MIC_ON;
    }

    // Show indicator
    if (_recIndicator) {
      _recIndicator.classList.remove('cm-hidden');
      updateRecTimer();
    }

    _recTimer = setInterval(function () {
      _recSeconds++;
      updateRecTimer();
    }, 1000);
  }

  function updateRecTimer() {
    if (!_recIndicator) return;
    var m = String(Math.floor(_recSeconds / 60)).padStart(2, '0');
    var s = String(_recSeconds % 60).padStart(2, '0');
    _recIndicator.querySelector('.cm-rec-time').textContent = m + ':' + s;
  }

  function doStopRecording() {
    _isRecording = false;
    if (_recTimer) { clearInterval(_recTimer); _recTimer = null; }
    try { if (_recognition) _recognition.stop(); } catch (e) {}

    if (_micBtn) {
      _micBtn.classList.remove('cm-recording');
      _micBtn.innerHTML = ICON_MIC;
    }
    if (_recIndicator) {
      _recIndicator.classList.add('cm-hidden');
    }
    // Clean up original marker
    if (_textInput) {
      _textInput.removeAttribute('data-cm-original');
    }
  }

  function stopRecording() {
    doStopRecording();
  }

  function toggleRecording() {
    if (_isRecording) stopRecording();
    else startRecording();
  }

  // ── UI Creation ──
  function createUI() {
    // 1. Hidden file input
    _fileInput = document.createElement('input');
    _fileInput.type = 'file';
    _fileInput.accept = 'image/*';
    _fileInput.multiple = true;
    _fileInput.className = 'cm-file-input';
    _fileInput.setAttribute('capture', 'environment');
    _fileInput.addEventListener('change', function () {
      if (_fileInput.files.length > 0) {
        handleFiles(_fileInput.files);
        _fileInput.value = '';
      }
    });
    document.body.appendChild(_fileInput);

    // 2. Preview strip - insert above the input area (not inside, to avoid flex row issues)
    _previewStrip = document.createElement('div');
    _previewStrip.className = 'cm-preview';
    _inputArea.parentNode.insertBefore(_previewStrip, _inputArea);

    // 3. Create toolbar with buttons
    _attachBtn = document.createElement('button');
    _attachBtn.type = 'button';
    _attachBtn.className = 'cm-btn';
    _attachBtn.title = '이미지 첨부';
    _attachBtn.innerHTML = ICON_ATTACH;
    _attachBtn.addEventListener('click', function (e) {
      e.preventDefault();
      _fileInput.click();
    });

    // 4. Mic button (conditionally hidden)
    var hasSpeech = setupSpeechRecognition();
    _micBtn = document.createElement('button');
    _micBtn.type = 'button';
    _micBtn.className = 'cm-btn';
    _micBtn.title = hasSpeech ? '음성 입력' : '이 브라우저에서는 음성 인식을 지원하지 않습니다';
    _micBtn.innerHTML = ICON_MIC;
    if (!hasSpeech) {
      _micBtn.classList.add('cm-hidden');
    } else {
      _micBtn.addEventListener('click', function (e) {
        e.preventDefault();
        toggleRecording();
      });
    }

    // 5. Recording indicator
    _recIndicator = document.createElement('div');
    _recIndicator.className = 'cm-rec-indicator cm-hidden';
    _recIndicator.innerHTML = '<span class="cm-rec-dot"></span><span class="cm-rec-time">00:00</span><span>\ub179\uc74c \uc911...</span>';

    // 6. Insert into DOM - strategy depends on existing layout
    insertButtons();

    // 7. Setup drag & drop
    setupDragDrop();
  }

  function insertButtons() {
    // Find the container that holds textarea + send button
    // Insert attach & mic buttons before the textarea (or its wrapper)
    var toolbar = document.createElement('div');
    toolbar.className = 'cm-toolbar';
    toolbar.appendChild(_attachBtn);
    toolbar.appendChild(_micBtn);

    // Detect layout: check if there's a wrapper around textarea
    var inputBox = _textInput.closest('.input-box');
    var row = _textInput.closest('.input-row') || _inputArea;

    if (inputBox) {
      // trustrag layout: .input-row > .input-box > textarea + send-btn
      row.insertBefore(toolbar, inputBox);
    } else {
      // demo layout: .input-area > textarea + sendBtn
      _inputArea.insertBefore(toolbar, _textInput);
    }

    // Insert recording indicator between preview strip and input area
    _inputArea.parentNode.insertBefore(_recIndicator, _inputArea);
  }

  // ── Image Modal ──
  function showImageModal(src) {
    var modal = document.createElement('div');
    modal.className = 'cm-modal';
    var img = document.createElement('img');
    img.src = src;
    modal.appendChild(img);
    modal.addEventListener('click', function () {
      modal.remove();
    });
    document.body.appendChild(modal);
  }

  // ── Render images in chat bubble ──
  function renderBubbleImages(images) {
    if (!images || images.length === 0) return null;
    var wrap = document.createElement('div');
    wrap.className = 'cm-bubble-images';
    images.forEach(function (img) {
      var imgEl = document.createElement('img');
      imgEl.src = img.base64;
      imgEl.alt = img.filename || '';
      imgEl.className = 'cm-bubble-img';
      imgEl.addEventListener('click', function () {
        showImageModal(img.base64);
      });
      wrap.appendChild(imgEl);
    });
    return wrap;
  }

  // ── Paste handler (Ctrl+V image) ──
  function setupPaste() {
    if (!_textInput) return;
    _textInput.addEventListener('paste', function (e) {
      var items = e.clipboardData && e.clipboardData.items;
      if (!items) return;
      var imageFiles = [];
      for (var i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') === 0) {
          var file = items[i].getAsFile();
          if (file) imageFiles.push(file);
        }
      }
      if (imageFiles.length > 0) {
        e.preventDefault();
        handleFiles(imageFiles);
      }
    });
  }

  // ══════════════════════════════════
  // Public API
  // ══════════════════════════════════
  return {
    /**
     * Initialize ChatMedia module
     */
    init: function (options) {
      _config = options || {};
      _images = [];

      _inputArea = document.querySelector(_config.inputAreaSelector);
      _textInput = document.querySelector(_config.textInputSelector);
      _sendBtn = document.querySelector(_config.sendBtnSelector);

      if (!_inputArea || !_textInput) {
        console.error('[ChatMedia] inputArea or textInput not found');
        return;
      }

      injectStyles();
      createUI();
      setupPaste();
    },

    /**
     * Get currently attached images
     * @returns {Array<{base64: string, mime_type: string, filename: string}>}
     */
    getAttachedImages: function () {
      return _images.slice();
    },

    /**
     * Clear all attached images
     */
    clearImages: function () {
      _images = [];
      renderPreviews();
    },

    /**
     * Check if voice recording is active
     */
    isRecording: function () {
      return _isRecording;
    },

    /**
     * Start voice recording
     */
    startRecording: startRecording,

    /**
     * Stop voice recording
     */
    stopRecording: stopRecording,

    /**
     * Show full-screen image modal
     */
    showImageModal: showImageModal,

    /**
     * Render images inside a chat bubble (helper for host page)
     * @param {Array} images - array of {base64, mime_type, filename}
     * @returns {HTMLElement|null}
     */
    renderBubbleImages: renderBubbleImages,

    /**
     * Cleanup
     */
    destroy: function () {
      if (_recognition) { try { _recognition.stop(); } catch (e) {} }
      if (_recTimer) clearInterval(_recTimer);
      if (_fileInput) _fileInput.remove();
      if (_previewStrip) _previewStrip.remove();
      if (_attachBtn) _attachBtn.parentElement.remove(); // remove toolbar
      if (_recIndicator) _recIndicator.remove();
      _images = [];
      _isRecording = false;
    }
  };
})();
