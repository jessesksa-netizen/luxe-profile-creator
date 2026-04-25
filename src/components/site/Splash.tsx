import { useEffect, useState } from "react";

export function Splash({ onEnter, accent = "#a855f7", audioSrc, backgroundUrl, backgroundBlur = 30, username }: { onEnter: () => void; accent?: string; audioSrc?: string | null; backgroundUrl?: string | null; backgroundBlur?: number; username?: string }) {
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
        (window as unknown as { __aura_audio?: HTMLAudioElement }).__aura_audio = a;
      } catch { /* ignore */ }
    }
    setTimeout(onEnter, 500);
  }

  return (
    <button
      type="button"
      onClick={handleEnter}
      className={`fixed inset-0 z-50 grid place-items-center cursor-pointer transition-opacity duration-500 ${exiting ? "opacity-0" : "opacity-100"}`}
      aria-label="click to enter"
    >
      {/* Background image - heavily blurred */}
      <div className="absolute inset-0 bg-black">
        {backgroundUrl && (
          <img
            src={backgroundUrl}
            alt=""
            className="h-full w-full object-cover opacity-40"
            style={{ filter: `blur(${Math.max(backgroundBlur, 24)}px) brightness(0.5)` }}
          />
        )}
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.85) 75%)" }} />
      </div>

      <div className="relative text-center select-none">
        <div className="text-[10px] tracking-[0.5em] uppercase text-white/50 mb-3">click anywhere</div>
        <h1 className="text-2xl sm:text-3xl font-light tracking-[0.3em] uppercase text-white/90" style={{ textShadow: `0 0 30px ${accent}80` }}>
          {username ? username : "enter"}
        </h1>
        <div className="mt-4 mx-auto h-px w-20" style={{ background: accent, opacity: 0.6 }} />
      </div>
    </button>
  );
}
