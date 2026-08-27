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

## /n8-plan * — 2026-08-27

- **Decision:** Storage-format backward-compat fixture harness moved from M0
  (roadmap phase 1) to M1 as #12, blocked by #6.
  **Why:** The v1 on-disk format doesn't exist until the add story creates it;
  a fixture for a nonexistent format can't be frozen. M0/M1 milestone
  descriptions and CLAUDE.md invariant 3 marking updated to match.
- **Decision:** M2: Audit left without stories; description updated with audit
  emphases instead (input robustness, file handling, invariant integrity).
  **Why:** Audit findings are produced by /n8-audit itself. Note: by /n8-plan's
  own definition ("planned = has stories assigned") M2 stays "unplanned", so a
  re-run of `/n8-plan *` will target it again.
- **Decision:** Bookmark ids are sequential positive integers, never reused;
  duplicate URL on add is an error naming the existing id; invalid URLs
  (rejected by `new URL()`) are errors; search is case-insensitive substring
  over url + tags; `--tag` filter is exact (case-insensitive) tag match;
  missing store = empty store; corrupt/newer-version store = typed error,
  exit 1; exit codes 0/1 only; table columns ID/URL/TAGS/ADDED.
  **Why:** User brief didn't specify; picked the simplest defensible answers
  per its standing instruction, encoded in #6/#9/#10/#11 AC.
- **Decision:** One subtask only (#8, module layout under #6) — no others.
  **Why:** Four stories share storage/args/output modules; prescribing the
  seams prevents divergence. Everything else is self-evident for this size.
- **Decision:** Id-reuse-after-deleting-max, URL normalization before duplicate
  check, and peerDependencies coverage delegated to Claude's Discretion
  sections of #11, #6, #5.
- **Decision:** No project-specific skills proposed (nothing recurs enough to
  pay for itself in a 4-command CLI); audit emphases recorded in the M2
  milestone description.

## /n8-exec * — 2026-08-27

- **Decision:** CI is a single job (`ci`) with typecheck/lint/test as sequential
  steps, not parallel jobs.
  **Why:** Claude's Discretion in #4; one required-check context keeps the
  ruleset wiring simple for a repo this small.
  **Issue:** #4
- **Decision (Rule 3):** Regenerated `package-lock.json` and bumped devDependency
  ranges to the locally installed toolchain (eslint ^10, @eslint/js ^10,
  typescript ^6, vitest ^4, @types/node ^26).
  **Why:** Lockfile was out of sync with package.json — `npm ci` failed with
  EUSAGE on every CI runner (blocker inside #4's scope). Chose "align to what
  the project actually builds and tests with locally" over downgrading, since
  the local toolchain is the verified-green one.
  **Issue:** #4
- **Decision:** The warning-severity proof for #4 uses an unused
  `eslint-disable` directive (reported at warning severity) rather than a rule
  violation — this config's rules are all error-severity, so a plain violation
  proves errors fail CI, not warnings.
  **Issue:** #4
- **Decision:** Release artifact is `linkring-<tag>.tar.gz` (dist/ +
  package.json), release notes auto-generated, concurrency group
  `release-<ref>` with cancel-in-progress false.
  **Why:** Claude's Discretion in #7; simplest formats that satisfy the AC.
  **Issue:** #7
- **Decision:** peerDependencies also guarded empty by the invariant test.
  **Why:** Delegated in #5's discretion; a peer dep is a runtime install
  requirement for a CLI in practice.
  **Issue:** #5
- **Decision:** No URL normalization before the duplicate check — `add`
  compares the exact stored string (`https://x.com` ≠ `https://x.com/`).
  **Why:** Delegated in #6; least surprise, zero magic, documented in code.
  **Issue:** #6
- **Decision:** Id counter is an optional `nextId` field in the v1 envelope
  (strict never-reuse, even after deleting the max id); counter-less files
  fall back to max+1, and rm bumps the counter past a removed max id.
  **Why:** Delegated in #11; strict monotonicity is what the story's truths
  promise, and the optional field keeps format version 1.
  **Issue:** #11 (implemented in #6's storage module)
- **Decision:** `search` takes exactly one term; extra positionals are a usage
  error with a "quote multi-word searches" hint.
  **Why:** Delegated in #10; matches the `<text>` contract exactly.
  **Issue:** #10
- **Decision:** Empty-state wordings: "no bookmarks yet" / "no bookmarks
  tagged 'x'" / "no bookmarks matching 'x'"; ADDED column shows the stored
  ISO-8601 string unmodified.
  **Why:** Delegated (#9/#10 discretion); simplest unambiguous forms.
  **Issue:** #9, #10
- **Decision:** v1 fixture includes an id gap and omits `nextId`.
  **Why:** #12 discretion (assertion granularity) — freezes the oldest legal
  shape, so the max+1 fallback path stays covered forever.
  **Issue:** #12

## /n8-exec M2 — 2026-08-27

- **Decision:** #17 and #18 share one commit (both edit src/storage.ts with
  adjacent concerns) instead of strictly one commit per story.
  **Why:** Hunk-splitting one small file across two commits adds risk for no
  audit value; both Refs lines are in the body.
  **Issue:** #17, #18
- **Decision:** #19 fixed by *rejecting* control characters rather than the
  issue's first suggested option (storing `new URL().href`).
  **Why:** Canonicalizing normalizes (`https://x.com` → `https://x.com/`),
  contradicting the documented no-normalization discretion from #6.
  **Issue:** #19
- **Decision:** Control check implemented as a code-point loop, not the
  regex `[\x00-\x1f\x7f]`.
  **Why:** eslint `no-control-regex` (invariant 2: warnings are errors)
  rejects the character class; code beats a suppression pragma.
  **Issue:** #19
- **Decision:** nextId validation rejects (`StorageError`) rather than
  silently clamping to max(id)+1.
  **Why:** Consistent with the file's existing refuse-don't-guess posture on
  corrupt input; clamping would hide corruption.
  **Issue:** #17
