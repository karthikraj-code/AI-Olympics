-- Create Enum for Roles
CREATE TYPE user_role AS ENUM ('participant', 'organizer', 'judge');

-- Create Users table (extends auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'participant',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Establish teams table
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_name TEXT NOT NULL,
  leader_id UUID REFERENCES public.users(id) NOT NULL,
  invite_code TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(6), 'hex'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team members table
CREATE TABLE public.team_members (
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (team_id, user_id)
);

-- Rounds table
CREATE TABLE public.rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  submission_type JSONB NOT NULL DEFAULT '["text", "file_upload", "link", "quiz"]'::jsonb,
  rubric JSONB DEFAULT '{"Innovation": 10, "Technical feasibility": 10, "Presentation": 10, "Impact": 10}'::jsonb
);

-- Quiz Questions table
CREATE TABLE public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID REFERENCES public.rounds(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer TEXT NOT NULL, -- e.g., 'A', 'B', 'C', 'D'
  marks INTEGER NOT NULL DEFAULT 1
);

-- Submissions table
CREATE TABLE public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  round_id UUID REFERENCES public.rounds(id) ON DELETE CASCADE,
  file_url TEXT,
  link TEXT,
  text_response TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Judge Assignments
CREATE TABLE public.judge_assignments (
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  judge_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  PRIMARY KEY (team_id, judge_id)
);

-- Scores table
CREATE TABLE public.scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  round_id UUID REFERENCES public.rounds(id) ON DELETE CASCADE,
  judge_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  feedback TEXT,
  graded_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (team_id, round_id, judge_id) -- A judge can only score a team's round once
);

-- Leaderboard Config
CREATE TABLE public.leaderboard_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  is_released BOOLEAN DEFAULT false
);

-- Insert initial config
INSERT INTO public.leaderboard_config (id, is_released) VALUES (1, false);

-- Organizer Emails whitelist
CREATE TABLE public.organizer_emails (
  email TEXT PRIMARY KEY,
  added_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Judge Emails whitelist
CREATE TABLE public.judge_emails (
  email TEXT PRIMARY KEY,
  added_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
