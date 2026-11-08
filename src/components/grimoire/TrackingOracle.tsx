"use client";

import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, ExternalLink, Radar } from "lucide-react";
import { DICTIONARIES, type Lang } from "./i18n";
import {
  CARRIERS,
  DEMO_SP_CODE,
  DEMO_TMLC_CODE,
  MAX_TRACKING_LENGTH,
  carrierUrl,
  detectCarriers,
  sanitizeTrackingCode,
  type Carrier,
  type Detection,
} from "./carriers";

export interface TrackingOracleProps {
  lang: Lang;
  /** Adds the parcel to the Adventurer's Guild Log. */
  onCreateQuestFromTracking: (trackingCode: string, carrierName: string) => void;
  /** Opens the feedback modal pre-filled for a wrong carrier match. */
  onReportTracking: (trackingCode: string, detectedNames: string) => void;
}

const SCAN_MS = 1000;
const NO_DETECTION: Detection = { kind: "none", matches: [] };

export function TrackingOracle({
  lang,
  onCreateQuestFromTracking,
  onReportTracking,
}: TrackingOracleProps) {
  const d = DICTIONARIES[lang];
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [inscribed, setInscribed] = useState(false);
  const [emptyHint, setEmptyHint] = useState(false);
  const [chosen, setChosen] = useState<Carrier | null>(null);
  const scanTimer = useRef<number | null>(null);
  const copyTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (scanTimer.current) window.clearTimeout(scanTimer.current);
      if (copyTimer.current) window.clearTimeout(copyTimer.current);
    },
    []
  );

  const detection = revealed ? detectCarriers(code) : NO_DETECTION;
  const matchById = new Map(detection.matches.map((m) => [m.carrier.id, m]));

  function resetResult() {
    setRevealed(false);
    setCopied(false);
    setInscribed(false);
    setEmptyHint(false);
    setChosen(null);
  }

  function onCodeChange(raw: string) {
    setCode(sanitizeTrackingCode(raw));
    resetResult();
  }

  function runScan(target: string) {
    if (!target) {
      setEmptyHint(true);
      return;
    }
    setEmptyHint(false);
    setRevealed(false);
    setScanning(true);
    if (scanTimer.current) window.clearTimeout(scanTimer.current);
    scanTimer.current = window.setTimeout(() => {
      setScanning(false);
      setRevealed(true);
    }, SCAN_MS);
  }

  function loadDemo(demo: string) {
    setCode(demo);
    resetResult();
    runScan(demo);
  }

  async function handleCarrierClick(carrier: Carrier) {
    if (!code) {
      setEmptyHint(true);
      return;
    }
    setChosen(carrier);
    // Open synchronously inside the click so popup blockers allow it.
    window.open(carrierUrl(carrier, code), "_blank", "noopener,noreferrer");
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      if (copyTimer.current) window.clearTimeout(copyTimer.current);
      copyTimer.current = window.setTimeout(() => setCopied(false), 3500);
    } catch {
      // Clipboard unavailable (insecure context / denied): portal still opens.
    }
  }

  function handleInscribe() {
    if (!code) {
      setEmptyHint(true);
      return;
    }
    const carrier = chosen ?? detectCarriers(code).matches.at(-1)?.carrier ?? null;
    // For dual-stage guides the local carrier (last match) is the one that delivers.
    onCreateQuestFromTracking(code, carrier?.name ?? "Courier");
    setInscribed(true);
  }

  function handleReport() {
    const names = detectCarriers(code).matches.map((m) => m.carrier.name);
    onReportTracking(code, names.length > 0 ? names.join(" + ") : d.oracleReportNone);
  }

  function statusText(): string {
    if (detection.kind === "tmlc") return d.oracleTmlcDetected;
    if (detection.kind === "dual") return `${d.oracleStageIntl} → ${d.oracleStageLocal}`;
    if (detection.kind === "generic") {
      return `✨ ${d.oracleBestMatch}: ${detection.matches
        .map((m) => m.carrier.name)
        .join(" · ")}`;
    }
    return d.oracleNoMatch;
  }

  function roleLabel(role: string | undefined): string | null {
    if (role === "intl") return d.oracleStageIntl;
    if (role === "local") return d.oracleStageLocal;
    if (role === "exact") return d.oracleTmlcDetected;
    if (role === "match") return `★ ${d.oracleBestMatch}`;
    return null;
  }

  const tab = open ? 0 : -1;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-border-arcane/70 bg-surface/60 backdrop-blur-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="tracking-oracle-panel"
        aria-label={open ? d.oracleCollapse : d.oracleExpand}
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-arcane-violet/10"
      >
        <div className="min-w-0 flex-1">
          <h2 className="font-serif text-base font-semibold tracking-wide text-foreground sm:text-lg">
            {d.oracleTitle}
          </h2>
          <p className="mt-0.5 text-xs text-foreground/60">{d.oracleSubtitle}</p>
        </div>
        <ChevronDown
          className={[
            "h-5 w-5 shrink-0 text-arcane-violet transition-transform duration-300",
            open ? "rotate-180" : "",
          ].join(" ")}
          aria-hidden
        />
      </button>

      <div
        id="tracking-oracle-panel"
        className={[
          "grid transition-all duration-300 ease-in-out",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        ].join(" ")}
      >
        <div className="overflow-hidden">
          <div className="space-y-4 px-5 pb-5">
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={code}
                maxLength={MAX_TRACKING_LENGTH}
                onChange={(e) => onCodeChange(e.target.value)}
                placeholder={d.oraclePlaceholder}
                autoComplete="off"
                spellCheck={false}
                aria-label={d.oraclePlaceholder}
                tabIndex={tab}
                className="min-w-0 flex-1 rounded-lg border border-border-arcane/60 bg-black/40 px-3 py-2 font-mono text-sm uppercase text-emerald-100 outline-none transition-colors placeholder:normal-case placeholder:text-foreground/30 focus:border-emerald-400/70"
              />
              <button
                type="button"
                onClick={() => runScan(code)}
                disabled={scanning}
                tabIndex={tab}
                className="rounded-lg border border-arcane-violet/50 bg-arcane-violet/20 px-3 py-2 text-xs font-bold text-foreground transition hover:bg-arcane-violet/35 disabled:opacity-50 sm:text-sm"
              >
                {d.oracleDetect}
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { label: d.oracleDemo1, value: DEMO_TMLC_CODE },
                { label: d.oracleDemo2, value: DEMO_SP_CODE },
              ].map((demo) => (
                <button
                  key={demo.value}
                  type="button"
                  onClick={() => loadDemo(demo.value)}
                  disabled={scanning}
                  tabIndex={tab}
                  className="rounded-full border border-orange-400/40 bg-orange-950/30 px-3 py-1.5 text-xs font-semibold text-amber-100 transition hover:bg-orange-900/40 disabled:opacity-50"
                >
                  {demo.label}
                </button>
              ))}
            </div>

            {emptyHint ? (
              <p role="status" className="text-xs text-amber-300">
                {d.oracleEmptyCode}
              </p>
            ) : null}

            {scanning ? (
              <p role="status" className="flex items-center gap-2 text-xs text-arcane-blue">
                <Radar className="h-4 w-4 animate-spin" aria-hidden />
                {d.oracleScanning}
              </p>
            ) : revealed ? (
              <p role="status" className="text-xs font-semibold text-emerald-200">
                {statusText()}
              </p>
            ) : (
              <p className="text-xs text-foreground/50">{d.oraclePickCarrier}</p>
            )}

            {revealed && detection.kind === "dual" ? (
              <p className="rounded-lg border border-arcane-blue/40 bg-arcane-blue/10 px-3 py-2 text-xs text-foreground/80">
                {d.oracleDualHelp}
              </p>
            ) : null}

            <ul className="grid gap-2 sm:grid-cols-2">
              {CARRIERS.map((c) => {
                const m = matchById.get(c.id);
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => handleCarrierClick(c)}
                      tabIndex={tab}
                      className={[
                        "flex h-full w-full items-center gap-2 rounded-xl border px-3 py-2 text-left transition-all",
                        scanning ? "animate-pulse" : "",
                        m
                          ? "border-emerald-400/70 bg-emerald-500/15 shadow-[0_0_18px_-4px_rgba(52,211,153,0.8)]"
                          : "border-border-arcane/50 bg-black/30 hover:border-arcane-violet/60",
                      ].join(" ")}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-foreground">
                          {c.name}
                        </span>
                        <span className="block text-[11px] leading-snug text-foreground/50">
                          {c.note}
                        </span>
                        {m ? (
                          <span className="mt-1 block text-[11px] font-bold leading-snug text-emerald-200">
                            {roleLabel(m.role)}
                          </span>
                        ) : null}
                      </span>
                      <ExternalLink
                        className="h-4 w-4 shrink-0 text-foreground/40"
                        aria-label={d.oracleOpenPortal}
                      />
                    </button>
                  </li>
                );
              })}
            </ul>

            {copied ? (
              <p
                role="status"
                className="rounded-lg border border-emerald-400/40 bg-emerald-950/40 px-3 py-1.5 text-xs text-emerald-200"
              >
                {d.oracleCopiedPaste}
              </p>
            ) : null}

            <button
              type="button"
              onClick={handleInscribe}
              disabled={!code || inscribed}
              tabIndex={tab}
              className="w-full rounded-xl border border-purple-400/50 bg-gradient-to-r from-purple-700/70 to-indigo-700/70 py-2 text-sm font-semibold text-purple-50 transition hover:from-purple-600 hover:to-indigo-600 disabled:opacity-50"
            >
              {inscribed ? d.oracleInscribed : d.oracleInscribe}
            </button>

            <button
              type="button"
              onClick={handleReport}
              tabIndex={tab}
              className="w-full rounded-xl border border-amber-400/40 bg-amber-950/30 py-2 text-xs font-semibold text-amber-200 transition hover:bg-amber-900/40"
            >
              {d.oracleReport}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default TrackingOracle;
