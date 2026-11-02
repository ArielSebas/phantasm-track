import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { computeManaBar, manaBarStatus } from "@/domain/customs";

// Generators -----------------------------------------------------------------
const cumulativeOk = fc.double({ min: 0, max: 1e9, noNaN: true });
const limitOk = fc.double({ min: Number.EPSILON, max: 1e9, noNaN: true });

describe("mana bar — property based", () => {
  // Feature: customs-grimoire, Property 9: Mana bar percentage formula and non-negativity
  it("Property 9: usagePercentage === cumulative/limit*100 and >= 0", () => {
    fc.assert(
      fc.property(cumulativeOk, limitOk, (cumulative, limit) => {
        const result = computeManaBar(cumulative, limit);
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.usagePercentage).toBe((cumulative / limit) * 100);
          expect(result.value.usagePercentage).toBeGreaterThanOrEqual(0);
        }
      }),
      { numRuns: 100 }
    );
  });

  // Feature: customs-grimoire, Property 10: Mana bar bound relative to limit
  it("Property 10: cumulative in [0,limit] -> <= 100; cumulative > limit -> > 100 (uncapped)", () => {
    // In range -> <= 100.
    fc.assert(
      fc.property(
        limitOk,
        fc.double({ min: 0, max: 1, noNaN: true }),
        (limit, frac) => {
          const cumulative = limit * frac; // within [0, limit]
          const result = computeManaBar(cumulative, limit);
          expect(result.ok).toBe(true);
          if (result.ok) {
            expect(result.value.usagePercentage).toBeLessThanOrEqual(100);
          }
        }
      ),
      { numRuns: 100 }
    );

    // Over limit -> > 100, with no upper cap.
    fc.assert(
      fc.property(
        limitOk,
        fc.double({ min: 1 + 1e-6, max: 1e6, noNaN: true }),
        (limit, mult) => {
          const cumulative = limit * mult; // strictly above limit
          const result = computeManaBar(cumulative, limit);
          expect(result.ok).toBe(true);
          if (result.ok) {
            expect(result.value.usagePercentage).toBeGreaterThan(100);
            // No cap: equals the raw formula, which can far exceed 100.
            expect(result.value.usagePercentage).toBe((cumulative / limit) * 100);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: customs-grimoire, Property 11: Mana bar status thresholds (boundaries at 80 and 100)
  it("Property 11: normal < 80, warning in [80,100), limitReached >= 100", () => {
    fc.assert(
      fc.property(fc.double({ min: 0, max: 1000, noNaN: true }), (p) => {
        const status = manaBarStatus(p);
        if (p < 80) {
          expect(status).toBe("normal");
        } else if (p < 100) {
          expect(status).toBe("warning");
        } else {
          expect(status).toBe("limitReached");
        }
      }),
      { numRuns: 100 }
    );

    // Explicit boundary checks at 80 and 100.
    expect(manaBarStatus(79.999)).toBe("normal");
    expect(manaBarStatus(80)).toBe("warning");
    expect(manaBarStatus(99.999)).toBe("warning");
    expect(manaBarStatus(100)).toBe("limitReached");
  });

  // Feature: customs-grimoire, Property 12: Mana bar determinism
  it("Property 12: two evaluations give identical usagePercentage and status", () => {
    fc.assert(
      fc.property(cumulativeOk, limitOk, (cumulative, limit) => {
        const a = computeManaBar(cumulative, limit);
        const b = computeManaBar(cumulative, limit);
        expect(a.ok).toBe(true);
        expect(b.ok).toBe(true);
        if (a.ok && b.ok) {
          expect(a.value.usagePercentage).toBe(b.value.usagePercentage);
          expect(a.value.status).toBe(b.value.status);
        }
      }),
      { numRuns: 100 }
    );
  });

  // Feature: customs-grimoire, Property 17: Invalid mana bar inputs rejected
  it("Property 17: limit <= 0 -> field limit; cumulative < 0 -> field cumulative", () => {
    // limit <= 0 -> Err field "limit" (cumulative kept valid).
    fc.assert(
      fc.property(
        cumulativeOk,
        fc.double({ min: -1e9, max: 0, noNaN: true }),
        (cumulative, limit) => {
          const result = computeManaBar(cumulative, limit);
          expect(result.ok).toBe(false);
          if (!result.ok) {
            expect(result.error.field).toBe("limit");
          }
        }
      ),
      { numRuns: 100 }
    );

    // cumulative < 0 with a valid positive limit -> Err field "cumulative".
    fc.assert(
      fc.property(
        fc.double({ min: -1e9, max: -Number.EPSILON, noNaN: true }),
        limitOk,
        (cumulative, limit) => {
          const result = computeManaBar(cumulative, limit);
          expect(result.ok).toBe(false);
          if (!result.ok) {
            expect(result.error.field).toBe("cumulative");
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
