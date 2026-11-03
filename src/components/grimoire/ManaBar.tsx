"use client";

import type { ComponentType } from "react";
import { Sparkles, ShieldAlert, Flame, type LucideProps } from "lucide-react";
import {
  computeManaBar,
  type ManaBarStatus,
} from "@/domain/customs";

export interface ManaBarProps {
  readonly label: string;
  readonly cumulative: number;
  readonly limit: number;
  /** Unit suffix shown in the readout, e.g. "kg" or "USD". */
  readonly unit?: string;
  /** When true, render the readout as a currency amount ($) rather than a unit suffix. */
  readonly currency?: boolean;
  readonly icon?: ComponentType<LucideProps>;
}

const STATUS_STYLES: Record<
  ManaBarStatus,
  {
    label: string;
    fill: string;
    track: string;
    glow: string;
    badge: string;
    text: string;
    statusIcon: ComponentType<LucideProps>;
  }
> = {
  normal: {
    label: "Stable",
    fill: "bg-gradient-to-r from-sky-500 via-cyan-400 to-sky-300",
    track: "border-sky-500/30",
    glow: "animate-arcane-glow",
    badge: "bg-sky-500/15 text-sky-200 ring-1 ring-inset ring-sky-400/40",
    text: "text-sky-200",
    statusIcon: Sparkles,
  },
  warning: {
    label: "Waning",
    fill: "bg-gradient-to-r from-amber-600 via-amber-400 to-yellow-300",
    track: "border-amber-500/40",
    glow: "animate-warning-glow",
    badge: "bg-amber-500/15 text-amber-200 ring-1 ring-inset ring-amber-400/50",
    text: "text-amber-200",
    statusIcon: ShieldAlert,
  },
  limitReached: {
    label: "Breach",
    fill: "bg-gradient-to-r from-red-700 via-rose-500 to-red-400",
    track: "border-red-600/50",
    glow: "animate-critical-pulse",
    badge: "bg-red-600/20 text-red-200 ring-1 ring-inset ring-red-400/60",
    text: "text-red-200",
    statusIcon: Flame,
  },
};

function formatAmount(value: number, currency: boolean, unit?: string): string {
  const num = value.toLocaleString("en-US", {
    minimumFractionDigits: currency ? 2 : value % 1 === 0 ? 0 : 1,
    maximumFractionDigits: currency ? 2 : 2,
  });
  if (currency) return `$${num}`;
  return unit ? `${num} ${unit}` : num;
}

/**
 * Reusable glowing mana bar. All numbers come from computeManaBar — the
 * component reimplements no math. The visual fill is clamped to 100% for
 * layout while the numeric readout shows the exact, uncapped percentage.
 */
export function ManaBar({
  label,
  cumulative,
  limit,
  unit,
  currency = false,
  icon: Icon,
}: ManaBarProps) {
  const result = computeManaBar(cumulative, limit);

  if (!result.ok) {
    return (
      <div className="rounded-xl border border-red-600/40 bg-red-950/30 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-red-200">
          <ShieldAlert className="h-4 w-4" aria-hidden />
          {label}
        </div>
        <p className="mt-1 text-xs text-red-300/80">
          Arcane miscalculation — {result.error.field}: {result.error.message}
        </p>
      </div>
    );
  }

  const { usagePercentage, status } = result.value;
  const styles = STATUS_STYLES[status];
  const StatusIcon = styles.statusIcon;
  const fillWidth = Math.min(100, Math.max(0, usagePercentage));

  return (
    <div className="rounded-xl border border-border-arcane/70 bg-surface/80 p-4 shadow-[0_0_30px_-12px_rgba(139,92,246,0.5)] backdrop-blur-sm">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {Icon ? (
            <Icon className={`h-4 w-4 ${styles.text}`} aria-hidden />
          ) : null}
          <span className="font-serif text-sm font-semibold tracking-wide text-foreground/90">
            {label}
          </span>
        </div>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-widest ${styles.badge}`}
        >
          <StatusIcon className="h-3 w-3" aria-hidden />
          {styles.label}
        </span>
      </div>

      <div
        className={`relative h-4 w-full overflow-hidden rounded-full border bg-black/60 ${styles.track}`}
      >
        <div
          className={`h-full rounded-full ${styles.fill} ${styles.glow} transition-[width] duration-700 ease-out`}
          style={{ width: `${fillWidth}%` }}
          role="progressbar"
          aria-valuenow={Math.round(usagePercentage)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label}
        />
      </div>

      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="font-mono text-foreground/70">
          {formatAmount(cumulative, currency, unit)}{" "}
          <span className="text-foreground/40">/</span>{" "}
          {formatAmount(limit, currency, unit)}
        </span>
        <span className={`font-mono font-bold ${styles.text}`}>
          {usagePercentage.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

export default ManaBar;
