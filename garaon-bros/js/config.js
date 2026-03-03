// Supabase 설정 (추천 앱 전용)
// 실제 키 값은 env.js에서 로드합니다 (env.js는 .gitignore 대상)
const CONFIG = {
  SUPABASE_URL:       ENV.SUPABASE_URL,
  SUPABASE_ANON:      ENV.SUPABASE_ANON,
  N8N_WEBHOOK:        ENV.N8N_WEBHOOK,
  SPOTIFY_WEBHOOK:    ENV.SPOTIFY_WEBHOOK,
  TELEGRAM_BOT_TOKEN: ENV.TELEGRAM_BOT_TOKEN,
  TELEGRAM_CHAT_ID:   ENV.TELEGRAM_CHAT_ID,
};

let _sb = null;
function getDB() {
  if (!_sb) _sb = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON);
  return _sb;
}
