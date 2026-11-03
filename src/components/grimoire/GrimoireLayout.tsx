"use client";

import { useCallback, useMemo, useState } from "react";
import { Scroll, Scale, Coins, Sparkles, Moon } from "lucide-react";
import {
  ANNUAL_WEIGHT_LIMIT,
  ANNUAL_BUDGET_LIMIT,
  QuestStage,
  type QuestStage as QuestStageType,
} from "@/domain/customs";
import type { QuestEntry } from "./types";
import { buildQuestEntry } from "./questFactory";
import { ManaBar } from "./ManaBar";
import { QuestLog } from "./QuestLog";
import { AlchemistCalculator } from "./AlchemistCalculator";

// Pre-loaded sample Ecuador quests so the grimoire feels alive on load. Each
// is built through the domain so its regime/total are authoritative.
function seedQuests(): QuestEntry[] {
  const seeds: {
    id: string;
    label: string;
    packageWeight: number;
    fobValue: number;
    stage: QuestStageType;
  }[] = [
    {
      id: "ARC-0001",
      label: "Arcane Mechanical Keyboard (Amazon)",
      packageWeight: 1.2,
      fobValue: 95,
      stage: QuestStage.CustomsAbyss,
    },
    {
      id: "ARC-0002",
      label: "Spectral GPU — RTX Relic",
      packageWeight: 2.9,
      fobValue: 720,
      stage: QuestStage.OriginPortal,
    },
    {
      id: "ARC-0003",
      label: "Grimoire Book Bundle",
      packageWeight: 3.4,
      fobValue: 260,
      stage: QuestStage.GuildDelivery,
    },
  ];

  const out: QuestEntry[] = [];
  for (const s of seeds) {
    const built = buildQuestEntry(s);
    if (built.ok) out.push(built.value);
  }
  return out;
}

export function GrimoireLayout() {
  const [quests, setQuests] = useState<QuestEntry[]>(() => seedQuests());
  const [nextId, setNextId] = useState(1000);

  // Cumulative annual totals derived purely from inscribed quests.
  const { cumulativeWeight, cumulativeBudget } = useMemo(() => {
    return quests.reduce(
      (acc, q) => {
        acc.cumulativeWeight += q.packageWeight;
        acc.cumulativeBudget += q.fobValue;
        return acc;
      },
      { cumulativeWeight: 0, cumulativeBudget: 0 }
    );
  }, [quests]);

  const handleAdvance = useCallback(
    (id: string, nextStage: QuestEntry["stage"]) => {
      setQuests((prev) =>
        prev.map((q) => (q.id === id ? { ...q, stage: nextStage } : q))
      );
    },
    []
  );

  const handleInscribe = useCallback(
    (args: { label: string; packageWeight: number; fobValue: number }) => {
      const id = `ARC-${nextId}`;
      const built = buildQuestEntry({ id, ...args });
      if (!built.ok) return; // calculator already guards, but stay safe
      setQuests((prev) => [built.value, ...prev]);
      setNextId((n) => n + 1);
    },
    [nextId]
  );

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      {/* Ambient arcane background glow */}
      <div
        className="pointer-events-none fixed inset-0 opacity-70"
        aria-hidden
        style={{
          background:
            "radial-gradient(60rem 40rem at 15% -10%, rgba(99,102,241,0.18), transparent 60%), radial-gradient(50rem 40rem at 95% 10%, rgba(168,85,247,0.16), transparent 55%), radial-gradient(60rem 50rem at 50% 120%, rgba(220,38,38,0.10), transparent 60%)",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Ornate gothic header */}
        <header className="mb-8 text-center">
          <div className="mb-2 flex items-center justify-center gap-3 text-arcane-violet/60">
            <span className="h-px w-16 bg-gradient-to-r from-transparent to-arcane-violet/60" />
            <Moon className="h-4 w-4 animate-rune-flicker" aria-hidden />
            <span className="h-px w-16 bg-gradient-to-l from-transparent to-arcane-violet/60" />
          </div>
          <h1 className="flex items-center justify-center gap-3 font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            <Scroll className="h-8 w-8 text-arcane-violet" aria-hidden />
            PhantasmTrack
            <span className="text-arcane-violet/70">·</span>
            <span className="bg-gradient-to-r from-arcane-violet via-arcane-blue to-portal-delivery bg-clip-text text-transparent">
              GrimCourier
            </span>
          </h1>
          <p className="mt-2 flex items-center justify-center gap-1.5 text-sm text-foreground/50">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            An arcane grimoire for cross-border customs quests &amp; the 4x4 rule
          </p>
        </header>

        {/* Annual Quota Mana Bars */}
        <section className="mb-8 grid gap-4 sm:grid-cols-2">
          <ManaBar
            label={`Annual Weight Mana — ${cumulativeWeight.toLocaleString("en-US", { maximumFractionDigits: 1 })} / ${ANNUAL_WEIGHT_LIMIT} kg`}
            cumulative={cumulativeWeight}
            limit={ANNUAL_WEIGHT_LIMIT}
            unit="kg"
            icon={Scale}
          />
          <ManaBar
            label={`Annual Budget Mana — $${cumulativeBudget.toLocaleString("en-US", { maximumFractionDigits: 0 })} / $${ANNUAL_BUDGET_LIMIT} USD`}
            cumulative={cumulativeBudget}
            limit={ANNUAL_BUDGET_LIMIT}
            currency
            icon={Coins}
          />
        </section>

        {/* Two-column grimoire grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          <AlchemistCalculator onInscribe={handleInscribe} />
          <QuestLog quests={quests} onAdvance={handleAdvance} />
        </div>

        <footer className="mt-10 text-center text-xs text-foreground/30">
          Tributes computed by the pure customs grimoire · 4x4 rule: ≤ 4 kg &amp; ≤ $400 FOB
        </footer>
      </div>
    </div>
  );
}

export default GrimoireLayout;
