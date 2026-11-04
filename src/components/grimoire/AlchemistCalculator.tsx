"use client";

import { useEffect, useMemo, useState } from "react";
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
  Lock,
  Skull,
  Truck,
  ShoppingBag,
  Package,
  Landmark,
  HelpCircle,
  Receipt,
  ChevronDown,
} from "lucide-react";
import {
  calculateCustoms,
  DEFAULT_CUSTOMS_CONFIG,
  DEFAULT_VAT_RATE,
  DEFAULT_FLAT_FEE,
  ImportRegime,
  type CustomsConfig,
  type TaxResult,
  type ValidationError,
} from "@/domain/customs";
import {
  DICTIONARIES,
  tr,
  LB_PER_KG,
  FOUR_BY_FOUR_LB,
  type Lang,
} from "./i18n";
import { CobwebCorner, JackOLantern } from "./decorations";
import { quoteCourier, type CourierId } from "./courierQuotes";

export type ShippingMode = "temu" | "courier";
export type WeightUnit = "lb" | "kg";

/** Persisted calculator/courier settings owned by the parent. */
export interface CalculatorSettings {
  readonly mode: ShippingMode;
  readonly unit: WeightUnit;
  /** Which real-Ecuador courier tariff model is selected. */
  readonly courier: CourierId;
  /** Courier rate in $/lb (only used by the "custom"/manual model). */
  readonly ratePerLb: number;
}

export const DEFAULT_CALCULATOR_SETTINGS: CalculatorSettings = {
  mode: "temu",
  unit: "lb",
  courier: "laarbox",
  ratePerLb: 4.5,
};

export interface AlchemistCalculatorProps {
  readonly lang: Lang;
  readonly settings: CalculatorSettings;
  readonly onSettingsChange: (next: CalculatorSettings) => void;
  /** Inscribe the current valid calculation into the quest log (weight in kg). */
  readonly onInscribe: (args: {
    label: string;
    packageWeight: number;
    fobValue: number;
  }) => void;
  /**
   * Reports the current package weight (in kg, 0 when empty/invalid) so the
   * parent can drive the per-parcel 4x4 weight Mana Bar live.
   */
  readonly onWeightChange?: (weightKg: number) => void;
}

interface Preset {
  readonly key: "presetSafe" | "presetHeavy" | "presetHighValue";
  readonly weightKg: number;
  readonly fob: string;
}

const PRESETS: readonly Preset[] = [
  { key: "presetSafe", weightKg: 2.5, fob: "180" },
  { key: "presetHeavy", weightKg: 5.2, fob: "250" },
  { key: "presetHighValue", weightKg: 1.8, fob: "550" },
];

const COURIERS: readonly {
  id: CourierId;
  pillKey:
    | "courierPillLaarbox"
    | "courierPillUpper"
    | "courierPillTiered"
    | "courierPillCustom";
  formulaKey:
    | "courierFormulaLaarbox"
    | "courierFormulaUpper"
    | "courierFormulaTiered"
    | "courierFormulaCustom";
}[] = [
  { id: "laarbox", pillKey: "courierPillLaarbox", formulaKey: "courierFormulaLaarbox" },
  { id: "upper", pillKey: "courierPillUpper", formulaKey: "courierFormulaUpper" },
  { id: "tiered", pillKey: "courierPillTiered", formulaKey: "courierFormulaTiered" },
  { id: "custom", pillKey: "courierPillCustom", formulaKey: "courierFormulaCustom" },
];

const USD = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Parse a form field into a number | undefined (empty -> undefined = "missing"). */
function parseField(raw: string): number | undefined {
  const trimmed = raw.trim();
  if (trimmed === "") return undefined;
  return Number(trimmed);
}

/** Convert an entered weight (in the active unit) into kilograms. */
function toKg(value: number, unit: WeightUnit): number {
  return unit === "kg" ? value : value / LB_PER_KG;
}

/** Convert kilograms into pounds. */
function toLb(kg: number): number {
  return kg * LB_PER_KG;
}

