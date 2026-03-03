# 프로젝트 설정

## 환경변수 위치
- **주 .env 파일**: `C:\work\ai work\program\vscode\.env`
  - GitHub PAT, Netlify Token, Gemini, Google OAuth, Coupang 등

## DB 접속 정보
- **Supabase 프로젝트**: `mkmxhmoocqnkltjxdfbm.supabase.co`
  - anon key: `garaon-bros/js/config.js` 및 `launchkit/js/config.js` 참조
  - service_role key: `~/.claude/projects/C--Users----/memory/MEMORY.md` 참조
- **TrustRAG Supabase**: `ryzkcdvywxblsbyujtfv.supabase.co`
  - service_role key: MEMORY.md 참조

## 프로젝트 구조
```
office-ai/
├── index.html              # 메인 랜딩 (office-ai.app)
├── admin-upload.html       # 관리자 파일 업로드
├── garaon-bros/            # 가라온브로스 보드게임카페 앱
│   └── js/config.js        # Supabase + Telegram + n8n 설정
├── launchkit/              # AI 사업계획서 & 랜딩 생성 SaaS
│   ├── js/config.js        # Supabase + n8n 웹훅 설정
│   └── db/schema.sql       # DB 스키마 (Supabase 대시보드에서 실행)
├── trustrag/               # TrustRAG 보안 채팅
└── reference/              # 레퍼런스 인덱스
```

## n8n
- **URL**: `https://jknetworks.app.n8n.cloud`
- **API Key**: `~/.claude/settings.json` → mcpServers.n8n-mcp.env.N8N_API_KEY

## 배포
- **GitHub**: `nohyohan0727-byte/office-ai`
- **Netlify**: `https://office-ai.app` (git push → 자동 배포)

## 주의사항
- Supabase DDL(CREATE TABLE)은 대시보드 SQL Editor에서 직접 실행
- 파일 링크는 `C:\work\office-ai`를 VS Code 워크스페이스로 열었을 때 동작
