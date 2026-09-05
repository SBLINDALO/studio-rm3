CREATE TABLE IF NOT EXISTS exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  abbreviation TEXT NOT NULL,
  date DATE NOT NULL,
  time TEXT NOT NULL,
  type TEXT CHECK (type IN ('Scritto', 'Orale')) NOT NULL,
  cfu INT CHECK (cfu IN (6, 12)) NOT NULL,
  color TEXT DEFAULT 'indigo',
  topics JSONB DEFAULT '[]'::JSONB,
  manual_total_hours NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS daily_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  hours NUMERIC NOT NULL DEFAULT 0,
  is_auto BOOLEAN DEFAULT TRUE,
  completed BOOLEAN DEFAULT FALSE,
  carried_forward_from DATE,
  UNIQUE (user_id, exam_id, date)
);

ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "exams_owner_only" ON exams
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "daily_sessions_owner_only" ON daily_sessions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_daily_sessions_date ON daily_sessions (user_id, date);