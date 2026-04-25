
-- Fix function search path
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- Replace broad SELECT policies with object-name-required reads (no listing)
DROP POLICY IF EXISTS "Public read avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public read backgrounds" ON storage.objects;
DROP POLICY IF EXISTS "Public read audio" ON storage.objects;

-- Allow read only when the request targets a specific object (length(name) > 0 and contains '/')
CREATE POLICY "Read avatar object" ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars' AND position('/' in name) > 0);
CREATE POLICY "Read background object" ON storage.objects FOR SELECT
  USING (bucket_id = 'backgrounds' AND position('/' in name) > 0);
CREATE POLICY "Read audio object" ON storage.objects FOR SELECT
  USING (bucket_id = 'audio' AND position('/' in name) > 0);
