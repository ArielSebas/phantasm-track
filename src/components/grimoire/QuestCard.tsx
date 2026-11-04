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
  Trash2,
  ChevronDown,
} from "lucide-react";
import { advanceQuest, ImportRegime, QuestStage } from "@/domain/customs";
import type { QuestEntry } from "./types";
import { StagePortals } from "./StagePortals";
import { DICTIONARIES, type Lang } from "./i18n";
import { ZombieHand } from "./decorations";

export interface QuestCardProps {
  readonly quest: QuestEntry;
  readonly lang: Lang;
  /** Called with the next stage when an advance succeeds. */
  readonly onAdvance: (id: string, nextStage: QuestEntry["stage"]) => void;
  /** Called to banish (delete) this quest. */
  readonly onDelete: (id: string) => void;
}

const USD = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * Renders one Quest package. The "Advance Portal" action calls the domain
 * advanceQuest; on Ok it lifts the new stage up, on Err it surfaces the
 * validation message without mutating the stage.
 */
export function QuestCard({ quest, lang, onAdvance, onDelete }: QuestCardProps) {
  const [error, setError] = useState<string | null>(null);
  const d = DICTIONARIES[lang];

  const isFourByFour = quest.regime === ImportRegime.FourByFour;
  const atAbyss = quest.stage === QuestStage.CustomsAbyss;
  const isDelivered = quest.stage === QuestStage.GuildDelivery;

  // Active quests start expanded; already-delivered quests start compact.
  const [expanded, setExpanded] = useState(!isDelivered);

  function handleAdvance() {
    const result = advanceQuest(quest.stage);
    if (result.ok) {
      setError(null);
      onAdvance(quest.id, result.value);
    } else {
      // Translate the known terminal-stage error; fall back to domain message.
      const msg =
        result.error.code === "alreadyFinal"
          ? d.errAlreadyFinal
          : result.error.code === "outOfSequence"
            ? d.errOutOfSequence
            : result.error.message;
      setError(msg);
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

      {/* Undead zombie hand rising when the quest is stuck in the Customs Abyss */}
      {atAbyss ? (
        <ZombieHand
          className="pointer-events-none absolute -bottom-1 right-3 text-portal-abyss/70 animate-zombie-rise"
        />
      ) : null}

      <header className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <Scroll className="mt-0.5 h-5 w-5 shrink-0 text-arcane-violet" aria-hidden />
          <div>
            <h3 className="font-serif text-base font-semibold leading-tight text-foreground">
              {quest.label}
            </h3>
            <p className="mt-0.5 font-mono text-[0.7rem] uppercase tracking-widest text-foreground/40">
              {d.rune} · {quest.id}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <span
            className={[
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wider ring-1 ring-inset",
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
            {isFourByFour ? d.badgeFourByFour : d.badgeGeneral}
          </span>
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            aria-expanded={expanded}
            aria-label={expanded ? d.collapseDetails : d.expandDetails}
            title={expanded ? d.collapseDetails : d.expandDetails}
            className="inline-flex items-center justify-center rounded-md border border-border-arcane/50 bg-black/30 p-1 text-foreground/50 transition-colors hover:text-foreground/80"
          >
            <ChevronDown
              className={[
                "h-4 w-4 transition-transform duration-300",
                expanded ? "rotate-180" : "",
              ].join(" ")}
              aria-hidden
            />
          </button>
        </div>
      </header>

      {/* Compact one-line summary shown when collapsed */}
      {!expanded ? (
        <div className="mb-4 flex items-center justify-between gap-2 rounded-lg border border-border-arcane/40 bg-black/20 px-3 py-2 text-xs">
          <span className="font-mono text-sky-200">{quest.packageWeight} kg</span>
          <span className="font-mono text-amber-200">{USD(quest.fobValue)}</span>
          <span className="flex items-center gap-1 font-mono font-bold text-rose-200">
            <Flame className="h-3 w-3" aria-hidden /> {USD(quest.total)}
          </span>
        </div>
      ) : null}

      {/* Collapsible secondary stats + stage portals */}
      <div
        className={[
          "grid transition-all duration-300 ease-out",
          expanded ? "mb-4 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        ].join(" ")}
      >
        <div className="overflow-hidden">
          <dl className="mb-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg border border-border-arcane/50 bg-black/30 px-2 py-2">
              <dt className="flex items-center justify-center gap-1 text-[0.6rem] uppercase tracking-wider text-foreground/40">
                <Scale className="h-3 w-3" aria-hidden /> {d.cardWeight}
              </dt>
              <dd className="mt-1 font-mono text-sm text-sky-200">
                {quest.packageWeight} kg
              </dd>
            </div>
            <div className="rounded-lg border border-border-arcane/50 bg-black/30 px-2 py-2">
              <dt className="flex items-center justify-center gap-1 text-[0.6rem] uppercase tracking-wider text-foreground/40">
                <Coins className="h-3 w-3" aria-hidden /> {d.cardFob}
              </dt>
              <dd className="mt-1 font-mono text-sm text-amber-200">
                {USD(quest.fobValue)}
              </dd>
            </div>
            <div className="rounded-lg border border-border-arcane/50 bg-black/30 px-2 py-2">
              <dt className="flex items-center justify-center gap-1 text-[0.6rem] uppercase tracking-wider text-foreground/40">
                <Flame className="h-3 w-3" aria-hidden /> {d.cardTribute}
              </dt>
              <dd className="mt-1 font-mono text-sm font-bold text-rose-200">
                {USD(quest.total)}
              </dd>
            </div>
          </dl>

          <div className="rounded-xl border border-border-arcane/40 bg-black/20 px-3 py-3">
            <StagePortals current={quest.stage} lang={lang} />
          </div>
        </div>
      </div>

      {error ? (
        <p className="mb-3 flex items-center gap-1.5 rounded-lg border border-red-600/40 bg-red-950/40 px-3 py-2 text-xs text-red-200">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      ) : null}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleAdvance}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-arcane-violet/40 bg-arcane-violet/10 px-4 py-2.5 text-sm font-semibold text-arcane-violet transition-all hover:bg-arcane-violet/20 hover:shadow-[0_0_20px_-4px_rgba(167,139,250,0.7)] active:scale-[0.98]"
        >
          <Compass className="h-4 w-4" aria-hidden />
          {d.advancePortal}
        </button>
        <button
          type="button"
          onClick={() => onDelete(quest.id)}
          aria-label={d.banishQuest}
          title={d.banishQuest}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-600/40 bg-red-950/30 px-3 py-2.5 text-sm font-semibold text-red-200 transition-all hover:bg-red-900/40 hover:shadow-[0_0_20px_-4px_rgba(220,38,38,0.7)] active:scale-[0.98]"
        >
          <Trash2 className="h-4 w-4" aria-hidden />
          <span className="hidden sm:inline">🗑️ {d.banishQuest}</span>
        </button>
      </div>
    </article>
  );
}

export default QuestCard;
