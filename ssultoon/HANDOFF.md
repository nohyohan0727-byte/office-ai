# 썰툰 스튜디오 HANDOFF

> 마지막 업데이트: 2026-03-08 (2차)

## 완료된 작업

### Week 1 - 기반 구축
1. **Supabase DB 스키마** — 6개 테이블 (st_topics, st_scripts, st_productions, st_uploads, st_performance, st_characters) 생성 완료
2. **대시보드 UI (index.html)** — 소재 관리 페이지 (카드 목록, 상세 패널, 필터, 수동 등록, 승인/반려)
3. **인증 시스템** — sessionStorage 기반 로그인 (login.html + auth-guard.js)
4. **API 래퍼 (ssultoon-api.js)** — 전체 CRUD + 웹훅 호출 함수 + patch export 추가
5. **n8n 워크플로우: st-collect-topics** (ID: `5f27FqFN6SXUFAT4`) — 네이버 블로그 검색 → Gemini AI 분석 → Supabase 저장, 매일 10AM 자동 실행, **활성화 완료**
6. **네이버 검색 API** — 스코프 이슈 해결 (검색 API 추가), 정상 동작 확인
7. **대본 관리 페이지 (scripts.html)** — 대본 목록/상세/필터/상태변경/승인/수정요청 UI 완성, 초 단위 표시 수정
8. **n8n 워크플로우: st-generate-script** (ID: `FTlughgsA9PWknZL`) — 웹훅 정상 동작 확인
   - 원인: Code 노드에서 `$this.helpers.httpRequest` 사용 → `this.helpers.httpRequest`로 수정
   - 대본 생성 end-to-end 테스트 성공 (7컷 대본 생성, Supabase 저장 확인)
9. **생산 관리 페이지 (production.html)** — 생산 파이프라인 시각화, 이미지/TTS/영상 미리보기, 비용 추적, 상태 관리
10. **캐릭터 관리 페이지 (characters.html)** — 캐릭터 CRUD, LoRA/TTS 보이스 설정, 활성/비활성 관리
11. **n8n 워크플로우: st-produce** (ID: `nu4Gyz5y6Sbqv1Mg`) — 웹훅 → 스크립트 조회 → 생산 레코드 생성 → 이미지/TTS 파이프라인 (현재 placeholder) → final_review 상태, **활성화 완료**
    - 파이프라인: Webhook → Fetch Script → Create Production → Generate Images → Generate TTS → Finalize
    - 이미지/TTS는 API 키 확보 후 실제 생성 코드 추가 필요

### 테스트 데이터
- st_topics에 6개 수동 입력 소재 존재
- "퇴근 후 갑자기 오는 카톡" (ID: 41d61329...) → 대본 생성 완료 (script_id: 1b790389...)
- 생성된 대본: 7컷, 45초, 캐릭터 [주인공, 팀장]
- 생산 레코드 생성됨 (production_id: 8cdfb346...) → status: final_review

### n8n 워크플로우 주의사항
- n8n Cloud task runner에서 `$this.helpers.httpRequest` → **사용 불가**
- `this.helpers.httpRequest` → **정상 동작** (st-collect-topics 워크플로우와 동일 패턴)
- `fetch` → **사용 불가** (task runner 환경)
- **webhook 등록 필수**: `typeVersion: 1.1` + `webhookId: UUID` 필요. `typeVersion: 2`로 하면 404

## 진행 중 / 미해결

없음

## 다음 세션에서 이어할 작업

1. **로컬 테스트** — http://localhost:8080/ssultoon/ 전체 페이지 동작 확인 (production.html에서 생산 데이터 보이는지)
2. **Netlify 배포** — git push → 자동 배포 후 실제 URL 확인
3. **캐릭터 기본 데이터** — 주인공/팀장/동료 등 기본 캐릭터 등록
4. **이미지 생성 실제 연동** — Replicate API 키 확보 → Generate Images 노드에 실제 이미지 생성 코드 추가
5. **TTS 실제 연동** — Clova/ElevenLabs API 키 확보 → Generate TTS 노드에 실제 음성 생성 코드 추가
6. **YouTube 업로드 워크플로우** (st-upload)

## 관련 파일 경로

| 파일 | 위치 |
|------|------|
| 메인 대시보드 | `c:\work\office-ai\ssultoon\index.html` |
| 대본 관리 | `c:\work\office-ai\ssultoon\scripts.html` |
| 생산 관리 | `c:\work\office-ai\ssultoon\production.html` |
| 캐릭터 관리 | `c:\work\office-ai\ssultoon\characters.html` |
| 로그인 | `c:\work\office-ai\ssultoon\login.html` |
| API 래퍼 | `c:\work\office-ai\ssultoon\js\ssultoon-api.js` |
| 환경변수 | `c:\work\office-ai\ssultoon\js\env.js` |
| 인증 가드 | `c:\work\office-ai\ssultoon\js\auth-guard.js` |
| DB 스키마 | `c:\work\automation_content\ssultoon\db\schema.sql` |
| 프로젝트 계획 | `c:\work\automation_content\ssultoon\SSULTOON_PLAN.md` |

## n8n 워크플로우

| 이름 | ID | 상태 |
|------|-----|------|
| st-collect-topics | `5f27FqFN6SXUFAT4` | 활성 (매일 10AM) |
| st-generate-script | `FTlughgsA9PWknZL` | 활성 (정상 동작) |
| st-produce | `nu4Gyz5y6Sbqv1Mg` | 활성 (이미지/TTS placeholder) |

## 인증 정보
- 비밀번호: `c:\work\office-ai\ssultoon\js\env.js` → `ADMIN_PASSWORD`
- Supabase: `mkmxhmoocqnkltjxdfbm.supabase.co` (anon key in env.js)
- 로컬 서버: `npx -y http-server -p 8080 -c-1` (office-ai 폴더에서 실행)
