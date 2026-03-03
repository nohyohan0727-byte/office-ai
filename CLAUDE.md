# 프로젝트 설정

## API 키 관리 규칙 (필수)
- **모든 API 키, 토큰, 시크릿은 코드에 직접 넣지 마세요**
- 키 값은 각 프로젝트의 `js/env.js` 파일에서만 관리합니다
- `env.js`는 `.gitignore` 대상이므로 GitHub에 push되지 않습니다
- 새 키가 필요하면 `env.js`에 추가하고, `env.example.js`에 변수명만 추가
- 주 .env 파일: `C:\work\ai work\program\vscode\.env`

### 키 파일 구조
```
garaon-bros/js/env.js        ← 실제 키 (gitignore)
garaon-bros/js/env.example.js ← 템플릿 (커밋됨)
garaon-bros/js/config.js      ← ENV에서 읽기 (커밋됨)

launchkit/js/env.js           ← 실제 키 (gitignore)
launchkit/js/env.example.js   ← 템플릿 (커밋됨)
launchkit/js/config.js        ← LK_ENV에서 읽기 (커밋됨)
```

### HTML에서 사용법
```html
<script src="./js/env.js"></script>    <!-- 먼저 로드 -->
<script src="./js/config.js"></script> <!-- ENV 참조 -->
```

## DB 접속 정보
- **Supabase 프로젝트**: `mkmxhmoocqnkltjxdfbm.supabase.co`
  - anon key: `garaon-bros/js/env.js` 및 `launchkit/js/env.js` 참조
  - service_role key: `~/.claude/projects/C--Users----/memory/MEMORY.md` 참조
- **TrustRAG Supabase**: `ryzkcdvywxblsbyujtfv.supabase.co`
  - service_role key: MEMORY.md 참조

## 프로젝트 구조
```
office-ai/
├── index.html              # 메인 랜딩 (office-ai.app)
├── admin-upload.html       # 관리자 파일 업로드
├── garaon-bros/            # 가라온브로스 보드게임카페 앱
│   ├── js/env.js           # 실제 키 (gitignore)
│   ├── js/env.example.js   # 템플릿
│   └── js/config.js        # ENV 참조
├── launchkit/              # AI 사업계획서 & 랜딩 생성 SaaS
│   ├── js/env.js           # 실제 키 (gitignore)
│   ├── js/env.example.js   # 템플릿
│   ├── js/config.js        # LK_ENV 참조
│   └── db/schema.sql       # DB 스키마
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
- **env.js 파일은 절대 커밋하지 마세요** — .gitignore로 보호됨
