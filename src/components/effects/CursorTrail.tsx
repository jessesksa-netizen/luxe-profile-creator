import { useEffect, useRef } from "react";

export function CursorTrail({ enabled, color }: { enabled: boolean; color: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!enabled) return;
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);

    const points: { x: number; y: number; life: number }[] = [];
    const onMove = (e: MouseEvent) => points.push({ x: e.clientX, y: e.clientY, life: 1 });
    window.addEventListener("mousemove", onMove);

    let raf = 0;
    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = points.length - 1; i >= 0; i--) {
        const p = points[i];
        p.life -= 0.025;
        if (p.life <= 0) { points.splice(i, 1); continue; }
        ctx.beginPath();
        ctx.arc(p.x, p.y, 6 * p.life + 1, 0, Math.PI * 2);
        ctx.fillStyle = color + Math.floor(p.life * 255).toString(16).padStart(2, "0");
        ctx.shadowBlur = 18;
        ctx.shadowColor = color;
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); window.removeEventListener("mousemove", onMove); };
  }, [enabled, color]);

  if (!enabled) return null;
  return <canvas ref={ref} className="pointer-events-none fixed inset-0 z-[6]" />;
}
