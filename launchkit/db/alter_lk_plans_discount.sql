-- lk_plans: discount_rate → discount_monthly + discount_yearly 분리
-- Supabase 대시보드 SQL Editor에서 실행

ALTER TABLE lk_plans ADD COLUMN discount_monthly INTEGER DEFAULT 0 CHECK (discount_monthly >= 0 AND discount_monthly <= 100);
ALTER TABLE lk_plans ADD COLUMN discount_yearly INTEGER DEFAULT 0 CHECK (discount_yearly >= 0 AND discount_yearly <= 100);

-- 기존 discount_rate 값을 monthly로 이관 (있는 경우)
UPDATE lk_plans SET discount_monthly = discount_rate WHERE discount_rate > 0;

-- 기존 컬럼 삭제
ALTER TABLE lk_plans DROP COLUMN discount_rate;
