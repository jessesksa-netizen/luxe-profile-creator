import { useEffect, useRef, useState } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";

export function MusicPlayer({ src, title, color }: { src: string; title?: string | null; color: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const a = audioRef.current; if (!a) return;
    const upd = () => setProgress((a.currentTime / (a.duration || 1)) * 100);
    a.addEventListener("timeupdate", upd);
    return () => a.removeEventListener("timeupdate", upd);
  }, []);

  return (
    <div className="glass holo-border rounded-2xl px-4 py-3 flex items-center gap-3 w-full max-w-sm">
      <audio ref={audioRef} src={src} loop />
      <button
        onClick={() => { const a = audioRef.current!; if (playing) a.pause(); else a.play(); setPlaying(!playing); }}
        className="h-10 w-10 rounded-full grid place-items-center text-white"
        style={{ background: color, boxShadow: `0 0 20px ${color}` }}
      >
        {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
      </button>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-foreground/80 truncate">{title || "now playing"}</div>
        <div className="h-1 mt-1.5 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: color }} />
        </div>
      </div>
      <button
        onClick={() => { const a = audioRef.current!; a.muted = !muted; setMuted(!muted); }}
        className="h-8 w-8 grid place-items-center text-foreground/70 hover:text-foreground"
      >
        {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      </button>
    </div>
  );
}
