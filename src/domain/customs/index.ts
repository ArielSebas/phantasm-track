// Barrel for the pure, UI-free customs domain layer.
//
// UI components import domain functions only from here. No React or UI imports
// may ever appear in this layer.

// Types, enums, and shared constants.
export type {
  Result,
  ValidationField,
  ValidationCode,
  ValidationError,
  PackageInput,
  CustomsConfig,
  TaxResult,
  ManaBarStatus,
  ManaBarInput,
  ManaBarResult,
  ManaBarConfig,
  Quest,
} from "./types";
export { ImportRegime, QuestStage, QUEST_SEQUENCE } from "./types";

// Ecuador configuration constants and defaults.
export {
  WEIGHT_LIMIT,
  FOB_LIMIT,
  WARNING_THRESHOLD,
  CRITICAL_THRESHOLD,
  DEFAULT_AD_VALOREM_RATE,
  DEFAULT_VAT_RATE,
  DEFAULT_FLAT_FEE,
  ANNUAL_WEIGHT_LIMIT,
  ANNUAL_BUDGET_LIMIT,
  DEFAULT_CUSTOMS_CONFIG,
  DEFAULT_MANA_BAR_CONFIG,
} from "./config";

// Regime selection.
export { selectRegime } from "./regime";

// Customs calculator.
export { round2, calculateCustoms } from "./calculator";

// Mana bars.
export { computeManaBar, manaBarStatus } from "./manaBar";

// Quest tracker.
export { createQuest, advanceQuest, setQuestStage } from "./quest";
