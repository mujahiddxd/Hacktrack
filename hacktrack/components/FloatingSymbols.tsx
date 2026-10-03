import type { CSSProperties } from "react";

type Glyph = {
  text: string;
  top: string;
  left: string;
  size: string;
  rot: number;
  dur: number;
  delay: number;
  /** Rendered as a small coloured tile instead of bare ink */
  tile?: string;
  /** Shown on phones too; others appear from md up so small screens stay calm */
  mobile?: boolean;
};

// Fixed positions (no Math.random) keep server and client markup identical.
// Most glyphs hug the outer edges, where the centred content column leaves empty canvas.
const GLYPHS: Glyph[] = [
  { text: "</>", top: "12%", left: "3%", size: "1.6rem", rot: -8, dur: 22, delay: 0, mobile: true },
  { text: "∑", top: "34%", left: "6%", size: "2.4rem", rot: 6, dur: 26, delay: -6 },
  { text: "{ }", top: "62%", left: "2.5%", size: "1.7rem", rot: 10, dur: 24, delay: -12 },
  { text: "π", top: "84%", left: "8%", size: "2.2rem", rot: -4, dur: 20, delay: -3, mobile: true },
  { text: "λ", top: "20%", left: "91%", size: "2.2rem", rot: 8, dur: 25, delay: -9, mobile: true },
  { text: "∫ f(x)dx", top: "44%", left: "88%", size: "1.15rem", rot: -6, dur: 28, delay: -15 },
  { text: "0101", top: "70%", left: "93%", size: "1rem", rot: 90, dur: 23, delay: -4 },
  { text: "√2", top: "90%", left: "86%", size: "1.6rem", rot: 4, dur: 21, delay: -10 },
  { text: "=>", top: "6%", left: "48%", size: "1.3rem", rot: 0, dur: 27, delay: -7 },
  { text: "∞", top: "52%", left: "14%", size: "1.8rem", rot: 0, dur: 30, delay: -18 },
  { text: "git push", top: "28%", left: "78%", size: "0.85rem", rot: -3, dur: 24, delay: -2 },
  { text: "Δ", top: "78%", left: "52%", size: "1.6rem", rot: 12, dur: 29, delay: -14 },
  // A few coloured tiles echo the brand palette without competing with content
  { text: "</>", top: "16%", left: "84%", size: "0.8rem", rot: 8, dur: 19, delay: -5, tile: "#FFEB3B" },
  { text: "x²", top: "74%", left: "11%", size: "0.8rem", rot: -10, dur: 22, delay: -11, tile: "#00E676" },
  { text: "#", top: "58%", left: "96%", size: "0.8rem", rot: 6, dur: 25, delay: -8, tile: "#2196F3" },
];

export function FloatingSymbols() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none">
      {GLYPHS.map((g, i) => {
        const style = {
          top: g.top,
          left: g.left,
          fontSize: g.size,
          backgroundColor: g.tile,
          "--ht-rot": `${g.rot}deg`,
          "--ht-dur": `${g.dur}s`,
          "--ht-delay": `${g.delay}s`,
          "--ht-dx": `${i % 2 ? -12 : 12}px`,
          "--ht-dy": `${i % 3 ? -24 : 18}px`,
        } as CSSProperties;

        return (
          <span
            key={i}
            style={style}
            className={`ht-floater absolute font-mono font-black leading-none whitespace-nowrap ${
              g.mobile ? "" : "hidden md:block"
            } ${
              g.tile
                ? "rounded-md border-2 border-ink px-1.5 py-1 text-on-accent opacity-30"
                : "text-ink opacity-[0.07]"
            }`}
          >
            {g.text}
          </span>
        );
      })}
    </div>
  );
}
