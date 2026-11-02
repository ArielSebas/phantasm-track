// Full customs computation. Pure; NO React / NO UI imports.
//
// Validation order (so the first offending field is named deterministically):
//   1. presence of both packageWeight and fobValue  -> "missing"
//   2. finiteness                                    -> "nonFinite"
//   3. non-negativity                                -> "negative"
//   4. regime selection
//   5. regime-specific config validity
// Only after all checks pass is a TaxResult constructed.

import type {
  CustomsConfig,
  PackageInput,
  Result,
  TaxResult,
  ValidationError,
} from "./types";
import { ImportRegime } from "./types";
import { selectRegime, validateNumber } from "./regime";

/** Rounds a monetary amount to the nearest cent. */
export function round2(x: number): number {
  return Math.round(x * 100) / 100;
}

/**
 * Validates input and config, selects the regime, and computes the tariff,
 * VAT, flat fee, and total, rounding every monetary amount to cents.
 */
export function calculateCustoms(
  input: PackageInput,
  config: CustomsConfig
): Result<TaxResult, ValidationError> {
  // Steps 1-3: numeric input validation (packageWeight before fobValue).
  const weightError = validateNumber(input.packageWeight, "packageWeight");
  if (weightError) {
    return { ok: false, error: weightError };
  }
  const fobError = validateNumber(input.fobValue, "fobValue");
  if (fobError) {
    return { ok: false, error: fobError };
  }

  const fob = input.fobValue as number;

  // Step 4: regime selection (re-runs the same validated inputs).
  const regimeResult = selectRegime(input, config);
  if (!regimeResult.ok) {
    return regimeResult;
  }
  const regime = regimeResult.value;

  // Step 5: regime-specific config validity, then compute.
  if (regime === ImportRegime.FourByFour) {
    if (config.flatFee < 0) {
      return {
        ok: false,
        error: {
          field: "flatFee",
          code: "negative",
          message: "flatFee must not be negative",
        },
      };
    }
    const flatFee = round2(config.flatFee);
    return {
      ok: true,
      value: {
        regime,
        adValoremTariff: 0,
        vat: 0,
        flatFee,
        total: flatFee,
      },
    };
  }

  // General regime.
  if (config.adValoremRate < 0) {
    return {
      ok: false,
      error: {
        field: "adValoremRate",
        code: "negative",
        message: "adValoremRate must not be negative",
      },
    };
  }
  if (config.vatRate < 0) {
    return {
      ok: false,
      error: {
        field: "vatRate",
        code: "negative",
        message: "vatRate must not be negative",
      },
    };
  }

  const adValoremTariff = round2(config.adValoremRate * fob);
  const vat = round2(config.vatRate * (fob + adValoremTariff));
  const flatFee = round2(config.flatFee);
  const total = round2(adValoremTariff + vat + flatFee);

  return {
    ok: true,
    value: {
      regime,
      adValoremTariff,
      vat,
      flatFee,
      total,
    },
  };
}
