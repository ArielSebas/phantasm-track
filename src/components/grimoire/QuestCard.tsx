"use client";

import { useState } from "react";
import {
  Scroll,
  Scale,
  Coins,
  Compass,
  ShieldCheck,
  Flame,
  AlertTriangle,
} from "lucide-react";
import { advanceQuest, ImportRegime } from "@/domain/customs";
import type { QuestEntry } from "./types";
import { StagePortals } from "./StagePortals";

export interface QuestCardProps {
  readonly quest: QuestEntry;
  /** Called with the next stage when an advance succeeds. */
  readonly onAdvance: (id: string, nextStage: QuestEntry["stage"]) => void;
}

const USD = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * Renders one Quest package. The "Advance Portal" action calls the domain
 * advanceQuest; on Ok it lifts the new stage up, on Err it surfaces the
 * validation message without mutating the stage.
 */
export function QuestCard({ quest, onAdvance }: QuestCardProps) {
  const [error, setError] = useState<string | null>(null);

  const isFourByFour = quest.regime === ImportRegime.FourByFour;

  function handleAdvance() {
    const result = advanceQuest(quest.stage);
    if (result.ok) {
      setError(null);
      onAdvance(quest.id, result.value);
    } else {
      setError(result.error.message);
    }
  }

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-border-arcane/70 bg-gradient-to-b from-surface-raised/90 to-surface/70 p-5 shadow-[0_0_40px_-16px_rgba(167,139,250,0.55)] transition-all duration-300 hover:border-arcane-violet/60 hover:shadow-[0_0_48px_-14px_rgba(167,139,250,0.75)]">
      {/* Ornamental corner rune */}
      <span
        className="pointer-events-none absolute -right-2 -top-2 select-none text-5xl text-arcane-violet/10 animate-rune-flicker"
        aria-hidden
      >
        ✶
      </span>

      <header className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <Scroll className="mt-0.5 h-5 w-5 shrink-0 text-arcane-violet" aria-hidden />
          <div>
            <h3 className="font-serif text-base font-semibold leading-tight text-foreground">
              {quest.label}
            </h3>
            <p className="mt-0.5 font-mono text-[0.7rem] uppercase tracking-widest text-foreground/40">
              rune · {quest.id}
            </p>
          </div>
        </div>

        <span
          className={[
            "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wider ring-1 ring-inset",
            isFourByFour
              ? "bg-emerald-500/15 text-emerald-200 ring-emerald-400/40"
              : "bg-amber-500/15 text-amber-200 ring-amber-400/40",
          ].join(" ")}
        >
          {isFourByFour ? (
            <ShieldCheck className="h-3 w-3" aria-hidden />
          ) : (
            <Flame className="h-3 w-3" aria-hidden />
          )}
          {isFourByFour ? "4x4 Exempt" : "General Taxed"}
        </span>
      </header>

      <dl className="mb-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg border border-border-arcane/50 bg-black/30 px-2 py-2">
          <dt className="flex items-center justify-center gap-1 text-[0.6rem] uppercase tracking-wider text-foreground/40">
            <Scale className="h-3 w-3" aria-hidden /> Weight
          </dt>
          <dd className="mt-1 font-mono text-sm text-sky-200">
            {quest.packageWeight} kg
          </dd>
        </div>
        <div className="rounded-lg border border-border-arcane/50 bg-black/30 px-2 py-2">
          <dt className="flex items-center justify-center gap-1 text-[0.6rem] uppercase tracking-wider text-foreground/40">
            <Coins className="h-3 w-3" aria-hidden /> FOB
          </dt>
          <dd className="mt-1 font-mono text-sm text-amber-200">
            {USD(quest.fobValue)}
          </dd>
        </div>
        <div className="rounded-lg border border-border-arcane/50 bg-black/30 px-2 py-2">
          <dt className="flex items-center justify-center gap-1 text-[0.6rem] uppercase tracking-wider text-foreground/40">
            <Flame className="h-3 w-3" aria-hidden /> Tribute
          </dt>
          <dd className="mt-1 font-mono text-sm font-bold text-rose-200">
            {USD(quest.total)}
          </dd>
        </div>
      </dl>

      <div className="mb-4 rounded-xl border border-border-arcane/40 bg-black/20 px-3 py-3">
        <StagePortals current={quest.stage} />
      </div>

      {error ? (
        <p className="mb-3 flex items-center gap-1.5 rounded-lg border border-red-600/40 bg-red-950/40 px-3 py-2 text-xs text-red-200">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={handleAdvance}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-arcane-violet/40 bg-arcane-violet/10 px-4 py-2.5 text-sm font-semibold text-arcane-violet transition-all hover:bg-arcane-violet/20 hover:shadow-[0_0_20px_-4px_rgba(167,139,250,0.7)] active:scale-[0.98]"
      >
        <Compass className="h-4 w-4" aria-hidden />
        Advance Portal
      </button>
    </article>
  );
}

export default QuestCard;
