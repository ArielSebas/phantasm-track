"use client";

// Subtle Kiroween atmosphere: a low-opacity graveyard along the bottom edge
// (tombstones, a zombie hand, tiny glowing pumpkins), a few drifting bats and
// faint corner cobwebs. Purely decorative: fixed, non-interactive, behind the
// content (z-0) and kept faint so cards, text and inputs stay fully legible.

import { CobwebCorner } from "./decorations";

function Bat({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="-22 -10 44 20"
      className={`absolute h-4 w-8 text-violet-300 sm:h-5 sm:w-10 ${className}`}
      style={style}
      fill="currentColor"
      aria-hidden
    >
      <path d="M0 -2 C-4 -9 -13 -9 -20 -1 C-15 -3 -12 1 -9 4 C-6 1 -3 1 0 4 C3 1 6 1 9 4 C12 1 15 -3 20 -1 C13 -9 4 -9 0 -2 Z" />
      <circle cx="-1.6" cy="-2.2" r="0.7" fill="#fbbf24" />
      <circle cx="1.6" cy="-2.2" r="0.7" fill="#fbbf24" />
    </svg>
  );
}

function Pumpkin({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="0" cy="0" rx="22" ry="17" fill="#c2410c" />
      <path d="M-8 -15 C-12 0 -12 0 -8 15 M0 -17 V17 M8 -15 C12 0 12 0 8 15" stroke="#7c2d12" strokeWidth="1.5" fill="none" />
      <path d="M0 -17 C0 -23 5 -25 8 -23" stroke="#166534" strokeWidth="3" fill="none" />
      <polygon points="-12,-4 -5,-7 -6,0" fill="#fbbf24" />
      <polygon points="12,-4 5,-7 6,0" fill="#fbbf24" />
      <path d="M-9 6 L-5 9 L-2 6 L2 9 L5 6 L9 9" stroke="#fbbf24" strokeWidth="2" fill="none" />
    </g>
  );
}

export function AmbientScenery() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 select-none overflow-hidden"
    >
      <style>{`
        @keyframes ambientBatLeft {
          0%   { transform: translate(-12vw, 0) rotate(-6deg); }
          50%  { transform: translate(18vw, 22px) rotate(4deg); }
          100% { transform: translate(-12vw, 0) rotate(-6deg); }
        }
        @keyframes ambientBatRight {
          0%   { transform: translate(12vw, 0) scaleX(-1) rotate(-6deg); }
          50%  { transform: translate(-18vw, 26px) scaleX(-1) rotate(4deg); }
          100% { transform: translate(12vw, 0) scaleX(-1) rotate(-6deg); }
        }
        @keyframes ambientPumpkinGlow {
          0%, 100% { opacity: 0.85; }
          50% { opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ambient-anim { animation: none !important; }
        }
      `}</style>

      {/* Upper atmosphere: faint cobwebs + slow bats */}
      <div className="absolute inset-x-0 top-0 h-40 opacity-60">
        <CobwebCorner position="tl" />
        <CobwebCorner position="tr" />
        <Bat
          className="ambient-anim left-[10%] top-14 opacity-20"
          style={{ animation: "ambientBatLeft 26s ease-in-out infinite" }}
        />
        <Bat
          className="ambient-anim left-[72%] top-8 opacity-[0.16]"
          style={{ animation: "ambientBatRight 32s ease-in-out infinite" }}
        />
        <Bat
          className="ambient-anim left-[40%] top-24 hidden opacity-[0.14] sm:block"
          style={{ animation: "ambientBatLeft 38s ease-in-out infinite" }}
        />
        <Bat
          className="ambient-anim left-[88%] top-20 hidden opacity-[0.12] md:block"
          style={{ animation: "ambientBatRight 29s ease-in-out infinite" }}
        />
      </div>

      {/* Bottom graveyard silhouette */}
      <div className="absolute inset-x-0 bottom-0 h-[22vh] max-h-[220px] min-h-[110px] opacity-20">
        <svg
          viewBox="0 0 1200 200"
          preserveAspectRatio="xMidYMax slice"
          className="h-full w-full"
        >
          <defs>
            <linearGradient id="ambMist" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a78bfa" stopOpacity="0" />
              <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.55" />
            </linearGradient>
          </defs>

          {/* misty ground */}
          <rect x="0" y="140" width="1200" height="60" fill="url(#ambMist)" />
          <path d="M0 175 Q150 160 300 176 T600 174 T900 177 T1200 172 V200 H0 Z" fill="#0b0618" />

          {/* crooked RIP tombstone */}
          <g transform="rotate(-6 150 150)" fill="#1b1230" stroke="#6d5aa8" strokeWidth="2">
            <path d="M120 180 V110 Q150 78 180 110 V180 Z" />
            <text x="150" y="130" textAnchor="middle" fontSize="18" fontWeight="bold" fill="#8b7bc4" stroke="none">RIP</text>
          </g>

          {/* cross gravestone */}
          <g transform="rotate(5 330 150)" fill="#1b1230" stroke="#6d5aa8" strokeWidth="2">
            <path d="M322 182 V100 H300 V84 H322 V62 H340 V84 H362 V100 H340 V182 Z" />
          </g>

          {/* small rounded stone */}
          <g fill="#1b1230" stroke="#6d5aa8" strokeWidth="2">
            <path d="M430 182 V132 Q430 110 452 110 Q474 110 474 132 V182 Z" />
          </g>

          {/* zombie hand reaching from the ground */}
          <g transform="translate(620 178)" fill="#1f3b2a" stroke="#4ade80" strokeOpacity="0.5" strokeWidth="1.5" strokeLinejoin="round">
            <path d="M-12 8 L-9 -38 Q-8 -50 -4 -52 L-2 -78 Q-1 -84 3 -80 L4 -56 L9 -58 L11 -86 Q12 -92 16 -88 L16 -58 L21 -58 L24 -80 Q26 -86 29 -82 L27 -54 L32 -50 L38 -64 Q41 -68 43 -64 L37 -36 Q34 -22 30 -12 L28 8 Z" />
          </g>

          {/* tilted cross + RIP stone on the right */}
          <g transform="rotate(7 800 150)" fill="#1b1230" stroke="#6d5aa8" strokeWidth="2">
            <path d="M770 182 V112 Q800 84 830 112 V182 Z" />
            <text x="800" y="136" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#8b7bc4" stroke="none">RIP</text>
          </g>
          <g transform="rotate(-4 960 150)" fill="#1b1230" stroke="#6d5aa8" strokeWidth="2">
            <path d="M952 182 V104 H932 V88 H952 V68 H968 V88 H988 V104 H968 V182 Z" />
          </g>

          {/* tiny resting pumpkins with soft amber eyes */}
          <g className="ambient-anim" style={{ animation: "ambientPumpkinGlow 5s ease-in-out infinite" }}>
            <Pumpkin x={250} y={176} s={0.7} />
            <Pumpkin x={540} y={178} s={0.55} />
            <Pumpkin x={1060} y={176} s={0.8} />
          </g>
        </svg>
      </div>
    </div>
  );
}

export default AmbientScenery;
