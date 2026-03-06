// Dev Console - Smart Chat (AI 코드 생성 + 업무 지시 + 파일 저장)

let chatSessionId = 'dc-' + Date.now();
let chatSending = false;
let codeBlockCounter = 0;

// --- 업무 지시 패턴 매칭 ---
const CHAT_COMMANDS = [
  { patterns: ['git status', '깃 상태', 'git 상태', '상태 확인', '변경 파일'], cmdId: 'git-status', label: 'Git Status' },
  { patterns: ['git log', '최근 커밋', '커밋 내역', '커밋 로그', '깃 로그'], cmdId: 'git-log', label: 'Git Log' },
  { patterns: ['git diff', '변경사항', '수정 내용', '뭐 바뀌었', '차이점'], cmdId: 'git-diff', label: 'Git Diff' },
  { patterns: ['서버 재시작', '리스타트', 'restart server', '서버 다시', '재시작해'], cmdId: 'pm2-restart', label: 'PM2 Restart' },
  { patterns: ['서버 로그', '로그 확인', '로그 보여', 'pm2 log', '에러 로그'], cmdId: 'pm2-logs', label: 'PM2 Logs' },
  { patterns: ['프로세스', 'pm2 list', 'pm2 상태', '서버 상태', '실행 중'], cmdId: 'pm2-list', label: 'PM2 List' },
  { patterns: ['npm test', '테스트 실행', '테스트 돌려', 'test 실행'], cmdId: 'npm-test', label: 'npm test' },
  { patterns: ['tailscale', '테일스케일', 'vpn 상태'], cmdId: 'tailscale-status', label: 'Tailscale Status' },
  { patterns: ['되돌리기', 'revert', '롤백', '커밋 취소'], cmdId: 'git-revert-last', label: 'Revert Last Commit' },
];

// --- 개발 요청 감지 ---
function isDevRequest(msg) {
  return /만들어|생성해|구현해|개발해|코딩해|작성해|짜줘|짜 줘|build|create|make|implement|write.*code/i.test(msg);
}

function detectCommand(msg) {
  const lower = msg.toLowerCase();
  for (const cmd of CHAT_COMMANDS) {
    if (cmd.patterns.some(p => lower.includes(p))) return cmd;
  }
  return null;
}

function detectFileRequest(msg) {
  if (/파일\s*(목록|보여|트리|리스트)|file\s*(list|tree)/i.test(msg)) return 'tree';
  const m1 = msg.match(/[\"'`]?([a-zA-Z0-9._\-/]+\.[a-zA-Z]{1,5})[\"'`]?\s*(열어|보여|읽어|내용|확인)/);
  if (m1) return m1[1];
  const m2 = msg.match(/(열어|보여|읽어|내용|확인)\s*[\"'`]?([a-zA-Z0-9._\-/]+\.[a-zA-Z]{1,5})[\"'`]?/);
  if (m2) return m2[2];
  return null;
}

async function sendChat() {
  const input = document.getElementById('chat-input');
  const msg = input.value.trim();
  if (!msg || chatSending) return;

  chatSending = true;
  input.value = '';
  input.style.height = 'auto';
  appendMessage('user', msg);

  // 1. 서버 명령어 감지
  const cmd = detectCommand(msg);
  if (cmd) { await handleCommand(cmd); chatSending = false; return; }

  // 2. 파일 조회 감지
  const fileReq = detectFileRequest(msg);
  if (fileReq) { await handleFileRequest(fileReq); chatSending = false; return; }

  // 3. AI에 보내기 (개발 요청이면 코드 생성 지시 추가)
  showTyping();
  try {
    let aiMsg = msg;
    if (isDevRequest(msg)) {
      aiMsg = msg + '\n\n[시스템 지시: 코드를 생성할 때 반드시 각 파일마다 코드블록 위에 `📁 파일명: path/filename.ext` 형식으로 파일 경로를 표시하세요. 완전한 실행 가능한 코드를 작성하세요. HTML 파일은 CDN 라이브러리를 활용하세요.]';
    }

    const webhookUrl = CONFIG.N8N_WEBHOOK + '/rag-category-chat';
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: CONFIG.RAG_API_KEY,
        session_id: chatSessionId,
        message: aiMsg,
        category: 'admin_upload',
      }),
    });
    const text = await res.text();
    hideTyping();

    if (!text) {
      appendMessage('bot', 'n8n에서 빈 응답. 실행 로그를 확인하세요.', null, true);
      chatSending = false;
      return;
    }

    let data;
    try { data = JSON.parse(text); } catch {
      appendMessage('bot', `응답 파싱 에러: ${text.substring(0, 200)}`, null, true);
      chatSending = false;
      return;
    }

    if (data.success !== false && (data.response || data.output)) {
      const response = data.response || data.output;
      appendMessage('bot', response, data.sources, false, isDevRequest(msg));
      if (data.tokens_remaining !== undefined) {
        toast(`Tokens: ${data.tokens_remaining}`, 'info');
      }
    } else {
      appendMessage('bot', data.error || data.message || 'No response received.', null, true);
    }
  } catch (e) {
    hideTyping();
    appendMessage('bot', `Connection error: ${e.message}`, null, true);
  }

  chatSending = false;
}

