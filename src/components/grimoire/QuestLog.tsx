"use client";

import { useMemo, useState } from "react";
import { BookOpen, Filter, Ghost } from "lucide-react";
import { ImportRegime, QuestStage } from "@/domain/customs";
import type { QuestEntry } from "./types";
import { QuestCard } from "./QuestCard";

type QuestFilter = "all" | "fourByFour" | "general" | "delivered";

export interface QuestLogProps {
  readonly quests: readonly QuestEntry[];
  readonly onAdvance: (id: string, nextStage: QuestEntry["stage"]) => void;
}

const FILTERS: readonly { id: QuestFilter; label: string }[] = [
  { id: "all", label: "All Quests" },
  { id: "fourByFour", label: "4x4 Exempt" },
  { id: "general", label: "General" },
  { id: "delivered", label: "Delivered" },
];

/**
 * Adventurer's guild log. Lists active Quests as log entries and lets the
 * seeker filter them. Add / advance are owned by the parent and passed in.
 */
export function QuestLog({ quests, onAdvance }: QuestLogProps) {
  const [filter, setFilter] = useState<QuestFilter>("all");

  const visible = useMemo(() => {
    switch (filter) {
      case "fourByFour":
        return quests.filter((q) => q.regime === ImportRegime.FourByFour);
      case "general":
        return quests.filter((q) => q.regime === ImportRegime.General);
      case "delivered":
        return quests.filter((q) => q.stage === QuestStage.GuildDelivery);
      default:
        return quests;
    }
  }, [quests, filter]);

  return (
    <section className="flex flex-col rounded-2xl border border-border-arcane/70 bg-surface/60 p-5 backdrop-blur-sm">
      <header className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-arcane-violet" aria-hidden />
          <h2 className="font-serif text-lg font-semibold tracking-wide text-foreground">
            Adventurer&apos;s Guild Log
          </h2>
        </div>
        <span className="rounded-full bg-arcane-violet/10 px-2.5 py-0.5 font-mono text-xs text-arcane-violet ring-1 ring-inset ring-arcane-violet/30">
          {quests.length} active
        </span>
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        <Filter className="mr-1 h-3.5 w-3.5 text-foreground/40" aria-hidden />
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={[
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              filter === f.id
                ? "bg-arcane-violet/25 text-arcane-violet ring-1 ring-inset ring-arcane-violet/50"
                : "bg-black/30 text-foreground/50 hover:text-foreground/80",
            ].join(" ")}
          >
            {f.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border-arcane/50 py-12 text-center">
          <Ghost className="h-8 w-8 text-foreground/20 animate-rune-flicker" aria-hidden />
          <p className="text-sm text-foreground/40">
            No quests haunt this page of the log.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {visible.map((quest) => (
            <QuestCard key={quest.id} quest={quest} onAdvance={onAdvance} />
          ))}
        </div>
      )}
    </section>
  );
}

export default QuestLog;
