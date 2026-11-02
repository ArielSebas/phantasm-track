// Pure domain types for the customs-grimoire feature.
//
// NO React / NO UI imports may ever appear in this file. These types describe
// the inputs, outputs, and error channel for the Alchemist Customs Calculator,
// the annual Mana Bars, and the Quest tracker. All failure is modelled as data
// via the Result type rather than thrown exceptions.

/** Discriminated result: either an Ok value or an Err error. */
export type Result<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

/** Names the offending field so the UI can point to it. */
export type ValidationField =
  | "packageWeight"
  | "fobValue"
  | "flatFee"
  | "adValoremRate"
  | "vatRate"
  | "cumulative"
  | "limit"
  | "targetStage";

/** Machine-readable reason a value was rejected. */
export type ValidationCode =
  | "missing"
  | "negative"
  | "nonFinite"
  | "invalidStage"
  | "outOfSequence"
  | "alreadyFinal";

export interface ValidationError {
  readonly field: ValidationField;
  readonly code: ValidationCode;
  readonly message: string;
}

// ---------------------------------------------------------------------------
// Customs domain
// ---------------------------------------------------------------------------

export enum ImportRegime {
  FourByFour = "FourByFour",
  General = "General",
}

/** Input fields are optional so the calculator can detect "missing". */
export interface PackageInput {
  readonly packageWeight?: number; // kg
  readonly fobValue?: number; // USD
}

export interface CustomsConfig {
  readonly weightLimit: number; // kg; Ecuador default 4
  readonly fobLimit: number; // USD; Ecuador default 400
  readonly adValoremRate: number; // fraction, e.g. 0.10 = 10%
  readonly vatRate: number; // fraction, e.g. 0.15 = 15%
  readonly flatFee: number; // USD, applied to every package
}

export interface TaxResult {
  readonly regime: ImportRegime;
  readonly adValoremTariff: number; // USD, rounded to cents, >= 0
  readonly vat: number; // USD, rounded to cents, >= 0
  readonly flatFee: number; // USD, rounded to cents, >= 0
  readonly total: number; // USD, rounded to cents, >= flatFee
}

// ---------------------------------------------------------------------------
// Mana bar domain
// ---------------------------------------------------------------------------

export type ManaBarStatus = "normal" | "warning" | "limitReached";

export interface ManaBarInput {
  readonly cumulative: number; // consumed amount for the year (kg or USD), >= 0
  readonly limit: number; // configured annual limit, > 0
}

export interface ManaBarResult {
  readonly cumulative: number;
  readonly limit: number;
  readonly usagePercentage: number; // >= 0, no upper cap
  readonly status: ManaBarStatus;
}

export interface ManaBarConfig {
  readonly warningThreshold: number; // percent; Ecuador default 80
  readonly criticalThreshold: number; // percent; Ecuador default 100
}

// ---------------------------------------------------------------------------
// Quest domain
// ---------------------------------------------------------------------------

export enum QuestStage {
  OriginPortal = "OriginPortal",
  CustomsAbyss = "CustomsAbyss",
  GuildDelivery = "GuildDelivery",
}

/** Canonical ordering used by advanceQuest / setQuestStage. */
export const QUEST_SEQUENCE: readonly QuestStage[] = [
  QuestStage.OriginPortal,
  QuestStage.CustomsAbyss,
  QuestStage.GuildDelivery,
] as const;

export interface Quest {
  readonly id: string;
  readonly label: string;
  readonly stage: QuestStage;
}
