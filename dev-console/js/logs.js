// Dev Console - Log Viewer Module

let logInterval = null;
let lastLogTs = 0;
let displayedLogs = [];

function startLogPolling() {
  if (logInterval) return;
  fetchLogs();
  logInterval = setInterval(fetchLogs, 3000);
}

function stopLogPolling() {
  if (logInterval) {
    clearInterval(logInterval);
    logInterval = null;
  }
}

async function fetchLogs() {
  try {
    const data = await apiGet(`/api/mobile/logs?since=${lastLogTs}`);
    if (data.logs && data.logs.length > 0) {
      data.logs.forEach(log => {
        lastLogTs = Math.max(lastLogTs, log.ts);
        displayedLogs.push(log);
        appendLogEntry(log);
      });

      if (document.getElementById('log-autoscroll')?.checked) {
        const container = document.getElementById('log-container');
        container.scrollTop = container.scrollHeight;
      }
    }
  } catch (e) {
    // silently fail
  }
}

function appendLogEntry(log) {
  const container = document.getElementById('log-container');
  const el = document.createElement('div');

  const levelColors = {
    info: 'text-slate-400',
    error: 'text-red-400',
    warn: 'text-yellow-400',
  };
  const levelBadge = {
    info: 'bg-slate-700',
    error: 'bg-red-900/50',
    warn: 'bg-yellow-900/50',
  };

  const time = new Date(log.ts).toLocaleTimeString('ko-KR', { hour12: false });
  el.className = `flex gap-2 items-start ${levelColors[log.level] || 'text-slate-400'}`;
  el.innerHTML = `
    <span class="text-slate-500 shrink-0">${time}</span>
    <span class="${levelBadge[log.level] || ''} px-1 rounded text-[10px] uppercase shrink-0">${log.level}</span>
    <span class="break-all">${escapeHtml(log.message)}</span>`;
  container.appendChild(el);
}

function clearLogs() {
  document.getElementById('log-container').innerHTML = '';
  displayedLogs = [];
  toast('Logs cleared');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
