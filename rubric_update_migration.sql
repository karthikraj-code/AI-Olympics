-- Update rubrics for AI Olympics rounds
-- Each rubric consists of 3 criteria worth 5 marks each (Total 15)

-- Add criteria_scores column to store individual marks
ALTER TABLE public.scores ADD COLUMN IF NOT EXISTS criteria_scores JSONB DEFAULT '{}'::jsonb;

-- AI Bias Investigation
UPDATE public.rounds 
SET rubric = '{"Bias Identification": 5, "Explanation of bias": 5, "Source of Bias": 5}'::jsonb
WHERE id = '2f11f16f-8648-4869-93a5-f41775ade9ec';

-- T-Learn Round
UPDATE public.rounds 
SET rubric = '{"Concept Understanding": 5, "Concept Explanation": 5, "AI Usage & Exploration": 5}'::jsonb
WHERE id = 'd3cd11bf-e205-41bb-817d-397dcee1c5af';

-- Debate with AI
UPDATE public.rounds 
SET rubric = '{"Argument Construction": 5, "Response to AI Counterpoints": 5, "Use of Evidence & Examples": 5}'::jsonb
WHERE id = '53050402-1fc2-4d79-bc1a-7b9bdb35239e';

-- Worst UI Challenge
UPDATE public.rounds 
SET rubric = '{"Creativity of Design": 5, "User Frustration Factor": 5, "Functionality": 5}'::jsonb
WHERE id = 'f6d1a0ad-75cd-42db-8290-4b25d670c66b';
