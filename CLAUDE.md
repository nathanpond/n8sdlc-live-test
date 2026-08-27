# linkring

A tiny TypeScript CLI that manages a personal bookmarks file (`~/.linkring.json`,
overridable via `LINKRING_FILE`). Zero runtime dependencies is an invariant.

## n8SDLC project

This project is managed by the n8SDLC workflow (GitHub Issues = the plan; `/n8-stat` shows where things stand). If a change made in this session deviates from what planned issues assume — different library, provider, architecture, dropped/added scope, or amending a declared invariant below — do two things before finishing:
1. Append an `## Ad-hoc` entry to `.n8/decisions.md` (format documented in that file's header) naming the change, the why, and the milestones/issues likely affected.
2. Tell the user which future milestones may now have stale plans and suggest running `/n8-replan`.

## Invariants

1. Zero runtime dependencies (dev dependencies are fine). — **test-enforced** (guard test asserts `package.json` `dependencies` is empty; planned into M0/CI)
2. Warnings and lint findings are errors in CI (`eslint --max-warnings 0`, `tsc` strict). — **test-enforced** (build setting in the CI workflow)
3. The storage file format is versioned JSON — never break reading an older file. — **test-enforced** (fixture tests read every prior on-disk format version; planned into M0/CI)
