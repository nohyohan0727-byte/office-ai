-- =============================================
-- 가라온브로스 보드게임 추천 앱 - DB 스키마
-- Supabase SQL Editor에서 실행
-- =============================================

-- 보드게임 테이블
CREATE TABLE IF NOT EXISTS board_games (
  id            BIGSERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  name_en       TEXT,
  min_players   INTEGER NOT NULL DEFAULT 2,
  max_players   INTEGER NOT NULL DEFAULT 6,
  play_time_min INTEGER DEFAULT 30,           -- 평균 플레이 시간 (분)
  difficulty    INTEGER DEFAULT 2 CHECK (difficulty BETWEEN 1 AND 5),  -- 1=쉬움, 5=어려움
  fun_score     INTEGER DEFAULT 4 CHECK (fun_score BETWEEN 1 AND 5),   -- 재미도
  categories    TEXT[] DEFAULT '{}',          -- ['전략','카드','파티','협력','추리','경제']
  age_min       INTEGER DEFAULT 8,
  image_url     TEXT,
  description   TEXT,
  rules         TEXT,
  tips          TEXT,
  is_available  BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 맨손 게임 테이블 (도구 없이 사람끼리 하는 게임)
CREATE TABLE IF NOT EXISTS hand_games (
  id            BIGSERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  min_players   INTEGER NOT NULL DEFAULT 2,
  max_players   INTEGER DEFAULT 99,
  play_time_min INTEGER DEFAULT 10,
  fun_score     INTEGER DEFAULT 4 CHECK (fun_score BETWEEN 1 AND 5),
  categories    TEXT[] DEFAULT '{}',          -- ['언어','신체','추리','창의','조용','시끌벅적']
  age_min       INTEGER DEFAULT 6,
  description   TEXT,
  rules         TEXT,
  tips          TEXT,
  materials     TEXT DEFAULT '없음',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 (카테고리 검색 최적화)
CREATE INDEX IF NOT EXISTS idx_bg_categories  ON board_games USING GIN (categories);
CREATE INDEX IF NOT EXISTS idx_bg_players     ON board_games (min_players, max_players);
CREATE INDEX IF NOT EXISTS idx_hg_categories  ON hand_games  USING GIN (categories);
CREATE INDEX IF NOT EXISTS idx_hg_players     ON hand_games  (min_players, max_players);

-- updated_at 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_bg_updated_at
BEFORE UPDATE ON board_games
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS 비활성화 (공개 앱 - 별도 인증 없음)
ALTER TABLE board_games DISABLE ROW LEVEL SECURITY;
ALTER TABLE hand_games  DISABLE ROW LEVEL SECURITY;
