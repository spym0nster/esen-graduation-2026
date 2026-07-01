import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Ad-hoc operational Node scripts for poking at the Google Sheet — not part of the app.
    "*.js",
    "scripts/**",
    "remotion-skills/**",
  ]),
  {
    rules: {
      // The standard SSR "mount guard" (setState inside a mount effect to avoid hydration
      // mismatches) is used intentionally in several client components. The React Compiler
      // preview rule flags this valid pattern as a false positive, so disable it project-wide.
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;
