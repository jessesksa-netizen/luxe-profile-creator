import { useEffect, useRef, useState } from "react";
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward } from "lucide-react";

function fmt(s: number) {
  if (!isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

export function MusicPlayer({ src, title, color, cover }: { src: string; title?: string | null; color: string; cover?: string | null }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const a = audioRef.current; if (!a) return;
    const upd = () => setTime(a.currentTime);
    const meta = () => setDuration(a.duration || 0);
    a.addEventListener("timeupdate", upd);
    a.addEventListener("loadedmetadata", meta);
    return () => { a.removeEventListener("timeupdate", upd); a.removeEventListener("loadedmetadata", meta); };
  }, []);

  const pct = duration > 0 ? (time / duration) * 100 : 0;

  function seek(e: React.MouseEvent<HTMLDivElement>) {
    const a = audioRef.current; if (!a || !duration) return;
    const r = e.currentTarget.getBoundingClientRect();
    a.currentTime = ((e.clientX - r.left) / r.width) * duration;
  }

  return (
    <div className="rounded-2xl px-3 py-3 flex items-center gap-3 w-full bg-black/40 border border-white/5">
      <audio ref={audioRef} src={src} loop />
      {cover ? (
        <img src={cover} alt="" className="h-11 w-11 rounded-lg object-cover flex-shrink-0" />
      ) : (
        <div className="h-11 w-11 rounded-lg flex-shrink-0" style={{ background: `linear-gradient(135deg, ${color}66, ${color}22)` }} />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-[0.18em] font-semibold truncate" style={{ color }}>now playing</div>
            <div className="text-sm text-white/90 truncate font-medium">{title || "untitled"}</div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => { const a = audioRef.current!; a.muted = !muted; setMuted(!muted); }}
              className="h-7 w-7 grid place-items-center text-white/60 hover:text-white transition"
              aria-label={muted ? "unmute" : "mute"}
            >
              {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
            </button>
            <button
              onClick={() => { const a = audioRef.current!; if (playing) a.pause(); else a.play(); setPlaying(!playing); }}
              className="h-9 w-9 rounded-full grid place-items-center text-white transition hover:scale-105"
              style={{ background: color, boxShadow: `0 0 18px ${color}99` }}
              aria-label={playing ? "pause" : "play"}
            >
              {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 ml-0.5" />}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[10px] tabular-nums text-white/40 w-8">{fmt(time)}</span>
          <div onClick={seek} className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden cursor-pointer group">
            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color, boxShadow: `0 0 8px ${color}` }} />
          </div>
          <span className="text-[10px] tabular-nums text-white/40 w-8 text-right">{fmt(duration)}</span>
        </div>
      </div>
      {/* SkipBack/SkipForward kept for layout balance on wider variants - hidden by default */}
      <SkipBack className="hidden" /><SkipForward className="hidden" />
    </div>
  );
}
