-- office-ai.app 채팅 위젯용 테이블
-- Supabase 대시보드 > SQL Editor에서 실행

CREATE TABLE site_chat (
  id bigserial PRIMARY KEY,
  session_id text NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'ai', 'human')),
  content text NOT NULL,
  tg_message_id bigint,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_site_chat_session ON site_chat(session_id, created_at);

-- RLS 활성화 + anon 읽기/쓰기 허용 (n8n service_role은 bypass)
ALTER TABLE site_chat ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_insert" ON site_chat FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_select" ON site_chat FOR SELECT TO anon USING (true);
