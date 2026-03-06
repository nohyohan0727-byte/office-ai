// Dev Console - File Browser Module

let currentFilePath = '';
let currentFileContent = '';

async function loadFileTree() {
  const container = document.getElementById('file-tree');
  const viewer = document.getElementById('file-viewer');
  viewer.classList.add('hidden');
  container.classList.remove('hidden');

  container.innerHTML = '<div class="text-slate-400 text-sm">Loading...</div>';
  document.getElementById('file-breadcrumb').innerHTML = `<span class="text-blue-400">${currentProject}</span>`;

  try {
    const data = await apiGet(`/api/mobile/files?project=${currentProject}`);
    container.innerHTML = '';
    renderTree(container, data.tree, 0);
  } catch (e) {
    container.innerHTML = `<div class="text-red-400 text-sm">${e.message}</div>`;
  }
}

function renderTree(parent, items, depth) {
  if (!items) return;
  items.forEach(item => {
    if (item.type === 'dir') {
      const details = document.createElement('details');
      details.className = depth === 0 ? '' : 'ml-4';
      const summary = document.createElement('summary');
      summary.className = 'flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-slate-800/50 cursor-pointer text-sm';
      summary.innerHTML = `
        <svg class="w-4 h-4 text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>
        <span class="text-slate-200">${item.name}</span>
        <span class="text-slate-500 text-xs">${item.children ? item.children.length : ''}</span>`;
      details.appendChild(summary);
      const childDiv = document.createElement('div');
      renderTree(childDiv, item.children, depth + 1);
      details.appendChild(childDiv);
      parent.appendChild(details);
    } else {
      const fileDiv = document.createElement('div');
      fileDiv.className = `${depth > 0 ? 'ml-4' : ''} flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-slate-800/50 cursor-pointer text-sm`;
      const ext = item.name.split('.').pop();
      const iconColor = getFileColor(ext);
      fileDiv.innerHTML = `
        <svg class="w-4 h-4 ${iconColor} shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
        <span class="text-slate-300">${item.name}</span>`;
      fileDiv.onclick = () => openFile(item.path);
      parent.appendChild(fileDiv);
    }
  });
}

function getFileColor(ext) {
  const colors = {
    js: 'text-yellow-400', ts: 'text-blue-400', tsx: 'text-blue-400',
    html: 'text-orange-400', css: 'text-purple-400',
    json: 'text-green-400', md: 'text-slate-400',
    py: 'text-emerald-400', sql: 'text-cyan-400',
  };
  return colors[ext] || 'text-slate-400';
}

async function openFile(filePath) {
  const container = document.getElementById('file-tree');
  const viewer = document.getElementById('file-viewer');
  const contentEl = document.getElementById('file-content');

  try {
    const data = await apiGet(`/api/mobile/files/${currentProject}/${filePath}`);
    currentFilePath = filePath;
    currentFileContent = data.content;

    // Breadcrumb
    const parts = filePath.split('/');
    document.getElementById('file-breadcrumb').innerHTML =
      `<span class="text-blue-400 cursor-pointer" onclick="loadFileTree()">${currentProject}</span>` +
      parts.map((p, i) => `<span class="text-slate-500">/</span><span class="${i === parts.length - 1 ? 'text-white' : 'text-slate-400'}">${p}</span>`).join('');

    // Syntax highlighting
    const lang = getPrismLang(data.extension);
    const highlighted = Prism.highlight(data.content, Prism.languages[lang] || Prism.languages.plaintext, lang);
    contentEl.innerHTML = `<pre class="language-${lang}" style="max-height: calc(100vh - 14rem);"><code class="language-${lang}">${highlighted}</code></pre>`;

    container.classList.add('hidden');
    viewer.classList.remove('hidden');
  } catch (e) {
    toast(e.message || 'Failed to load file', 'error');
  }
}

function getPrismLang(ext) {
  const map = {
    js: 'javascript', ts: 'typescript', tsx: 'tsx',
    html: 'html', css: 'css', json: 'json',
    md: 'markdown', py: 'python', sql: 'sql',
  };
  return map[ext] || 'plaintext';
}

function closeFileViewer() {
  document.getElementById('file-viewer').classList.add('hidden');
  document.getElementById('file-tree').classList.remove('hidden');
  document.getElementById('file-breadcrumb').innerHTML = `<span class="text-blue-400">${currentProject}</span>`;
}

function copyFilePath() {
  navigator.clipboard.writeText(currentFilePath).then(() => toast('Path copied'));
}

function copyFileContent() {
  navigator.clipboard.writeText(currentFileContent).then(() => toast('Content copied'));
}
