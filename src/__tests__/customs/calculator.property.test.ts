import { describe, it, expect } from "vitest";
import fc from "fast-check";
import {
  calculateCustoms,
  round2,
  ImportRegime,
  DEFAULT_CUSTOMS_CONFIG,
  type CustomsConfig,
} from "@/domain/customs";

const baseConfig: CustomsConfig = DEFAULT_CUSTOMS_CONFIG;

// Generators -----------------------------------------------------------------

// 4x4-qualifying inputs: weight in [0, 4], fob in [0, 400].
const fourByFourInput = fc.record({
  packageWeight: fc.double({ min: 0, max: 4, noNaN: true }),
  fobValue: fc.double({ min: 0, max: 400, noNaN: true }),
});

// General-qualifying inputs: at least one of weight > 4 or fob > 400,
// both finite and non-negative.
const generalInput = fc
  .record({
    packageWeight: fc.double({ min: 0, max: 1e6, noNaN: true }),
    fobValue: fc.double({ min: 0, max: 1e9, noNaN: true }),
  })
  .filter(
    (i) =>
      i.packageWeight > baseConfig.weightLimit ||
      i.fobValue > baseConfig.fobLimit
  );

// Non-negative rate/fee configs for the General formula.
const nonNegRates = fc.record({
  adValoremRate: fc.double({ min: 0, max: 2, noNaN: true }),
  vatRate: fc.double({ min: 0, max: 2, noNaN: true }),
  flatFee: fc.double({ min: 0, max: 1000, noNaN: true }),
});

