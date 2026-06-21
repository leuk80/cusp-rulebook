<!-- Thanks for improving the rulebook! Keep changes data-only — no app logic lives here. -->

## What changed
<!-- e.g. "Update Accor ALL Diamond threshold for 2026" or "Add Turkish Miles&Smiles" -->

## Source
<!-- Link the official program page(s) the numbers come from, and the date you checked. -->
- Source:
- Checked on (YYYY-MM-DD):

## Checklist
- [ ] `npm run validate` passes locally (schema is green).
- [ ] Used stable kebab-case ids; reused existing metric/tier ids where possible.
- [ ] Every `metricId` / `tierId` I reference exists in the program file.
- [ ] Filenames follow the convention (`<id>.json`, `<id>.earning.json`, `<id>.milestones.json`).
- [ ] Money/points are net of tax where the program earns "excluding taxes".
- [ ] I did **not** hardcode display names that should be localized (see field reference).
