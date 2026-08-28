-- Migrazioni Supabase per studio-rm3

-- Tabella per i progressi dei topic
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_key TEXT NOT NULL,
  topic_index INTEGER NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  review_status TEXT CHECK (review_status IN ('review')),
  confidence INTEGER,
  note TEXT,
  notes_data JSONB DEFAULT '{}'::JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, subject_key, topic_index)
);

ALTER TABLE IF EXISTS user_progress ADD COLUMN IF NOT EXISTS notes_data JSONB DEFAULT '{}'::JSONB;

-- Tabella per le sessioni giornaliere completate
CREATE TABLE IF NOT EXISTS user_daily (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_str TEXT NOT NULL,
  session_index INTEGER NOT NULL,
  is_done BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, day_str, session_index)
);

-- Tabella per le note settimanali
CREATE TABLE IF NOT EXISTS user_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_index INTEGER NOT NULL,
  note TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, week_index)
);

-- Tabella per i valori di confidenza
CREATE TABLE IF NOT EXISTS user_conf (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conf_key TEXT NOT NULL,
  value INTEGER NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, conf_key)
);

-- Tabella per i valori di check
CREATE TABLE IF NOT EXISTS user_check (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  check_key TEXT NOT NULL,
  value INTEGER NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, check_key)
);

-- Tabella per le sessioni loggate
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id BIGINT NOT NULL,
  date TEXT NOT NULL,
  subject TEXT,
  duration INTEGER NOT NULL,
  mode TEXT NOT NULL,
  start_time TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, session_id)
);

-- Tabella per gli item di catchup
CREATE TABLE IF NOT EXISTS user_catchup (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  catchup_id TEXT NOT NULL,
  orig_day TEXT NOT NULL,
  orig_idx INTEGER NOT NULL,
  sub TEXT NOT NULL,
  dur TEXT NOT NULL,
  topic TEXT NOT NULL,
  target_day TEXT NOT NULL,
  done BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, catchup_id)
);

-- Abilita RLS (Row Level Security)
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_conf ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_check ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_catchup ENABLE ROW LEVEL SECURITY;

-- Esami dinamici: il client non invia user_id, viene assegnato dalla sessione autenticata.
CREATE TABLE IF NOT EXISTS dynamic_exams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  exam_date DATE NOT NULL,
  material JSONB NOT NULL DEFAULT '{}'::JSONB,
  study_plan JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived'))
);

ALTER TABLE dynamic_exams ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own dynamic exams" ON dynamic_exams;
DROP POLICY IF EXISTS "Users can insert own dynamic exams" ON dynamic_exams;
DROP POLICY IF EXISTS "Users can update own dynamic exams" ON dynamic_exams;
DROP POLICY IF EXISTS "Users can delete own dynamic exams" ON dynamic_exams;
CREATE POLICY "Users can view own dynamic exams" ON dynamic_exams FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own dynamic exams" ON dynamic_exams FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own dynamic exams" ON dynamic_exams FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own dynamic exams" ON dynamic_exams FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS exam_daily_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES dynamic_exams(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  "pagesCompleted" INTEGER NOT NULL DEFAULT 0,
  "topicsCompleted" JSONB NOT NULL DEFAULT '[]'::JSONB,
  "hoursStudied" NUMERIC(4, 2) NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, exam_id, date)
);

ALTER TABLE exam_daily_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own exam daily progress" ON exam_daily_progress;
DROP POLICY IF EXISTS "Users can insert own exam daily progress" ON exam_daily_progress;
DROP POLICY IF EXISTS "Users can update own exam daily progress" ON exam_daily_progress;
CREATE POLICY "Users can view own exam daily progress" ON exam_daily_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own exam daily progress" ON exam_daily_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own exam daily progress" ON exam_daily_progress FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
ALTER TABLE exam_daily_progress REPLICA IDENTITY FULL;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE exam_daily_progress;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Policy per user_progress
CREATE POLICY "Users can view own progress" ON user_progress
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress" ON user_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON user_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy per user_daily
CREATE POLICY "Users can view own daily" ON user_daily
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own daily" ON user_daily
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own daily" ON user_daily
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy per user_notes
CREATE POLICY "Users can view own notes" ON user_notes
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notes" ON user_notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notes" ON user_notes
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy per user_conf
CREATE POLICY "Users can view own conf" ON user_conf
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own conf" ON user_conf
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own conf" ON user_conf
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy per user_check
CREATE POLICY "Users can view own check" ON user_check
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own check" ON user_check
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own check" ON user_check
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy per user_sessions
CREATE POLICY "Users can view own sessions" ON user_sessions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON user_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy per user_catchup
CREATE POLICY "Users can view own catchup" ON user_catchup
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own catchup" ON user_catchup
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own catchup" ON user_catchup
  FOR UPDATE USING (auth.uid() = user_id);