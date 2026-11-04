"use client";

// Kiroween / Halloween visual motifs: custom inline SVG illustrations used to
// decorate the grimoire. These are presentational only (aria-hidden) and carry
// no logic. Colors inherit via `currentColor` where possible so they blend with
// the surrounding arcane palette.

import type { SVGProps } from "react";

/** Corner cobweb overlay — place inside a `relative` container. */
export function CobwebCorner({
  className = "",
  position = "tl",
}: {
  className?: string;
  /** tl | tr | bl | br corner anchor. */
  position?: "tl" | "tr" | "bl" | "br";
}) {
  const rotate = { tl: 0, tr: 90, br: 180, bl: 270 }[position];
  const anchor = {
    tl: "left-0 top-0",
    tr: "right-0 top-0",
    bl: "bottom-0 left-0",
    br: "bottom-0 right-0",
  }[position];

  return (
    <svg
      viewBox="0 0 100 100"
      className={`pointer-events-none absolute ${anchor} h-16 w-16 text-arcane-violet/20 ${className}`}
      style={{ transform: `rotate(${rotate}deg)` }}
      aria-hidden
    >
      <g fill="none" stroke="currentColor" strokeWidth="1">
        <path d="M0 0 L100 0 M0 0 L0 100 M0 0 L70 70 M0 0 L95 40 M0 0 L40 95" />
        <path d="M18 0 Q14 14 0 18" />
        <path d="M38 0 Q30 30 0 38" />
        <path d="M60 0 Q46 46 0 60" />
        <path d="M82 0 Q60 60 0 82" />
      </g>
    </svg>
  );
}

/** Glowing Jack-o'-Lantern pumpkin. */
export function JackOLantern({ className = "", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={`h-7 w-7 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)] ${className}`}
      aria-hidden
      {...props}
    >
      {/* stem */}
      <path d="M31 10c0-4 2-6 5-7-1 3 0 5 2 7z" fill="#4d7c0f" />
      {/* body */}
      <g fill="#f97316">
        <ellipse cx="32" cy="38" rx="22" ry="20" />
        <ellipse cx="18" cy="38" rx="11" ry="19" opacity="0.85" />
        <ellipse cx="46" cy="38" rx="11" ry="19" opacity="0.85" />
      </g>
      {/* glowing carved face */}
      <g fill="#fde047" className="animate-arcane-glow">
        <path d="M20 30 L30 35 L20 38 Z" />
        <path d="M44 30 L34 35 L44 38 Z" />
        <path d="M22 46 q10 8 20 0 l-4 0 -3 -4 -3 4 -3 -4 -3 4 z" />
      </g>
    </svg>
  );
}

/** Undead zombie hand rising from the ground. */
export function ZombieHand({ className = "", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={`h-8 w-8 ${className}`}
      aria-hidden
      {...props}
    >
      <g fill="#6b7a5a" stroke="#3f4a33" strokeWidth="1.2">
        {/* palm */}
        <path d="M24 42 h16 v10 q-8 6 -16 0 z" />
        {/* fingers */}
        <rect x="24" y="22" width="4" height="22" rx="2" />
        <rect x="30" y="16" width="4" height="28" rx="2" />
        <rect x="36" y="18" width="4" height="26" rx="2" />
        <rect x="42" y="26" width="4" height="18" rx="2" />
        {/* thumb */}
        <rect x="18" y="34" width="4" height="12" rx="2" transform="rotate(-30 20 40)" />
      </g>
      {/* stitches */}
      <g stroke="#2a3322" strokeWidth="0.8">
        <path d="M28 30 h4 M31 20 h4 M37 26 h4" />
      </g>
    </svg>
  );
}

/** A single flying bat. */
export function Bat({ className = "", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 64 32"
      className={`h-4 w-8 ${className}`}
      aria-hidden
      {...props}
    >
      <path
        fill="currentColor"
        d="M32 8c2-4 5-5 8-3-1 2 0 3 2 3 3-5 8-6 12-4-3 1-4 4-3 7 2-2 5-2 7 1-4 0-6 3-9 6-3-3-6-4-9-2 1-3 0-5-3-6-1 3-2 5-5 5s-4-2-5-5c-3 1-4 3-3 6-3-2-6-1-9 2-3-3-5-6-9-6 2-3 5-3 7-1 1-3 0-6-3-7 4-2 9-1 12 4 2 0 3-1 2-3 3-2 6-1 8 3z"
      />
    </svg>
  );
}

/** A small row of bats fluttering across a header. */
export function BatSwarm({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none flex items-center gap-3 ${className}`} aria-hidden>
      <Bat className="animate-bat-flap text-foreground/40" style={{ animationDelay: "0ms" }} />
      <Bat className="animate-bat-flap text-foreground/25 scale-75" style={{ animationDelay: "280ms" }} />
      <Bat className="animate-bat-flap text-foreground/35 scale-90" style={{ animationDelay: "520ms" }} />
    </div>
  );
}
