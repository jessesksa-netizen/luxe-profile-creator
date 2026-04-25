-- Add slug + is_owner to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS is_owner boolean NOT NULL DEFAULT false;

-- Backfill slug from username for existing rows where missing
UPDATE public.profiles SET slug = username WHERE slug IS NULL;

-- Enforce unique non-null slugs (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_slug_unique_ci ON public.profiles (lower(slug)) WHERE slug IS NOT NULL;

-- Validation trigger: slug must be url-safe
CREATE OR REPLACE FUNCTION public.validate_profile_slug()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.slug IS NOT NULL THEN
    IF NEW.slug !~ '^[a-zA-Z0-9_-]{1,40}$' THEN
      RAISE EXCEPTION 'slug must be 1-40 chars: letters, numbers, _ or -';
    END IF;
    IF lower(NEW.slug) IN ('dashboard','login','api','admin','assets','public','auth','_root') THEN
      RAISE EXCEPTION 'slug is reserved';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_profile_slug ON public.profiles;
CREATE TRIGGER trg_validate_profile_slug
BEFORE INSERT OR UPDATE OF slug ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.validate_profile_slug();