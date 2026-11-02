import { describe, it, expect } from "vitest";
import fc from "fast-check";
import {
  createQuest,
  advanceQuest,
  setQuestStage,
  QuestStage,
  QUEST_SEQUENCE,
} from "@/domain/customs";

const allStages = QUEST_SEQUENCE;
const stageArb = fc.constantFrom(...allStages);

describe("quest transitions — property based", () => {
  // Feature: customs-grimoire, Property 13: Quest ordered transitions
  it("Property 13: setQuestStage Ok iff target is immediate successor; advanceQuest total", () => {
    fc.assert(
      fc.property(stageArb, stageArb, (current, target) => {
        const currentIndex = allStages.indexOf(current);
        const targetIndex = allStages.indexOf(target);
        const isImmediateSuccessor = targetIndex === currentIndex + 1;

        const result = setQuestStage(current, target);
        if (isImmediateSuccessor) {
          expect(result.ok).toBe(true);
          if (result.ok) {
            expect(result.value).toBe(target);
          }
        } else {
          expect(result.ok).toBe(false);
          if (!result.ok) {
            expect(result.error.field).toBe("targetStage");
            // current is retained (returned value is Err, no mutation).
          }
        }
      }),
      { numRuns: 100 }
    );

    // advanceQuest is total over all stages: Ok(successor) for non-terminal,
    // Err(alreadyFinal) for the terminal stage.
    fc.assert(
      fc.property(stageArb, (stage) => {
        const index = allStages.indexOf(stage);
        const result = advanceQuest(stage);
        if (index === allStages.length - 1) {
          expect(result.ok).toBe(false);
          if (!result.ok) {
            expect(result.error.code).toBe("alreadyFinal");
          }
        } else {
          expect(result.ok).toBe(true);
          if (result.ok) {
            expect(result.value).toBe(allStages[index + 1]);
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  // Feature: customs-grimoire, Property 18: Invalid quest target rejected
  it("Property 18: non-member target -> Err invalidStage/targetStage, retains current", () => {
    const invalidTarget = fc
      .string()
      .filter((s) => !(allStages as readonly string[]).includes(s));

    fc.assert(
      fc.property(stageArb, invalidTarget, (current, target) => {
        // Cast through unknown: the target is deliberately not a QuestStage.
        const result = setQuestStage(current, target as unknown as QuestStage);
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.code).toBe("invalidStage");
          expect(result.error.field).toBe("targetStage");
        }
      }),
      { numRuns: 100 }
    );
  });

  // Unit example — Requirement 8.1: a new Quest starts at OriginPortal.
  it("createQuest starts a new quest at OriginPortal", () => {
    const quest = createQuest("q-1", "Obsidian Relic Shipment");
    expect(quest.id).toBe("q-1");
    expect(quest.label).toBe("Obsidian Relic Shipment");
    expect(quest.stage).toBe(QuestStage.OriginPortal);
  });
});
