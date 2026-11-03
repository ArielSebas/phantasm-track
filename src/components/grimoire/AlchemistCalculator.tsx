"use client";

import { useMemo, useState } from "react";
import {
  FlaskConical,
  Scale,
  Coins,
  Sparkles,
  ShieldCheck,
  Flame,
  AlertTriangle,
  PenLine,
  Wand2,
} from "lucide-react";
import {
  calculateCustoms,
  DEFAULT_CUSTOMS_CONFIG,
  DEFAULT_VAT_RATE,
  ImportRegime,
  type TaxResult,
  type ValidationError,
} from "@/domain/customs";

export interface AlchemistCalculatorProps {
  /** Inscribe the current valid calculation into the quest log. */
  readonly onInscribe: (args: {
    label: string;
    packageWeight: number;
    fobValue: number;
  }) => void;
}

interface Preset {
  readonly label: string;
  readonly weight: string;
  readonly fob: string;
}

const PRESETS: readonly Preset[] = [
  { label: "4x4 Safe Loot (2.5kg / $180)", weight: "2.5", fob: "180" },
  { label: "Heavy Relic (5.2kg / $250)", weight: "5.2", fob: "250" },
  { label: "High-Value Artifact (1.8kg / $550)", weight: "1.8", fob: "550" },
];

const USD = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Parse a form field into a number | undefined (empty -> undefined = "missing"). */
function parseField(raw: string): number | undefined {
  const trimmed = raw.trim();
  if (trimmed === "") return undefined;
  return Number(trimmed);
}

export function AlchemistCalculator({ onInscribe }: AlchemistCalculatorProps) {
  const [weight, setWeight] = useState("2.5");
  const [fob, setFob] = useState("180");
  const [label, setLabel] = useState("");

  const vatPercent = Math.round(DEFAULT_VAT_RATE * 100);

  const result = useMemo(
    () =>
      calculateCustoms(
        { packageWeight: parseField(weight), fobValue: parseField(fob) },
        DEFAULT_CUSTOMS_CONFIG
      ),
    [weight, fob]
  );

  function applyPreset(p: Preset) {
    setWeight(p.weight);
    setFob(p.fob);
  }

  function handleInscribe() {
    if (!result.ok) return;
    const w = parseField(weight);
    const f = parseField(fob);
    if (w === undefined || f === undefined) return;
    const name = label.trim() || "Unnamed Arcane Parcel";
    onInscribe({ label: name, packageWeight: w, fobValue: f });
    setLabel("");
  }

  return (
    <section className="flex flex-col rounded-2xl border border-border-arcane/70 bg-surface/60 p-5 backdrop-blur-sm">
      <header className="mb-4 flex items-center gap-2">
        <FlaskConical className="h-5 w-5 text-arcane-blue" aria-hidden />
        <h2 className="font-serif text-lg font-semibold tracking-wide text-foreground">
          Customs &amp; Tariff Alchemist
        </h2>
      </header>

      {/* Preset potions */}
      <div className="mb-4 flex flex-col gap-1.5">
        <span className="flex items-center gap-1 text-[0.65rem] uppercase tracking-widest text-foreground/40">
          <Wand2 className="h-3 w-3" aria-hidden /> Quick-test potions
        </span>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => applyPreset(p)}
              className="rounded-lg border border-arcane-blue/30 bg-arcane-blue/5 px-2.5 py-1 text-xs text-sky-200 transition-colors hover:bg-arcane-blue/15"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Inputs */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="flex items-center gap-1 text-xs font-medium text-foreground/60">
            <Scale className="h-3.5 w-3.5" aria-hidden /> Package Weight (kg)
          </span>
          <input
            type="number"
            min="0"
            step="0.1"
            inputMode="decimal"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="rounded-lg border border-border-arcane/60 bg-black/40 px-3 py-2 font-mono text-sm text-sky-100 outline-none transition-colors focus:border-arcane-blue/70 focus:shadow-[0_0_16px_-4px_rgba(110,168,254,0.7)]"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="flex items-center gap-1 text-xs font-medium text-foreground/60">
            <Coins className="h-3.5 w-3.5" aria-hidden /> FOB Value (USD)
          </span>
          <input
            type="number"
            min="0"
            step="1"
            inputMode="decimal"
            value={fob}
            onChange={(e) => setFob(e.target.value)}
            className="rounded-lg border border-border-arcane/60 bg-black/40 px-3 py-2 font-mono text-sm text-amber-100 outline-none transition-colors focus:border-amber-400/70 focus:shadow-[0_0_16px_-4px_rgba(245,158,11,0.7)]"
          />
        </label>
      </div>

      {result.ok ? (
        <Verdict result={result.value} vatPercent={vatPercent} />
      ) : (
        <ErrorBanner error={result.error} />
      )}

      {/* Inscribe */}
      <div className="mt-4 flex flex-col gap-2 border-t border-border-arcane/40 pt-4">
        <label className="flex items-center gap-2 rounded-lg border border-border-arcane/60 bg-black/40 px-3 py-2 focus-within:border-arcane-violet/70">
          <PenLine className="h-4 w-4 text-foreground/40" aria-hidden />
          <input
            type="text"
            value={label}
            placeholder="Name this quest (e.g. Obsidian GPU from Amazon)"
            onChange={(e) => setLabel(e.target.value)}
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-foreground/30"
          />
        </label>
        <button
          type="button"
          onClick={handleInscribe}
          disabled={!result.ok}
          className="flex items-center justify-center gap-2 rounded-lg border border-arcane-violet/50 bg-gradient-to-r from-arcane-violet/20 to-arcane-blue/20 px-4 py-2.5 text-sm font-semibold text-foreground transition-all hover:shadow-[0_0_24px_-6px_rgba(167,139,250,0.9)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:shadow-none"
        >
          <Sparkles className="h-4 w-4" aria-hidden />
          Inscribe as Active Quest
        </button>
      </div>
    </section>
  );
}

