# Structure

## Project Layout

A clean, modular structure that isolates pure business logic from UI:

```
src/
  app/                  # Next.js App Router routes, layouts, pages
  components/
    grimoire/           # Gothic dark-fantasy UI components (quests, mana bars, portals)
  domain/
    customs/            # Pure business logic — NO React, NO UI imports
  __tests__/            # Vitest + fast-check property-based tests
```

## Separation of Concerns

- **`src/domain/customs/`** holds all pure business logic: tax calculation, tariff fees, weight validation, and mana bar percentage math.
  - This code must have **no dependency on React or any UI component**.
  - It must be **100% testable with Property-Based Testing independently of the UI**.
- **`src/components/grimoire/`** holds presentational and interactive UI. It consumes the domain logic but never reimplements it.
- **`src/app/`** wires routes and pages together, composing grimoire components.
- **`src/__tests__/`** contains the Vitest suites, with PBT focused on the `domain/customs` functions.

## Guiding Principle

Keep calculations pure and deterministic so they can be verified in isolation. UI should be a thin, atmospheric layer over trustworthy domain logic.
