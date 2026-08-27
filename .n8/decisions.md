# Decision log (append-only)

Every n8SDLC skill run appends one `##` section here recording real decisions —
choices between alternatives, assumptions made, deviations from plan — not
routine actions.

Ad-hoc entries (changes made outside the n8SDLC commands that deviate from
planned issues) use this format, so `/n8-replan` and drift checks can find them:

```markdown
## Ad-hoc — YYYY-MM-DD

- **Change:** <what changed — library, provider, architecture, scope, invariant>
  **Why:** <one line>
  **Affects:** <milestones/issues whose plans may now be stale>
```

When `/n8-replan` processes an entry it appends `— reconciled by /n8-replan <date>`.

## /n8-roadmap — 2026-08-27

- **Decision:** Two epics only — "Infrastructure & CI" (#1) and "Core bookmark
  commands" (#2); the storage layer is folded into #2 rather than getting its
  own epic.
  **Why:** User asked to keep it small; the storage engine is a phase of the
  core-commands milestone, not a separately shippable capability.
- **Decision:** CI folded into M0 ("M0: Infrastructure & CI") instead of a
  separate M1 CI milestone.
  **Why:** User explicitly offered this ("M0 infra+CI combined is fine").
- **Decision:** Milestones: M0: Infrastructure & CI → M1: Core commands →
  M2: Audit. One feature milestone only, per user preference.
- **Decision:** All three invariants marked **test-enforced** in CLAUDE.md
  (deps-empty guard test; lint/warnings-as-errors as CI build setting;
  storage-format backward-compat fixtures). Guards planned into M0.
- **Decision:** deployment.stage recorded as "none" — the config.yml example
  shape expects dev/stage/production keys, but a local CLI has no stage; dev =
  local checkout, production = tagged GitHub release with artifacts (user's
  definition).
- **Decision:** context7 check skipped (declined at init per config).

## /n8-init — 2026-08-27

- **Decision:** Hand-rolled arg parsing; zero runtime dependencies (dev deps allowed).
  **Why:** Project invariant set by the user at init.
- **Decision:** `area:*` set is `cli`, `ci`, `docs` (src/, .github/workflows, docs).
  **Why:** Maps to the actual top-level structure of a small single-package CLI.
- **Decision:** Branch ruleset requires a PR with 0 approving reviews; the CI
  status-check requirement will be added by the CI milestone.
  **Why:** Solo-author repo; a review-count requirement would deadlock merges.
- **Decision:** Wiki left enabled but unseeded — the wiki git repo does not exist
  until the first page is created in the web UI, and no API can create it.
  **Why:** Both `git clone` and `git push` to `<repo>.wiki.git` return
  "Repository not found". Owner action: visit the repo's Wiki tab and create
  the first page, then re-run `/n8-init` to seed Home.md.
