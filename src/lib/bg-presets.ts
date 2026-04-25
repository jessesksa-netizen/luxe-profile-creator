// Built-in animated background presets (pure CSS — no external assets).
// Each preset returns a JSX-friendly background style or a small component.

export type BgPreset = {
  id: string;
  label: string;
  // CSS background applied to a full-screen div
  css: React.CSSProperties;
};

export const BG_PRESETS: BgPreset[] = [
  {
    id: "darkveil",
    label: "Dark Veil",
    css: {
      background:
        "radial-gradient(1200px 600px at 70% 30%, rgba(40,90,200,0.55), transparent 60%), radial-gradient(900px 500px at 20% 80%, rgba(20,40,120,0.5), transparent 60%), linear-gradient(180deg, #03070f 0%, #050a18 100%)",
    },
  },
  {
    id: "midnight",
    label: "Midnight",
    css: {
      background:
        "radial-gradient(1000px 500px at 50% 0%, rgba(60,30,120,0.6), transparent 65%), linear-gradient(180deg, #060409 0%, #0a0612 100%)",
    },
  },
  {
    id: "ember",
    label: "Ember",
    css: {
      background:
        "radial-gradient(900px 500px at 80% 20%, rgba(220,80,40,0.45), transparent 60%), radial-gradient(700px 400px at 10% 90%, rgba(120,20,40,0.5), transparent 60%), #0a0505",
    },
  },
  {
    id: "abyss",
    label: "Abyss",
    css: {
      background:
        "radial-gradient(1200px 700px at 50% 50%, rgba(0,80,140,0.55), transparent 65%), #02060c",
    },
  },
  {
    id: "amethyst",
    label: "Amethyst",
    css: {
      background:
        "radial-gradient(900px 500px at 30% 30%, rgba(140,80,220,0.55), transparent 60%), radial-gradient(900px 500px at 80% 80%, rgba(60,20,120,0.55), transparent 60%), #07040d",
    },
  },
  {
    id: "void",
    label: "Pure Void",
    css: { background: "#000" },
  },
];
