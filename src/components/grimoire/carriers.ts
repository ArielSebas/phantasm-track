// Ecuador carrier catalogue + tracking-code detection for the Tracking Oracle.
// Pure UI-adjacent helpers: no React, no customs math.

export type CarrierId =
  | "far"
  | "urbano"
  | "servientrega"
  | "laar"
  | "tramaco"
  | "gintracom";

export interface Carrier {
  readonly id: CarrierId;
  readonly name: string;
  readonly note: string;
  readonly url: string; // official portal (fixed https constants only)
  /** Deep link with the code pre-filled, when the carrier supports it. */
  readonly buildUrl?: (code: string) => string;
}

/** Official URL to open for a carrier and code (deep link if supported). */
export function carrierUrl(carrier: Carrier, code: string): string {
  return carrier.buildUrl ? carrier.buildUrl(code) : carrier.url;
}

export const CARRIERS: readonly Carrier[] = [
  {
    id: "laar",
    name: "LaarCourier",
    note: "Temu · Laar Courier",
    url: "https://fenix.laarcourier.com/Tracking/",
    buildUrl: (code) =>
      `https://fenix.laarcourier.com/Tracking/?guia=${encodeURIComponent(code)}`,
  },
  {
    id: "far",
    name: "Far International",
    note: "International transit",
    url: "https://en.far800.com/en",
  },
  {
    id: "urbano",
    name: "Urbano Express Ecuador",
    note: "Temu Last-Mile EC · Hub Quito",
    url: "https://app.urbano.com.ec/plugin/etracking/etracking/",
  },
  {
    id: "servientrega",
    name: "Servientrega Ecuador",
    note: "Servientrega EC",
    url: "https://www.servientrega.com.ec/",
  },
  {
    id: "tramaco",
    name: "Tramaco Express",
    note: "Tramaco Express",
    url: "https://www.tramaco.com.ec/",
  },
  {
    id: "gintracom",
    name: "Gintracom / Correos",
    note: "Gintracom · Correos del Ecuador",
    url: "https://www.gintracom.com.ec/",
  },
];

// Safe, fake demo codes (never real parcels).
export const DEMO_TMLC_CODE = "TMLC99999999";
export const DEMO_SP_CODE = "SP1234567890EC";
export const MAX_TRACKING_LENGTH = 40;

/** Keep only letters, digits and hyphens; trim and cap the length. */
export function sanitizeTrackingCode(raw: string): string {
  return raw
    .replace(/[^A-Za-z0-9-]/g, "")
    .slice(0, MAX_TRACKING_LENGTH)
    .trim();
}

/** How a carrier relates to the code. */
export type MatchRole = "exact" | "intl" | "local" | "match";

export interface CarrierMatch {
  readonly carrier: Carrier;
  readonly role: MatchRole;
}

export type DetectionKind = "tmlc" | "dual" | "generic" | "none";

export interface Detection {
  readonly kind: DetectionKind;
  readonly matches: readonly CarrierMatch[];
}

function byId(id: CarrierId): Carrier {
  // CARRIERS is a fixed catalogue, so the lookup always succeeds.
  return CARRIERS.find((c) => c.id === id) as Carrier;
}

/**
 * Detect carriers for a tracking code. Exact real-world Temu patterns come
 * first; otherwise every generic rule that matches is returned (multi-match).
 */
export function detectCarriers(rawCode: string): Detection {
  const flat = sanitizeTrackingCode(rawCode).toUpperCase().replace(/-/g, "");
  if (!flat) return { kind: "none", matches: [] };

  // Temu -> LaarCourier official code, e.g. TMLC55800119.
  if (/^TMLC\d{6,12}$/.test(flat)) {
    return { kind: "tmlc", matches: [{ carrier: byId("laar"), role: "exact" }] };
  }

  // Dual-stage guide, e.g. SP048007098826EC: Far Intl + Urbano Express EC.
  if (/^SP\d{10,14}EC$/.test(flat)) {
    return {
      kind: "dual",
      matches: [
        { carrier: byId("far"), role: "intl" },
        { carrier: byId("urbano"), role: "local" },
      ],
    };
  }

  const matches: CarrierMatch[] = [];
  const isDigits = /^\d+$/.test(flat);
  const len = flat.length;
  const add = (id: CarrierId) => matches.push({ carrier: byId(id), role: "match" });

  if (/^(LAAR|TMLC)/.test(flat) || (isDigits && len >= 7 && len <= 8)) add("laar");
  if (/^(URB|TMU)/.test(flat) || /EC$/.test(flat)) add("urbano");
  if (isDigits && len >= 9 && len <= 10) add("servientrega");
  if (/^(TRA|TMTR)/.test(flat)) add("tramaco");
  if (/^(GIN|LP|YT|UN)/.test(flat)) add("gintracom");

  return matches.length > 0
    ? { kind: "generic", matches }
    : { kind: "none", matches: [] };
}
