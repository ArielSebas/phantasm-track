# Implementation Plan: Customs Grimoire

## Overview

This plan builds PhantasmTrack (GrimCourier) bottom-up: project scaffolding first, then the pure, UI-free domain layer in `src/domain/customs/` (each module paired with its `fast-check` property tests from the design's Correctness Properties), and finally the gothic dark-fantasy UI in `src/components/grimoire/` wired into `src/app`. The strict separation from `structure.md` is preserved — domain code imports no React/UI, and UI components consume domain functions without reimplementing any math. All property tests use Vitest + fast-check with a minimum of 100 iterations.

## Tasks

- [x] 1. Scaffold the project and toolchain
  - [x] 1.1 Initialize the Next.js (App Router) + TypeScript + Tailwind CSS project
    - Create a Next.js App Router project with TypeScript and Tailwind CSS at the workspace root (keep existing `README.md` and `LICENSE`)
    - Install `lucide-react` for arcane/RPG icons
    - Configure Tailwind with custom keyframes placeholders for gothic glow effects (`globals.css` / `tailwind.config`)
    - _Tech: Next.js App Router, TypeScript, Tailwind, lucide-react_

  - [x] 1.2 Set up the Vitest + fast-check testing harness
    - Install and configure Vitest and `fast-check` as dev dependencies
    - Add a `vitest.config.ts` that resolves the `src/` paths and runs with no DOM environment for domain suites
    - Add a `test` script that runs Vitest once (non-watch, e.g. `vitest run`)
    - _Tech: Vitest, fast-check, Testing Expectations_

  - [x] 1.3 Create the source folder structure and barrel
    - Create `src/app/`, `src/components/grimoire/`, `src/domain/customs/`, and `src/__tests__/customs/`
    - Create `src/domain/customs/index.ts` barrel (initially empty, re-exports added as modules land)
    - _Structure: Project Layout, Separation of Concerns_

  - [x] 1.4 Verify `/.kiro` is NOT git-ignored
    - Inspect `.gitignore` (and any generated Next.js `.gitignore`) and ensure no entry excludes `/.kiro` or any subdirectory
    - If a framework-generated `.gitignore` adds such an entry, remove it; confirm `git check-ignore .kiro/specs/customs-grimoire/tasks.md` reports the file is tracked (not ignored)
    - _Tech: Strict Rules (never ignore /.kiro)_

- [x] 2. Define domain types and Ecuador configuration constants
  - [x] 2.1 Implement `src/domain/customs/types.ts`
    - Define `Result<T, E>`, `ValidationField`, `ValidationError` (codes: missing, negative, nonFinite, invalidStage, outOfSequence, alreadyFinal)
    - Define `ImportRegime`, `PackageInput`, `CustomsConfig`, `TaxResult`
    - Define `ManaBarStatus`, `ManaBarInput`, `ManaBarResult`, `ManaBarConfig`
    - Define `QuestStage`, `QUEST_SEQUENCE`, `Quest`
    - No React/UI imports; export from barrel `index.ts`
    - _Requirements: 1.4, 1.5, 4.2, 5.1, 7.1, 8.1; Design: Data Models_

  - [x] 2.2 Implement `src/domain/customs/config.ts`
    - Define constants `WEIGHT_LIMIT=4`, `FOB_LIMIT=400`, `WARNING_THRESHOLD=80`, `CRITICAL_THRESHOLD=100`
    - Define `DEFAULT_AD_VALOREM_RATE=0.10`, `DEFAULT_VAT_RATE=0.15`, `DEFAULT_FLAT_FEE=42`
    - Define `DEFAULT_CUSTOMS_CONFIG` and `DEFAULT_MANA_BAR_CONFIG`; export from barrel
    - _Requirements: 1.1, 1.2, 1.3, 2.3, 5.2, 5.3, 5.4; Design: Ecuador configuration constants_

- [x] 3. Implement the customs calculator (regime selection + taxes/fees)
  - [x] 3.1 Implement `selectRegime` in `src/domain/customs/regime.ts`
    - Validate presence/finiteness/non-negativity of `packageWeight` and `fobValue`; return `Err` with offending field otherwise
    - Select `FourByFour` when `weight <= weightLimit` AND `fob <= fobLimit`; else `General`
    - Pure, config-injected, returns `Result<ImportRegime, ValidationError>`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 3.2 Implement `round2` helper and `calculateCustoms` in `src/domain/customs/calculator.ts`
    - Add `round2(x) = Math.round(x * 100) / 100`
    - Validate in order: missing → nonFinite → negative → regime selection → regime-specific config validity
    - 4x4: `adValoremTariff=0`, `vat=0`, `flatFee=config.flatFee`, `total=config.flatFee`; reject negative `flatFee`
    - General: `adValoremTariff=round2(adValoremRate*fob)`, `vat=round2(vatRate*(fob+adValoremTariff))`, `flatFee=config.flatFee`, `total=round2(sum)`; reject negative `adValoremRate`/`vatRate`
    - Return `Result<TaxResult, ValidationError>`; export both functions from barrel
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x]* 3.3 Write property test for regime boundary selection — `src/__tests__/customs/regime.property.test.ts`
    - **Property 1: Regime boundary selection** (in-range → FourByFour; over either limit → General)
    - **Validates: Requirements 1.1, 1.2, 1.3**
    - Use fast-check, min 100 iterations; tag with `// Feature: customs-grimoire, Property 1: ...`
    - Run the test and confirm it passes

  - [x]* 3.4 Write property tests for regime totality and error paths — `src/__tests__/customs/regime.property.test.ts`
    - **Property 2: Regime totality (exactly one regime)** — **Validates: Requirements 1.4**
    - **Property 14: Missing input fields rejected** — **Validates: Requirements 1.5**
    - min 100 iterations each; run and confirm they pass

  - [x]* 3.5 Write property tests for the 4x4 and General formulas — `src/__tests__/customs/calculator.property.test.ts`
    - **Property 3: 4x4 regime invariant** — **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
    - **Property 4: General regime formula** — **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
    - **Property 5: General total monotonic non-decreasing in FOB** — **Validates: Requirements 3.4**
    - min 100 iterations each; run and confirm they pass

  - [x]* 3.6 Write property tests for determinism, bounds, and calculator error paths — `src/__tests__/customs/calculator.property.test.ts`
    - **Property 6: Determinism and cent rounding** — **Validates: Requirements 4.1**
    - **Property 7: Non-negativity of monetary outputs** — **Validates: Requirements 4.2**
    - **Property 8: Total bounded below by flat fee** — **Validates: Requirements 4.3**
    - **Property 15: Invalid numeric input rejected** — **Validates: Requirements 4.4, 4.5**
    - **Property 16: Invalid configuration rejected** — **Validates: Requirements 2.5, 3.5**
    - min 100 iterations each; run and confirm they pass

  - [x]* 3.7 Write unit (example) tests for worked customs scenarios — `src/__tests__/customs/calculator.example.test.ts`
    - Known-value 4x4 package (total === flatFee) and known-value General package (expected tariff/VAT/total)
    - Guards against a property that is self-consistent but wrong; run and confirm they pass
    - _Requirements: 2.4, 3.4_

