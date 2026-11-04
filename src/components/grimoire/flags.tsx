"use client";

// Inline SVG flag icons. Windows renders the 🇪🇨 / 🇺🇸 regional-indicator
// emojis as plain letters (EC / US), so we draw the real flag colors inline to
// guarantee they show correctly everywhere.

import type { SVGProps } from "react";

/** Flag of Ecuador: yellow top half, blue band, red band + a small shield. */
export function EcuadorFlag({ className = "", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 16"
      className={`inline-block h-3.5 w-5 rounded-[2px] ring-1 ring-inset ring-black/30 ${className}`}
      aria-hidden
      {...props}
    >
      {/* Yellow top half */}
      <rect x="0" y="0" width="24" height="8" fill="#FFD100" />
      {/* Blue middle band */}
      <rect x="0" y="8" width="24" height="4" fill="#0033A0" />
      {/* Red bottom band */}
      <rect x="0" y="12" width="24" height="4" fill="#EF3340" />
      {/* Subtle golden shield / condor emblem at the center */}
      <g transform="translate(12,8)">
        <ellipse cx="0" cy="0" rx="2.6" ry="3.4" fill="#B8860B" opacity="0.9" />
        <ellipse cx="0" cy="-0.4" rx="1.7" ry="2.3" fill="#FCE7A1" opacity="0.95" />
        {/* tiny condor silhouette */}
        <path d="M-1.7 -2 Q0 -3.2 1.7 -2 Q0 -1.4 -1.7 -2 Z" fill="#6B4F1D" />
        {/* small mast line */}
        <rect x="-0.2" y="-1" width="0.4" height="3.2" fill="#6B4F1D" />
      </g>
    </svg>
  );
}

/** Flag of the USA: simplified stars-and-stripes used for the English toggle. */
export function USAFlag({ className = "", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 16"
      className={`inline-block h-3.5 w-5 rounded-[2px] ring-1 ring-inset ring-black/30 ${className}`}
      aria-hidden
      {...props}
    >
      {/* Red + white stripes */}
      <rect x="0" y="0" width="24" height="16" fill="#B22234" />
      {[1, 3, 5, 7, 9, 11, 13].map((i) => (
        <rect key={i} x="0" y={(i * 16) / 13} width="24" height={16 / 13} fill="#FFFFFF" />
      ))}
      {/* Blue canton */}
      <rect x="0" y="0" width="10" height={(16 / 13) * 7} fill="#3C3B6E" />
      {/* A few stars (simplified dots) */}
      <g fill="#FFFFFF">
        {[2, 4, 6, 8].flatMap((x) =>
          [1.6, 4, 6.4].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r="0.55" />)
        )}
      </g>
    </svg>
  );
}
