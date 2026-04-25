import { useEffect, useState } from "react";

export function Splash({ onEnter, accent = "#a855f7", audioSrc }: { onEnter: () => void; accent?: string; audioSrc?: string | null }) {
  const [hovered, setHovered] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") handleEnter(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleEnter() {
    if (exiting) return;
    setExiting(true);
    if (audioSrc) {
      try {
        const a = new Audio(audioSrc); a.volume = 0.5; a.play().catch(() => {});
        // attach to window so it survives unmount briefly
        (window as unknown as { __aura_audio?: HTMLAudioElement }).__aura_audio = a;
      } catch { /* ignore */ }
    }
    setTimeout(onEnter, 600);
  }

  return (
    <button
      type="button"
      onClick={handleEnter}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`fixed inset-0 z-50 grid place-items-center cursor-pointer transition-opacity duration-500 ${exiting ? "opacity-0" : "opacity-100"}`}
      aria-label="click to enter"
    >
      {/* animated background */}
      <div className="absolute inset-0 holo-bg opacity-30" />
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-background/60 to-background"
        style={{ background: "radial-gradient(ellipse at center, transparent 0%, var(--background) 80%)" }} />

      {/* floating orbs */}
      <div className="absolute h-72 w-72 rounded-full holo-bg blur-3xl opacity-60 animate-float" />
      <div className="absolute h-40 w-40 rounded-full blur-3xl opacity-50 animate-float" style={{ background: accent, animationDelay: "1s" }} />

      <div className={`relative text-center select-none transition-transform duration-300 ${hovered ? "scale-105" : "scale-100"}`}>
        <div className="text-[10px] tracking-[0.6em] uppercase text-foreground/60 mb-3 animate-pulse-soft">tap anywhere</div>
        <h1 className="text-6xl sm:text-8xl font-bold tracking-tight holo-text">click to enter</h1>
        <div className="mt-6 mx-auto h-px w-32 holo-bg opacity-60" />
        <div className="mt-3 text-xs tracking-[0.4em] uppercase text-foreground/50">↵  enter</div>
      </div>
    </button>
  );
}