- [x] 4. Checkpoint — customs calculator verified
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement the mana bar logic
  - [x] 5.1 Implement `computeManaBar` and `manaBarStatus` in `src/domain/customs/manaBar.ts`
    - `computeManaBar(cumulative, limit)`: reject `limit <= 0` (field `limit`) and `cumulative < 0` (field `cumulative`); else `usagePercentage = cumulative / limit * 100` with no upper cap; return `ManaBarResult`
    - `manaBarStatus(usagePercentage)`: `normal` when `< 80`, `warning` when `80 <= p < 100`, `limitReached` when `>= 100`
    - Pure; export from barrel
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [x]* 5.2 Write property tests for mana bar formula and bounds — `src/__tests__/customs/manaBar.property.test.ts`
    - **Property 9: Mana bar percentage formula and non-negativity** — **Validates: Requirements 5.1, 6.1, 7.1**
    - **Property 10: Mana bar bound relative to limit** — **Validates: Requirements 7.2, 7.3**
    - min 100 iterations each; tag each with its Property number; run and confirm they pass

  - [x]* 5.3 Write property tests for mana bar status thresholds and determinism — `src/__tests__/customs/manaBar.property.test.ts`
    - **Property 11: Mana bar status thresholds** (boundaries at 80 and 100) — **Validates: Requirements 5.2, 5.3, 5.4, 6.2, 6.3, 6.4**
    - **Property 12: Mana bar determinism** — **Validates: Requirements 7.4**
    - min 100 iterations each; run and confirm they pass

  - [x]* 5.4 Write property test for mana bar error paths — `src/__tests__/customs/manaBar.property.test.ts`
    - **Property 17: Invalid mana bar inputs rejected** (`limit <= 0` → field limit; `cumulative < 0` → field cumulative) — **Validates: Requirements 5.5, 6.5, 7.5, 7.6**
    - min 100 iterations; run and confirm it passes