describe("customs calculator — property based", () => {
  // Feature: customs-grimoire, Property 3: 4x4 regime invariant
  it("Property 3: 4x4 yields zero tariff/VAT and total === flatFee", () => {
    fc.assert(
      fc.property(
        fourByFourInput,
        fc.double({ min: 0, max: 1000, noNaN: true }),
        (input, flatFee) => {
          const config: CustomsConfig = { ...baseConfig, flatFee };
          const result = calculateCustoms(input, config);
          expect(result.ok).toBe(true);
          if (result.ok) {
            const r = result.value;
            expect(r.regime).toBe(ImportRegime.FourByFour);
            expect(r.adValoremTariff).toBe(0);
            expect(r.vat).toBe(0);
            expect(r.flatFee).toBe(round2(flatFee));
            expect(r.total).toBe(round2(flatFee));
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: customs-grimoire, Property 4: General regime formula
  it("Property 4: General tariff/VAT/total match the rounded formula", () => {
    fc.assert(
      fc.property(generalInput, nonNegRates, (input, rates) => {
        const config: CustomsConfig = { ...baseConfig, ...rates };
        const result = calculateCustoms(input, config);
        expect(result.ok).toBe(true);
        if (result.ok) {
          const r = result.value;
          const fob = input.fobValue;
          const expectedTariff = round2(rates.adValoremRate * fob);
          const expectedVat = round2(rates.vatRate * (fob + expectedTariff));
          const expectedFlat = round2(rates.flatFee);
          const expectedTotal = round2(
            expectedTariff + expectedVat + expectedFlat
          );
          expect(r.regime).toBe(ImportRegime.General);
          expect(r.adValoremTariff).toBe(expectedTariff);
          expect(r.vat).toBe(expectedVat);
          expect(r.flatFee).toBe(expectedFlat);
          expect(r.total).toBe(expectedTotal);
        }
      }),
      { numRuns: 100 }
    );
  });

  // Feature: customs-grimoire, Property 5: General total is monotonic non-decreasing in FOB
  it("Property 5: larger FOB never produces a smaller total (General)", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 1e9, noNaN: true }),
        fc.double({ min: 0, max: 1e9, noNaN: true }),
        nonNegRates,
        (fobA, fobB, rates) => {
          const config: CustomsConfig = { ...baseConfig, ...rates };
          // Force General via an over-limit weight so only FOB varies.
          const weight = baseConfig.weightLimit + 10;
          const lo = Math.min(fobA, fobB);
          const hi = Math.max(fobA, fobB);
          const rLo = calculateCustoms({ packageWeight: weight, fobValue: lo }, config);
          const rHi = calculateCustoms({ packageWeight: weight, fobValue: hi }, config);
          expect(rLo.ok).toBe(true);
          expect(rHi.ok).toBe(true);
          if (rLo.ok && rHi.ok) {
            expect(rHi.value.total).toBeGreaterThanOrEqual(rLo.value.total);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: customs-grimoire, Property 6: Determinism and cent rounding
  it("Property 6: two evaluations are equal and amounts equal their round2", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 1e6, noNaN: true }),
        fc.double({ min: 0, max: 1e9, noNaN: true }),
        nonNegRates,
        (packageWeight, fobValue, rates) => {
          const config: CustomsConfig = { ...baseConfig, ...rates };
          const a = calculateCustoms({ packageWeight, fobValue }, config);
          const b = calculateCustoms({ packageWeight, fobValue }, config);
          expect(a.ok).toBe(true);
          expect(b.ok).toBe(true);
          if (a.ok && b.ok) {
            expect(a.value).toEqual(b.value);
            for (const amount of [
              a.value.adValoremTariff,
              a.value.vat,
              a.value.flatFee,
              a.value.total,
            ]) {
              expect(amount).toBe(round2(amount));
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: customs-grimoire, Property 7: Non-negativity of monetary outputs
  it("Property 7: every monetary output is >= 0", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 1e6, noNaN: true }),
        fc.double({ min: 0, max: 1e9, noNaN: true }),
        nonNegRates,
        (packageWeight, fobValue, rates) => {
          const config: CustomsConfig = { ...baseConfig, ...rates };
          const result = calculateCustoms({ packageWeight, fobValue }, config);
          expect(result.ok).toBe(true);
          if (result.ok) {
            const r = result.value;
            expect(r.adValoremTariff).toBeGreaterThanOrEqual(0);
            expect(r.vat).toBeGreaterThanOrEqual(0);
            expect(r.flatFee).toBeGreaterThanOrEqual(0);
            expect(r.total).toBeGreaterThanOrEqual(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: customs-grimoire, Property 8: Total is bounded below by the flat fee
  it("Property 8: total >= flatFee for flatFee >= 0", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 1e6, noNaN: true }),
        fc.double({ min: 0, max: 1e9, noNaN: true }),
        nonNegRates,
        (packageWeight, fobValue, rates) => {
          const config: CustomsConfig = { ...baseConfig, ...rates };
          const result = calculateCustoms({ packageWeight, fobValue }, config);
          expect(result.ok).toBe(true);
          if (result.ok) {
            expect(result.value.total).toBeGreaterThanOrEqual(
              result.value.flatFee
            );
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: customs-grimoire, Property 15: Invalid numeric input rejected
  it("Property 15: negative or non-finite weight/fob is rejected with no TaxResult", () => {
    const badNumber = fc.oneof(
      fc.constant(Number.NaN),
      fc.constant(Number.POSITIVE_INFINITY),
      fc.constant(Number.NEGATIVE_INFINITY),
      fc.double({ min: -1e9, max: -Number.EPSILON, noNaN: true })
    );
    const goodNumber = fc.double({ min: 0, max: 1e6, noNaN: true });

    // Bad weight (good fob) -> error names packageWeight.
    fc.assert(
      fc.property(badNumber, goodNumber, (packageWeight, fobValue) => {
        const result = calculateCustoms({ packageWeight, fobValue }, baseConfig);
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.field).toBe("packageWeight");
          expect(["negative", "nonFinite"]).toContain(result.error.code);
        }
      }),
      { numRuns: 100 }
    );

    // Good weight, bad fob -> error names fobValue.
    fc.assert(
      fc.property(goodNumber, badNumber, (packageWeight, fobValue) => {
        const result = calculateCustoms({ packageWeight, fobValue }, baseConfig);
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.field).toBe("fobValue");
          expect(["negative", "nonFinite"]).toContain(result.error.code);
        }
      }),
      { numRuns: 100 }
    );
  });

  // Feature: customs-grimoire, Property 16: Invalid configuration rejected
  it("Property 16: negative flatFee (4x4) or negative rates (General) are rejected", () => {
    // 4x4 with negative flatFee -> Err field flatFee.
    fc.assert(
      fc.property(
        fourByFourInput,
        fc.double({ min: -1000, max: -Number.EPSILON, noNaN: true }),
        (input, flatFee) => {
          const config: CustomsConfig = { ...baseConfig, flatFee };
          const result = calculateCustoms(input, config);
          expect(result.ok).toBe(false);
          if (!result.ok) {
            expect(result.error.field).toBe("flatFee");
          }
        }
      ),
      { numRuns: 100 }
    );

    // General with negative adValoremRate or vatRate -> Err naming that field.
    fc.assert(
      fc.property(
        generalInput,
        fc.double({ min: -2, max: -Number.EPSILON, noNaN: true }),
        fc.boolean(),
        (input, negRate, negateAdValorem) => {
          const config: CustomsConfig = negateAdValorem
            ? { ...baseConfig, adValoremRate: negRate }
            : { ...baseConfig, vatRate: negRate };
          const result = calculateCustoms(input, config);
          expect(result.ok).toBe(false);
          if (!result.ok) {
            // adValoremRate is validated before vatRate.
            const expected = negateAdValorem ? "adValoremRate" : "vatRate";
            expect(result.error.field).toBe(expected);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
