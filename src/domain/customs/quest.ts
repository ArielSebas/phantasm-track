// Quest lifecycle transitions across the arcane stages
// OriginPortal -> CustomsAbyss -> GuildDelivery. Pure; NO React / NO UI imports.

import type { Quest, Result, ValidationError } from "./types";
import { QuestStage, QUEST_SEQUENCE } from "./types";

/** Requirement 8.1: a new Quest starts at OriginPortal. */
export function createQuest(id: string, label: string): Quest {
  return { id, label, stage: QuestStage.OriginPortal };
}

/**
 * Advances one step along the ordered sequence. Returns Ok(successor) for a
 * non-terminal stage; Err(code "alreadyFinal") for GuildDelivery, retaining
 * the stage.
 */
export function advanceQuest(stage: QuestStage): Result<QuestStage, ValidationError> {
  const index = QUEST_SEQUENCE.indexOf(stage);
  if (index === -1) {
    return {
      ok: false,
      error: {
        field: "targetStage",
        code: "invalidStage",
        message: `${String(stage)} is not a valid quest stage`,
      },
    };
  }
  if (index === QUEST_SEQUENCE.length - 1) {
    return {
      ok: false,
      error: {
        field: "targetStage",
        code: "alreadyFinal",
        message: "quest is already at the final stage",
      },
    };
  }
  return { ok: true, value: QUEST_SEQUENCE[index + 1] };
}

/**
 * A targeted stage change succeeds only when `target` is the immediate
 * successor of `current`. Rejects out-of-sequence targets (outOfSequence) and
 * non-member targets (invalidStage), retaining `current` in both cases.
 */
export function setQuestStage(
  current: QuestStage,
  target: QuestStage
): Result<QuestStage, ValidationError> {
  // Reject targets that are not members of the canonical sequence.
  const targetIndex = QUEST_SEQUENCE.indexOf(target);
  if (targetIndex === -1) {
    return {
      ok: false,
      error: {
        field: "targetStage",
        code: "invalidStage",
        message: `${String(target)} is not a valid quest stage`,
      },
    };
  }

  const currentIndex = QUEST_SEQUENCE.indexOf(current);
  if (currentIndex === -1) {
    // Defensive: a non-member current stage cannot have a valid successor.
    return {
      ok: false,
      error: {
        field: "targetStage",
        code: "invalidStage",
        message: `${String(current)} is not a valid quest stage`,
      },
    };
  }

  // Success only when target is the immediate successor of current.
  if (targetIndex === currentIndex + 1) {
    return { ok: true, value: target };
  }

  return {
    ok: false,
    error: {
      field: "targetStage",
      code: "outOfSequence",
      message: `cannot move from ${String(current)} to ${String(target)}; only the immediate successor is allowed`,
    },
  };
}
