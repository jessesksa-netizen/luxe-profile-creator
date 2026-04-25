import { useEffect, useState } from "react";

type Effect = "none" | "sparkles" | "snow" | "rain" | "hearts";

const SYMBOLS: Record<Effect, string> = {
  none: "",
  sparkles: "✦",
  snow: "❄",
  rain: "│",
  hearts: "♥",
};

export function AmbientEffects({ effect, color }: { effect: string; color: string }) {
  const e = (effect as Effect) ?? "none";
  const [particles, setParticles] = useState<{ id: number; left: number; delay: number; dur: number; size: number }[]>([]);

  useEffect(() => {
    if (e === "none") { setParticles([]); return; }
    const count = e === "rain" ? 60 : 40;
    setParticles(
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 8,
        dur: 6 + Math.random() * 8,
        size: 8 + Math.random() * 14,
      }))
    );
  }, [e]);

  if (e === "none") return null;
  const symbol = SYMBOLS[e];

  return (
    <div className="pointer-events-none fixed inset-0 z-[5] overflow-hidden">
      {particles.map((p) => (
        <span
          key={p.id}
          className={e === "sparkles" ? "absolute" : "absolute -top-10"}
          style={{
            left: `${p.left}%`,
            top: e === "sparkles" ? `${Math.random() * 100}%` : undefined,
            color,
            fontSize: `${p.size}px`,
            opacity: 0.7,
            animation:
              e === "sparkles"
                ? `twinkle ${p.dur}s ease-in-out ${p.delay}s infinite`
                : `fall ${p.dur}s linear ${p.delay}s infinite`,
            textShadow: `0 0 12px ${color}`,
          }}
        >
          {symbol}
        </span>
      ))}
    </div>
  );
}