export function AlchemistCalculator({
  lang,
  settings,
  onSettingsChange,
  onInscribe,
  onWeightChange,
}: AlchemistCalculatorProps) {
  const d = DICTIONARIES[lang];
  const { mode, unit, courier, ratePerLb } = settings;

  // Default displayed weight tracks the active unit (2.5 kg ≈ 5.51 lb).
  const [weight, setWeight] = useState(() =>
    unit === "kg" ? "2.5" : (2.5 * LB_PER_KG).toFixed(2)
  );
  const [fob, setFob] = useState("180");
  const [label, setLabel] = useState("");
  // De-clutter: collapsible sections, both closed by default.
  const [potionsOpen, setPotionsOpen] = useState(false);
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  // Tracks which preset (if any) is currently active, for the accordion badge.
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const vatPercent = Math.round(DEFAULT_VAT_RATE * 100);

  const weightNum = parseField(weight);
  const fobNum = parseField(fob);

  // Weight in kg drives the pure domain; lb is derived for courier math + display.
  const weightKg =
    weightNum === undefined || !Number.isFinite(weightNum)
      ? undefined
      : toKg(weightNum, unit);
  const weightLb = weightKg === undefined ? undefined : toLb(weightKg);

  // Report the live package weight (kg) up so the parent's per-parcel weight
  // Mana Bar tracks it; 0 when the field is empty/invalid.
  useEffect(() => {
    onWeightChange?.(weightKg ?? 0);
  }, [weightKg, onWeightChange]);

  // Courier quote (freight + surcharge) for the selected tariff model. Only
  // applied in courier mode; Temu adds no per-weight freight. The fixed $20
  // SENAE fee is always added by the domain layer below.
  const quote = useMemo(() => {
    if (mode !== "courier" || weightLb === undefined || weightLb < 0) {
      return { freight: 0, surcharge: 0 };
    }
    return quoteCourier(courier, weightLb, ratePerLb);
  }, [mode, courier, weightLb, ratePerLb]);

  const courierExtra = quote.freight + quote.surcharge;

  // All math is driven by the domain: we fold the fixed SENAE fee + courier
  // freight + courier surcharge into flatFee and let calculateCustoms produce
  // the authoritative TaxResult (regime, ad-valorem, VAT, total).
  const customConfig: CustomsConfig = useMemo(
    () => ({
      ...DEFAULT_CUSTOMS_CONFIG,
      flatFee: DEFAULT_FLAT_FEE + courierExtra,
    }),
    [courierExtra]
  );

  const result = useMemo(
    () =>
      calculateCustoms(
        { packageWeight: weightKg, fobValue: fobNum },
        customConfig
      ),
    [weightKg, fobNum, customConfig]
  );

  function applyPreset(p: Preset) {
    setWeight(unit === "kg" ? String(p.weightKg) : toLb(p.weightKg).toFixed(2));
    setFob(p.fob);
    setActivePreset(d[p.key]);
  }

  /** The "real case" preset sets weight unit, mode, and courier together. */
  function applyUndertalePreset() {
    onSettingsChange({
      ...settings,
      mode: "courier",
      unit: "lb",
      courier: "laarbox",
    });
    setWeight("4.65");
    setFob("189.94");
    setLabel("Undertale Collector's Edition");
    setActivePreset(d.presetUndertale);
  }

  function setMode(next: ShippingMode) {
    onSettingsChange({ ...settings, mode: next });
  }

  function setCourier(next: CourierId) {
    onSettingsChange({ ...settings, courier: next });
  }

  function setUnit(next: WeightUnit) {
    if (next === unit) return;
    // Preserve the physical weight across the unit switch for a smooth UX.
    if (weightNum !== undefined && Number.isFinite(weightNum)) {
      const kg = toKg(weightNum, unit);
      setWeight(next === "kg" ? kg.toFixed(2) : toLb(kg).toFixed(2));
    }
    onSettingsChange({ ...settings, unit: next });
  }

  function setRate(raw: string) {
    const n = Number(raw);
    onSettingsChange({
      ...settings,
      ratePerLb: Number.isFinite(n) && n >= 0 ? n : 0,
    });
  }

  function handleInscribe() {
    if (!result.ok || weightKg === undefined || fobNum === undefined) return;
    const name = label.trim() || d.unnamedParcel;
    onInscribe({ label: name, packageWeight: weightKg, fobValue: fobNum });
    setLabel("");
  }

  return (
    <section className="relative flex flex-col overflow-hidden rounded-2xl border border-border-arcane/70 bg-surface/60 p-5 backdrop-blur-sm">
      <CobwebCorner position="tr" />

      <header className="mb-4 flex items-center gap-2">
        <FlaskConical className="h-5 w-5 text-arcane-blue" aria-hidden />
        <h2 className="font-serif text-lg font-semibold tracking-wide text-foreground">
          {d.calcTitle}
        </h2>
        <JackOLantern className="ml-auto animate-float-drift" />
      </header>

      {/* Quick-test potions — collapsible, closed by default */}
      <div className="mb-4 overflow-hidden rounded-xl border border-arcane-blue/25 bg-arcane-blue/5">
        <button
          type="button"
          onClick={() => setPotionsOpen((o) => !o)}
          aria-expanded={potionsOpen}
          className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-arcane-blue/10"
        >
          <Wand2 className="h-3.5 w-3.5 shrink-0 text-sky-300" aria-hidden />
          <span className="text-xs font-semibold text-sky-100">
            {d.quickPotionsAccordion}
          </span>
          {activePreset ? (
            <span className="ml-1 truncate rounded-full bg-amber-500/15 px-2 py-0.5 text-[0.6rem] font-semibold text-amber-200 ring-1 ring-inset ring-amber-400/40">
              {activePreset}
            </span>
          ) : null}
          <ChevronDown
            className={[
              "ml-auto h-4 w-4 shrink-0 text-foreground/50 transition-transform duration-300",
              potionsOpen ? "rotate-180" : "",
            ].join(" ")}
            aria-hidden
          />
        </button>
        <div
          className={[
            "grid transition-all duration-300 ease-out",
            potionsOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
          ].join(" ")}
        >
          <div className="overflow-hidden">
            <div className="flex flex-wrap gap-1.5 px-3 pb-3 pt-1">
              {PRESETS.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className="rounded-lg border border-arcane-blue/30 bg-arcane-blue/5 px-2.5 py-1 text-xs text-sky-200 transition-colors hover:bg-arcane-blue/15"
                >
                  {d[p.key]}
                </button>
              ))}
              <button
                type="button"
                onClick={applyUndertalePreset}
                className="rounded-lg border border-amber-400/40 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-200 transition-colors hover:bg-amber-500/20"
              >
                {d.presetUndertale}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Shipping mode toggle */}
      <div className="mb-4 flex flex-col gap-1.5">
        <span className="text-[0.65rem] uppercase tracking-widest text-foreground/40">
          {d.shippingMode}
        </span>
        <div className="grid grid-cols-2 gap-2">
          <ModeButton
            active={mode === "temu"}
            onClick={() => setMode("temu")}
            icon={ShoppingBag}
            title={d.modeTemu}
            hint={d.modeTemuHint}
          />
          <ModeButton
            active={mode === "courier"}
            onClick={() => setMode("courier")}
            icon={Truck}
            title={d.modeCourier}
            hint={d.modeCourierHint}
          />
        </div>
      </div>

      {/* Courier quoter — only in courier mode */}
      {mode === "courier" ? (
        <div className="mb-4 flex flex-col gap-2 rounded-xl border border-emerald-500/25 bg-emerald-950/10 p-3">
          <span className="group relative flex items-center gap-1.5 text-xs font-semibold text-emerald-100">
            <Truck className="h-3.5 w-3.5" aria-hidden /> {d.courierPickerLabel}
            <HelpCircle
              className="h-3.5 w-3.5 cursor-help text-emerald-300/70"
              aria-hidden
            />
            <span
              role="tooltip"
              className="pointer-events-none absolute left-0 top-6 z-20 w-64 rounded-lg border border-border-arcane/70 bg-surface-raised/95 p-2.5 text-[0.7rem] font-normal leading-snug text-foreground/80 opacity-0 shadow-xl transition-opacity duration-200 group-hover:opacity-100"
            >
              {d.courierPickerHelp}
            </span>
          </span>

          {/* Compact horizontal courier pills */}
          <div className="flex flex-wrap gap-1.5">
            {COURIERS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCourier(c.id)}
                className={[
                  "rounded-full border px-2.5 py-1 text-xs font-semibold transition-all",
                  courier === c.id
                    ? "border-emerald-400/60 bg-emerald-500/20 text-emerald-100 shadow-[0_0_14px_-5px_rgba(52,211,153,0.9)]"
                    : "border-border-arcane/50 bg-black/30 text-foreground/55 hover:border-emerald-400/40 hover:text-foreground/80",
                ].join(" ")}
              >
                {d[c.pillKey]}
              </button>
            ))}
          </div>

          {/* Single compact 1-line formula badge for the selected courier */}
          <span className="inline-flex w-fit items-center gap-1.5 rounded-md bg-black/30 px-2 py-0.5 font-mono text-[0.65rem] text-emerald-200/80">
            ƒ ·{" "}
            {d[COURIERS.find((c) => c.id === courier)?.formulaKey ?? "courierFormulaCustom"]}
          </span>

          {/* Manual $/lb rate (custom model only) */}
          {courier === "custom" ? (
            <label className="mt-1 flex flex-col gap-1">
              <span className="text-xs font-medium text-foreground/60">
                {d.ratePerLb}
              </span>
              <input
                type="number"
                min="0"
                step="0.1"
                inputMode="decimal"
                value={String(ratePerLb)}
                onChange={(e) => setRate(e.target.value)}
                className="rounded-lg border border-border-arcane/60 bg-black/40 px-3 py-2 font-mono text-sm text-emerald-100 outline-none transition-colors focus:border-emerald-400/70 focus:shadow-[0_0_16px_-4px_rgba(52,211,153,0.7)]"
              />
              <span className="text-[0.65rem] text-foreground/40">
                {d.ratePerLbHint}
              </span>
            </label>
          ) : null}
        </div>
      ) : null}

      {/* Weight unit toggle */}
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[0.65rem] uppercase tracking-widest text-foreground/40">
          {d.weightUnit}
        </span>
        <div className="inline-flex overflow-hidden rounded-lg border border-border-arcane/60">
          {(["lb", "kg"] as const).map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => setUnit(u)}
              className={[
                "px-3 py-1 text-xs font-bold uppercase transition-colors",
                unit === u
                  ? "bg-arcane-blue/25 text-sky-100"
                  : "bg-black/30 text-foreground/40 hover:text-foreground/70",
              ].join(" ")}
            >
              {u}
            </button>
          ))}
        </div>
      </div>

      {/* Inputs */}
      <div className="mb-1 grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="flex items-center gap-1 text-xs font-medium text-foreground/60">
            <Scale className="h-3.5 w-3.5" aria-hidden />{" "}
            {tr(d.packageWeight, { unit })}
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
            <Coins className="h-3.5 w-3.5" aria-hidden /> {d.fobValue}
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

      {/* Conversion + limit hints, with the compact inline locked SENAE badge */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[0.65rem] text-foreground/40">
          {weightKg !== undefined
            ? tr(d.conversionHint, {
                kg: weightKg.toFixed(2),
                lb: toLb(weightKg).toFixed(2),
              })
            : `1 kg = ${LB_PER_KG} lb`}{" "}
          · {d.limitHint} ({FOUR_BY_FOUR_LB} lb)
        </p>
        {/* Compact, non-editable fixed $20 SENAE fee badge */}
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-950/20 px-2.5 py-0.5 text-[0.65rem] font-semibold text-amber-100">
          <Lock className="h-3 w-3 shrink-0 text-amber-300" aria-hidden />
          {d.compactSenaeBadge}
        </span>
      </div>

      {result.ok ? (
        <Verdict
          result={result.value}
          vatPercent={vatPercent}
          d={d}
          mode={mode}
          fixedFee={DEFAULT_FLAT_FEE}
          freight={quote.freight}
          surcharge={quote.surcharge}
          weightLb={weightLb}
          ratePerLb={ratePerLb}
          fobValue={fobNum}
          breakdownOpen={breakdownOpen}
          onToggleBreakdown={() => setBreakdownOpen((o) => !o)}
        />
      ) : (
        <ErrorBanner error={result.error} d={d} />
      )}

      {/* Inscribe */}
      <div className="mt-4 flex flex-col gap-2 border-t border-border-arcane/40 pt-4">
        <label className="flex items-center gap-2 rounded-lg border border-border-arcane/60 bg-black/40 px-3 py-2 focus-within:border-arcane-violet/70">
          <PenLine className="h-4 w-4 text-foreground/40" aria-hidden />
          <input
            type="text"
            value={label}
            placeholder={d.questNamePlaceholder}
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
          {d.inscribe}
        </button>
      </div>
    </section>
  );
}

