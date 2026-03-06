// Dev Console 환경 설정 (이 파일을 env.js로 복사 후 실제 값 입력)
const DC_ENV = {
  MANAGER_URL: 'http://localhost:3000',       // claude-manager 서버 (Tailscale: http://100.x.x.x:3000)
  ADMIN_KEY: 'YOUR_ADMIN_KEY_HERE',           // MOBILE_ADMIN_KEY 환경변수와 동일한 값
  N8N_WEBHOOK: 'https://YOUR_N8N.app.n8n.cloud/webhook',  // n8n RAG 웹훅 베이스
  RAG_API_KEY: '',                             // RAG 채팅용 API 키 (선택)
};
