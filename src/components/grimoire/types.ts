// UI-layer view models for the grimoire. These compose the pure domain Quest
// with the package figures needed for display (weight, FOB, computed tax).
// No math lives here — tax figures are produced by domain calculateCustoms
// before a quest is inscribed.

import type { Quest, ImportRegime } from "@/domain/customs";

export interface QuestEntry extends Quest {
  /** Package weight in kg (as entered / validated through the domain). */
  readonly packageWeight: number;
  /** FOB value in USD. */
  readonly fobValue: number;
  /** Regime chosen by the domain calculator. */
  readonly regime: ImportRegime;
  /** Total tribute due (USD), from the domain TaxResult. */
  readonly total: number;
}
