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
    // Owner profile = the most recently updated one (single-tenant site)
    const { data: p } = await supabase.from("profiles").select("*").order("updated_at", { ascending: false }).limit(1).maybeSingle();
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
