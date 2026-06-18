// @ts-check
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import importPlugin from "eslint-plugin-import-x";

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/coverage/**",
      "**/*.js",
      "**/*.cjs",
      "**/*.mjs",
    ],
  },
  {
    files: ["**/*.ts"],
    plugins: {
      "@typescript-eslint": tseslint,
      "import-x": importPlugin,
    },
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
      },
    },
    rules: {
      // No any in public signatures
      "@typescript-eslint/no-explicit-any": "error",

      // No default exports
      "import-x/no-default-export": "error",

      // No side effects on import (enforced by design, warned here)
      // Circular deps are checked via madge, not ESLint

      // General TypeScript rules
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports" },
      ],
      "@typescript-eslint/no-non-null-assertion": "error",

      // Import order
      "import-x/order": [
        "error",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
          ],
          "newlines-between": "always",
          alphabetize: { order: "asc" },
        },
      ],
    },
  },
  {
    // tsup, vitest configs need default exports
    files: ["**/tsup.config.ts", "**/vitest.config.ts"],
    rules: {
      "import-x/no-default-export": "off",
    },
  },
];