// --- 명령어 실행 ---
async function handleCommand(cmd) {
  appendMessage('bot', `**${cmd.label}** 실행 중...`);
  try {
    const data = await apiPost('/api/mobile/exec', { commandId: cmd.cmdId, project: currentProject });
    const output = data.output || '(출력 없음)';
    const status = data.success ? '완료' : '오류';
    appendMessage('bot', `**${cmd.label}** (${status})\n\`\`\`\n${output}\n\`\`\``);
  } catch (e) {
    if (e.message === 'Unauthorized') { appendMessage('bot', '인증 만료. 다시 로그인하세요.', null, true); return; }
    appendMessage('bot', `명령 실행 실패: ${e.message}`, null, true);
  }
}

// --- 파일 조회 ---
async function handleFileRequest(fileReq) {
  try {
    if (fileReq === 'tree') {
      const data = await apiGet(`/api/mobile/files?project=${currentProject}`);
      appendMessage('bot', `**${currentProject}** 파일 구조:\n\`\`\`\n${renderTreeText(data.tree, 0)}\n\`\`\``);
    } else {
      const data = await apiGet(`/api/mobile/files/${currentProject}/${fileReq}`);
      if (data.error) { appendMessage('bot', `파일 없음: ${fileReq}`, null, true); return; }
      const ext = fileReq.split('.').pop();
      appendMessage('bot', `**${fileReq}**\n\`\`\`${ext}\n${data.content?.substring(0, 3000) || ''}\n\`\`\``);
    }
  } catch (e) { appendMessage('bot', `파일 조회 실패: ${e.message}`, null, true); }
}

function renderTreeText(nodes, depth) {
  let r = '';
  for (const n of nodes) {
    r += '  '.repeat(depth) + (n.type === 'dir' ? '📁 ' : '📄 ') + n.name + '\n';
    if (n.children) r += renderTreeText(n.children, depth + 1);
  }
  return r;
}

// --- 코드블록에서 파일 저장 ---
async function saveCodeToFile(blockId) {
  const block = document.getElementById(blockId);
  if (!block) return;

  const code = block.querySelector('code')?.textContent || '';
  const btn = block.querySelector('.save-file-btn');

  // 파일명 입력 프롬프트
  const suggested = block.dataset.filename || '';
  const filePath = prompt('저장할 파일 경로 (프로젝트 루트 기준):', suggested);
  if (!filePath) return;

  btn.textContent = '저장 중...';
  btn.disabled = true;

  try {
    const data = await apiPost('/api/mobile/files/write', {
      project: currentProject,
      filePath: filePath,
      content: code,
      commitMessage: `Chat-generated: ${filePath}`,
    });
    if (data.success) {
      btn.textContent = '저장 완료';
      btn.classList.replace('bg-blue-600', 'bg-emerald-600');
      toast(`${filePath} 저장 + 커밋 완료`, 'success');
    } else {
      btn.textContent = '저장 실패';
      toast(data.error || '저장 실패', 'error');
    }
  } catch (e) {
    btn.textContent = '저장 실패';
    toast(e.message, 'error');
  }

  setTimeout(() => {
    btn.textContent = '📁 파일로 저장';
    btn.disabled = false;
    btn.classList.replace('bg-emerald-600', 'bg-blue-600');
  }, 3000);
}

// --- 전체 코드블록 일괄 저장 ---
async function saveAllCodeBlocks() {
  const blocks = document.querySelectorAll('.code-saveable');
  let saved = 0;
  for (const block of blocks) {
    const filename = block.dataset.filename;
    if (!filename) continue;
    const code = block.querySelector('code')?.textContent || '';
    try {
      const data = await apiPost('/api/mobile/files/write', {
        project: currentProject,
        filePath: filename,
        content: code,
        commitMessage: `Chat-generated: ${filename}`,
      });
      if (data.success) saved++;
    } catch (e) { /* skip */ }
  }
  if (saved > 0) toast(`${saved}개 파일 저장 완료`, 'success');
  else toast('저장할 파일이 없습니다', 'error');
}

