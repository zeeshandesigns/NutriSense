-- NutriSense AI — Supabase Schema
-- Paste this into: Supabase Dashboard → SQL Editor → New query → Run

-- Auto-create a profiles row whenever a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (new.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- User profiles (goal + dietary restrictions)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  goal text NOT NULL DEFAULT 'curious'
    CHECK (goal IN ('weight_loss', 'muscle_gain', 'curious')),
  restrictions text[] NOT NULL DEFAULT '{}',
  onboarding_complete boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Every food scan result
CREATE TABLE IF NOT EXISTS scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  food_label text NOT NULL,
  confidence float NOT NULL,
  top_3 jsonb,
  nutrition jsonb NOT NULL,
  insight text,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast history queries (most recent first, per user)
CREATE INDEX IF NOT EXISTS scans_user_created
  ON scans (user_id, created_at DESC);

-- Row Level Security — users can only see their own data
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_profile" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "own_scans" ON scans FOR ALL USING (auth.uid() = user_id);
