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
import { TrackingOracle } from "./TrackingOracle";
import { AmbientScenery } from "./AmbientScenery";
import {
  AlchemistCalculator,
  DEFAULT_CALCULATOR_SETTINGS,
  type CalculatorSettings,
} from "./AlchemistCalculator";
import { DICTIONARIES, tr, type Lang } from "./i18n";
import { CobwebCorner, BatSwarm, JackOLantern } from "./decorations";
import { BackgroundScene, type SceneStage } from "./BackgroundScene";
import { EcuadorFlag, USAFlag } from "./flags";
import { SuggestionModal, type SuggestionPrefill } from "./SuggestionModal";

/** Round to 2 decimals so stored figures never carry long float tails. */
const round2 = (n: number) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

const STORAGE_KEY = "phantasm-track-state-v1";
const CINEMATICS_KEY = "phantasm-track-cinematics-v1";

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
  const [toastVisible, setToastVisible] = useState(false);
  const [toastSeq, setToastSeq] = useState(0);
  // Spotlight mode: dims the page and pulses a ring around the language switch
  // for the lifetime of the welcome toast.
  const [spotlight, setSpotlight] = useState(false);
  // User preference: foreground cinematics on/off (persisted separately).
  const [cinematicsEnabled, setCinematicsEnabled] = useState<boolean>(true);
  // Cinematic handoff trigger: bumping this replays the foreground sequence.
  const [triggerKey, setTriggerKey] = useState(0);
  // Which cinematic to play. Starts as the macabre "welcome" ritual on every
  // page open/reload; quest actions switch it to their specific stage.
  const [sceneStage, setSceneStage] = useState<SceneStage>("welcome");
  // Raven Messenger (suggestions) modal.
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestPrefill, setSuggestPrefill] = useState<SuggestionPrefill | null>(null);

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
        const data: unknown = JSON.parse(raw);
        // Must be a plain object (not null / array / primitive).
        if (data && typeof data === "object" && !Array.isArray(data)) {
          const parsed = data as Partial<PersistedState>;
          const isFiniteNum = (v: unknown): v is number =>
            typeof v === "number" && Number.isFinite(v);
          const stages: string[] = Object.values(QuestStage);
          if (Array.isArray(parsed.quests)) {
            // Keep only entries with the expected shape; drop corrupt ones.
            const valid = (parsed.quests as unknown[]).filter((q): q is QuestEntry => {
              if (!q || typeof q !== "object") return false;
              const e = q as Record<string, unknown>;
              return (
                typeof e.id === "string" &&
                typeof e.label === "string" &&
                typeof e.stage === "string" &&
                stages.includes(e.stage) &&
                isFiniteNum(e.packageWeight) &&
                isFiniteNum(e.fobValue) &&
                isFiniteNum(e.total)
              );
            });
            if (valid.length > 0 || parsed.quests.length === 0) {
              // Heal previously stored 16-digit floats.
              setQuests(
                valid.map((q) => ({
                  ...q,
                  packageWeight: round2(q.packageWeight),
                  fobValue: round2(q.fobValue),
                  total: round2(q.total),
                }))
              );
            }
          }
          if (parsed.lang === "es" || parsed.lang === "en") setLang(parsed.lang);
          if (
            parsed.settings &&
            typeof parsed.settings === "object" &&
            !Array.isArray(parsed.settings)
          ) {
            setSettings({ ...DEFAULT_CALCULATOR_SETTINGS, ...parsed.settings });
          }
          if (isFiniteNum(parsed.nextId)) setNextId(parsed.nextId);
        }
      }
    } catch {
      // Corrupt or unavailable storage — fall back to seed defaults silently.
    }
    try {
      if (window.localStorage.getItem(CINEMATICS_KEY) === "false") {
        setCinematicsEnabled(false);
      }
    } catch {
      // Ignore unavailable storage; cinematics stay enabled.
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

  const toggleCinematics = useCallback(() => {
    setCinematicsEnabled((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(CINEMATICS_KEY, String(next));
      } catch {
        // Ignore quota / unavailable storage.
      }
      return next;
    });
  }, []);

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
      if (!cinematicsEnabled) return;
      if (nextStage === QuestStage.CustomsAbyss) {
        setSceneStage("customs");
        setTriggerKey((k) => k + 1);
      } else if (nextStage === QuestStage.GuildDelivery) {
        setSceneStage("delivered");
        setTriggerKey((k) => k + 1);
      }
    },
    [cinematicsEnabled]
  );

  const handleInscribe = useCallback(
    (args: { label: string; packageWeight: number; fobValue: number }) => {
      const id = `ARC-${nextId}`;
      const built = buildQuestEntry({ id, ...args });
      if (!built.ok) return; // calculator already guards, but stay safe
      // Round stored display figures (the domain already computed regime/total).
      const entry: QuestEntry = {
        ...built.value,
        label: built.value.label.slice(0, 60),
        packageWeight: round2(built.value.packageWeight),
        fobValue: round2(built.value.fobValue),
        total: round2(built.value.total),
      };
      setQuests((prev) => [entry, ...prev]);
      setNextId((n) => n + 1);
      // A freshly inscribed quest starts at OriginPortal -> packing cinematic.
      if (!cinematicsEnabled) return;
      setSceneStage("packing");
      setTriggerKey((k) => k + 1);
    },
    [nextId, cinematicsEnabled]
  );

  // Oracle -> Guild Log: sensible defaults (1.2 kg / $45 FOB) for a tracked parcel.
  const handleCreateQuestFromTracking = useCallback(
    (trackingCode: string, carrierName: string) => {
      handleInscribe({
        label: `${carrierName} · ${trackingCode}`,
        packageWeight: 1.2,
        fobValue: 45,
      });
    },
    [handleInscribe]
  );

  // Oracle -> Raven Messenger: open the modal pre-filled for a wrong carrier match.
  const handleReportTracking = useCallback(
    (trackingCode: string, detectedNames: string) => {
      const message = tr(DICTIONARIES[lang].oracleReportTemplate, {
        code: trackingCode || (lang === "es" ? "[CÓDIGO]" : "[CODE]"),
        detected: detectedNames,
      });
      setSuggestPrefill((prev) => ({
        seq: (prev?.seq ?? 0) + 1,
        category: "courier",
        message,
      }));
      setSuggestOpen(true);
    },
    [lang]
  );

  const handleDelete = useCallback((id: string) => {
    setQuests((prev) => prev.filter((q) => q.id !== id));
    // Banishing always plays the sweep cinematic; parcel ownership afterward is
    // derived from the remaining quests via `delivered`.
    if (!cinematicsEnabled) return;
    setSceneStage("banished");
    setTriggerKey((k) => k + 1);
  }, [cinematicsEnabled]);

  const handleReset = useCallback(() => {
    setQuests(seedQuests());
    setNextId(1000);
    // Restoring the grimoire replays the macabre welcome ritual.
    if (!cinematicsEnabled) return;
    setSceneStage("welcome");
    setTriggerKey((k) => k + 1);
  }, [cinematicsEnabled]);

  const replayHandoff = useCallback(() => {
    if (!cinematicsEnabled) return;
    setTriggerKey((k) => k + 1);
  }, [cinematicsEnabled]);

  const dismissToast = useCallback(() => {
    setToastVisible(false);
    setSpotlight(false);
  }, []);

  const toggleLang = useCallback(() => {
    setSpotlight(false);
    setLang((prev) => (prev === "es" ? "en" : "es"));
    // Re-trigger the toast in the newly selected language on every click.
    setToastVisible(true);
    setToastSeq((n) => n + 1);
  }, []);

  // Auto-dismiss the toast ~3.5s after each trigger. Re-running on `toastSeq`
  // clears the previous timer, so rapid clicks reset the countdown cleanly.
  useEffect(() => {
    // Read the persisted preference directly: state is not hydrated yet.
    let cinematicsOn = true;
    try {
      cinematicsOn = window.localStorage.getItem(CINEMATICS_KEY) !== "false";
    } catch {
      // Unavailable storage: assume cinematics are on.
    }
    // Animations OFF: no welcome cinematic to wait for, show almost at once.
    const welcomeWait = window.setTimeout(
      () => {
        setToastVisible(true);
        setSpotlight(true);
        setToastSeq((n) => n + 1);
      },
      cinematicsOn ? 4300 : 250
    );
    return () => window.clearTimeout(welcomeWait);
  }, []);

  useEffect(() => {
    if (!toastVisible) return;
    const t = window.setTimeout(() => {
      setToastVisible(false);
      setSpotlight(false);
    }, cinematicsEnabled ? 4000 : 2500);
    return () => window.clearTimeout(t);
    // cinematicsEnabled intentionally excluded: toggling must not restart the timer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      {/* Faint graveyard / bats / cobwebs backdrop (z-0, non-interactive) */}
      <AmbientScenery />

      {/* 4-stage quest-lifecycle cinematic: foreground (z-50) ~2.4s, then z-0 */}
      <BackgroundScene
        sceneStage={sceneStage}
        hasDeliveredParcel={delivered}
        triggerKey={triggerKey}
        lang={lang}
        cinematicsEnabled={cinematicsEnabled}
      />

      {/* Language toast — shown on load and on every switch, in the active lang.
          `key={toastSeq}` remounts it so the pop-in/fade animation replays. */}
      {spotlight && cinematicsEnabled ? (
        <div
          aria-hidden
          onClick={dismissToast}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-[2px]"
        />
      ) : null}

      {toastVisible ? (
        <div className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex justify-center px-4">
          <div
            key={toastSeq}
            // Match the faster 2.5s auto-dismiss so the fade-out completes.
            style={cinematicsEnabled ? undefined : { animationDuration: "2.5s" }}
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

      {/* While spotlighted, the wrapper drops its z-index so the header can
          escape to the root stacking context and sit above the z-40 backdrop. */}
      <div
        className={[
          "relative mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8 xl:px-56 2xl:px-64",
          spotlight ? "" : "z-10",
        ].join(" ")}
      >
        {/* Ornate gothic header card with flying bats + sleek language pill */}
        <header
          className={[
            "relative mb-8 rounded-2xl border border-border-arcane/60 bg-surface/40 px-4 py-6 text-center",
            // backdrop-filter creates a stacking context that would trap the
            // switch below the overlay, so it is disabled during the spotlight.
            spotlight ? "" : "backdrop-blur-sm",
          ].join(" ")}
        >
          {/* Top-right controls: replay-handoff + feedback + language pill.
              No z-index while spotlighted so only the switch escapes. */}
          {/* Below lg it flows above the title (never overlaps it); from lg up it
              floats in the top-right corner as before. */}
          <div
            className={[
              "mb-4 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 lg:absolute lg:right-3 lg:top-3 lg:mb-0 lg:justify-end",
              spotlight ? "relative" : "relative z-20",
            ].join(" ")}
          >
            <button
              type="button"
              onClick={replayHandoff}
              className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/50 bg-gradient-to-r from-amber-500/20 to-orange-500/15 px-2.5 py-1 text-[11px] font-bold sm:px-3 sm:py-1.5 sm:text-xs text-amber-100 shadow-[0_0_18px_-6px_rgba(245,158,11,0.9)] ring-1 ring-inset ring-amber-400/20 transition-all hover:from-amber-500/35 hover:shadow-[0_0_24px_-4px_rgba(245,158,11,1)] active:scale-95 lg:text-sm"
            >
              {d.playHandoff}
            </button>
            <button
              type="button"
              onClick={toggleCinematics}
              aria-pressed={cinematicsEnabled}
              title={d.cinematicsTooltip}
              aria-label={d.cinematicsTooltip}
              className={[
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold sm:px-3 sm:py-1.5 sm:text-xs ring-1 ring-inset transition-all active:scale-95 lg:text-sm",
                cinematicsEnabled
                  ? "border-emerald-400/50 bg-gradient-to-r from-arcane-violet/25 to-emerald-500/20 text-emerald-100 ring-emerald-400/20 shadow-[0_0_18px_-6px_rgba(52,211,153,0.9)] hover:from-arcane-violet/40 hover:shadow-[0_0_24px_-4px_rgba(52,211,153,1)]"
                  : "border-slate-500/40 bg-slate-800/60 text-slate-400 ring-slate-500/10 hover:bg-slate-700/60",
              ].join(" ")}
            >
              {cinematicsEnabled ? d.cinematicsOn : d.cinematicsOff}
            </button>
            <button
              type="button"
              onClick={() => setSuggestOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/50 bg-gradient-to-r from-emerald-500/20 to-teal-500/15 px-2.5 py-1 text-[11px] font-bold sm:px-3 sm:py-1.5 sm:text-xs text-emerald-100 shadow-[0_0_18px_-6px_rgba(52,211,153,0.9)] ring-1 ring-inset ring-emerald-400/20 transition-all hover:from-emerald-500/35 hover:shadow-[0_0_24px_-4px_rgba(52,211,153,1)] active:scale-95 lg:text-sm"
            >
              {d.feedbackButton}
            </button>
            <button
              type="button"
              onClick={toggleLang}
              aria-label={d.switchTo}
              className={[
                "inline-flex items-center gap-1.5 rounded-full border border-arcane-violet/50 bg-gradient-to-r from-arcane-violet/25 to-arcane-blue/20 px-2.5 py-1 text-[11px] font-bold sm:px-3 sm:py-1.5 sm:text-xs text-foreground transition-all active:scale-95 lg:text-sm",
                spotlight
                  ? cinematicsEnabled
                    ? "relative z-50 animate-pulse ring-4 ring-amber-400 shadow-[0_0_35px_rgba(251,191,36,0.95)]"
                    : "relative z-50 ring-2 ring-amber-400/70 shadow-[0_0_14px_rgba(251,191,36,0.5)]"
                  : "shadow-[0_0_18px_-6px_rgba(167,139,250,0.9)] ring-1 ring-inset ring-arcane-violet/20 hover:from-arcane-violet/40 hover:shadow-[0_0_24px_-4px_rgba(167,139,250,1)]",
              ].join(" ")}
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
          <h1 className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 font-serif text-2xl font-bold tracking-tight text-foreground sm:gap-x-3 sm:text-4xl">
            <Scroll className="h-6 w-6 text-arcane-violet sm:h-8 sm:w-8" aria-hidden />
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
          <div className="flex flex-col gap-6">
            <TrackingOracle
              lang={lang}
              onCreateQuestFromTracking={handleCreateQuestFromTracking}
              onReportTracking={handleReportTracking}
            />
            <QuestLog
              quests={quests}
              lang={lang}
              onAdvance={handleAdvance}
              onDelete={handleDelete}
              onReset={handleReset}
            />
          </div>
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
        prefill={suggestPrefill}
        lang={lang}
        onClose={() => setSuggestOpen(false)}
      />
    </div>
  );
}

export default GrimoireLayout;
