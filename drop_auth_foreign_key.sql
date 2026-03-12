-- Run this in the Supabase SQL Editor to decouple public.users from Supabase Auth

-- 1. Drop the foreign key constraint that requires users to exist in auth.users
ALTER TABLE public.users DROP CONSTRAINT users_id_fkey;

-- 2. Alter the id column to generate its own random UUID by default
ALTER TABLE public.users ALTER COLUMN id SET DEFAULT gen_random_uuid();
