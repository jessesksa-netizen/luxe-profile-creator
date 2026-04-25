import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ownerLogin, userLogin } from "@/server/owner-auth.functions";
import { Loader2, Lock } from "lucide-react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const [slug, setSlug] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const tokens = slug.trim()
        ? await userLogin({ data: { slug: slug.trim(), password } })
        : await ownerLogin({ data: { password } });
      const { error: setErr } = await supabase.auth.setSession({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
      });
      if (setErr) throw setErr;
      nav({ to: "/dashboard" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "login failed");
      setBusy(false);
    }
  }

  return (
    <div className="relative min-h-screen grid place-items-center px-4">
      <div className="absolute inset-0 -z-10 holo-bg opacity-20" />
      <div className="absolute inset-0 -z-10" style={{ background: "radial-gradient(ellipse at center, transparent, var(--background) 70%)" }} />

      <form onSubmit={onSubmit} className="glass holo-border rounded-3xl p-8 w-full max-w-sm text-center glow animate-fade-up">
        <div className="mx-auto h-12 w-12 rounded-2xl grid place-items-center holo-bg mb-3"><Lock className="h-5 w-5" /></div>
        <h1 className="text-3xl font-bold holo-text">welcome back</h1>
        <p className="text-sm text-foreground/70 mt-2">leave username blank for owner login</p>

        <input
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="username (optional)"
          className="mt-6 w-full rounded-xl bg-background/40 border border-white/10 px-4 py-3 text-center outline-none focus:border-white/30 transition"
        />

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="mt-3 w-full rounded-xl bg-background/40 border border-white/10 px-4 py-3 text-center tracking-widest outline-none focus:border-white/30 transition"
        />

        <button
          type="submit"
          disabled={busy || !password}
          className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-medium text-white transition hover:scale-[1.02] disabled:opacity-50 holo-bg"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "unlock dashboard"}
        </button>

        {error && <p className="mt-4 text-xs text-destructive">{error}</p>}
        <p className="mt-6 text-[10px] text-foreground/40 tracking-widest uppercase">private</p>
      </form>
    </div>
  );
}
