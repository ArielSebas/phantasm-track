"use client";

import React, { useEffect, useRef, useState } from "react";

export type SceneStage = "welcome" | "packing" | "customs" | "delivered" | "banished";

export interface BackgroundSceneProps {
  sceneStage?: SceneStage;
  hasDeliveredParcel?: boolean;
  delivered?: boolean;
  triggerKey?: number;
  lang?: "es" | "en";
  /** When false, the foreground cinematic never plays; guardians stay on the sides. */
  cinematicsEnabled?: boolean;
}

const BANNERS: Record<SceneStage, { es: string; en: string; accent: string; durationMs: number }> = {
  welcome: {
    es: "🕯️ Bienvenido a este viaje macabro, viajero 🎃💀",
    en: "🕯️ Welcome to this macabre journey, traveler 🎃💀",
    accent: "border-purple-400/70 bg-[#120924]/95 text-purple-100 shadow-[0_0_35px_rgba(168,85,247,0.45)]",
    durationMs: 4200,
  },
  packing: {
    es: "📦 Empaquetando tus reliquias en el Portal de Origen...",
    en: "📦 Packing your relics at the Origin Portal...",
    accent: "border-cyan-400/70 bg-[#081b26]/95 text-cyan-100 shadow-[0_0_35px_rgba(34,211,238,0.45)]",
    durationMs: 3800,
  },
  customs: {
    es: "💀 Cinta de Aduana SENAE: Escaneando paquete...",
    en: "💀 SENAE Customs Belt: Scanning parcel...",
    accent: "border-purple-400/70 bg-[#160b29]/95 text-purple-100 shadow-[0_0_35px_rgba(168,85,247,0.45)]",
    durationMs: 3800,
  },
  delivered: {
    es: "🎃 ¡Entrega completada! El Señor Calabaza recibe su paquete",
    en: "🎃 Delivery complete! The Pumpkin Lord receives the parcel",
    accent: "border-emerald-400/70 bg-[#06241c]/95 text-emerald-100 shadow-[0_0_35px_rgba(52,211,153,0.45)]",
    durationMs: 2900,
  },
  banished: {
    es: "🧹 ¡Misión desterrada! El Señor Calabaza barre los restos",
    en: "🧹 Quest banished! The Pumpkin Lord sweeps the remains",
    accent: "border-rose-500/70 bg-[#260812]/95 text-rose-100 shadow-[0_0_35px_rgba(244,63,94,0.45)]",
    durationMs: 3800,
  },
};

function RuneParcel({
  glow = "origin",
  x = 0,
  y = 0,
}: {
  glow?: "origin" | "customs" | "deliver";
  x?: number;
  y?: number;
}) {
  const strokeColor =
    glow === "deliver" ? "#34d399" : glow === "customs" ? "#c084fc" : "#38bdf8";
  const innerColor =
    glow === "deliver" ? "#10b981" : glow === "customs" ? "#a855f7" : "#0ea5e9";

  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect
        x="0"
        y="0"
        width="78"
        height="62"
        rx="8"
        fill="#130b20"
        stroke={strokeColor}
        strokeWidth="3"
      />
      <line x1="0" y1="31" x2="78" y2="31" stroke={strokeColor} strokeWidth="2" />
      <line x1="39" y1="0" x2="39" y2="62" stroke={strokeColor} strokeWidth="2" />
      <polygon points="39,15 50,31 39,47 28,31" fill={innerColor} opacity="0.9" />
    </g>
  );
}

