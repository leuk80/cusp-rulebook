# Contributing to the Cusp Rulebook

This repo is **data, not code**. You don't need to build the app to contribute — a text
editor and Node are enough. Every change is validated against the schema in CI before merge.

## Setup

```bash
npm ci
npm run validate     # validates every file in programs/ against schema/
```

## Add or update a program

1. **Program file — `programs/<id>.json`.** Pick a stable kebab-case `id` (e.g.
   `turkish-miles-smiles`). Define the `metrics` (the things that count toward status) and
   the `tiers` (the thresholds). See `docs/field-reference.md` for every field, and an
   existing program (e.g. `accor-all.json`, `miles-and-more.json`) as a template.
2. **Earning rule — `programs/<id>.earning.json`** (optional). How a flight / hotel stay /
   purchase turns into metric contributions. The `programId` must equal `<id>`, and every
   `*MetricId` must be one of the program's `metrics`.
3. **Milestones — `programs/<id>.milestones.json`** (optional). Rewards unlocked at
   thresholds above/alongside status.
4. **Run `npm run validate`** until it's green, then open a PR.

## Update a threshold (the common case)

Most PRs just change a number when a program revises its requirements. Edit the value in
`programs/<id>.json`, run `npm run validate`, and **link the official program page plus the
date you checked** in the PR. The maintainers re-verify thresholds against the official pages
each January.

## Rules of thumb

- **Reuse ids.** Within a program, reference existing `metricId`/`tierId`s — don't invent new
  ones for the same concept. Cross-references that don't resolve fail the app's Swift tests.
- **Stable identifiers, not translations.** Program/tier names are proper nouns (Senator,
  Diamond, HON Circle) and stay the same in every language. The app localizes display via keys
  like `metric.<id>` / `tier.<id>`; the `name`/`unit` fields here are developer fallbacks.
- **Earn on net spend.** Where a program earns "excluding taxes", model the rate accordingly;
  amounts are handled net of VAT/tax downstream.
- **Caps.** A yearly ceiling on *bought / partner / promo* contributions goes on the metric as
  `purchasedCap` (organic stays/flights are never capped).
- **Don't reformat unrelated files.** Keep diffs focused on what you changed.

## What does NOT belong here

No app logic, no UI strings, no personal account data. This is the shared rulebook only.
