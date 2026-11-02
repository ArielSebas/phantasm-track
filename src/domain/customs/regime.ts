// Regime selection for a package input. Pure; NO React / NO UI imports.
//
// Validates presence, finiteness, and non-negativity of packageWeight and
// fobValue, then selects FourByFour when both are within their configured
// limits, otherwise General.

import type {
  CustomsConfig,
  ImportRegime as ImportRegimeType,
  PackageInput,
  Result,
  ValidationError,
  ValidationField,
} from "./types";
import { ImportRegime } from "./types";

function err(
  field: ValidationField,
  code: ValidationError["code"],
  message: string
): Result<never, ValidationError> {
  return { ok: false, error: { field, code, message } };
}

/**
 * Validate a single numeric field in the canonical order
 * missing -> nonFinite -> negative, returning the offending error or null.
 */
function validateNumber(
  value: number | undefined,
  field: ValidationField
): ValidationError | null {
  if (value === undefined || value === null) {
    return { field, code: "missing", message: `${field} is required` };
  }
  if (!Number.isFinite(value)) {
    return { field, code: "nonFinite", message: `${field} must be a finite number` };
  }
  if (value < 0) {
    return { field, code: "negative", message: `${field} must not be negative` };
  }
  return null;
}

export { validateNumber };

/**
 * Selects the applicable import regime for a package input.
 *
 * Returns Err for a missing, non-finite, or negative packageWeight/fobValue
 * (packageWeight is checked before fobValue). Otherwise returns FourByFour
 * when weight <= weightLimit AND fob <= fobLimit, else General.
 */
export function selectRegime(
  input: PackageInput,
  config: CustomsConfig
): Result<ImportRegimeType, ValidationError> {
  const weightError = validateNumber(input.packageWeight, "packageWeight");
  if (weightError) {
    return { ok: false, error: weightError };
  }
  const fobError = validateNumber(input.fobValue, "fobValue");
  if (fobError) {
    return { ok: false, error: fobError };
  }

  // Both validated as finite, non-negative numbers above.
  const weight = input.packageWeight as number;
  const fob = input.fobValue as number;

  const regime =
    weight <= config.weightLimit && fob <= config.fobLimit
      ? ImportRegime.FourByFour
      : ImportRegime.General;

  return { ok: true, value: regime };
}

// Exported to keep the error constructor reusable by the calculator without a
// second copy; underscore-tagged to signal internal use.
export { err as _err };
