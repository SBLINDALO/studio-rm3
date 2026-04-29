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