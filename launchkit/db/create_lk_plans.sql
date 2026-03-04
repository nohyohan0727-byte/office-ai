-- lk_plans: 구독 상품/서비스 카탈로그
-- Supabase 대시보드 SQL Editor에서 실행

CREATE TABLE lk_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  plan_type TEXT DEFAULT 'regular' CHECK (plan_type IN ('regular', 'event')),
  plan_key TEXT NOT NULL,
  tokens INTEGER DEFAULT 0,
  price_monthly INTEGER DEFAULT 0,
  price_yearly INTEGER DEFAULT 0,
  discount_monthly INTEGER DEFAULT 0 CHECK (discount_monthly >= 0 AND discount_monthly <= 100),
  discount_yearly INTEGER DEFAULT 0 CHECK (discount_yearly >= 0 AND discount_yearly <= 100),
  event_start TIMESTAMPTZ,
  event_end TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 기본 플랜 데이터
INSERT INTO lk_plans (name, plan_key, plan_type, tokens, price_monthly, price_yearly, sort_order) VALUES
  ('Free', 'free', 'regular', 100, 0, 0, 1),
  ('Pro', 'pro', 'regular', 500, 30000, 300000, 2),
  ('Pro Max', 'pro_max', 'regular', 2500, 50000, 500000, 3);
