"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Scroll, Coins, Sparkles, Moon, X } from "lucide-react";
import {
  ANNUAL_BUDGET_LIMIT,
  QuestStage,
  type QuestStage as QuestStageType,
} from "@/domain/customs";
import type { QuestEntry } from "./types";
import { buildQuestEntry } from "./questFactory";
import { ManaBar } from "./ManaBar";
import { QuestLog } from "./QuestLog";
import {
  AlchemistCalculator,
  DEFAULT_CALCULATOR_SETTINGS,
  type CalculatorSettings,
} from "./AlchemistCalculator";
import { DICTIONARIES, type Lang } from "./i18n";
import { CobwebCorner, BatSwarm, JackOLantern } from "./decorations";
import { BackgroundScene, type SceneStage } from "./BackgroundScene";
import { EcuadorFlag, USAFlag } from "./flags";
import { SuggestionModal } from "./SuggestionModal";

const STORAGE_KEY = "phantasm-track-state-v1";

interface PersistedState {
  readonly quests: QuestEntry[];
  readonly lang: Lang;
  readonly settings: CalculatorSettings;
  readonly nextId: number;
}

// Pre-loaded sample Ecuador quests so the grimoire feels alive on load. Each
// is built through the domain so its regime/total (reflecting the $20 fixed
// 4x4 fee) are authoritative.
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
  const [lang, setLang] = useState<Lang>("es"); // default to Spanish
  const [settings, setSettings] = useState<CalculatorSettings>(
    DEFAULT_CALCULATOR_SETTINGS
  );
  // Guards persistence so we don't overwrite storage before the initial read.
  const [hydrated, setHydrated] = useState(false);
  // Language toast: shown on load and on every switch. `toastSeq` is a trigger
  // token — bumping it replays the pop-in/fade animation and resets the timer;
  // `toastVisible` controls mounting so the toast unmounts after ~3.5s.
  const [toastVisible, setToastVisible] = useState(true);
  const [toastSeq, setToastSeq] = useState(0);
  // Cinematic handoff trigger: bumping this replays the foreground sequence.
  const [triggerKey, setTriggerKey] = useState(0);
  // Which cinematic to play. Starts as the macabre "welcome" ritual on every
  // page open/reload; quest actions switch it to their specific stage.
  const [sceneStage, setSceneStage] = useState<SceneStage>("welcome");
  // Raven Messenger (suggestions) modal.
  const [suggestOpen, setSuggestOpen] = useState(false);

  const d = DICTIONARIES[lang];

  // Delivered when at least one quest has reached GuildDelivery.
  const delivered = useMemo(
    () => quests.some((q) => q.stage === QuestStage.GuildDelivery),
    [quests]
  );

  const manaStatusLabels = {
    normal: d.manaStable,
    warning: d.manaWaning,
    limitReached: d.manaBreach,
  };

  // Rehydrate from localStorage once on mount (client-only).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<PersistedState>;
        if (Array.isArray(parsed.quests)) setQuests(parsed.quests);
        if (parsed.lang === "es" || parsed.lang === "en") setLang(parsed.lang);
        if (parsed.settings) {
          setSettings({ ...DEFAULT_CALCULATOR_SETTINGS, ...parsed.settings });
        }
        if (typeof parsed.nextId === "number") setNextId(parsed.nextId);
      }
    } catch {
      // Corrupt or unavailable storage — fall back to seed defaults silently.
    }
    setHydrated(true);
  }, []);

  // Persist whenever meaningful state changes (after hydration).
  useEffect(() => {
    if (!hydrated) return;
    try {
      const payload: PersistedState = { quests, lang, settings, nextId };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore quota / unavailable storage.
    }
  }, [hydrated, quests, lang, settings, nextId]);

  // Cumulative annual budget ($) consumed across all active quests. Weight is
  // NOT accumulated: SENAE 4x4 caps weight per-parcel, not per-year.
  const cumulativeBudget = useMemo(
    () => quests.reduce((acc, q) => acc + q.fobValue, 0),
    [quests]
  );

  const handleAdvance = useCallback(
    (id: string, nextStage: QuestEntry["stage"]) => {
      setQuests((prev) =>
        prev.map((q) => (q.id === id ? { ...q, stage: nextStage } : q))
      );
      // Map the arrival stage to its cinematic:
      //   -> CustomsAbyss   = "customs"  (skull retains the parcel, inspection)
      //   -> GuildDelivery  = "delivered" (handoff to the Pumpkin Lord)
      if (nextStage === QuestStage.CustomsAbyss) {
        setSceneStage("customs");
        setTriggerKey((k) => k + 1);
      } else if (nextStage === QuestStage.GuildDelivery) {
        setSceneStage("delivered");
        setTriggerKey((k) => k + 1);
      }
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
      // A freshly inscribed quest starts at OriginPortal -> packing cinematic.
      setSceneStage("packing");
      setTriggerKey((k) => k + 1);
    },
    [nextId]
  );

  const handleDelete = useCallback((id: string) => {
    setQuests((prev) => prev.filter((q) => q.id !== id));
    // Banishing always plays the sweep cinematic; parcel ownership afterward is
    // derived from the remaining quests via `delivered`.
    setSceneStage("banished");
    setTriggerKey((k) => k + 1);
  }, []);

  const handleReset = useCallback(() => {
    setQuests(seedQuests());
    setNextId(1000);
    // Restoring the grimoire replays the macabre welcome ritual.
    setSceneStage("welcome");
    setTriggerKey((k) => k + 1);
  }, []);

  const replayHandoff = useCallback(() => setTriggerKey((k) => k + 1), []);

  const dismissToast = useCallback(() => setToastVisible(false), []);

  const toggleLang = useCallback(() => {
    setLang((prev) => (prev === "es" ? "en" : "es"));
    // Re-trigger the toast in the newly selected language on every click.
    setToastVisible(true);
    setToastSeq((n) => n + 1);
  }, []);

  // Auto-dismiss the toast ~3.5s after each trigger. Re-running on `toastSeq`
  // clears the previous timer, so rapid clicks reset the countdown cleanly.
  useEffect(() => {
    if (!toastVisible) return;
    const t = window.setTimeout(() => setToastVisible(false), 3500);
    return () => window.clearTimeout(t);
  }, [toastVisible, toastSeq]);

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

      {/* 4-stage quest-lifecycle cinematic: foreground (z-50) ~2.4s, then z-0 */}
      <BackgroundScene
        sceneStage={sceneStage}
        hasDeliveredParcel={delivered}
        triggerKey={triggerKey}
        lang={lang}
      />

      {/* Language toast — shown on load and on every switch, in the active lang.
          `key={toastSeq}` remounts it so the pop-in/fade animation replays. */}
      {toastVisible ? (
        <div className="pointer-events-none fixed inset-x-0 top-4 z-30 flex justify-center px-4">
          <div
            key={toastSeq}
            className="pointer-events-auto flex max-w-xl animate-toast-life items-center gap-3 rounded-2xl border border-orange-400/50 bg-gradient-to-r from-orange-950/90 via-arcane-violet/30 to-orange-950/90 px-4 py-2.5 shadow-xl backdrop-blur-sm"
          >
            <span className="text-xs font-semibold leading-snug tracking-wide text-amber-100 sm:text-sm">
              {d.langActiveToast}
            </span>
            <button
              type="button"
              onClick={dismissToast}
              aria-label={d.toastDismiss}
              className="inline-flex shrink-0 items-center justify-center rounded-full border border-orange-400/40 bg-black/40 p-1 text-amber-100 transition-colors hover:bg-black/60"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      ) : null}

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Ornate gothic header card with flying bats + sleek language pill */}
        <header className="relative mb-8 rounded-2xl border border-border-arcane/60 bg-surface/40 px-4 py-6 text-center backdrop-blur-sm">
          {/* Top-right controls: replay-handoff + feedback + language pill */}
          <div className="absolute right-3 top-3 z-20 flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={replayHandoff}
              className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/50 bg-gradient-to-r from-amber-500/20 to-orange-500/15 px-3 py-1.5 text-xs font-bold text-amber-100 shadow-[0_0_18px_-6px_rgba(245,158,11,0.9)] ring-1 ring-inset ring-amber-400/20 transition-all hover:from-amber-500/35 hover:shadow-[0_0_24px_-4px_rgba(245,158,11,1)] active:scale-95 sm:text-sm"
            >
              {d.playHandoff}
            </button>
            <button
              type="button"
              onClick={() => setSuggestOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/50 bg-gradient-to-r from-emerald-500/20 to-teal-500/15 px-3 py-1.5 text-xs font-bold text-emerald-100 shadow-[0_0_18px_-6px_rgba(52,211,153,0.9)] ring-1 ring-inset ring-emerald-400/20 transition-all hover:from-emerald-500/35 hover:shadow-[0_0_24px_-4px_rgba(52,211,153,1)] active:scale-95 sm:text-sm"
            >
              {d.feedbackButton}
            </button>
            <button
              type="button"
              onClick={toggleLang}
              aria-label={d.switchTo}
              className="inline-flex items-center gap-1.5 rounded-full border border-arcane-violet/50 bg-gradient-to-r from-arcane-violet/25 to-arcane-blue/20 px-3 py-1.5 text-xs font-bold text-foreground shadow-[0_0_18px_-6px_rgba(167,139,250,0.9)] ring-1 ring-inset ring-arcane-violet/20 transition-all hover:from-arcane-violet/40 hover:shadow-[0_0_24px_-4px_rgba(167,139,250,1)] active:scale-95 sm:text-sm"
            >
              <span
                className={[
                  "inline-flex items-center gap-1 transition-opacity",
                  lang === "es" ? "opacity-100" : "opacity-50",
                ].join(" ")}
              >
                <EcuadorFlag />
                <span className={lang === "es" ? "text-amber-200" : "text-foreground/50"}>ES</span>
              </span>
              <span className="text-foreground/30">|</span>
              <span
                className={[
                  "inline-flex items-center gap-1 transition-opacity",
                  lang === "en" ? "opacity-100" : "opacity-50",
                ].join(" ")}
              >
                <USAFlag />
                <span className={lang === "en" ? "text-amber-200" : "text-foreground/50"}>EN</span>
              </span>
            </button>
          </div>

          <BatSwarm className="absolute left-2 top-2 hidden sm:flex" />
          <div className="mb-2 flex items-center justify-center gap-3 text-arcane-violet/60">
            <span className="h-px w-16 bg-gradient-to-r from-transparent to-arcane-violet/60" />
            <Moon className="h-4 w-4 animate-rune-flicker" aria-hidden />
            <span className="h-px w-16 bg-gradient-to-l from-transparent to-arcane-violet/60" />
          </div>
          <h1 className="flex flex-wrap items-center justify-center gap-3 font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            <Scroll className="h-8 w-8 text-arcane-violet" aria-hidden />
            PhantasmTrack
            <span className="text-arcane-violet/70">·</span>
            <span className="bg-gradient-to-r from-arcane-violet via-arcane-blue to-portal-delivery bg-clip-text text-transparent">
              GrimCourier
            </span>
            <JackOLantern className="animate-float-drift" />
          </h1>
          <p className="mt-2 flex items-center justify-center gap-1.5 text-sm text-foreground/50">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            {d.appTagline}
          </p>

          {/* Proud Ecuador edition badge with the real SVG flag */}
          <div className="mt-3 flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-gradient-to-r from-[#FFD100]/10 via-[#0033A0]/10 to-[#EF3340]/10 px-3.5 py-1 text-xs font-bold tracking-wide text-amber-100 ring-1 ring-inset ring-amber-400/20 shadow-[0_0_16px_-6px_rgba(255,209,0,0.7)]">
              <EcuadorFlag className="h-4 w-6" />
              {d.editionBadge}
            </span>
          </div>
        </header>

        {/* Single full-width Annual SENAE Budget Quota centerpiece bar */}
        <section className="mb-8">
          <ManaBar
            label={`${d.annualBudgetMana} — $${cumulativeBudget.toLocaleString("en-US", { maximumFractionDigits: 0 })} / $${ANNUAL_BUDGET_LIMIT} USD`}
            cumulative={cumulativeBudget}
            limit={ANNUAL_BUDGET_LIMIT}
            currency
            icon={Coins}
            statusLabels={manaStatusLabels}
          />
        </section>

        {/* Two-column grimoire grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          <AlchemistCalculator
            lang={lang}
            settings={settings}
            onSettingsChange={setSettings}
            onInscribe={handleInscribe}
          />
          <QuestLog
            quests={quests}
            lang={lang}
            onAdvance={handleAdvance}
            onDelete={handleDelete}
            onReset={handleReset}
          />
        </div>

        <footer className="relative mt-10 text-center text-xs text-foreground/30">
          <CobwebCorner position="bl" />
          <CobwebCorner position="br" />
          {d.footer}
        </footer>
      </div>

      {/* Raven Messenger / Suggestions modal */}
      <SuggestionModal
        open={suggestOpen}
        lang={lang}
        onClose={() => setSuggestOpen(false)}
      />
    </div>
  );
}

export default GrimoireLayout;
