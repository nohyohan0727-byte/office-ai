// Supabase 설정 (추천 앱 전용)
// env.js가 있으면 ENV에서, 없으면 fallback 값 사용
const _E = typeof ENV !== 'undefined' ? ENV : {};
const CONFIG = {
  SUPABASE_URL:       _E.SUPABASE_URL       || 'https://mkmxhmoocqnkltjxdfbm.supabase.co',
  SUPABASE_ANON:      _E.SUPABASE_ANON      || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rbXhobW9vY3Fua2x0anhkZmJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5MDE0ODIsImV4cCI6MjA4NzQ3NzQ4Mn0.tYPVpoEs_9Qbw3kcUzkImDv0d6lQ69wAZ5YKz2GqqM8',
  N8N_WEBHOOK:        _E.N8N_WEBHOOK        || 'https://jknetworks.app.n8n.cloud/webhook/garaon-call',
  SPOTIFY_WEBHOOK:    _E.SPOTIFY_WEBHOOK    || 'https://jknetworks.app.n8n.cloud/webhook/spotify-search',
  TELEGRAM_BOT_TOKEN: _E.TELEGRAM_BOT_TOKEN || '8602303372:AAE5PoJQ6pNr3mVRaohbmzk29nEXbd-pMRc',
  TELEGRAM_CHAT_ID:   _E.TELEGRAM_CHAT_ID   || '6484111154',
};

let _sb = null;
function getDB() {
  if (!_sb) _sb = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON);
  return _sb;
}
