-- =============================================
-- LaunchKit - 구독 관리 컬럼 추가
-- Supabase SQL Editor에서 실행
-- =============================================

-- lk_users에 구독 관련 컬럼 추가
ALTER TABLE lk_users
  ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  ADD COLUMN IF NOT EXISTS discount_rate INTEGER DEFAULT 0 CHECK (discount_rate >= 0 AND discount_rate <= 100),
  ADD COLUMN IF NOT EXISTS subscription_start TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS subscription_end TIMESTAMPTZ;

-- lk_token_logs: 유저 삭제 시 로그도 CASCADE 삭제되도록 수정
ALTER TABLE lk_token_logs DROP CONSTRAINT IF EXISTS lk_token_logs_user_id_fkey;
ALTER TABLE lk_token_logs ADD CONSTRAINT lk_token_logs_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES lk_users(id) ON DELETE CASCADE;

-- lk_token_logs: 프로젝트 삭제 시 로그도 CASCADE
ALTER TABLE lk_token_logs DROP CONSTRAINT IF EXISTS lk_token_logs_project_id_fkey;
ALTER TABLE lk_token_logs ADD CONSTRAINT lk_token_logs_project_id_fkey
  FOREIGN KEY (project_id) REFERENCES lk_projects(id) ON DELETE CASCADE;