- [x] 6. Implement the quest tracker
  - [x] 6.1 Implement `createQuest`, `advanceQuest`, `setQuestStage` in `src/domain/customs/quest.ts`
    - `createQuest(id, label)` → `Quest` at `OriginPortal`
    - `advanceQuest(stage)` → `Ok(successor)` for non-terminal; `Err(code "alreadyFinal")` for `GuildDelivery`
    - `setQuestStage(current, target)` → `Ok(target)` only when `target` is the immediate successor; reject out-of-sequence (`outOfSequence`) and non-member targets (`invalidStage`), retaining `current`, field `targetStage`
    - Pure; export from barrel
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

  - [x]* 6.2 Write property test for quest ordered transitions — `src/__tests__/customs/quest.property.test.ts`
    - **Property 13: Quest ordered transitions** (successor-only success; terminal/out-of-sequence rejection; advanceQuest totality) — **Validates: Requirements 8.2, 8.3, 8.4, 8.5**
    - Enumerate all `(current, target)` pairs over `QUEST_SEQUENCE`; min 100 iterations; run and confirm it passes

  - [x]* 6.3 Write property test for invalid quest targets and the creation example — `src/__tests__/customs/quest.property.test.ts`
    - **Property 18: Invalid quest target rejected** (`invalidStage`, field `targetStage`, retains current) — **Validates: Requirements 8.6**
    - Unit example: `createQuest(...)` starts at `OriginPortal` — _Requirements: 8.1_
    - min 100 iterations for the property; run and confirm they pass

- [x] 7. Checkpoint — full domain layer verified
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Build the gothic dark-fantasy UI components (`src/components/grimoire/`)
  - [~] 8.1 Implement `ManaBar.tsx`
    - Props `cumulative`, `limit`, `label`, optional icon; call `computeManaBar`; on `Err` show field-specific message, on `Ok` render fill width from `usagePercentage` (visual fill clamped to 100%, numeric readout uncapped)
    - Tint by status: `normal` calm arcane blue, `warning` amber glow (≥80%), `limitReached` pulsing crimson (≥100%) via Tailwind keyframes; use `lucide-react` icon
    - Consumes domain only; no local math
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 6.4, 7.2, 7.3; Design: ManaBar_

  - [~] 8.2 Implement `StagePortals.tsx`
    - Map `QuestStage` → three arcane portals (Origin Portal → Customs Abyss → Guild Delivery), highlighting the active stage with glow; `lucide-react` icons
    - _Requirements: 8.1, 8.2, 8.3; Design: StagePortals_

  - [~] 8.3 Implement `QuestCard.tsx`
    - Render one `Quest` (label, current stage via `StagePortals`) with an "Advance" action that calls `advanceQuest(quest.stage)`; update state only on `Ok`, surface the validation message on `Err` without mutating the stage
    - _Requirements: 8.2, 8.3, 8.4, 8.5; Design: QuestCard_

  - [~] 8.4 Implement `QuestLog.tsx`
    - Render the collection of `QuestCard`s as adventurer's-log entries; pass through advance handlers
    - _Requirements: 8.1, 8.2, 8.3, 8.4; Design: QuestLog_

  - [~] 8.5 Implement `AlchemistCalculator.tsx`
    - Form for `Package_Weight` and `FOB_Value`; on change call `calculateCustoms(input, config)`; on `Ok` render regime badge (4x4 vs General) and tariff/VAT/flat-fee/total breakdown; on `Err` show field-specific message
    - Embed two `ManaBar`s (annual weight, annual budget) fed by cumulative totals
    - _Requirements: 1.1, 1.2, 1.3, 2.4, 3.4, 4.2, 4.4, 4.5; Design: AlchemistCalculator_

  - [~] 8.6 Implement `GrimoireLayout.tsx`
    - Top-level atmospheric spellbook shell with background glow; hold client state (quests, calculator inputs, cumulative annual totals) and pass values down to `QuestLog` and `AlchemistCalculator`
    - _Requirements: 8.1, 5.1, 6.1; Design: GrimoireLayout_

- [ ] 9. Wire the UI into the Next.js app
  - [~] 9.1 Compose the grimoire in `src/app/page.tsx`
    - Render `GrimoireLayout` as the home page; seed initial quests and cumulative totals; ensure components import only from `src/domain/customs` (barrel)
    - Confirm the app builds with the Next.js build step
    - _Requirements: 1.1, 5.1, 6.1, 8.1; Design: Architecture / Layered Data Flow_

- [~] 10. Final checkpoint — full build and test pass
  - Ensure all tests pass and the project builds, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional test sub-tasks and can be skipped for a faster MVP, but the steering guidance (`tech.md`) requires PBT coverage on all customs/tax/weight/mana-bar math.
- Every domain property sub-task references a specific Property from the design's Correctness Properties section and the requirement clauses it validates, and must write and run the fast-check tests (minimum 100 iterations each).
- The domain layer (`src/domain/customs/*`) is implemented and fully tested before any UI work; UI components consume domain functions and never reimplement math.
- `/.kiro` must remain tracked in version control at all times (verified in task 1.4).

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3", "1.4"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["2.2"] },
    { "id": 3, "tasks": ["3.1", "5.1", "6.1"] },
    { "id": 4, "tasks": ["3.2", "3.3", "3.4", "5.2", "5.3", "5.4", "6.2", "6.3"] },
    { "id": 5, "tasks": ["3.5", "3.6", "3.7", "8.1", "8.2"] },
    { "id": 6, "tasks": ["8.3", "8.5"] },
    { "id": 7, "tasks": ["8.4", "8.6"] },
    { "id": 8, "tasks": ["9.1"] }
  ]
}
```
