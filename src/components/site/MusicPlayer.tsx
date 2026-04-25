import { useEffect, useRef, useState } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";

function fmt(s: number) {
  if (!isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

export function MusicPlayer({ src, title, color, autoPlay = false }: { src: string; title?: string | null; color: string; autoPlay?: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const a = audioRef.current; if (!a) return;
    const upd = () => setTime(a.currentTime);
    const meta = () => setDuration(a.duration || 0);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    a.addEventListener("timeupdate", upd);
    a.addEventListener("loadedmetadata", meta);
    a.addEventListener("durationchange", meta);
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    return () => {
      a.removeEventListener("timeupdate", upd);
      a.removeEventListener("loadedmetadata", meta);
      a.removeEventListener("durationchange", meta);
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
    };
  }, []);

  useEffect(() => {
    const a = audioRef.current; if (!a || !autoPlay) return;
    a.volume = 0.5;
    a.play().catch(() => {});
  }, [autoPlay, src]);

  const pct = duration > 0 ? (time / duration) * 100 : 0;

  function seek(e: React.MouseEvent<HTMLDivElement>) {
    const a = audioRef.current; if (!a || !duration) return;
    const r = e.currentTarget.getBoundingClientRect();
    a.currentTime = ((e.clientX - r.left) / r.width) * duration;
  }

  function toggle() {
    const a = audioRef.current; if (!a) return;
    if (a.paused) a.play().catch(() => {}); else a.pause();
  }

  return (
    <div className="rounded-2xl px-3 py-3 flex items-center gap-3 w-full bg-black/40 border border-white/5">
      <audio ref={audioRef} src={src} loop preload="metadata" />
      <button
        onClick={toggle}
        className="h-10 w-10 rounded-full grid place-items-center text-white transition hover:scale-105 flex-shrink-0"
        style={{ background: color, boxShadow: `0 0 18px ${color}99` }}
        aria-label={playing ? "pause" : "play"}
      >
        {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-[0.2em] font-semibold truncate" style={{ color }}>now playing</div>
            <div className="text-sm text-white/90 truncate font-medium">{title || "untitled"}</div>
          </div>
          <button
            onClick={() => { const a = audioRef.current!; a.muted = !muted; setMuted(!muted); }}
            className="h-7 w-7 grid place-items-center text-white/60 hover:text-white transition flex-shrink-0"
            aria-label={muted ? "unmute" : "mute"}
          >
            {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
          </button>
        </div>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[10px] tabular-nums text-white/50 w-9">{fmt(time)}</span>
          <div onClick={seek} className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden cursor-pointer">
            <div className="h-full rounded-full transition-[width] duration-150" style={{ width: `${pct}%`, background: color, boxShadow: `0 0 8px ${color}` }} />
          </div>
          <span className="text-[10px] tabular-nums text-white/50 w-9 text-right">{fmt(duration)}</span>
        </div>
      </div>
    </div>
  );
}
