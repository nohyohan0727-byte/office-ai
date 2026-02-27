# 배포 가이드 - office-ai.app

## 설정 이력

| 날짜 | 작업 내용 |
|------|-----------|
| 2026-02-03 | 초기 사이트 개발 (index.html, style.css) |
| 2026-02-03 | Netlify 수동 배포로 office-ai.app 호스팅 시작 |
| 2026-02-27 | GitHub 저장소 생성 및 코드 연결 |
| 2026-02-27 | Netlify + GitHub 자동 배포 파이프라인 구성 완료 |

---

## 인프라 구성

```
개발 환경 (로컬)               버전 관리                 배포 환경
C:\work\office-ai   →  git push  →  GitHub   →  webhook  →  Netlify  →  office-ai.app
                                nohyohan0727-byte/office-ai          elaborate-cendol-e22a61
```

### GitHub 저장소
- **URL**: https://github.com/nohyohan0727-byte/office-ai
- **계정**: nohyohan0727-byte
- **기본 브랜치**: `main`
- **공개 여부**: Public

### Netlify 사이트
- **사이트 URL**: https://office-ai.app
- **Netlify 대시보드**: https://app.netlify.com/sites/elaborate-cendol-e22a61
- **Site ID**: `7b9d2cad-0a57-4d30-bbdf-54f80848ce94`
- **빌드 명령**: 없음 (정적 사이트)
- **배포 폴더**: `.` (루트)

### 자동 배포 트리거
- GitHub `main` 브랜치에 `push` 이벤트 발생 시 자동 배포
- GitHub Webhook ID: `598181689`
- Netlify Build Hook: `https://api.netlify.com/build_hooks/69a0fa07e63f66c3cb45ca56`

---

## 코드 변경 & 배포 방법

### 일반적인 작업 흐름

```bash
# 1. 로컬에서 파일 수정
# index.html 또는 style.css 편집

# 2. 변경사항 확인
cd C:/work/office-ai
git status
git diff

# 3. 스테이징 & 커밋
git add .
git commit -m "변경 내용을 간략히 설명"

# 4. 푸시 (자동 배포 시작)
git push

# 5. 배포 확인 (약 10~30초 후)
# https://office-ai.app 새로고침
```

### 특정 파일만 반영할 때

```bash
git add index.html
git commit -m "메인 페이지 섹션 업데이트"
git push
```

### 배포 상태 확인

```bash
# Netlify 최근 배포 목록 (PowerShell 또는 bash)
curl -s -H "Authorization: Bearer $NETLIFY_TOKEN" \
  "https://api.netlify.com/api/v1/sites/7b9d2cad-0a57-4d30-bbdf-54f80848ce94/deploys?per_page=5"
```

또는 Netlify 대시보드 → Deploys 탭에서 확인

---

## 수동 배포 (긴급 시)

git 없이 즉시 배포가 필요할 때:

```bash
# Netlify Build Hook 직접 호출
curl -X POST "https://api.netlify.com/build_hooks/69a0fa07e63f66c3cb45ca56"
```

---

## 문제 해결

### git push 시 인증 오류
```bash
# remote URL에 토큰 포함 방식으로 재설정
git remote set-url origin "https://nohyohan0727-byte:YOUR_PAT@github.com/nohyohan0727-byte/office-ai.git"
```
> PAT는 `C:\work\ai work\program\vscode\.env` 파일의 `GITHUB_PAT` 참고

### Netlify 배포가 안 될 때
1. https://app.netlify.com/sites/elaborate-cendol-e22a61/deploys 에서 오류 로그 확인
2. GitHub Webhooks 설정 확인: https://github.com/nohyohan0727-byte/office-ai/settings/hooks
3. 수동 빌드 트리거 (위 수동 배포 섹션 참고)

### 커밋 히스토리 확인
```bash
git log --oneline
```

---

## API 키 / 자격증명 관리

모든 토큰은 `.env` 파일에서 관리:
- **위치**: `C:\work\ai work\program\vscode\.env`
- `GITHUB_PAT` - GitHub Personal Access Token
- `NETLIFY_TOKEN` - Netlify API Token
- `NETLIFY_SITE_ID` - 사이트 ID
