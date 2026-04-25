import { useEffect } from "react";
import * as Icons from "lucide-react";
import type { Profile, ProfileLink, ProfileBadge } from "@/lib/use-profile";
import { AmbientEffects } from "@/components/effects/AmbientEffects";
import { CursorTrail } from "@/components/effects/CursorTrail";
import { MusicPlayer } from "@/components/site/MusicPlayer";
import { supabase } from "@/integrations/supabase/client";

function Icon({ name, className }: { name?: string | null; className?: string }) {
  const key = (name || "Link") as keyof typeof Icons;
  const Comp = (Icons[key] as React.ComponentType<{ className?: string }>) || Icons.Link;
  return <Comp className={className} />;
}

export function ProfileView({ profile, links, badges }: { profile: Profile; links: ProfileLink[]; badges: ProfileBadge[] }) {
  useEffect(() => {
    // increment view count (best-effort)
    supabase.rpc as unknown;
    supabase.from("profiles").update({ view_count: (profile.view_count ?? 0) + 1 }).eq("id", profile.id).then(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.id]);

  const accent = profile.accent_color || "#a855f7";
  const text = profile.text_color || "#ffffff";
  const bgUrl = profile.background_url;

  return (
    <div className="relative min-h-screen w-full overflow-hidden" style={{ color: text }}>
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        {bgUrl ? (
          <img src={bgUrl} alt="" className="h-full w-full object-cover"
            style={{ filter: `blur(${profile.background_blur}px)`, opacity: profile.background_opacity }} />
        ) : (
          <div className="h-full w-full holo-bg opacity-30" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/70" />
      </div>

      <AmbientEffects effect={profile.effect} color={accent} />
      <CursorTrail enabled={profile.cursor_effect === "trail"} color={accent} />

      {/* Card */}
      <div className="relative z-10 min-h-screen grid place-items-center px-4 py-16">
        <div
          className="glass holo-border rounded-3xl p-8 sm:p-10 w-full max-w-md text-center animate-fade-up glow"
          style={{ filter: `blur(${profile.profile_blur}px)`, opacity: profile.profile_opacity }}
        >
          <div className="relative mx-auto h-32 w-32 mb-5">
            <div className="absolute inset-0 rounded-full holo-bg blur-xl opacity-70 animate-pulse-soft" />
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.username}
                className="relative h-32 w-32 rounded-full object-cover ring-2 ring-white/20"
                style={{ boxShadow: `0 0 40px ${accent}` }} />
            ) : (
              <div className="relative h-32 w-32 rounded-full holo-bg" />
            )}
          </div>

          <h1 className="text-3xl font-bold tracking-tight" style={{ textShadow: `0 0 24px ${accent}` }}>
            {profile.display_name || profile.username}
          </h1>
          <p className="text-sm opacity-70 mt-1">@{profile.username}</p>

          {badges.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {badges.map((b) => (
                <span key={b.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium glass"
                  style={{ borderColor: b.color, color: b.color, boxShadow: `0 0 12px ${b.color}66` }}>
                  <Icon name={b.icon} className="h-3 w-3" />
                  {b.label}
                </span>
              ))}
            </div>
          )}

          {profile.bio && <p className="mt-5 text-sm leading-relaxed opacity-90 whitespace-pre-line">{profile.bio}</p>}

          {links.length > 0 && (
            <div className="grid gap-2 mt-6">
              {links.map((l) => (
                <a key={l.id} href={l.url} target="_blank" rel="noreferrer"
                  className="group flex items-center gap-3 rounded-xl px-4 py-3 glass hover:scale-[1.02] transition-transform"
                  style={{ borderColor: `${accent}44` }}>
                  <span className="grid place-items-center h-8 w-8 rounded-lg"
                    style={{ background: `${accent}22`, color: accent }}>
                    <Icon name={l.icon} className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-medium flex-1 text-left">{l.label}</span>
                  <Icons.ArrowUpRight className="h-4 w-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition" />
                </a>
              ))}
            </div>
          )}

          {profile.audio_url && (
            <div className="mt-6 flex justify-center">
              <MusicPlayer src={profile.audio_url} title={profile.audio_title} color={accent} />
            </div>
          )}

          {profile.show_views && (
            <div className="mt-6 text-xs opacity-60 inline-flex items-center gap-1.5">
              <Icons.Eye className="h-3 w-3" /> {profile.view_count.toLocaleString()} views
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
