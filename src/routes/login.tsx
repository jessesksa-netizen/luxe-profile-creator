import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ALLOWED_DISCORD_ID } from "@/lib/config";
import { useSession } from "@/lib/use-profile";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { userId, discordId, ready } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    if (!ready) return;
    if (userId && discordId) {
      if (discordId === ALLOWED_DISCORD_ID) {
        nav({ to: "/dashboard" });
      } else {
        setError(`access denied — your discord id (${discordId}) is not authorized.`);
        supabase.auth.signOut();
      }
    }
  }, [ready, userId, discordId, nav]);

  async function signIn() {
    setBusy(true); setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: { redirectTo: window.location.origin + "/login" },
    });
    if (error) { setError(error.message); setBusy(false); }
  }

  return (
    <div className="relative min-h-screen grid place-items-center px-4">
      <div className="absolute inset-0 -z-10 holo-bg opacity-20" />
      <div className="absolute inset-0 -z-10" style={{ background: "radial-gradient(ellipse at center, transparent, var(--background) 70%)" }} />

      <div className="glass holo-border rounded-3xl p-8 w-full max-w-sm text-center glow animate-fade-up">
        <h1 className="text-3xl font-bold holo-text">welcome back</h1>
        <p className="text-sm text-foreground/70 mt-2">authenticate with discord to continue</p>

        <button
          onClick={signIn}
          disabled={busy}
          className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-medium text-white transition hover:scale-[1.02] disabled:opacity-50"
          style={{ background: "#5865F2", boxShadow: "0 0 30px #5865F244" }}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M20.317 4.369A19.79 19.79 0 0 0 16.558 3a14.2 14.2 0 0 0-.617 1.27 18.27 18.27 0 0 0-5.487 0A14.2 14.2 0 0 0 9.838 3a19.7 19.7 0 0 0-3.762 1.37C2.79 9.046 1.99 13.58 2.39 18.058A19.9 19.9 0 0 0 8.413 21c.488-.66.92-1.36 1.293-2.094a13 13 0 0 1-2.04-.978c.171-.124.339-.253.5-.385 3.927 1.793 8.18 1.793 12.06 0 .163.132.33.261.5.385a13 13 0 0 1-2.043.979 14 14 0 0 0 1.293 2.092 19.85 19.85 0 0 0 6.025-2.94c.47-5.18-.802-9.673-3.685-13.69M8.02 15.331c-1.183 0-2.157-1.085-2.157-2.42 0-1.333.955-2.42 2.157-2.42 1.21 0 2.176 1.094 2.157 2.42 0 1.335-.955 2.42-2.157 2.42m7.974 0c-1.183 0-2.157-1.085-2.157-2.42 0-1.333.955-2.42 2.157-2.42 1.21 0 2.176 1.094 2.157 2.42 0 1.335-.946 2.42-2.157 2.42"/></svg>
          )}
          continue with discord
        </button>

        {error && <p className="mt-4 text-xs text-destructive">{error}</p>}
        <p className="mt-6 text-[10px] text-foreground/40 tracking-widest uppercase">private — owner only</p>
      </div>
    </div>
  );
}
