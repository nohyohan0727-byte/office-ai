# LaunchKit HANDOFF (2026-03-06 updated)

## 완료된 작업

### 기존 완료 (이전 세션)
- 랜딩페이지 생성 파이프라인 (n8n `cZqQMdy87j0Qa2yC`)
- CREATE_PROJECT 타입 파싱 수정 (`37q9ALNOlqGng2g2`)
- CSS 템플릿 프롬프트 강화 (SYS_SIMPLE 8섹션, SYS_DETAIL 12섹션)
- confirm 버튼 수정, result.html 랜딩 탭 자동 전환

### 2026-03-06 완료
- **수정 요청 리다이렉트 루프 수정**: result.html -> interview.html 무한 루프 해결 (edit=1 파라미터 방식)
- **generating 상태 추가**: confirmYes() 시 DB status=generating, 이탈 후 재진입 시 폴링으로 완료 대기
- **이벤트 중복 제거**: onclick + addEventListener 이중 실행 수정
- **result.html 네비게이션**: 프로젝트 목록 링크 추가
- **홈 링크**: 전체 서비스 로고에 office-ai.app 링크

## 프로젝트 상태 흐름 (DB lk_projects.status)
```
interview -> confirming -> generating -> ir_done/complete
                 |              |
                 v              v (에러 시)
             interview      confirming
```

## 진행 예정 작업

### [중요] 랜딩페이지 디자인 AI 솔루션 변경
- **현재**: GPT-4o + CSS 템플릿 -> 디자인 퀄리티 한계
- **예정**: 디자인 전문 AI 솔루션으로 교체 (구체적 솔루션 미정)
- **영향**: launchkit-generate-landing 워크플로우의 Prepare/CallOpenAI/Process 노드

### 기타 미완료
- **상세 랜딩 테스트**: SYS_DETAIL 프롬프트 배포됨, 실제 생성 테스트 미완료
- **에러 핸들링**: Prepare 에러 시 IF 노드로 CallOpenAI 건너뛰기
- **런칭(URL 생성) 기능**: 유저별 퍼블릭 URL 배포 (보류)

## 관련 파일
| 파일 | 설명 |
|------|------|
| `launchkit/interview.html` | 인터뷰 + 수정 + 생성 흐름 (핵심) |
| `launchkit/result.html` | 결과 미리보기 (IR탭 + 랜딩탭 iframe) |
| `launchkit/dashboard.html` | 대시보드 (프로젝트 목록) |
| `launchkit/auth.html` | 로그인/회원가입 |
| `launchkit/js/config.js` | 웹훅 URL + 플랜/토큰 설정 |

## n8n 워크플로우
| 이름 | ID | 상태 |
|------|----|------|
| launchkit-generate-landing | `cZqQMdy87j0Qa2yC` | 활성 |
| launchkit-generate-ir | `rYOIv61oyJAn6zsc` | 활성 |
| launchkit-create-project | `37q9ALNOlqGng2g2` | 활성 |
| launchkit-interview | `rg7ELOblLrnzbOsb` | 활성 |
| launchkit-get-project | `twtX9aSZmB0PGBGJ` | 활성 |
| launchkit-register | `ChAX9FXE91DHNSsr` | 활성 |
| launchkit-login | `HFcn58o3YJn5a4IR` | 활성 |

## 테스트 계정
- 이메일: `logintest@test.com` / 비밀번호: `test0727`
- 토큰: 10,000 (충전됨)
