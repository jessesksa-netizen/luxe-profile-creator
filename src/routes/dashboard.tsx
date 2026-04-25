import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ALLOWED_DISCORD_ID } from "@/lib/config";
import { useOwnerProfile, useSession, type Profile, type ProfileLink, type ProfileBadge } from "@/lib/use-profile";
import { Loader2, Save, Upload, Plus, Trash2, LogOut, Eye } from "lucide-react";
import { toast, Toaster } from "sonner";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { userId, discordId, ready } = useSession();
  const { profile, links, badges, loading, reload } = useOwnerProfile();
  const nav = useNavigate();

  useEffect(() => {
    if (!ready) return;
    if (!userId) { nav({ to: "/login" }); return; }
    if (discordId !== ALLOWED_DISCORD_ID) {
      supabase.auth.signOut().then(() => nav({ to: "/login" }));
    }
  }, [ready, userId, discordId, nav]);

  if (loading || !ready) {
    return <div className="min-h-screen grid place-items-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }
  if (!userId) return null;
  if (!profile) return <div className="min-h-screen grid place-items-center text-foreground/60">setting up profile…</div>;

  return (
    <DashboardInner profile={profile} links={links} badges={badges} reload={reload} />
  );
}

function DashboardInner({ profile, links, badges, reload }: { profile: Profile; links: ProfileLink[]; badges: ProfileBadge[]; reload: () => void }) {
  const [p, setP] = useState<Profile>(profile);
  const [saving, setSaving] = useState(false);
  const nav = useNavigate();

  useEffect(() => { setP(profile); }, [profile]);

  function set<K extends keyof Profile>(k: K, v: Profile[K]) { setP({ ...p, [k]: v }); }

  async function save() {
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      username: p.username, display_name: p.display_name, bio: p.bio,
      background_blur: p.background_blur, background_opacity: p.background_opacity,
      profile_blur: p.profile_blur, profile_opacity: p.profile_opacity,
      accent_color: p.accent_color, text_color: p.text_color,
      effect: p.effect, cursor_effect: p.cursor_effect,
      show_views: p.show_views, audio_title: p.audio_title,
    }).eq("id", p.id);
    setSaving(false);
    if (error) toast.error(error.message); else { toast.success("saved"); reload(); }
  }

  async function uploadFile(bucket: "avatars" | "backgrounds" | "audio", file: File, field: "avatar_url" | "background_url" | "audio_url") {
    const ext = file.name.split(".").pop();
    const path = `${p.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) { toast.error(error.message); return; }
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    const update = { [field]: data.publicUrl } as Partial<Profile>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: e2 } = await supabase.from("profiles").update(update as any).eq("id", p.id);
    if (e2) toast.error(e2.message); else { toast.success("uploaded"); reload(); }
  }

  return (
    <div className="min-h-screen text-foreground">
      <Toaster theme="dark" position="top-center" />
      {/* ambient bg */}
      <div className="fixed inset-0 -z-10 holo-bg opacity-10" />
      <div className="fixed inset-0 -z-10" style={{ background: "radial-gradient(ellipse at top, transparent, var(--background) 60%)" }} />

      {/* header */}
      <header className="sticky top-0 z-20 backdrop-blur-xl bg-background/60 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.4em] text-foreground/50">dashboard</div>
            <div className="text-lg font-bold holo-text">aura.studio</div>
          </div>
          <div className="flex items-center gap-2">
            <a href="/" className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg glass hover:bg-white/10"><Eye className="h-3.5 w-3.5" /> view</a>
            <button onClick={save} disabled={saving}
              className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg holo-bg text-black disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} save
            </button>
            <button onClick={() => supabase.auth.signOut().then(() => nav({ to: "/login" }))}
              className="h-9 w-9 grid place-items-center rounded-lg glass hover:bg-white/10"><LogOut className="h-4 w-4" /></button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Section title="identity">
            <Field label="username"><input className={inputCls} value={p.username} onChange={(e) => set("username", e.target.value)} /></Field>
            <Field label="display name"><input className={inputCls} value={p.display_name ?? ""} onChange={(e) => set("display_name", e.target.value)} /></Field>
            <Field label="bio" full><textarea rows={3} className={inputCls} value={p.bio ?? ""} onChange={(e) => set("bio", e.target.value)} /></Field>
            <Field label="avatar"><FilePick accept="image/*" onPick={(f) => uploadFile("avatars", f, "avatar_url")} preview={p.avatar_url} /></Field>
            <Field label="background"><FilePick accept="image/*" onPick={(f) => uploadFile("backgrounds", f, "background_url")} preview={p.background_url} /></Field>
          </Section>

          <Section title="background">
            <Slider label="blur" value={p.background_blur} min={0} max={40} onChange={(v) => set("background_blur", v)} />
            <Slider label="opacity" value={p.background_opacity * 100} min={0} max={100} onChange={(v) => set("background_opacity", v / 100)} suffix="%" />
          </Section>

          <Section title="profile card">
            <Slider label="blur" value={p.profile_blur} min={0} max={20} onChange={(v) => set("profile_blur", v)} />
            <Slider label="opacity" value={p.profile_opacity * 100} min={0} max={100} onChange={(v) => set("profile_opacity", v / 100)} suffix="%" />
          </Section>

          <Section title="colors">
            <Field label="accent">
              <div className="flex items-center gap-3">
                <input type="color" value={p.accent_color} onChange={(e) => set("accent_color", e.target.value)} className="h-10 w-14 rounded cursor-pointer bg-transparent" />
                <input className={inputCls} value={p.accent_color} onChange={(e) => set("accent_color", e.target.value)} />
              </div>
            </Field>
            <Field label="text">
              <div className="flex items-center gap-3">
                <input type="color" value={p.text_color} onChange={(e) => set("text_color", e.target.value)} className="h-10 w-14 rounded cursor-pointer bg-transparent" />
                <input className={inputCls} value={p.text_color} onChange={(e) => set("text_color", e.target.value)} />
              </div>
            </Field>
          </Section>

          <Section title="effects">
            <Field label="ambient">
              <select className={inputCls} value={p.effect} onChange={(e) => set("effect", e.target.value)}>
                {["none","sparkles","snow","rain","hearts"].map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </Field>
            <Field label="cursor">
              <select className={inputCls} value={p.cursor_effect} onChange={(e) => set("cursor_effect", e.target.value)}>
                {["none","trail"].map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </Field>
            <Field label="show views">
              <button onClick={() => set("show_views", !p.show_views)}
                className={`px-3 py-1.5 rounded-lg text-sm ${p.show_views ? "holo-bg text-black" : "glass"}`}>
                {p.show_views ? "on" : "off"}
              </button>
            </Field>
          </Section>

          <Section title="music">
            <Field label="audio file"><FilePick accept="audio/*" onPick={(f) => uploadFile("audio", f, "audio_url")} preview={p.audio_url ? "🎵 uploaded" : null} /></Field>
            <Field label="track title"><input className={inputCls} value={p.audio_title ?? ""} onChange={(e) => set("audio_title", e.target.value)} /></Field>
          </Section>

          <LinksManager userId={p.id} links={links} reload={reload} />
          <BadgesManager userId={p.id} badges={badges} reload={reload} />
        </div>

        {/* live preview */}
        <aside className="space-y-3">
          <div className="text-xs uppercase tracking-[0.4em] text-foreground/50 px-1">live preview</div>
          <div className="sticky top-24 rounded-2xl overflow-hidden glass holo-border h-[640px]">
            <iframe src="/" title="preview" className="w-full h-full bg-black" />
          </div>
        </aside>
      </main>
    </div>
  );
}

const inputCls = "w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-white/30 transition";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="glass holo-border rounded-2xl p-5">
      <h2 className="text-xs uppercase tracking-[0.4em] text-foreground/60 mb-4">{title}</h2>
      <div className="grid sm:grid-cols-2 gap-4">{children}</div>
    </section>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={`block ${full ? "sm:col-span-2" : ""}`}>
      <div className="text-[11px] uppercase tracking-wider text-foreground/50 mb-1.5">{label}</div>
      {children}
    </label>
  );
}

function Slider({ label, value, min, max, onChange, suffix }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void; suffix?: string }) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-3">
        <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 accent-[var(--holo-1)]" />
        <span className="text-xs tabular-nums text-foreground/60 w-12 text-right">{Math.round(value)}{suffix ?? ""}</span>
      </div>
    </Field>
  );
}

function FilePick({ accept, onPick, preview }: { accept: string; onPick: (f: File) => void; preview?: string | null }) {
  return (
    <label className="flex items-center gap-3 rounded-lg bg-white/5 border border-white/10 px-3 py-2 cursor-pointer hover:bg-white/10 transition">
      <Upload className="h-4 w-4 text-foreground/60" />
      <span className="text-xs text-foreground/70 truncate flex-1">{preview ? "replace" : "choose file"}</span>
      {preview && (preview.startsWith("http") ? <img src={preview} alt="" className="h-8 w-8 rounded object-cover" /> : <span className="text-xs">{preview}</span>)}
      <input type="file" accept={accept} className="hidden" onChange={(e) => e.target.files?.[0] && onPick(e.target.files[0])} />
    </label>
  );
}

function LinksManager({ userId, links, reload }: { userId: string; links: ProfileLink[]; reload: () => void }) {
  const [label, setLabel] = useState(""); const [url, setUrl] = useState(""); const [icon, setIcon] = useState("Link");
  async function add() {
    if (!label || !url) return;
    const { error } = await supabase.from("profile_links").insert({ user_id: userId, label, url, icon, position: links.length });
    if (error) toast.error(error.message); else { setLabel(""); setUrl(""); setIcon("Link"); reload(); }
  }
  async function remove(id: string) {
    const { error } = await supabase.from("profile_links").delete().eq("id", id);
    if (error) toast.error(error.message); else reload();
  }
  return (
    <section className="glass holo-border rounded-2xl p-5">
      <h2 className="text-xs uppercase tracking-[0.4em] text-foreground/60 mb-4">links</h2>
      <div className="space-y-2 mb-4">
        {links.map((l) => (
          <div key={l.id} className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2">
            <span className="text-xs text-foreground/50 w-20 truncate">{l.icon}</span>
            <span className="text-sm flex-1 truncate">{l.label}</span>
            <span className="text-xs text-foreground/50 truncate max-w-[200px]">{l.url}</span>
            <button onClick={() => remove(l.id)} className="h-7 w-7 grid place-items-center rounded text-destructive hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
        ))}
      </div>
      <div className="grid sm:grid-cols-4 gap-2">
        <input className={inputCls} placeholder="label" value={label} onChange={(e) => setLabel(e.target.value)} />
        <input className={inputCls + " sm:col-span-2"} placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} />
        <input className={inputCls} placeholder="lucide icon (e.g. Github)" value={icon} onChange={(e) => setIcon(e.target.value)} />
      </div>
      <button onClick={add} className="mt-3 inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg holo-bg text-black"><Plus className="h-4 w-4" /> add link</button>
    </section>
  );
}

function BadgesManager({ userId, badges, reload }: { userId: string; badges: ProfileBadge[]; reload: () => void }) {
  const [label, setLabel] = useState(""); const [icon, setIcon] = useState("Star"); const [color, setColor] = useState("#a855f7");
  async function add() {
    if (!label) return;
    const { error } = await supabase.from("profile_badges").insert({ user_id: userId, label, icon, color, position: badges.length });
    if (error) toast.error(error.message); else { setLabel(""); reload(); }
  }
  async function remove(id: string) {
    const { error } = await supabase.from("profile_badges").delete().eq("id", id);
    if (error) toast.error(error.message); else reload();
  }
  return (
    <section className="glass holo-border rounded-2xl p-5">
      <h2 className="text-xs uppercase tracking-[0.4em] text-foreground/60 mb-4">badges</h2>
      <div className="flex flex-wrap gap-2 mb-4">
        {badges.map((b) => (
          <span key={b.id} className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs glass" style={{ borderColor: b.color, color: b.color }}>
            {b.label}
            <button onClick={() => remove(b.id)}><Trash2 className="h-3 w-3" /></button>
          </span>
        ))}
      </div>
      <div className="grid sm:grid-cols-4 gap-2">
        <input className={inputCls} placeholder="label" value={label} onChange={(e) => setLabel(e.target.value)} />
        <input className={inputCls} placeholder="icon (Star)" value={icon} onChange={(e) => setIcon(e.target.value)} />
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 rounded cursor-pointer bg-transparent" />
        <button onClick={add} className="inline-flex items-center justify-center gap-1.5 text-sm px-3 py-2 rounded-lg holo-bg text-black"><Plus className="h-4 w-4" /> add</button>
      </div>
    </section>
  );
}
