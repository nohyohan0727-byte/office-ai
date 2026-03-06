# LaunchKit HANDOFF (2026-03-06)

## 완료된 작업

### 1. 랜딩페이지 생성 파이프라인 구축
- **n8n 워크플로우**: `launchkit-generate-landing` (ID: `cZqQMdy87j0Qa2yC`) 생성 및 활성화
  - Webhook → Prepare(인증+DB조회+프롬프트 생성) → CallOpenAI(gpt-4o) → Process(HTML추출+DB저장+토큰차감)
- **interview.html `confirmYes()` 타입 분기**: selectedType에 따라 IR/Landing/번들 분기 호출
- **config.js**: `GENERATE_LANDING: '/launchkit-generate-landing'` 등록 완료

### 2. CREATE_PROJECT 타입 파싱 수정
- `project_type: "landing_simple"` 같은 combined string을 `ir_type`/`landing_type`으로 분리 파싱
- 워크플로우 ID: `37q9ALNOlqGng2g2`

### 3. CSS 템플릿 프롬프트 강화
- `update_landing_prompt.py` 작성 → n8n Prepare 노드에 배포
- SYS_SIMPLE (8섹션): nav, hero(blob+gradient), stats, features, process, testimonials, CTA, footer
- SYS_DETAIL (12섹션): + trust-bar, feature-detail(좌우교차), pricing, FAQ accordion, scroll reveal
- 레퍼런스(dev-master) 수준 CSS: blob 애니메이션, gradient-shift, glassmorphism nav, cubic-bezier hover 등

### 4. confirm 버튼 수정
- `confirmYes()`, `confirmEdit()` onclick 속성 복구 (addEventListener와 병행)

### 5. result.html 랜딩 탭 자동 전환
- IR 없이 랜딩만 있는 경우 자동으로 랜딩 탭으로 전환

## 테스트 결과
- 프로젝트 4번(간단 랜딩): 17,987자 HTML 생성 성공
- 14개 CSS 클래스 전부 활용 확인 (blob, gradient-shift, reveal, feature-card 등)
- JS 포함 (Intersection Observer, nav scroll, smooth scroll)
- DB 저장 → result.html 미리보기 정상

## 진행 예정 작업

### [중요] 랜딩페이지 디자인 AI 솔루션 변경 예정
- **현재 문제**: GPT-4o 기반 HTML 생성 → 디자인 퀄리티 한계 (CSS 템플릿 제공해도 레퍼런스 수준에 미달)
- **변경 계획**: 디자인 전문 AI 솔루션으로 교체 예정 (구체적 솔루션 미정)
- **영향 범위**:
  - `launchkit-generate-landing` 워크플로우의 Prepare/CallOpenAI/Process 노드
  - `update_landing_prompt.py` (프롬프트 스크립트)
  - interview.html의 API 호출 부분은 동일하게 유지 가능 (webhook 인터페이스 불변)

### 기타 미완료/보류
- **런칭(URL 생성) 기능**: 유저별 폴더 생성 + 퍼블릭 URL 배포 (사용자 보류)
- **에러 핸들링 개선**: Prepare에서 _error 반환 시 CallOpenAI 건너뛰기 (IF 노드 추가) — 기능적으로는 동작하지만 불필요한 API 호출 발생
- **상세 랜딩 테스트**: SYS_DETAIL 프롬프트는 배포됨, 실제 생성 테스트 미완료

## 관련 파일
| 파일 | 설명 |
|------|------|
| `launchkit/interview.html` | 인터뷰 UI + confirmYes() 타입 분기 |
| `launchkit/result.html` | 결과 미리보기 (IR탭 + 랜딩탭 iframe) |
| `launchkit/js/config.js` | 웹훅 URL + 플랜/토큰 설정 |
| `~/update_landing_prompt.py` | n8n 프롬프트 업데이트 스크립트 |
| `~/landing_wf_update.json` | 워크플로우 원본 JSON |
| `~/test_landing.html` | 생성된 테스트 랜딩페이지 |

## n8n 워크플로우 ID
| 이름 | ID | 상태 |
|------|----|------|
| launchkit-generate-landing | `cZqQMdy87j0Qa2yC` | 활성 |
| launchkit-generate-ir | `rYOIv61oyJAn6zsc` | 활성 |
| launchkit-create-project | `37q9ALNOlqGng2g2` | 활성 |
| launchkit-interview | `rg7ELOblLrnzbOsb` | 활성 |
| launchkit-get-project | `twtX9aSZmB0PGBGJ` | 활성 |

## 테스트 계정
- 이메일: `logintest@test.com` / 비밀번호: `test0727`
- 토큰: 380/500 잔여
