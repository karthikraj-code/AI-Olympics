CREATE TABLE public.topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID REFERENCES public.rounds(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('cse', 'other')),
  name TEXT NOT NULL,
  max_teams INTEGER NOT NULL DEFAULT 3
);

CREATE TABLE public.topic_selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  round_id UUID REFERENCES public.rounds(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, round_id, category) -- Note: we must enforce one per category per team, so we might need a category column or complex constraint. Let's just rely on application logic or UNIQUE(team_id, round_id, topic_id) and limit it to 2 rows.
);

-- Actually, to enforce database-level mutually exclusive categories for a team:
ALTER TABLE public.topic_selections ADD COLUMN category TEXT NOT NULL CHECK (category IN ('cse', 'other'));
ALTER TABLE public.topic_selections DROP CONSTRAINT IF EXISTS topic_selections_team_id_round_id_topic_id_key;
ALTER TABLE public.topic_selections ADD CONSTRAINT topic_selections_team_id_round_id_category_key UNIQUE(team_id, round_id, category);
