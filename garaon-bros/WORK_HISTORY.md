# 가라온브로스 - 작업 히스토리

> 보드게임방 게임 추천 앱 개인 프로젝트 (회사 업무 무관)
> 경로: `C:\dev\office-ai\garaon-bros\`

---

## 프로젝트 개요

| 항목 | 내용 |
|------|------|
| **목적** | 보드게임방에서 아이들이 게임을 추천받는 웹 앱 |
| **기술** | HTML + CSS + JS (정적 파일, 빌드 없음) |
| **DB** | Supabase (`mkmxhmoocqnkltjxdfbm`) |
| **배포** | 로컬 실행 or GitHub Pages |

---

## 파일 구조

```
garaon-bros/
├── index.html          ← 메인 (추천 선택 화면)
├── recommend.html      ← 추천 결과 화면
├── admin.html          ← 게임 목록 관리 (추가/수정/삭제)
├── style.css           ← 공통 스타일
├── data/
│   └── games-data.js   ← 보드게임 + 맨손게임 로컬 데이터
├── js/
│   ├── app.js          ← 앱 로직 (추천 알고리즘)
│   └── supabase.js     ← Supabase 연동
└── db/
    └── schema.sql      ← DB 스키마 (Supabase SQL Editor에서 실행)
```

---

## 작업 이력

### [2026-03-01] 픽셀 기지 앱 개발 완료 (pixel-base.html)

| 항목 | 내용 |
|------|------|
| **작업자** | nohyohan0727-byte + Claude (Sonnet 4.6) |
| **파일** | `pixel-base.html` (index.html과 충돌 방지를 위해 분리) |
| **상태** | ✅ 완료 — Supabase 키 입력 후 즉시 사용 가능 |

**구현 내용:**
- 1,045줄 단일 HTML (React 18 CDN + Tailwind + Supabase JS)
- 닌텐도 스위치 스타일 다크 네온 디자인 + Press Start 2P 픽셀 폰트
- 비밀번호 화면(`!20150910!`) → 캐릭터 로그인 → 대시보드

**⚠️ 파일 구조 충돌 방지:**
- `index.html` → 추천 앱 전용 (이 파일 건드리지 않음)
- `pixel-base.html` → 픽셀 기지 전용

---

### [2026-03-01] 프로젝트 초기 구축

| 항목 | 내용 |
|------|------|
| **작업자** | nohyohan0727-byte + Claude |
| **상태** | 🚧 진행중 |

**구현 내용:**
- 프로젝트 폴더 구조 생성
- Supabase DB 스키마 설계 (board_games, hand_games 테이블)
- 보드게임 20개 + 맨손게임 10개 샘플 데이터
- 메인 추천 플로우 UI/UX

---
