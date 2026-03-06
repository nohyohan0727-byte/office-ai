// Dev Console - Manager Proxy Module

async function loadManager() {
  try {
    const [promptsData, memoryData] = await Promise.all([
      apiGet('/api/prompts'),
      apiGet('/api/memory'),
    ]);

    // Stats
    document.getElementById('mgr-prompt-count').textContent = promptsData.prompts?.length || 0;
    document.getElementById('mgr-memory-count').textContent = memoryData.files?.length || 0;

    // Memory files list
    const memList = document.getElementById('mgr-memory-list');
    memList.innerHTML = '';
    (memoryData.files || []).forEach(f => {
      const div = document.createElement('div');
      div.className = 'bg-dc-card border border-dc-border rounded-lg p-3 flex items-center justify-between cursor-pointer hover:border-blue-500/30 transition-colors';
      div.innerHTML = `
        <div>
          <div class="text-sm font-medium">${f.name}</div>
          <div class="text-xs text-slate-500">${f.exists ? formatSize(f.size) : 'Not created'}</div>
        </div>
        <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>`;
      div.onclick = () => viewMemoryFile(f.name);
      memList.appendChild(div);
    });

    // Recent prompts
    const promptList = document.getElementById('mgr-prompt-list');
    promptList.innerHTML = '';
    const recentPrompts = (promptsData.prompts || []).slice(-10).reverse();
    recentPrompts.forEach(p => {
      const div = document.createElement('div');
      div.className = 'bg-dc-card border border-dc-border rounded-lg p-3';
      div.innerHTML = `
        <div class="flex items-center justify-between mb-1">
          <span class="text-sm font-medium">${escapeHtml(p.title)}</span>
          <span class="text-[10px] px-2 py-0.5 rounded-full ${p.active ? 'bg-emerald-900/50 text-emerald-400' : 'bg-slate-700 text-slate-400'}">${p.active ? 'Active' : 'Off'}</span>
        </div>
        <div class="flex gap-2 text-[10px] text-slate-500">
          <span>${p.category}</span>
          <span>${p.type}</span>
          <span>${p.scope}</span>
        </div>`;
      promptList.appendChild(div);
    });
  } catch (e) {
    toast('Manager load failed', 'error');
  }
}

async function viewMemoryFile(name) {
  try {
    const data = await apiGet(`/api/memory/${name}`);
    // Use file viewer to show content
    currentFilePath = `memory/${name}`;
    currentFileContent = data.content;

    const viewer = document.getElementById('file-viewer');
    const contentEl = document.getElementById('file-content');

    const rendered = DOMPurify.sanitize(marked.parse(data.content || '(empty)'));
    contentEl.innerHTML = `<div class="prose prose-invert prose-sm max-w-none p-4">${rendered}</div>`;

    // Switch to files tab to show viewer
    switchTab('files');
    document.getElementById('file-tree').classList.add('hidden');
    viewer.classList.remove('hidden');
    document.getElementById('file-breadcrumb').innerHTML = `<span class="text-blue-400">memory</span><span class="text-slate-500">/</span><span class="text-white">${name}</span>`;
  } catch (e) {
    toast('Failed to load file', 'error');
  }
}

async function doSync() {
  try {
    const data = await apiPost('/api/sync', {});
    if (data.ok) {
      toast(`Synced! ${data.activeCount} prompts`, 'success');
    } else {
      toast(data.error || 'Sync failed', 'error');
    }
  } catch (e) {
    toast('Sync failed', 'error');
  }
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
