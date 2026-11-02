import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/**
 * Vitest configuration for PhantasmTrack (GrimCourier).
 *
 * The domain layer (`src/domain/customs/*`) is pure, UI-free business logic,
 * so the suites run in a plain Node environment (no DOM). The `@/*` alias
 * mirrors `tsconfig.json` so test files can import domain modules the same
 * way the app does.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/__tests__/**/*.{test,spec}.{ts,tsx}"],
    globals: true,
  },
});
