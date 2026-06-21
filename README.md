# Cusp Rulebook

A public, community-reviewable rulebook of airline and hotel **loyalty-program status
rules**, expressed entirely as data. [Cusp](https://github.com/) — a private, local-first
app for tracking your own loyalty status — consumes this rulebook so that program rules can
be reviewed, corrected, and extended **without changing app code**.

> Status thresholds change every year. They belong in data, not in code. Anyone can open a
> PR to fix a number or add a program; CI validates it against the schema before it can merge.

## What's in here

```
programs/      The data — one file set per program (see naming below)
schema/        JSON Schema (draft-07) for every file type; the contract
scripts/       validate.mjs — routes each file to its schema and validates it
docs/          field-reference.md — every field explained, with the quirks
```

### File naming

| File                     | Contents            | Schema                      |
|--------------------------|---------------------|-----------------------------|
| `<id>.json`              | Program & tiers     | `program.schema.json`       |
| `<id>.earning.json`      | Earning rules       | `earning.schema.json`       |
| `<id>.milestones.json`   | Milestone rewards   | `milestones.schema.json`    |
| `*.links.json`           | Cross-program links | `links.schema.json`         |
| `vat-rates.json`         | Lodging VAT table   | `vat-rates.schema.json`     |
| `service-rates.json`     | Lodging service-charge ("++") table | `service-rates.schema.json` |

`<id>` is a stable kebab-case identifier (e.g. `miles-and-more`, `accor-all`).

## Validate locally

```bash
npm ci
npm run validate
```

This is the same check CI runs on every pull request. Cross-reference integrity (that the
metric/tier ids you reference actually exist) is additionally enforced by Swift tests in the
consuming app.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) and [docs/field-reference.md](docs/field-reference.md).
Open a PR — link your source and the date you checked it.

## How Cusp uses it

The app bundles a pinned copy of `programs/` at build time (today via a sync script; later via
hosted delivery so rule updates ship without an app release). The app translates display names
through localized keys — the names in these files are stable identifiers / developer fallbacks,
not the user-facing strings.

## License

- **Data** (`programs/`): [CC0 1.0](LICENSE) — public-domain factual data.
- **Schema & scripts**: MIT (see header in `LICENSE`).
