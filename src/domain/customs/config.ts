// Ecuador 4x4 regime defaults and injected configuration objects.
//
// NO React / NO UI imports. Rates are representative, configurable policy
// inputs; the calculator reads them only through an injected CustomsConfig so
// deployments can override them without touching logic.

import type { CustomsConfig, ManaBarConfig } from "./types";

// --- Per-package 4x4 rule limits ---
export const WEIGHT_LIMIT = 4; // kg  (FourByFour regime max)
export const FOB_LIMIT = 400; // USD (FourByFour regime max)

// --- Mana-bar thresholds (percent) ---
export const WARNING_THRESHOLD = 80; // percent
export const CRITICAL_THRESHOLD = 100; // percent

// --- Representative, configurable rates (fractions). Override per policy. ---
export const DEFAULT_AD_VALOREM_RATE = 0.1; // 10%
export const DEFAULT_VAT_RATE = 0.15; // 15%
export const DEFAULT_FLAT_FEE = 42; // USD courier/customs fee

// --- Annual quota limits consumed by the Mana Bars ---
export const ANNUAL_WEIGHT_LIMIT = 48; // kg  (annual cumulative weight quota)
export const ANNUAL_BUDGET_LIMIT = 1600; // USD (annual cumulative budget quota)

export const DEFAULT_CUSTOMS_CONFIG: CustomsConfig = {
  weightLimit: WEIGHT_LIMIT,
  fobLimit: FOB_LIMIT,
  adValoremRate: DEFAULT_AD_VALOREM_RATE,
  vatRate: DEFAULT_VAT_RATE,
  flatFee: DEFAULT_FLAT_FEE,
};

export const DEFAULT_MANA_BAR_CONFIG: ManaBarConfig = {
  warningThreshold: WARNING_THRESHOLD,
  criticalThreshold: CRITICAL_THRESHOLD,
};
