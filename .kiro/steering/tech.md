# Tech

## Stack

- **Framework:** Next.js (App Router) with TypeScript.
- **Styling:** Tailwind CSS.
- **Icons & Animations:** `lucide-react` for arcane / RPG icons, plus Tailwind custom keyframes for spooky, glowing gothic UI effects.
- **Testing:** Vitest with `fast-check` for Property-Based Testing (PBT) on all customs / tax / weight math logic.
- **Deployment target:** Vercel (zero-config static / SSR).

## Testing Expectations

- All pure business logic (customs taxes, tariff fees, weight validation, mana bar percentages) must be covered by Property-Based Tests using `fast-check`.
- PBT should assert invariants (e.g. non-negativity, monotonicity, bounds) rather than only hard-coded example cases.

## Strict Rules

- **NEVER** add `/.kiro` or any of its subdirectories to `.gitignore`. Steering, specs, and other Kiro configuration must always remain tracked in version control.
