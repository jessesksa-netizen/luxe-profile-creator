import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileLink = Database["public"]["Tables"]["profile_links"]["Row"];
export type ProfileBadge = Database["public"]["Tables"]["profile_badges"]["Row"];

export function useOwnerProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [links, setLinks] = useState<ProfileLink[]>([]);
  const [badges, setBadges] = useState<ProfileBadge[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    // Owner profile = the row marked is_owner; fallback to oldest profile.
    let { data: p } = await supabase.from("profiles").select("*").eq("is_owner", true).maybeSingle();
    if (!p) {
      const { data: fallback } = await supabase.from("profiles").select("*").order("created_at", { ascending: true }).limit(1).maybeSingle();
      p = fallback ?? null;
    }
    if (p) {
      setProfile(p);
      const [{ data: l }, { data: b }] = await Promise.all([
        supabase.from("profile_links").select("*").eq("user_id", p.id).order("position"),
        supabase.from("profile_badges").select("*").eq("user_id", p.id).order("position"),
      ]);
      setLinks(l ?? []);
      setBadges(b ?? []);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);
  return { profile, links, badges, loading, reload: load };
}

export function useProfileBySlug(slug: string | undefined) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [links, setLinks] = useState<ProfileLink[]>([]);
  const [badges, setBadges] = useState<ProfileBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  async function load() {
    if (!slug) return;
    setLoading(true); setNotFound(false);
    const { data: p } = await supabase.from("profiles").select("*").ilike("slug", slug).maybeSingle();
    if (!p) { setNotFound(true); setLoading(false); return; }
    setProfile(p);
    const [{ data: l }, { data: b }] = await Promise.all([
      supabase.from("profile_links").select("*").eq("user_id", p.id).order("position"),
      supabase.from("profile_badges").select("*").eq("user_id", p.id).order("position"),
    ]);
    setLinks(l ?? []);
    setBadges(b ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [slug]);
  return { profile, links, badges, loading, notFound, reload: load };
}

/** Loads the profile row for the currently logged-in user (used in dashboard). */
export function useMyProfile(userId: string | null) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [links, setLinks] = useState<ProfileLink[]>([]);
  const [badges, setBadges] = useState<ProfileBadge[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    const { data: p } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    if (p) {
      setProfile(p);
      const [{ data: l }, { data: b }] = await Promise.all([
        supabase.from("profile_links").select("*").eq("user_id", p.id).order("position"),
        supabase.from("profile_badges").select("*").eq("user_id", p.id).order("position"),
      ]);
      setLinks(l ?? []);
      setBadges(b ?? []);
    }
    setLoading(false);
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [userId]);
  return { profile, links, badges, loading, reload: load };
}

export function useSession() {
  const [userId, setUserId] = useState<string | null>(null);
  const [discordId, setDiscordId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user?.id ?? null);
      const meta = session?.user?.user_metadata as Record<string, unknown> | undefined;
      setDiscordId((meta?.provider_id as string) ?? (meta?.sub as string) ?? null);
    });
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user?.id ?? null);
      const meta = data.session?.user?.user_metadata as Record<string, unknown> | undefined;
      setDiscordId((meta?.provider_id as string) ?? (meta?.sub as string) ?? null);
      setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { userId, discordId, ready };
}