// --- 메시지 표시 ---
function appendMessage(role, content, sources, isError, isDevResponse) {
  const container = document.getElementById('chat-messages');
  if (container.querySelector('.flex.flex-col.items-center')) container.innerHTML = '';

  const msgDiv = document.createElement('div');
  msgDiv.className = role === 'user' ? 'flex justify-end' : 'flex justify-start';

  const bubble = document.createElement('div');
  bubble.className = role === 'user'
    ? 'max-w-[85%] bg-blue-600/15 border border-blue-500/20 rounded-2xl rounded-tr-sm px-4 py-3 text-sm'
    : `max-w-[85%] bg-slate-800/50 border ${isError ? 'border-red-500/30' : 'border-slate-700/50'} rounded-2xl rounded-tl-sm px-4 py-3 text-sm`;

  if (role === 'bot') {
    let html = DOMPurify.sanitize(marked.parse(content));

    // 코드블록에 "파일로 저장" 버튼 추가
    if (isDevResponse) {
      html = addSaveButtons(html, content);
    }

    bubble.innerHTML = `<div class="msg-content prose prose-invert prose-sm max-w-none">${html}</div>`;
    bubble.querySelectorAll('pre code').forEach(block => Prism.highlightElement(block));
  } else {
    bubble.textContent = content;
  }

  msgDiv.appendChild(bubble);
  container.appendChild(msgDiv);

  // 전체 저장 버튼
  if (isDevResponse && bubble.querySelectorAll('.code-saveable').length > 1) {
    const allBtn = document.createElement('div');
    allBtn.className = 'flex justify-start mt-1 ml-1';
    allBtn.innerHTML = `<button onclick="saveAllCodeBlocks()" class="text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg transition-colors">
      📦 전체 파일 저장 (${bubble.querySelectorAll('.code-saveable').length}개)</button>`;
    container.appendChild(allBtn);
  }

  // Sources
  if (sources && sources.length > 0) {
    const srcDiv = document.createElement('div');
    srcDiv.className = 'flex flex-wrap gap-1 mt-1 ml-1';
    sources.forEach(s => {
      const tag = document.createElement('span');
      tag.className = 'text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700';
      tag.textContent = s.file_name || s.filename || s.metadata?.file_path || 'source';
      if (s.similarity) tag.textContent += ` ${Math.round(s.similarity * 100)}%`;
      srcDiv.appendChild(tag);
    });
    container.appendChild(srcDiv);
  }

  container.scrollTop = container.scrollHeight;
}

// --- 코드블록에 저장 버튼 삽입 ---
function addSaveButtons(html, rawContent) {
  // 원본 마크다운에서 "📁 파일명: xxx" 패턴 추출
  const fileNames = [];
  const lines = rawContent.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/📁\s*파일명?[:\s]+(.+)/i) ||
              lines[i].match(/파일[:\s]*`([^`]+)`/i) ||
              lines[i].match(/(?:file|filename)[:\s]+`?([a-zA-Z0-9._\-/]+\.[a-zA-Z]{1,5})`?/i);
    if (m) fileNames.push(m[1].trim());
  }

  // 코드블록마다 저장 버튼 추가
  let blockIdx = 0;
  return html.replace(/<pre><code([^>]*)>([\s\S]*?)<\/code><\/pre>/g, (match, attrs, code) => {
    const blockId = `code-block-${++codeBlockCounter}`;
    const filename = fileNames[blockIdx] || '';
    blockIdx++;
    const filenameDisplay = filename ? `<span class="text-slate-400 text-[10px] ml-2">${filename}</span>` : '';
    return `<div id="${blockId}" class="code-saveable relative group" data-filename="${filename}">
      <div class="flex items-center justify-between bg-slate-900 px-3 py-1 rounded-t-lg border border-slate-700 border-b-0">
        <span class="text-[10px] text-slate-500">CODE${filenameDisplay}</span>
        <button onclick="saveCodeToFile('${blockId}')" class="save-file-btn text-[10px] bg-blue-600 hover:bg-blue-500 text-white px-2 py-0.5 rounded transition-colors">📁 파일로 저장</button>
      </div>
      <pre class="!mt-0 !rounded-t-none"><code${attrs}>${code}</code></pre>
    </div>`;
  });
}

function showTyping() {
  const container = document.getElementById('chat-messages');
  const typing = document.createElement('div');
  typing.id = 'typing-indicator';
  typing.className = 'flex justify-start';
  typing.innerHTML = `
    <div class="bg-slate-800/50 border border-slate-700/50 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1">
      <div class="w-2 h-2 rounded-full bg-slate-400 typing-dot"></div>
      <div class="w-2 h-2 rounded-full bg-slate-400 typing-dot"></div>
      <div class="w-2 h-2 rounded-full bg-slate-400 typing-dot"></div>
    </div>`;
  container.appendChild(typing);
  container.scrollTop = container.scrollHeight;
}

function hideTyping() {
  const el = document.getElementById('typing-indicator');
  if (el) el.remove();
}

document.getElementById('chat-input')?.addEventListener('input', function() {
  this.style.height = 'auto';
  this.style.height = Math.min(this.scrollHeight, 120) + 'px';
});
