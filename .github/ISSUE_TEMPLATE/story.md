---
name: Story
about: Describes WHAT to build, with testable acceptance criteria and a test plan
labels: feature
---

## What
<what to build and why — no implementation detail>

## Acceptance criteria
- [ ] <testable criterion>

## Must-haves
truths:            # 3-7 user-observable statements this story makes true
  - "<user-observable outcome>"
artifacts:         # concrete files that make each truth possible
  - path: "<file>"
    provides: "<capability>"
key_links:         # the connections where stubs hide
  - from: "<file>"
    to: "<endpoint/file>"
    via: "<mechanism>"

## Demo
<user-facing stories only: a concrete ~60-second user script — specific actions, observable
outcomes, complete workflow. Omit for stories the agent can fully verify on its own.>

## Test plan
<automated tests to be written as part of this story; they must pass before the story is done>

## Claude's Discretion
<decisions the user explicitly delegated during planning — where execution may improvise without a blocker>

## Dependencies
<Blocked by: #N lines, if the native API is unavailable>
