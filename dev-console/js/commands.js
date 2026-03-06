// Dev Console - Command Execution Module

const CMD_ICONS = {
  'git-status': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>',
  'git-log': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>',
  'git-diff': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h8m-8 6h16"/>',
  'npm-test': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>',
  'pm2-list': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>',
  'pm2-restart': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>',
  'pm2-logs': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>',
  'git-revert-last': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/>',
  'tailscale-status': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/>',
};

let cmdLastOutput = '';

async function loadCommands() {
  const grid = document.getElementById('cmd-grid');
  try {
    const data = await apiGet('/api/mobile/commands');
    grid.innerHTML = '';
    data.commands.forEach(cmd => {
      const btn = document.createElement('button');
      btn.className = 'bg-dc-card border border-dc-border rounded-xl p-3 flex flex-col items-center gap-2 hover:border-blue-500/30 active:scale-95 transition-all';
      const icon = CMD_ICONS[cmd.id] || CMD_ICONS['git-status'];
      btn.innerHTML = `
        <svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">${icon}</svg>
        <span class="text-xs text-slate-300">${cmd.label}</span>`;
      btn.onclick = () => execCommand(cmd.id, cmd.label);
      grid.appendChild(btn);
    });
  } catch (e) {
    grid.innerHTML = `<div class="col-span-2 text-red-400 text-sm">${e.message}</div>`;
  }
}

async function execCommand(commandId, label) {
  const outputDiv = document.getElementById('cmd-output');
  const outputPre = document.getElementById('cmd-output-pre');
  const outputLabel = document.getElementById('cmd-output-label');

  outputLabel.textContent = `Running: ${label}...`;
  outputPre.textContent = '';
  outputDiv.classList.remove('hidden');

  try {
    const data = await apiPost('/api/mobile/exec', { commandId, project: currentProject });
    cmdLastOutput = data.output || '';
    outputLabel.textContent = `${label} ${data.success ? '(OK)' : '(Error)'}`;
    outputPre.textContent = data.output || '(no output)';

    if (!data.success) {
      outputPre.classList.add('text-red-300');
    } else {
      outputPre.classList.remove('text-red-300');
    }
  } catch (e) {
    if (e.message === 'Unauthorized') return;
    outputLabel.textContent = `${label} (Failed)`;
    outputPre.textContent = e.message;
    outputPre.classList.add('text-red-300');
  }
}

function copyCmdOutput() {
  navigator.clipboard.writeText(cmdLastOutput).then(() => toast('Output copied'));
}
