// Builds UI QuestEntry view models strictly from the pure domain layer.
// The UI never computes a regime or total itself — it calls calculateCustoms
// and createQuest, then (optionally) sets a starting stage.

import {
  calculateCustoms,
  createQuest,
  DEFAULT_CUSTOMS_CONFIG,
  QuestStage,
  type CustomsConfig,
  type Result,
  type ValidationError,
} from "@/domain/customs";
import type { QuestEntry } from "./types";

export interface BuildQuestArgs {
  readonly id: string;
  readonly label: string;
  readonly packageWeight: number;
  readonly fobValue: number;
  readonly stage?: QuestStage;
  readonly config?: CustomsConfig;
}

/**
 * Produce a QuestEntry from package figures. Returns the domain Err when the
 * inputs/config are invalid so callers can surface the field-specific message.
 */
export function buildQuestEntry({
  id,
  label,
  packageWeight,
  fobValue,
  stage = QuestStage.OriginPortal,
  config = DEFAULT_CUSTOMS_CONFIG,
}: BuildQuestArgs): Result<QuestEntry, ValidationError> {
  const tax = calculateCustoms({ packageWeight, fobValue }, config);
  if (!tax.ok) {
    return tax;
  }

  const base = createQuest(id, label);

  return {
    ok: true,
    value: {
      ...base,
      stage,
      packageWeight,
      fobValue,
      regime: tax.value.regime,
      total: tax.value.total,
    },
  };
}