function Verdict({
  result,
  vatPercent,
}: {
  result: TaxResult;
  vatPercent: number;
}) {
  const isFourByFour = result.regime === ImportRegime.FourByFour;

  return (
    <div className="flex flex-col gap-3">
      {/* Regime banner */}
      <div
        className={[
          "flex items-center gap-2 rounded-xl border px-4 py-3",
          isFourByFour
            ? "border-emerald-500/40 bg-emerald-950/30 text-emerald-200 animate-arcane-glow"
            : "border-amber-500/40 bg-amber-950/30 text-amber-200 animate-warning-glow",
        ].join(" ")}
      >
        {isFourByFour ? (
          <ShieldCheck className="h-5 w-5" aria-hidden />
        ) : (
          <Flame className="h-5 w-5" aria-hidden />
        )}
        <span className="font-serif text-sm font-bold tracking-wide">
          {isFourByFour ? "4x4 Simplified Regime" : "General Import Regime"}
        </span>
      </div>

      {/* Itemized breakdown */}
      <dl className="overflow-hidden rounded-xl border border-border-arcane/50 bg-black/30 text-sm">
        <Row label="Ad-Valorem Tariff" value={USD(result.adValoremTariff)} />
        <Row label={`Ecuador VAT ${vatPercent}%`} value={USD(result.vat)} />
        <Row label="Courier Flat Fee" value={USD(result.flatFee)} />
        <div className="flex items-center justify-between bg-arcane-violet/10 px-4 py-2.5">
          <dt className="flex items-center gap-1.5 font-serif font-bold text-foreground">
            <Flame className="h-4 w-4 text-rose-300" aria-hidden /> Total Tribute Due
          </dt>
          <dd className="font-mono text-base font-bold text-rose-200">
            {USD(result.total)}
          </dd>
        </div>
      </dl>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border-arcane/30 px-4 py-2 last:border-b-0">
      <dt className="text-foreground/60">{label}</dt>
      <dd className="font-mono text-foreground/90">{value}</dd>
    </div>
  );
}

function ErrorBanner({ error }: { error: ValidationError }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-red-600/40 bg-red-950/30 px-4 py-3 text-sm text-red-200 animate-critical-pulse">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div>
        <p className="font-semibold capitalize">{error.field} rejected</p>
        <p className="text-xs text-red-300/80">{error.message}</p>
      </div>
    </div>
  );
}

export default AlchemistCalculator;
