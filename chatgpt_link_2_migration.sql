-- Add second ChatGPT link field to submissions
ALTER TABLE public.submissions ADD COLUMN chatgpt_link_2 TEXT;
