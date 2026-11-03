import { describe, it, expect } from "vitest";
import fc from "fast-check";
import {
  selectRegime,
  calculateCustoms,
  ImportRegime,
  DEFAULT_CUSTOMS_CONFIG,
  type CustomsConfig,
  type PackageInput,
} from "@/domain/customs";

const config: CustomsConfig = DEFAULT_CUSTOMS_CONFIG;

// Weight/FOB generators scoped to the 4x4 range.
const inRangeWeight = fc.double({ min: 0, max: config.weightLimit, noNaN: true });
const inRangeFob = fc.double({ min: 0, max: config.fobLimit, noNaN: true });

// A finite, non-negative value that STRICTLY exceeds a limit. minExcluded keeps
// the generator off the boundary, and the filter guarantees shrinking can never
// land back on exactly WEIGHT_LIMIT / FOB_LIMIT.
const overWeight = fc
  .double({ min: config.weightLimit, max: 1e6, noNaN: true, minExcluded: true })
  .filter((v) => v > config.weightLimit);
const overFob = fc
  .double({ min: config.fobLimit, max: 1e9, noNaN: true, minExcluded: true })
  .filter((v) => v > config.fobLimit);

describe("regime selection — property based", () => {
  // Feature: customs-grimoire, Property 1: Regime boundary selection — in-range -> FourByFour; over either limit -> General
  it("Property 1: selects FourByFour in range and General over either limit", () => {
    // Exact boundary [weightLimit, fobLimit] is inclusive -> FourByFour.
    const boundary = selectRegime(
      { packageWeight: config.weightLimit, fobValue: config.fobLimit },
      config
    );
    expect(boundary.ok).toBe(true);
    if (boundary.ok) {
      expect(boundary.value).toBe(ImportRegime.FourByFour);
    }

    // In range -> FourByFour
    fc.assert(
      fc.property(inRangeWeight, inRangeFob, (packageWeight, fobValue) => {
        const result = selectRegime({ packageWeight, fobValue }, config);
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value).toBe(ImportRegime.FourByFour);
        }
      }),
      { numRuns: 100 }
    );

    // Over weight (any finite non-negative FOB) -> General
    fc.assert(
      fc.property(
        overWeight,
        fc.double({ min: 0, max: 1e9, noNaN: true }),
        (packageWeight, fobValue) => {
          const result = selectRegime({ packageWeight, fobValue }, config);
          expect(result.ok).toBe(true);
          if (result.ok) {
            expect(result.value).toBe(ImportRegime.General);
          }
        }
      ),
      { numRuns: 100 }
    );

    // Over FOB (any finite non-negative weight) -> General
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 1e6, noNaN: true }),
        overFob,
        (packageWeight, fobValue) => {
          const result = selectRegime({ packageWeight, fobValue }, config);
          expect(result.ok).toBe(true);
          if (result.ok) {
            expect(result.value).toBe(ImportRegime.General);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: customs-grimoire, Property 2: Regime totality (exactly one regime)
  it("Property 2: calculateCustoms returns Ok with exactly one regime for valid input", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 1e6, noNaN: true }),
        fc.double({ min: 0, max: 1e9, noNaN: true }),
        (packageWeight, fobValue) => {
          const result = calculateCustoms({ packageWeight, fobValue }, config);
          expect(result.ok).toBe(true);
          if (result.ok) {
            const regime = result.value.regime;
            const isExactlyOne =
              (regime === ImportRegime.FourByFour) !==
              (regime === ImportRegime.General);
            expect(isExactlyOne).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: customs-grimoire, Property 14: Missing input fields rejected
  it("Property 14: missing packageWeight and/or fobValue is rejected with no TaxResult", () => {
    // Build inputs where at least one field is missing (undefined).
    const maybeNumber = fc.option(fc.double({ min: 0, max: 1e6, noNaN: true }), {
      nil: undefined,
    });

    fc.assert(
      fc.property(maybeNumber, maybeNumber, (packageWeight, fobValue) => {
        fc.pre(packageWeight === undefined || fobValue === undefined);
        const input: PackageInput = { packageWeight, fobValue };
        const result = calculateCustoms(input, config);
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.code).toBe("missing");
          // The named field must be one of the actually-missing fields.
          const missingFields: string[] = [];
          if (packageWeight === undefined) missingFields.push("packageWeight");
          if (fobValue === undefined) missingFields.push("fobValue");
          expect(missingFields).toContain(result.error.field);
        }
      }),
      { numRuns: 100 }
    );
  });
});
