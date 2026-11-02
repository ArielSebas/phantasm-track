// Annual mana-bar computation shared by the weight bar and the budget bar.
// Pure; NO React / NO UI imports.
//
// usagePercentage = cumulative / limit * 100 (no upper cap). Status thresholds
// are normal (< 80), warning (>= 80 and < 100), limitReached (>= 100).

import type {
  ManaBarResult,
  ManaBarStatus,
  Result,
  ValidationError,
} from "./types";
import { WARNING_THRESHOLD, CRITICAL_THRESHOLD } from "./config";

/**
 * Classifies a usage percentage into a mana-bar status.
 * Assumes usagePercentage >= 0.
 */
export function manaBarStatus(usagePercentage: number): ManaBarStatus {
  if (usagePercentage >= CRITICAL_THRESHOLD) {
    return "limitReached";
  }
  if (usagePercentage >= WARNING_THRESHOLD) {
    return "warning";
  }
  return "normal";
}

/**
 * Computes the annual mana-bar usage for a cumulative amount against a limit.
 *
 * Returns Err with field "limit" when limit <= 0, and Err with field
 * "cumulative" when cumulative < 0 (limit is checked first). Non-finite inputs
 * are likewise rejected on the offending field. Otherwise returns the usage
 * percentage (uncapped) and its status.
 */
export function computeManaBar(
  cumulative: number,
  limit: number
): Result<ManaBarResult, ValidationError> {
  if (!Number.isFinite(limit)) {
    return {
      ok: false,
      error: { field: "limit", code: "nonFinite", message: "limit must be a finite number" },
    };
  }
  if (limit <= 0) {
    return {
      ok: false,
      error: { field: "limit", code: "negative", message: "limit must be greater than 0" },
    };
  }
  if (!Number.isFinite(cumulative)) {
    return {
      ok: false,
      error: {
        field: "cumulative",
        code: "nonFinite",
        message: "cumulative must be a finite number",
      },
    };
  }
  if (cumulative < 0) {
    return {
      ok: false,
      error: {
        field: "cumulative",
        code: "negative",
        message: "cumulative must not be negative",
      },
    };
  }

  const usagePercentage = (cumulative / limit) * 100;

  return {
    ok: true,
    value: {
      cumulative,
      limit,
      usagePercentage,
      status: manaBarStatus(usagePercentage),
    },
  };
}