function ModeButton({
  active,
  onClick,
  icon: Icon,
  title,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof ShoppingBag;
  title: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex flex-col gap-1 rounded-xl border px-3 py-2 text-left transition-all",
        active
          ? "border-arcane-violet/60 bg-arcane-violet/15 shadow-[0_0_20px_-6px_rgba(167,139,250,0.8)]"
          : "border-border-arcane/50 bg-black/30 hover:border-arcane-violet/40",
      ].join(" ")}
    >
      <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
        <Icon className="h-4 w-4" aria-hidden />
        {title}
      </span>
      <span className="text-[0.65rem] leading-snug text-foreground/45">{hint}</span>
    </button>
  );
}

function Verdict({
  result,
  vatPercent,
  d,
  mode,
  fixedFee,
  freight,
  surcharge,
  weightLb,
  ratePerLb,
  fobValue,
  breakdownOpen,
  onToggleBreakdown,
}: {
  result: TaxResult;
  vatPercent: number;
  d: (typeof DICTIONARIES)[Lang];
  mode: ShippingMode;
  fixedFee: number;
  freight: number;
  surcharge: number;
  weightLb?: number;
  ratePerLb: number;
  fobValue?: number;
  breakdownOpen: boolean;
  onToggleBreakdown: () => void;
}) {
  const isFourByFour = result.regime === ImportRegime.FourByFour;

  // Breakdown decomposition. The domain `total` already includes everything we
  // folded into flatFee (SENAE + freight + surcharge) plus any ad-valorem/VAT.
  // "Customs only" = total minus the courier freight (freight is shipping, not
  // a customs charge). This keeps the 3 boxes mutually exclusive and summing to
  // the import total.
  const customsAndFees = result.total - freight;
  const importTotal = result.total; // freight + surcharge + SENAE (+ taxes)
  const finalTotal =
    fobValue !== undefined ? importTotal + fobValue : undefined;

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
          <Skull className="h-5 w-5" aria-hidden />
        )}
        <span className="font-serif text-sm font-bold tracking-wide">
          {isFourByFour ? d.regimeFourByFour : d.regimeGeneral}
        </span>
      </div>

      {/* Arcane skull warning for the General regime */}
      {!isFourByFour ? (
        <p className="flex items-center gap-1.5 rounded-lg border border-amber-600/30 bg-amber-950/20 px-3 py-1.5 text-xs text-amber-200/90">
          <Skull className="h-3.5 w-3.5 shrink-0 animate-rune-flicker" aria-hidden />
          {d.generalWarning}
        </p>
      ) : null}

      {/* 3-box visual summary: product / freight / customs */}
      <div className="grid grid-cols-3 gap-2">
        <SummaryBox
          icon={ShoppingBag}
          tone="sky"
          title={d.boxProductValue}
          value={fobValue !== undefined ? USD(fobValue) : "—"}
        />
        <SummaryBox
          icon={Package}
          tone="violet"
          title={d.boxFreight}
          value={mode === "temu" ? USD(0) : USD(freight)}
          note={mode === "temu" ? d.boxFreightTemuNote : undefined}
        />
        <SummaryBox
          icon={Landmark}
          tone="amber"
          title={d.boxCustoms}
          value={USD(customsAndFees)}
          note={isFourByFour ? d.boxCustomsFourByFour : d.boxCustomsGeneral}
        />
      </div>

      {/* Collapsible itemized tax breakdown — closed by default; the 3 summary
          cards above already surface the key numbers. */}
      <div className="overflow-hidden rounded-xl border border-border-arcane/50 bg-black/30">
        <button
          type="button"
          onClick={onToggleBreakdown}
          aria-expanded={breakdownOpen}
          className="flex w-full items-center gap-2 px-4 py-2 text-left text-xs font-semibold text-foreground/70 transition-colors hover:bg-black/20"
        >
          {d.detailedBreakdown}
          <ChevronDown
            className={[
              "ml-auto h-4 w-4 shrink-0 transition-transform duration-300",
              breakdownOpen ? "rotate-180" : "",
            ].join(" ")}
            aria-hidden
          />
        </button>
        <div
          className={[
            "grid transition-all duration-300 ease-out",
            breakdownOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
          ].join(" ")}
        >
          <dl className="overflow-hidden border-t border-border-arcane/30 text-sm">
            {!isFourByFour ? (
              <>
                <Row label={d.rowAdValorem} value={USD(result.adValoremTariff)} />
                <Row
                  label={tr(d.rowVat, { pct: vatPercent })}
                  value={USD(result.vat)}
                />
              </>
            ) : null}
            <Row label={d.rowFixedFee} value={USD(fixedFee)} locked />
            {mode === "courier" ? (
              <>
                <Row
                  label={tr(d.rowFreight, {
                    lb: (weightLb ?? 0).toFixed(2),
                    rate:
                      weightLb && weightLb > 0
                        ? (freight / weightLb).toFixed(3)
                        : ratePerLb.toFixed(2),
                  })}
                  value={USD(freight)}
                />
                {surcharge > 0 ? (
                  <Row label={d.rowSurcharge} value={USD(surcharge)} />
                ) : null}
              </>
            ) : null}
          </dl>
        </div>
      </div>

      {/* Always-visible import total (key number, kept out of the accordion) */}
      <div className="flex items-center justify-between rounded-xl border border-arcane-violet/40 bg-arcane-violet/10 px-4 py-2.5">
        <span className="flex items-center gap-1.5 font-serif font-bold text-foreground">
          <Receipt className="h-4 w-4 text-rose-300" aria-hidden /> {d.grandImportTotal}
        </span>
        <span className="font-mono text-base font-bold text-rose-200">
          {USD(importTotal)}
        </span>
      </div>

      {/* Grand final total: product + import */}
      {finalTotal !== undefined ? (
        <div className="flex items-center justify-between rounded-xl border border-emerald-500/40 bg-emerald-950/20 px-4 py-2.5">
          <span className="flex items-center gap-1.5 font-serif text-sm font-bold text-emerald-100">
            <Flame className="h-4 w-4" aria-hidden /> {d.grandFinalTotal}
          </span>
          <span className="font-mono text-base font-bold text-emerald-200">
            {USD(finalTotal)}
          </span>
        </div>
      ) : null}
    </div>
  );
}

