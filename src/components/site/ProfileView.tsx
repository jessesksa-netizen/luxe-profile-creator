import { useEffect } from "react";
import * as Icons from "lucide-react";
import type { Profile, ProfileLink, ProfileBadge } from "@/lib/use-profile";
import { AmbientEffects } from "@/components/effects/AmbientEffects";
import { CursorTrail } from "@/components/effects/CursorTrail";
import { MusicPlayer } from "@/components/site/MusicPlayer";
import { BG_PRESETS } from "@/lib/bg-presets";
import { supabase } from "@/integrations/supabase/client";

function Icon({ name, className, style }: { name?: string | null; className?: string; style?: React.CSSProperties }) {
  const key = (name || "Link") as keyof typeof Icons;
  const Comp = (Icons[key] as React.ComponentType<{ className?: string; style?: React.CSSProperties }>) || Icons.Link;
  return <Comp className={className} style={style} />;
}

export function ProfileView({ profile, links, badges, autoPlayAudio = false }: { profile: Profile; links: ProfileLink[]; badges: ProfileBadge[]; autoPlayAudio?: boolean }) {
  useEffect(() => {
    supabase.from("profiles").update({ view_count: (profile.view_count ?? 0) + 1 }).eq("id", profile.id).then(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.id]);

  const accent = profile.accent_color || "#a855f7";
  const text = profile.text_color || "#ffffff";
  const bgUrl = profile.background_url;
  // background_type: "image" | "video" | "preset:<id>"
  const bgType = (profile as unknown as { background_type?: string }).background_type ?? "image";
  const preset = bgType.startsWith("preset:") ? BG_PRESETS.find((p) => p.id === bgType.slice(7)) : null;

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black" style={{ color: text }}>
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        {preset ? (
          preset.render ? (
            <div className="absolute inset-0">{preset.render()}</div>
          ) : (
            <div className="h-full w-full" style={preset.css} />
          )
        ) : bgUrl && bgType === "video" ? (
          <video
            src={bgUrl}
            autoPlay
            muted
            loop
            playsInline
            className="h-full w-full object-cover"
            style={{ filter: `blur(${profile.background_blur}px)`, opacity: profile.background_opacity, transform: "scale(1.1)" }}
          />
        ) : bgUrl ? (
          <img
            src={bgUrl}
            alt=""
            className="h-full w-full object-cover"
            style={{ filter: `blur(${profile.background_blur}px)`, opacity: profile.background_opacity, transform: "scale(1.1)" }}
          />
        ) : (
          <div className="h-full w-full" style={BG_PRESETS[0].css} />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />
      </div>

      <AmbientEffects effect={profile.effect} color={accent} />
      <CursorTrail enabled={profile.cursor_effect === "trail"} color={accent} />

      {profile.show_views && (
        <div className="absolute top-5 right-5 z-20 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-xs">
          <Icons.Eye className="h-3 w-3 opacity-70" />
          <span className="tabular-nums opacity-90">{(profile.view_count ?? 0).toLocaleString()}</span>
        </div>
      )}

      {/* Card */}
      <div className="relative z-10 min-h-screen grid place-items-center px-4 py-12">
        <div
          className="w-full max-w-md animate-fade-up"
          style={{ filter: profile.profile_blur ? `blur(${profile.profile_blur}px)` : undefined, opacity: profile.profile_opacity }}
        >
          <div
            className="relative rounded-2xl overflow-hidden border border-white/[0.08] shadow-2xl"
            style={{ background: "rgba(10, 10, 12, 0.72)", backdropFilter: "blur(28px) saturate(140%)", WebkitBackdropFilter: "blur(28px) saturate(140%)" }}
          >
            <div className="relative h-36 overflow-hidden">
              {preset ? (
                <div className="absolute inset-0" style={preset.css} />
              ) : bgUrl && bgType !== "video" ? (
                <img src={bgUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${accent}, ${accent}33)` }} />
              )}
              <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-[rgba(10,10,12,0.95)]" />
            </div>

            <div className="relative -mt-12 flex justify-center">
              <div className="relative">
                <div className="absolute -inset-1 rounded-full blur-md opacity-60" style={{ background: accent }} />
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.username}
                    className="relative h-24 w-24 rounded-full object-cover ring-4 ring-[rgba(10,10,12,0.95)]"
                    style={{ boxShadow: `0 0 24px ${accent}99` }}
                  />
                ) : (
                  <div className="relative h-24 w-24 rounded-full ring-4 ring-[rgba(10,10,12,0.95)]" style={{ background: `linear-gradient(135deg, ${accent}, ${accent}55)` }} />
                )}
              </div>
            </div>

            <div className="px-6 pt-4 pb-6">
              <div className="text-center">
                <h1 className="text-2xl font-bold tracking-tight">
                  {profile.display_name || profile.username}
                </h1>
                <p className="text-sm mt-0.5" style={{ color: accent }}>@{profile.username}</p>
              </div>

              {profile.bio && (
                <p className="mt-3 text-sm text-center text-white/70 leading-relaxed whitespace-pre-line">{profile.bio}</p>
              )}

              {badges.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  {badges.map((b) => (
                    <div
                      key={b.id}
                      title={b.label}
                      className="h-8 w-8 rounded-full grid place-items-center border transition hover:scale-110"
                      style={{ background: `${b.color}1a`, borderColor: `${b.color}55`, boxShadow: `0 0 10px ${b.color}33` }}
                    >
                      <Icon name={b.icon} className="h-4 w-4" style={{ color: b.color }} />
                    </div>
                  ))}
                </div>
              )}

              {(badges.length > 0 || profile.bio) && links.length > 0 && (
                <div className="my-5 h-px bg-white/[0.06]" />
              )}

              {links.length > 0 && (
                <div className="grid gap-2">
                  {links.map((l) => (
                    <a
                      key={l.id}
                      href={l.url}
                      target="_blank"
                      rel="noreferrer"
                      className="group relative flex items-center gap-3 rounded-xl px-4 py-3 bg-black/40 border border-white/[0.06] hover:border-white/20 transition-all hover:bg-black/60"
                    >
                      <span className="grid place-items-center h-7 w-7 rounded-md" style={{ background: `${accent}15`, color: accent }}>
                        <Icon name={l.icon} className="h-3.5 w-3.5" />
                      </span>
                      <span className="text-sm font-medium flex-1 text-center text-white/85">{l.label}</span>
                      <Icons.ExternalLink className="h-3.5 w-3.5 text-white/30 group-hover:text-white/70 transition" />
                    </a>
                  ))}
                </div>
              )}

              {profile.audio_url && (
                <div className="mt-5">
                  <MusicPlayer src={profile.audio_url} title={profile.audio_title} color={accent} autoPlay={autoPlayAudio} />
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 text-center text-[10px] tracking-[0.3em] uppercase text-white/30">
            @{profile.username}
          </div>
        </div>
      </div>
    </div>
  );
}
