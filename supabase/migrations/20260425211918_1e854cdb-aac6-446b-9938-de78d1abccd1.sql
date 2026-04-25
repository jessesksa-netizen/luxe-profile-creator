
-- Profile customization (singleton-ish per user, but we allow many users; only one will be allowed in via Discord ID gate)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  discord_id TEXT,
  username TEXT NOT NULL DEFAULT 'user',
  display_name TEXT,
  bio TEXT DEFAULT '',
  avatar_url TEXT,
  background_url TEXT,
  audio_url TEXT,
  audio_title TEXT,
  background_blur INT NOT NULL DEFAULT 8,
  background_opacity NUMERIC NOT NULL DEFAULT 0.6,
  profile_blur INT NOT NULL DEFAULT 0,
  profile_opacity NUMERIC NOT NULL DEFAULT 1,
  accent_color TEXT NOT NULL DEFAULT '#a855f7',
  text_color TEXT NOT NULL DEFAULT '#ffffff',
  effect TEXT NOT NULL DEFAULT 'sparkles', -- none | sparkles | snow | rain | hearts
  cursor_effect TEXT NOT NULL DEFAULT 'trail', -- none | trail | glow
  show_views BOOLEAN NOT NULL DEFAULT true,
  view_count INT NOT NULL DEFAULT 0,
  monochrome_icons BOOLEAN NOT NULL DEFAULT false,
  typewriter_text TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.profile_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  icon TEXT, -- lucide icon name or platform key
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.profile_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'star',
  color TEXT NOT NULL DEFAULT '#a855f7',
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_badges ENABLE ROW LEVEL SECURITY;

-- Public read (so visitors can view the profile)
CREATE POLICY "profiles public read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "links public read" ON public.profile_links FOR SELECT USING (true);
CREATE POLICY "badges public read" ON public.profile_badges FOR SELECT USING (true);

-- Owner write
CREATE POLICY "profiles owner write" ON public.profiles FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "links owner write" ON public.profile_links FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "badges owner write" ON public.profile_badges FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Auto-create profile row on signup, capture Discord ID from raw_user_meta_data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, discord_id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'provider_id', NEW.raw_user_meta_data->>'sub'),
    COALESCE(NEW.raw_user_meta_data->>'user_name', NEW.raw_user_meta_data->>'name', 'user'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  ) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES
  ('avatars','avatars',true),
  ('backgrounds','backgrounds',true),
  ('audio','audio',true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Public read backgrounds" ON storage.objects FOR SELECT USING (bucket_id = 'backgrounds');
CREATE POLICY "Public read audio" ON storage.objects FOR SELECT USING (bucket_id = 'audio');

CREATE POLICY "Owner upload avatars" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Owner upload backgrounds" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'backgrounds' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Owner upload audio" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'audio' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Owner update avatars" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Owner update backgrounds" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'backgrounds' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Owner update audio" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'audio' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Owner delete avatars" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Owner delete backgrounds" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'backgrounds' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Owner delete audio" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'audio' AND (storage.foldername(name))[1] = auth.uid()::text);