function SummaryBox({
  icon: Icon,
  tone,
  title,
  value,
  note,
}: {
  icon: typeof ShoppingBag;
  tone: "sky" | "violet" | "amber";
  title: string;
  value: string;
  note?: string;
}) {
  const toneStyles = {
    sky: "border-sky-500/30 bg-sky-950/20 text-sky-200",
    violet: "border-arcane-violet/30 bg-arcane-violet/10 text-arcane-violet",
    amber: "border-amber-500/30 bg-amber-950/20 text-amber-200",
  }[tone];

  return (
    <div className={`flex flex-col gap-1 rounded-xl border p-2.5 ${toneStyles}`}>
      <span className="flex items-center gap-1 text-[0.6rem] font-semibold uppercase leading-tight tracking-wide">
        <Icon className="h-3 w-3 shrink-0" aria-hidden />
        {title}
      </span>
      <span className="font-mono text-sm font-bold text-foreground">{value}</span>
      {note ? (
        <span className="text-[0.58rem] leading-snug text-foreground/45">{note}</span>
      ) : null}
    </div>
  );
}

function Row({
  label,
  value,
  locked = false,
}: {
  label: string;
  value: string;
  locked?: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b border-border-arcane/30 px-4 py-2 last:border-b-0">
      <dt className="flex items-center gap-1.5 text-foreground/60">
        {locked ? <Lock className="h-3 w-3 text-amber-300/80" aria-hidden /> : null}
        {label}
      </dt>
      <dd className="font-mono text-foreground/90">{value}</dd>
    </div>
  );
}

function ErrorBanner({
  error,
  d,
}: {
  error: ValidationError;
  d: (typeof DICTIONARIES)[Lang];
}) {
  const detail =
    error.code === "missing"
      ? tr(d.errMissing, { field: error.field })
      : error.code === "negative"
        ? tr(d.errNegative, { field: error.field })
        : error.code === "nonFinite"
          ? tr(d.errNonFinite, { field: error.field })
          : error.message;

  return (
    <div className="flex items-start gap-2 rounded-xl border border-red-600/40 bg-red-950/30 px-4 py-3 text-sm text-red-200 animate-critical-pulse">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div>
        <p className="font-semibold">{tr(d.errFieldRejected, { field: error.field })}</p>
        <p className="text-xs text-red-300/80">{detail}</p>
      </div>
    </div>
  );
}

export default AlchemistCalculator;
