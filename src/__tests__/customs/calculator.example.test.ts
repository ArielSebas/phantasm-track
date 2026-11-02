import { describe, it, expect } from "vitest";
import {
  calculateCustoms,
  ImportRegime,
  DEFAULT_CUSTOMS_CONFIG,
  type CustomsConfig,
} from "@/domain/customs";

// Worked examples guard against a property that is self-consistent but wrong.
const config: CustomsConfig = DEFAULT_CUSTOMS_CONFIG; // flatFee 42, adValorem 0.10, vat 0.15

describe("customs calculator — worked examples", () => {
  it("4x4 package: a light, cheap parcel pays only the flat fee", () => {
    // weight 2kg <= 4, fob $200 <= 400 -> FourByFour.
    const result = calculateCustoms({ packageWeight: 2, fobValue: 200 }, config);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.regime).toBe(ImportRegime.FourByFour);
      expect(result.value.adValoremTariff).toBe(0);
      expect(result.value.vat).toBe(0);
      expect(result.value.flatFee).toBe(42);
      expect(result.value.total).toBe(42); // total === flatFee
    }
  });

  it("General package: over the FOB limit, with known tariff/VAT/total", () => {
    // fob $1000 > 400 -> General.
    // adValoremTariff = round2(0.10 * 1000) = 100
    // vat = round2(0.15 * (1000 + 100)) = round2(165) = 165
    // flatFee = 42
    // total = round2(100 + 165 + 42) = 307
    const result = calculateCustoms({ packageWeight: 3, fobValue: 1000 }, config);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.regime).toBe(ImportRegime.General);
      expect(result.value.adValoremTariff).toBe(100);
      expect(result.value.vat).toBe(165);
      expect(result.value.flatFee).toBe(42);
      expect(result.value.total).toBe(307);
    }
  });

  it("General via over-weight: a heavy parcel leaves the 4x4 regime", () => {
    // weight 5kg > 4 forces General even though fob $300 <= 400.
    // adValoremTariff = round2(0.10 * 300) = 30
    // vat = round2(0.15 * (300 + 30)) = round2(49.5) = 49.5
    // total = round2(30 + 49.5 + 42) = 121.5
    const result = calculateCustoms({ packageWeight: 5, fobValue: 300 }, config);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.regime).toBe(ImportRegime.General);
      expect(result.value.adValoremTariff).toBe(30);
      expect(result.value.vat).toBe(49.5);
      expect(result.value.total).toBe(121.5);
    }
  });
});
