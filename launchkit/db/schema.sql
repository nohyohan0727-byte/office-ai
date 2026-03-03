-- =============================================
-- LaunchKit - AI 사업계획서 & 랜딩페이지 생성 서비스
-- Supabase SQL Editor에서 실행
-- =============================================

-- 사용자 테이블 (커스텀 인증)
CREATE TABLE IF NOT EXISTS lk_users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT UNIQUE NOT NULL,
  password_hash   TEXT NOT NULL,           -- bcrypt (n8n에서 처리)
  name            TEXT NOT NULL,
  plan            TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'pro_max')),
  tokens_total    INTEGER DEFAULT 100,     -- 플랜별 월 지급 토큰
  tokens_used     INTEGER DEFAULT 0,       -- 이번 달 사용량
  tokens_reset_at TIMESTAMPTZ DEFAULT (date_trunc('month', NOW()) + INTERVAL '1 month'),
  session_token   TEXT,                    -- 로그인 세션 토큰 (UUID)
  session_expires TIMESTAMPTZ,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 프로젝트 테이블
CREATE TABLE IF NOT EXISTS lk_projects (
  id              BIGSERIAL PRIMARY KEY,
  user_id         UUID REFERENCES lk_users(id) ON DELETE CASCADE,
  title           TEXT DEFAULT '새 프로젝트',
  company_name    TEXT,
  interview_data  JSONB DEFAULT '{}',      -- 인터뷰 수집 데이터
  ir_type         TEXT CHECK (ir_type IN ('simple', 'detail', NULL)),
  landing_type    TEXT CHECK (landing_type IN ('simple', 'detail', NULL)),
  ir_html         TEXT,                    -- 생성된 IR 문서 HTML
  landing_html    TEXT,                    -- 생성된 랜딩페이지 HTML
  tokens_used     INTEGER DEFAULT 0,
  status          TEXT DEFAULT 'interview' CHECK (status IN (
                    'interview',    -- 인터뷰 진행 중
                    'confirming',   -- 목차/구성안 확인 중
                    'generating',   -- 생성 중
                    'ir_done',      -- IR 완료
                    'complete'      -- 전체 완료
                  )),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 채팅 메시지 테이블 (인터뷰 대화 저장)
CREATE TABLE IF NOT EXISTS lk_messages (
  id          BIGSERIAL PRIMARY KEY,
  project_id  BIGINT REFERENCES lk_projects(id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 토큰 거래 로그
CREATE TABLE IF NOT EXISTS lk_token_logs (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID REFERENCES lk_users(id),
  project_id  BIGINT REFERENCES lk_projects(id),
  action      TEXT NOT NULL,   -- 'ir_simple'|'ir_detail'|'landing_simple'|'landing_detail'|'monthly_reset'|'plan_upgrade'
  tokens_delta INTEGER NOT NULL, -- 음수: 소비, 양수: 충전
  memo        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- 플랜별 토큰 기준 (참고용)
-- free:      100 토큰/월
-- pro:       500 토큰/월  (3만원)
-- pro_max: 2,500 토큰/월  (5만원)
--
-- 작업별 소비량:
--   간단 IR:        80 토큰
--   상세 IR:       200 토큰
--   간단 랜딩:     120 토큰
--   상세 랜딩:     300 토큰
-- ─────────────────────────────────────────

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_lk_projects_user   ON lk_projects (user_id);
CREATE INDEX IF NOT EXISTS idx_lk_messages_proj   ON lk_messages (project_id);
CREATE INDEX IF NOT EXISTS idx_lk_token_logs_user ON lk_token_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_lk_users_session   ON lk_users (session_token);

-- updated_at 자동 갱신
CREATE OR REPLACE FUNCTION lk_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_lk_projects_updated
BEFORE UPDATE ON lk_projects
FOR EACH ROW EXECUTE FUNCTION lk_update_updated_at();

-- RLS 비활성화 (n8n 서버사이드 인증 사용)
ALTER TABLE lk_users       DISABLE ROW LEVEL SECURITY;
ALTER TABLE lk_projects    DISABLE ROW LEVEL SECURITY;
ALTER TABLE lk_messages    DISABLE ROW LEVEL SECURITY;
ALTER TABLE lk_token_logs  DISABLE ROW LEVEL SECURITY;
