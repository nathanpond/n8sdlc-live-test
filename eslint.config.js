// Build-time analysis is the always-on layer the audits lean on (n8SDLC).
// Warnings are errors in CI: `npm run lint` runs eslint with --max-warnings 0.
// Any rule tuned down here must carry a one-line rationale; audits treat
// unexplained suppressions as findings.
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist/", "coverage/"] },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ["**/*.js"],
    ...tseslint.configs.disableTypeChecked,
  },
);