export function BackgroundScene({
  sceneStage = "welcome",
  hasDeliveredParcel,
  delivered = false,
  triggerKey = 0,
  lang = "es",
  cinematicsEnabled = true,
}: BackgroundSceneProps) {
  const [foregroundActive, setIsForeground] = useState<boolean>(true);
  // Derived so disabling takes effect on the very same render (no flash).
  const isForeground = foregroundActive && cinematicsEnabled;
  const safeStage: SceneStage = BANNERS[sceneStage] ? sceneStage : "welcome";
  const meta = BANNERS[safeStage];
  const parcelWithPumpkin = hasDeliveredParcel ?? delivered;

  // Read through a ref so re-enabling cinematics does not replay the last one.
  const cinematicsRef = useRef(cinematicsEnabled);

  // Declared before the timer effect so the ref is current when it runs.
  useEffect(() => {
    cinematicsRef.current = cinematicsEnabled;
    // Disabling instantly drops any running foreground cinematic.
    if (!cinematicsEnabled) setIsForeground(false);
  }, [cinematicsEnabled]);

  useEffect(() => {
    if (!cinematicsRef.current) {
      setIsForeground(false);
      return;
    }
    setIsForeground(true);
    const timer = setTimeout(() => {
      setIsForeground(false);
    }, meta.durationMs);
    return () => clearTimeout(timer);
  }, [triggerKey, safeStage, meta.durationMs]);

  const hideSkeletonInFg = isForeground && safeStage === "banished";
  const hidePumpkinInFg =
    isForeground && (safeStage === "packing" || safeStage === "customs");

  // y (px inside each prop SVG, 1:1 box) that must sit on the hand line.
  const PROP_LINE_Y: Record<string, number> = {
    welcome: 112, // centre of the rune seal
    packing: 118, // box/table lowered to waist-hip level (was 150)
    customs: 142, // conveyor belt lowered to waist-hip level (was 174)
    delivered: 41, // centre of the handed-off parcel
    banished: 131, // centre of the banished box
  };
  const propLineY = PROP_LINE_Y[safeStage] ?? 112;
  // Extra rightward shift (prop units) so packing/customs props breathe away
  // from the Skeleton's hand. Other stages stay centred.
  const propShiftX = safeStage === "packing" ? 26 : safeStage === "customs" ? 22 : 0;
  const propAnchor =
    safeStage === "banished"
      ? "50vh + 70 * var(--gs)" // broom / ground line (y≈550 of 960)
      : "50vh - 108 * var(--gs)"; // outstretched-hand line (y≈372 of 960)

  const skeletonGlow: "origin" | "customs" =
    safeStage === "customs" ? "customs" : "origin";

  return (
    <div
      aria-hidden="true"
      className={[
        "pointer-events-none fixed inset-0 overflow-hidden select-none transition-all duration-500",
        isForeground ? "z-50 bg-black/70 backdrop-blur-[3px]" : "z-0 bg-transparent",
      ].join(" ")}
    >
      <style>{`
        @keyframes torsoBowLeft {
          0%, 100% { transform: rotate(0deg); }
          45%, 65% { transform: rotate(7deg); }
        }
        @keyframes torsoBowRight {
          0%, 100% { transform: rotate(0deg); }
          45%, 65% { transform: rotate(-7deg); }
        }
        @keyframes shoulderPivotLeft {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-12deg); }
        }
        @keyframes shoulderPackLeft {
          0%, 100% { transform: rotate(0deg); }
          35% { transform: rotate(10deg); }
          70% { transform: rotate(-8deg); }
        }
        @keyframes shoulderPivotRight {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(12deg); }
        }
        @keyframes shoulderSweepRight {
          0%, 100% { transform: rotate(-6deg); }
          50% { transform: rotate(14deg); }
        }
        @keyframes lootDrop1 {
          0% { transform: translateY(-55px) scale(0.7); opacity: 0; }
          35% { transform: translateY(18px) scale(1); opacity: 1; }
          60%, 100% { transform: translateY(42px) scale(0.4); opacity: 0; }
        }
        @keyframes lootDrop2 {
          0%, 25% { transform: translateY(-55px) scale(0.7); opacity: 0; }
          60% { transform: translateY(18px) scale(1); opacity: 1; }
          85%, 100% { transform: translateY(42px) scale(0.4); opacity: 0; }
        }
        @keyframes shoulderPlaceLeft {
          0% { transform: rotate(-14deg); }
          100% { transform: rotate(4deg); }
        }
        @keyframes customsParcelRide {
          0% { transform: translate(-125px, -46px); }
          25% { transform: translate(-85px, 0px); }
          28% { transform: translate(-85px, 0px); }
          100% { transform: translate(85px, 0px); }
        }
        @keyframes laserPulse {
          0%, 100% { opacity: 0.35; transform: scaleY(0.96); }
          50% { opacity: 0.95; transform: scaleY(1.03); }
        }
        /* --handoff-drop lowers the parcel so it rests on the outstretched hands
           (set per breakpoint on the handoff <svg>; user units are pre-scale). */
        @keyframes handoffOnce {
          0%, 16.7% { transform: translate(-56px, calc(2px + var(--handoff-drop, 0px))) scale(0.95); }
          41.7% { transform: translate(0px, calc(-12px + var(--handoff-drop, 0px))) scale(1.04); }
          66.7% { transform: translate(56px, calc(2px + var(--handoff-drop, 0px))) scale(0.95); }
          100% { transform: translate(84px, calc(8px + var(--handoff-drop, 0px))) scale(0.9); }
        }
        @keyframes handoffTrailFade {
          0%, 60% { opacity: 0.75; }
          70%, 100% { opacity: 0; }
        }
        @keyframes shoulderReleaseLeft {
          0% { transform: rotate(-4deg); }
          71% { transform: rotate(-14deg); }
          100% { transform: rotate(6deg); }
        }
        @keyframes shoulderReceiveRight {
          0%, 46% { transform: rotate(0deg); }
          61.5% { transform: rotate(14deg); }
          100% { transform: rotate(-8deg); }
        }
        @keyframes dustScatter {
          0% { transform: translate(0, 0) scale(1); opacity: 0.95; }
          100% { transform: translate(-75px, -35px) scale(0.2); opacity: 0; }
        }
      `}</style>

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(88,28,135,0.16),transparent_65%),radial-gradient(ellipse_at_bottom,rgba(220,38,38,0.08),transparent_60%)]" />

      {/* LEFT FULL-HEIGHT GUARDIAN: Anatomical Skeleton Courier */}
      <div
        className={[
          // Idle: sides only on xl+ (never covers inputs on phones). During any
          // cinematic the guardian shows on every screen size.
          isForeground ? "flex" : "hidden xl:flex",
          "fixed top-0 bottom-0 h-screen items-stretch justify-start overflow-visible transition-all duration-700",
          isForeground
            ? "left-0 w-[130px] sm:w-[180px] xl:w-[300px] 2xl:w-[350px]"
            : "-left-12 2xl:-left-8 w-[310px] 2xl:w-[345px]",
          // Below xl the hand travels to the viewport centre (50vw minus the
          // hand offset and half the parcel gap); xl+ keeps the vw offsets.
          hideSkeletonInFg
            ? "opacity-0 -translate-x-24"
            : isForeground
            ? safeStage === "packing"
              ? "opacity-100 translate-x-[calc(50vw_-_122px)] sm:translate-x-[calc(50vw_-_167px)] xl:translate-x-[31.5vw] 2xl:translate-x-[33vw]"
              : safeStage === "customs"
              ? "opacity-100 translate-x-[calc(50vw_-_137px)] sm:translate-x-[calc(50vw_-_183px)] xl:translate-x-[28.5vw] 2xl:translate-x-[30vw]"
              : safeStage === "delivered"
              ? "opacity-100 translate-x-[calc(50vw_-_121px)] sm:translate-x-[calc(50vw_-_170px)] xl:translate-x-[29.5vw] 2xl:translate-x-[31vw]"
              : "opacity-100 translate-x-0 xl:translate-x-[20vw]"
            : "opacity-90 translate-x-0",
        ].join(" ")}
      >
        <svg
          viewBox="0 0 320 960"
          fill="none"
          preserveAspectRatio="xMinYMid meet"
          className="h-full w-full overflow-visible drop-shadow-[0_0_25px_rgba(110,168,254,0.24)]"
        >
          <defs>
            <linearGradient id="boneGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f3e8ff" />
              <stop offset="55%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#64748b" />
            </linearGradient>
            <linearGradient id="cloakLeft" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1e1b4b" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#0f172a" stopOpacity="0.92" />
              <stop offset="100%" stopColor="#090514" stopOpacity="0.98" />
            </linearGradient>
          </defs>

          {!isForeground && (
            <path
              d="M0 0 H260 C180 60 130 140 130 240 V960 H0 Z"
              fill="url(#cloakLeft)"
              opacity="0.45"
            />
          )}

          <line x1="145" y1="0" x2="145" y2="62" stroke="#64748b" strokeWidth="3" />
          <circle cx="145" cy="66" r="6" fill="none" stroke="#94a3b8" strokeWidth="2.5" />
          <path
            d="M128 72 H162 L170 105 L120 105 Z"
            fill="#1e1b4b"
            stroke="#6ea8fe"
            strokeWidth="2"
          />
          <circle cx="145" cy="90" r="8" fill="#38bdf8" opacity="0.85" />

          <path
            d="M70 220 C45 340 35 560 22 920 L65 895 L95 935 L135 900 L175 940 L195 580 C190 420 175 290 145 225 Z"
            fill="url(#cloakLeft)"
            stroke="#4c1d95"
            strokeWidth="2"
          />

          <g
            style={{
              transformOrigin: "130px 485px",
              transformBox: "view-box",
              animation:
                isForeground && safeStage === "welcome"
                  ? "torsoBowLeft 2.2s ease-in-out infinite"
                  : "none",
            }}
          >
            <g transform="translate(88, 122)">
              <path
                d="M8 38 C12 8 68 4 92 26 L128 36 C125 44 102 46 82 44 L8 38 Z"
                fill="#1e1b4b"
                stroke="#6ea8fe"
                strokeWidth="2.2"
              />
              <circle cx="52" cy="24" r="5" fill="#38bdf8" />
              <path
                d="M14 40 C6 68 14 98 36 108 L42 126 L78 126 L84 110 C82 104 62 104 58 98 L92 98 C98 86 102 72 94 60 C100 50 96 40 84 38 Z"
                fill="url(#boneGrad)"
                stroke="#1e293b"
                strokeWidth="2.5"
              />
              <path d="M66 52 C78 50 86 58 82 68 C74 72 64 68 66 52 Z" fill="#090514" />
              <circle cx="75" cy="60" r="3.5" fill="#38bdf8" />
              <path d="M88 68 L96 80 L84 82 Z" fill="#090514" />
              <path d="M46 72 Q64 82 78 78" stroke="#334155" strokeWidth="2.5" fill="none" />
              <path
                d="M64 98 V112 M72 98 V112 M80 98 V112 M88 98 V110"
                stroke="#090514"
                strokeWidth="2.2"
              />
            </g>

            <g fill="url(#boneGrad)" stroke="#1e293b" strokeWidth="2">
              <rect x="122" y="252" width="22" height="9" rx="4" />
              <rect x="120" y="264" width="24" height="9" rx="4" />
              <rect x="118" y="276" width="26" height="10" rx="4" />
            </g>

            <g fill="url(#boneGrad)" stroke="#1e293b" strokeWidth="2">
              <path d="M126 290 V455" stroke="#cbd5e1" strokeWidth="9" strokeLinecap="round" />
              <path d="M118 302 C152 300 182 314 188 328 C172 334 144 322 118 316 Z" />
              <path d="M116 326 C156 324 190 340 194 356 C176 362 146 348 116 340 Z" />
              <path d="M116 352 C156 350 188 366 192 382 C174 388 144 374 116 366 Z" />
              <path d="M118 378 C152 378 182 392 184 406 C168 412 142 398 118 392 Z" />
              <path d="M120 404 C148 404 172 416 174 428 C158 432 138 422 120 416 Z" />
              <rect x="116" y="446" width="26" height="12" rx="4" />
              <rect x="114" y="462" width="28" height="12" rx="4" />
              <rect x="112" y="478" width="30" height="13" rx="4" />
            </g>

            <g
              key={`arm-${safeStage}-${triggerKey}`}
              style={{
                transformOrigin: "138px 308px",
                transformBox: "view-box",
                animation: isForeground
                  ? safeStage === "packing"
                    ? "shoulderPackLeft 1.1s ease-in-out infinite"
                    : safeStage === "customs"
                    ? "shoulderPlaceLeft 0.9s ease-in-out 1 forwards"
                    : safeStage === "delivered"
                    ? "shoulderReleaseLeft 1.4s ease-in-out 1 forwards"
                    : "shoulderPivotLeft 1.6s ease-in-out infinite"
                  : "none",
              }}
            >
              <circle
                cx="138"
                cy="308"
                r="9"
                fill="url(#boneGrad)"
                stroke="#1e293b"
                strokeWidth="2"
              />
              <line
                x1="138"
                y1="308"
                x2="180"
                y2="398"
                stroke="url(#boneGrad)"
                strokeWidth="13"
                strokeLinecap="round"
              />
              <circle
                cx="180"
                cy="398"
                r="8"
                fill="url(#boneGrad)"
                stroke="#1e293b"
                strokeWidth="2"
              />
              <line
                x1="180"
                y1="398"
                x2="246"
                y2="372"
                stroke="url(#boneGrad)"
                strokeWidth="11"
                strokeLinecap="round"
              />
              <g stroke="url(#boneGrad)" strokeWidth="4.5" strokeLinecap="round">
                <line x1="246" y1="372" x2="268" y2="358" />
                <line x1="246" y1="372" x2="272" y2="370" />
                <line x1="246" y1="372" x2="270" y2="382" />
                <line x1="246" y1="372" x2="262" y2="392" />
              </g>

              {!isForeground && !parcelWithPumpkin && (
                <RuneParcel glow={skeletonGlow} x={222} y={312} />
              )}
            </g>
          </g>

          <path
            d="M92 496 C90 538 112 562 136 564 C162 562 178 536 170 498 C154 510 116 510 92 496 Z"
            fill="url(#boneGrad)"
            stroke="#1e293b"
            strokeWidth="2.5"
          />
          <circle cx="116" cy="532" r="10" fill="#090514" />
          <circle cx="150" cy="532" r="9" fill="#090514" />

          <g stroke="url(#boneGrad)" strokeLinecap="round">
            <line x1="112" y1="554" x2="98" y2="715" strokeWidth="14" />
            <circle cx="98" cy="726" r="9" fill="url(#boneGrad)" stroke="#1e293b" strokeWidth="2" />
            <line x1="98" y1="738" x2="88" y2="895" strokeWidth="11" />
            <path d="M74 895 H126 L136 918 H68 Z" fill="url(#boneGrad)" stroke="#1e293b" strokeWidth="2" />

            <line x1="150" y1="554" x2="168" y2="715" strokeWidth="15" />
            <circle cx="170" cy="726" r="10" fill="url(#boneGrad)" stroke="#1e293b" strokeWidth="2" />
            <line x1="168" y1="738" x2="158" y2="898" strokeWidth="12" />
            <path d="M144 898 H202 L214 922 H140 Z" fill="url(#boneGrad)" stroke="#1e293b" strokeWidth="2" />
          </g>
        </svg>
      </div>

      {/* RIGHT FULL-HEIGHT GUARDIAN: Sinister Pumpkin-Headed Skeleton Lord */}
      <div
        className={[
          isForeground ? "flex" : "hidden xl:flex",
          "fixed top-0 bottom-0 h-screen items-stretch justify-end overflow-visible transition-all duration-700",
          isForeground
            ? "right-0 w-[130px] sm:w-[180px] xl:w-[300px] 2xl:w-[350px]"
            : "-right-12 2xl:-right-8 w-[310px] 2xl:w-[345px]",
          hidePumpkinInFg
            ? "opacity-0 translate-x-24"
            : isForeground
            ? safeStage === "banished"
              ? "opacity-100 -translate-x-[calc(50vw_-_162px)] sm:-translate-x-[calc(50vw_-_225px)] xl:-translate-x-[24vw]"
              : safeStage === "delivered"
              ? "opacity-100 -translate-x-[calc(50vw_-_121px)] sm:-translate-x-[calc(50vw_-_170px)] xl:-translate-x-[29.5vw] 2xl:-translate-x-[31vw]"
              : "opacity-100 translate-x-0 xl:-translate-x-[20vw]"
            : "opacity-90 translate-x-0",
        ].join(" ")}
      >
        <svg
          viewBox="0 0 320 960"
          fill="none"
          preserveAspectRatio="xMaxYMid meet"
          className="h-full w-full overflow-visible drop-shadow-[0_0_28px_rgba(245,158,11,0.24)]"
        >
          <defs>
            <linearGradient id="pumpkinHead" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="45%" stopColor="#ea580c" />
              <stop offset="100%" stopColor="#7c2d12" />
            </linearGradient>
            <linearGradient id="amberBone" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fde68a" />
              <stop offset="55%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#92400e" />
            </linearGradient>
            <linearGradient id="cloakRight" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b0764" stopOpacity="0.82" />
              <stop offset="55%" stopColor="#1c1917" stopOpacity="0.92" />
              <stop offset="100%" stopColor="#090514" stopOpacity="0.98" />
            </linearGradient>
          </defs>

          {!isForeground && (
            <path
              d="M320 0 H60 C140 60 190 140 190 240 V960 H320 Z"
              fill="url(#cloakRight)"
              opacity="0.45"
            />
          )}

          <circle cx="185" cy="64" r="32" fill="#f59e0b" opacity="0.22" />
          <circle cx="185" cy="64" r="22" fill="#fbbf24" opacity="0.4" />

          <path
            d="M250 225 C275 340 285 560 298 920 L255 895 L225 935 L185 900 L145 940 L125 580 C130 420 145 290 175 225 Z"
            fill="url(#cloakRight)"
            stroke="#7c2d12"
            strokeWidth="2"
          />

          <g
            style={{
              transformOrigin: "188px 485px",
              transformBox: "view-box",
              animation:
                isForeground && safeStage === "welcome"
                  ? "torsoBowRight 2.2s ease-in-out infinite"
                  : "none",
            }}
          >
            <g transform="translate(105, 108)">
              <path
                d="M66 24 C68 4 86 -4 98 6 C88 14 84 22 86 28 Z"
                fill="#15803d"
                stroke="#052e16"
                strokeWidth="2.5"
              />
              <ellipse
                cx="74"
                cy="80"
                rx="66"
                ry="56"
                fill="url(#pumpkinHead)"
                stroke="#431407"
                strokeWidth="3"
              />
              <path
                d="M52 26 C30 58 30 102 52 134 M74 24 V136 M96 26 C118 58 118 102 96 134"
                stroke="#431407"
                strokeWidth="2.5"
                fill="none"
                opacity="0.75"
              />
              <polygon points="24,68 56,54 50,82" fill="#090514" stroke="#fbbf24" strokeWidth="1.5" />
              <polygon points="30,68 50,59 46,77" fill="#fef08a" opacity="0.9" />
              <polygon points="74,56 108,66 80,82" fill="#090514" stroke="#fbbf24" strokeWidth="1.5" />
              <polygon points="78,61 100,67 82,77" fill="#fef08a" opacity="0.9" />
              <polygon points="56,86 64,74 68,88" fill="#090514" />
              <path
                d="M18 96 L32 108 L44 96 L58 112 L72 96 L88 112 L102 96 L118 104 L106 122 L88 114 L72 126 L56 114 L38 124 L24 112 Z"
                fill="#090514"
                stroke="#fbbf24"
                strokeWidth="1.5"
              />
            </g>

            <g fill="url(#amberBone)" stroke="#431407" strokeWidth="2">
              <rect x="172" y="246" width="24" height="10" rx="4" />
              <rect x="170" y="259" width="28" height="10" rx="4" />
              <rect x="168" y="272" width="32" height="11" rx="4" />
            </g>

            <g fill="url(#amberBone)" stroke="#431407" strokeWidth="2.2">
              <path d="M188 286 V460" stroke="#f59e0b" strokeWidth="10" strokeLinecap="round" />
              <path d="M200 298 C164 296 132 312 124 328 C144 334 172 320 200 314 Z" />
              <path d="M202 324 C160 322 124 340 118 358 C138 364 170 348 202 340 Z" />
              <path d="M202 350 C160 348 126 366 122 384 C142 390 172 374 202 366 Z" />
              <path d="M200 378 C164 378 134 392 130 408 C148 414 174 398 200 392 Z" />
              <path d="M198 404 C168 404 144 416 140 430 C158 434 180 422 198 416 Z" />
              <rect x="174" y="446" width="28" height="12" rx="4" />
              <rect x="172" y="462" width="30" height="12" rx="4" />
              <rect x="170" y="478" width="32" height="13" rx="4" />
            </g>

            <g
              key={`parm-${safeStage}-${triggerKey}`}
              style={{
                transformOrigin: "178px 308px",
                transformBox: "view-box",
                animation: isForeground
                  ? safeStage === "banished"
                    ? "shoulderSweepRight 0.9s ease-in-out infinite"
                    : safeStage === "delivered"
                    ? "shoulderReceiveRight 2.6s ease-in-out 1 forwards"
                    : "shoulderPivotRight 1.6s ease-in-out infinite"
                  : "none",
              }}
            >
              <circle
                cx="178"
                cy="308"
                r="9"
                fill="url(#amberBone)"
                stroke="#431407"
                strokeWidth="2"
              />
              <line
                x1="178"
                y1="308"
                x2="136"
                y2="398"
                stroke="url(#amberBone)"
                strokeWidth="13"
                strokeLinecap="round"
              />
              <circle
                cx="136"
                cy="398"
                r="8"
                fill="url(#amberBone)"
                stroke="#431407"
                strokeWidth="2"
              />
              <line
                x1="136"
                y1="398"
                x2="68"
                y2="372"
                stroke="url(#amberBone)"
                strokeWidth="11"
                strokeLinecap="round"
              />
              <g stroke="url(#amberBone)" strokeWidth="4.5" strokeLinecap="round">
                <line x1="68" y1="372" x2="44" y2="356" />
                <line x1="68" y1="372" x2="40" y2="368" />
                <line x1="68" y1="372" x2="42" y2="382" />
                <line x1="68" y1="372" x2="50" y2="394" />
              </g>

              {isForeground && safeStage === "banished" && (
                <g>
                  <line
                    x1="82"
                    y1="260"
                    x2="38"
                    y2="520"
                    stroke="#92400e"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                  <path
                    d="M14 515 L64 522 L76 585 L-8 575 Z"
                    fill="#b45309"
                    stroke="#fbbf24"
                    strokeWidth="2.5"
                  />
                  <line x1="20" y1="540" x2="10" y2="575" stroke="#fde68a" strokeWidth="2" />
                  <line x1="38" y1="542" x2="34" y2="578" stroke="#fde68a" strokeWidth="2" />
                  <line x1="54" y1="545" x2="58" y2="580" stroke="#fde68a" strokeWidth="2" />
                </g>
              )}

              {!isForeground && parcelWithPumpkin && (
                <RuneParcel glow="deliver" x={20} y={316} />
              )}
            </g>
          </g>

          <path
            d="M146 496 C142 536 160 562 186 564 C212 562 230 538 226 496 C204 510 168 510 146 496 Z"
            fill="url(#amberBone)"
            stroke="#431407"
            strokeWidth="2.5"
          />
          <circle cx="170" cy="532" r="9" fill="#090514" />
          <circle cx="204" cy="532" r="10" fill="#090514" />

          <g stroke="url(#amberBone)" strokeLinecap="round">
            <line x1="206" y1="554" x2="220" y2="715" strokeWidth="14" />
            <circle cx="220" cy="726" r="9" fill="url(#amberBone)" stroke="#431407" strokeWidth="2" />
            <line x1="220" y1="738" x2="230" y2="895" strokeWidth="11" />
            <path d="M192 895 H246 L252 918 H184 Z" fill="url(#amberBone)" stroke="#431407" strokeWidth="2" />

            <line x1="168" y1="554" x2="150" y2="715" strokeWidth="15" />
            <circle cx="148" cy="726" r="10" fill="url(#amberBone)" stroke="#431407" strokeWidth="2" />
            <line x1="150" y1="738" x2="160" y2="898" strokeWidth="12" />
            <path d="M116 898 H174 L178 922 H104 Z" fill="url(#amberBone)" stroke="#431407" strokeWidth="2" />
          </g>
        </svg>
      </div>

      {/* FOREGROUND CENTRAL STAGE PROPS & BANNER */}
      {isForeground && (
        <div
          className="pointer-events-none fixed inset-0 z-50 [--gw:130px] [--ps:0.45] sm:[--gw:180px] sm:[--ps:0.6] xl:[--gw:300px] xl:[--ps:1] 2xl:[--gw:350px]"
          // --gs = rendered scale of the guardian SVGs (viewBox 320x960,
          // "meet" inside a --gw wide, 100vh tall box).
          style={
            { "--gs": "min(calc(var(--gw) / 320), calc(100vh / 960))" } as React.CSSProperties
          }
        >
          {/* Stage anchor: the props' "action line" is pinned to the guardians'
              hand height (shoulder y=308, hands y≈372 of 960 => 108 units above
              screen centre). Banished sits at the broom/ground line instead.
              Props scale with --ps to match the guardian scale per breakpoint. */}
          <div
            className="absolute left-1/2 top-0"
            style={{
              transformOrigin: "50% 0",
              transform: `translate(calc(-50% + ${propShiftX}px * var(--ps)), calc(${propAnchor} - ${propLineY}px * var(--ps))) scale(var(--ps))`,
            }}
          >
            {safeStage === "welcome" && (
              <svg viewBox="0 0 260 220" className="w-64 h-56 overflow-visible">
                <circle
                  cx="130"
                  cy="110"
                  r="64"
                  fill="none"
                  stroke="#a855f7"
                  strokeWidth="2.5"
                  strokeDasharray="10 8"
                />
                <circle
                  cx="130"
                  cy="110"
                  r="46"
                  fill="#1e1035"
                  fillOpacity="0.7"
                  stroke="#f59e0b"
                  strokeWidth="2"
                />
                <polygon
                  points="130,68 144,98 176,102 152,124 158,156 130,140 102,156 108,124 84,102 116,98"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                />
                <circle cx="130" cy="110" r="12" fill="#fbbf24" />
              </svg>
            )}

            {safeStage === "packing" && (
              <svg viewBox="0 0 320 240" className="w-80 h-60 overflow-visible">
                <g style={{ animation: "lootDrop1 1.6s ease-in infinite" }}>
                  <circle cx="145" cy="70" r="13" fill="#22d3ee" />
                  <polygon points="145,52 155,70 145,88 135,70" fill="#e0f2fe" />
                </g>
                <g style={{ animation: "lootDrop2 1.6s ease-in infinite" }}>
                  <circle cx="175" cy="65" r="11" fill="#a855f7" />
                </g>
                <line x1="60" y1="185" x2="260" y2="185" stroke="#b45309" strokeWidth="5" />
                <line x1="90" y1="185" x2="90" y2="225" stroke="#92400e" strokeWidth="5" />
                <line x1="230" y1="185" x2="230" y2="225" stroke="#92400e" strokeWidth="5" />
                <rect
                  x="110"
                  y="115"
                  width="100"
                  height="70"
                  rx="6"
                  fill="#0f172a"
                  stroke="#38bdf8"
                  strokeWidth="3.5"
                />
                <path d="M110 115 L84 92 L135 102 Z" fill="#1e293b" stroke="#38bdf8" strokeWidth="2.5" />
                <path d="M210 115 L236 92 L185 102 Z" fill="#1e293b" stroke="#38bdf8" strokeWidth="2.5" />
                <line x1="160" y1="115" x2="160" y2="185" stroke="#38bdf8" strokeWidth="2.5" />
              </svg>
            )}

            {safeStage === "customs" && (
              <svg viewBox="0 0 380 240" className="w-96 h-60 overflow-visible">
                <g
                  key={`parcel-${triggerKey}`}
                  style={{
                    animation: "customsParcelRide 3.6s ease-in-out 1 forwards",
                  }}
                >
                  <RuneParcel glow="customs" x={150} y={96} />
                </g>
                <path
                  d="M140 165 V58 C140 42 240 42 240 58 V165"
                  fill="none"
                  stroke="#c084fc"
                  strokeWidth="6"
                />
                <rect
                  x="148"
                  y="62"
                  width="84"
                  height="98"
                  fill="#a855f7"
                  fillOpacity="0.16"
                  style={{ animation: "laserPulse 1s ease-in-out infinite" }}
                />
                <line
                  x1="190"
                  y1="52"
                  x2="190"
                  y2="162"
                  stroke="#34d399"
                  strokeWidth="3"
                  strokeDasharray="6 4"
                />
                <rect
                  x="40"
                  y="162"
                  width="300"
                  height="24"
                  rx="12"
                  fill="#1e1b4b"
                  stroke="#8b5cf6"
                  strokeWidth="3"
                />
                {[70, 118, 166, 214, 262, 310].map((cx) => (
                  <circle
                    key={cx}
                    cx={cx}
                    cy="174"
                    r="8"
                    fill="#0f172a"
                    stroke="#38bdf8"
                    strokeWidth="2.5"
                  />
                ))}
                <text
                  x="190"
                  y="208"
                  textAnchor="middle"
                  fill="#c4b5fd"
                  fontSize="12"
                  fontWeight="bold"
                  letterSpacing="2"
                >
                  ESCANER ADUANERO SENAE
                </text>
              </svg>
            )}

            {safeStage === "delivered" && (
              <svg viewBox="0 0 360 220" className="w-88 h-56 overflow-visible">
                <path
                  d="M124 38 Q180 6 236 38"
                  fill="none"
                  stroke="#34d399"
                  strokeWidth="3"
                  strokeDasharray="8 6"
                  opacity="0.75"
                  key={`trail-${triggerKey}`}
                  style={{ animation: "handoffTrailFade 2.4s linear 1 forwards" }}
                />
                <g
                  key={`handoff-${triggerKey}`}
                  style={{ animation: "handoffOnce 2.4s ease-in-out 1 forwards" }}
                >
                  <RuneParcel glow="deliver" x={141} y={6} />
                </g>
              </svg>
            )}

            {safeStage === "banished" && (
              <svg viewBox="0 0 320 220" className="w-80 h-56 overflow-visible">
                <g style={{ animation: "dustScatter 1.4s ease-out infinite" }}>
                  <rect
                    x="130"
                    y="110"
                    width="48"
                    height="38"
                    rx="5"
                    fill="#260812"
                    stroke="#f43f5e"
                    strokeWidth="2.5"
                    strokeDasharray="6 4"
                  />
                  <circle cx="115" cy="105" r="6" fill="#fbbf24" />
                  <circle cx="95" cy="130" r="8" fill="#f43f5e" />
                  <circle cx="140" cy="88" r="5" fill="#fb923c" />
                  <circle cx="80" cy="112" r="4" fill="#fde68a" />
                </g>
              </svg>
            )}
          </div>

          <div
            className={[
              // Pinned near the bottom, below the guardians' feet.
              "absolute inset-x-0 bottom-6 mx-auto w-fit max-w-[88vw] rounded-2xl border px-4 py-2.5 font-serif text-sm font-bold tracking-wide text-center transition-all sm:bottom-10 sm:px-6 sm:py-3 sm:text-base md:text-lg",
              meta.accent,
            ].join(" ")}
          >
            {lang === "en" ? meta.en : meta.es}
          </div>
        </div>
      )}
    </div>
  );
}

export default BackgroundScene;
