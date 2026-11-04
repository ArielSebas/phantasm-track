// Real-Ecuador courier quoting models for the Alchemist calculator.
//
// This module is UI-adjacent but PURE: it holds no React and performs only
// deterministic arithmetic over a weight-in-pounds input. It never computes
// customs taxes itself — the resulting freight + surcharge are folded into the
// `flatFee` passed to the domain `calculateCustoms`, which remains the single
// source of truth for the 4x4 / General regime math.
//
// Each courier returns a structured quote so the UI can itemize:
//   - freight:   the per-weight international shipping charge ($)
//   - surcharge: courier handling / insurance recargos ($), excluding SENAE
// The fixed $20.00 SENAE 4x4 fee is added separately by the domain layer.

export type CourierId = "laarbox" | "upper" | "tiered" | "custom";

export interface CourierQuote {
  /** International freight for the package weight (USD). */
  readonly freight: number;
  /** Courier handling/insurance surcharges, excluding the SENAE fee (USD). */
  readonly surcharge: number;
}

// --- LaarBox (Miami) real figures -------------------------------------------
// Observed model: ~$7.843/lb freight + a flat ~$3.74 handling/insurance
// surcharge. Example: 4.65 lb -> 4.65 * 7.843 = $36.47 freight, +$3.74 = $40.21
// courier bill before the $20 SENAE fee (=> $60.21 with SENAE).
export const LAARBOX_RATE_PER_LB = 7.843;
export const LAARBOX_SURCHARGE = 3.74;

// --- Upper Casillero --------------------------------------------------------
// Flat $5.75/lb, IVA already included; no separate surcharge.
export const UPPER_RATE_PER_LB = 5.75;

// --- Standard Ecuador tiered pound table ------------------------------------
// Index 0 is unused; TIERED_TABLE[n] is the freight for exactly n lb, 1..12.
// Above 12 lb: the 12-lb rate plus $4 for every additional pound.
export const TIERED_TABLE: readonly number[] = [
  0, // 0 lb (placeholder)
  11.0, // 1 lb
  16.48, // 2 lb
  20.99, // 3 lb
  28.28, // 4 lb
  37.61, // 5 lb
  42.14, // 6 lb
  46.13, // 7 lb
  50.12, // 8 lb
  54.11, // 9 lb
  58.1, // 10 lb
  62.09, // 11 lb
  66.08, // 12 lb
];
export const TIERED_EXTRA_PER_LB = 4.0;
const TIERED_MAX_TIER = 12;

/**
 * Standard tiered table lookup. Fractional pounds round UP to the next whole
 * pound tier (couriers bill the ceiling), with a minimum of 1 lb for any
 * positive weight. 12+ lb uses the 12-lb rate plus $4 per extra pound.
 */
export function tieredFreight(weightLb: number): number {
  if (!Number.isFinite(weightLb) || weightLb <= 0) return 0;
  const tier = Math.max(1, Math.ceil(weightLb));
  if (tier <= TIERED_MAX_TIER) {
    return TIERED_TABLE[tier];
  }
  const extraLbs = tier - TIERED_MAX_TIER;
  return TIERED_TABLE[TIERED_MAX_TIER] + extraLbs * TIERED_EXTRA_PER_LB;
}

/**
 * Compute the freight + surcharge for the chosen courier model.
 *
 * @param courier    which quoting model to apply
 * @param weightLb   package weight in pounds (>= 0)
 * @param customRate $/lb used only by the "custom" (manual) model
 */
export function quoteCourier(
  courier: CourierId,
  weightLb: number,
  customRate: number
): CourierQuote {
  const lb = Number.isFinite(weightLb) && weightLb > 0 ? weightLb : 0;

  switch (courier) {
    case "laarbox":
      return {
        freight: lb * LAARBOX_RATE_PER_LB,
        surcharge: lb > 0 ? LAARBOX_SURCHARGE : 0,
      };
    case "upper":
      return { freight: lb * UPPER_RATE_PER_LB, surcharge: 0 };
    case "tiered":
      return { freight: tieredFreight(lb), surcharge: 0 };
    case "custom":
    default: {
      const rate = Number.isFinite(customRate) && customRate >= 0 ? customRate : 0;
      return { freight: lb * rate, surcharge: 0 };
    }
  }
}
