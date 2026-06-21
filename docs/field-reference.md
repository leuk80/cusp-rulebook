# Field reference

Every field of every rulebook file type, and the modelling quirks behind them. The schemas
in `../schema/` are the authoritative contract; this explains the *why*. Field names mirror
the Cusp engine's value types one-to-one.

---

## Program — `<id>.json`

| Field                | Req | Notes |
|----------------------|-----|-------|
| `id`                 | ✓   | Stable kebab-case identifier; must equal the filename. |
| `name`               | ✓   | Proper-noun program name (developer fallback; UI is localized). |
| `type`               | ✓   | `airline` \| `hotel` \| `alliance` \| `rail` \| `car`. |
| `redeemableCurrency` | ✓   | Name of the spendable currency (miles/points). **Not** a status metric. |
| `alliance`           |     | `star` \| `oneworld` \| `skyteam`, if the program belongs to one. |
| `metrics`            | ✓   | The things that accrue toward status (see Metric). |
| `tiers`              | ✓   | The status levels and their thresholds (see Tier). |
| `lifetimeMetrics`    |     | Lifetime-only metrics not earned from bookings (e.g. `eliteYears`). |
| `lifetimeTiers`      |     | Cumulative, never-resetting tiers (e.g. Lifetime Platinum). |

### Metric

| Field          | Req | Notes |
|----------------|-----|-------|
| `id`           | ✓   | Referenced by thresholds, earning rules, links, milestones. |
| `name`, `unit` | ✓   | Developer fallback; the app shows localized `metric.<id>`. |
| `periodType`   | ✓   | `calendarYear` \| `rolling12` \| `membershipYear` \| `anchoredReset`. |
| `anchorDate`   |     | ISO-8601 date-time; only month/day matter (for `membershipYear`). |
| `purchasedCap` |     | Yearly ceiling on **non-organic** contributions (bought/partner/promo). Organic stays/flights are never capped. |

**Period types.** `calendarYear` resets Jan 1. `rolling12` is a trailing window ending "now".
`membershipYear` is anchored to the member's anniversary. `anchoredReset` is a fixed 12-month
window starting at the first eligible activity, resetting when it lapses (Radisson model).

### Tier — flat *or* grouped (exactly one form)

| Field            | Req | Notes |
|------------------|-----|-------|
| `id`             | ✓   | Unique within the program. |
| `name`           | ✓   | Proper noun (Senator, Diamond…); not translated. |
| `rank`           | ✓   | Integer; higher = better. Unique within `tiers`. |
| `allianceStatus` |     | The alliance status this tier confers (e.g. `gold`). |
| `mode`           |     | `anyOf` (one threshold suffices) \| `allOf` (all required). Flat form. |
| `thresholds`     | *   | `[{ metricId, value }]`. **Flat form** — use with `mode`. |
| `groups`         | *   | `[{ anyOf: [{ metricId, value }] }]`. **Grouped form** (CNF). |

A tier uses **either** `mode`+`thresholds` **or** `groups` — never both.

- **Flat `anyOf`** — Accor Silver: `2000 sp` OR `10 nights`.
- **Flat `allOf`** — Miles & More Senator: `2000 points` AND `1000 qp` (two metrics at once).
- **Grouped (CNF, "AND of ORs")** — Hilton Diamond Reserve: `(80 nights OR 40 stays) AND 18000 spend`.
  Each group is an `anyOf`; all groups must hold.

> Quirks: Accor **Diamond** is Status-Points-only (no nights threshold). Miles & More needs
> two metrics together for FT/Senator (`allOf`), while HON Circle runs off its own metric
> (`anyOf`). Marriott **Ambassador** is `allOf` (100 nights AND spend).

---

## Earning rule — `<id>.earning.json`

`programId` (req) must equal `<id>`. Then any of `flight`, `hotel`, `purchase`. Every
`*MetricId` must be one of the program's `metrics`.

### `flight`
| Field                  | Req | Notes |
|------------------------|-----|-------|
| `pointsMetricId`       | ✓   | Primary per-segment metric, always credited. |
| `qpMetricId`           |     | Qualifying-points metric, gated by `qpIntegratedAirlines`. |
| `honMetricId`          |     | HON-style metric, gated by `honCabins`. |
| `pointMatrix`          | ✓   | `pointMatrix[haul][cabin]` = base per segment. Hauls: `continental`, `intercontinental`. Cabins: `economy`, `premiumEconomy`, `business`, `first`. |
| `qpIntegratedAirlines` |     | Operating airlines (IATA) that earn the qualifying/HON metric. |
| `honCabins`            |     | Cabins that earn the HON metric. |

### `hotel`
| Field             | Req | Notes |
|-------------------|-----|-------|
| `pointsMetricId`  |     | Status-points metric, if any (omit for nights-only programs). |
| `nightsMetricId`  |     | Nights metric, if counted. |
| `staysMetricId`   |     | Stays metric (1 per stay regardless of nights). |
| `pointsPerEuro`   |     | Points per **eligible** euro — net of tax **and** service charge. |
| `roundPointsDown` |     | Floor vs nearest. Default `true`. |

### `purchase`
| Field             | Req | Notes |
|-------------------|-----|-------|
| `pointsMetricId`  | ✓   | Destination metric. |
| `pointsPerEuro`   | ✓   | Points per spend unit. |
| `convertToEUR`    |     | Default `true`. Set `false` for currency-denominated points (e.g. BA Tier Points: 1 TP per £). |
| `roundPointsDown` |     | Floor vs nearest. Default `true`. |

> Hotel points are earned on the **pre-tax, pre-service room rate** (Accor's *prix HT*; the
> same holds for the other hotel programs). Before applying `pointsPerEuro` the engine nets
> the gross down: an explicit broken-out tax amount wins, otherwise it removes the country
> VAT (`vat-rates.json`) **and** the country service charge (`service-rates.json`), i.e.
> `eligible = gross / (1 + service) / (1 + vat)`. Both are global, country-keyed tables — the
> deduction is **not** a per-program field.

---

## Milestones — `<id>.milestones.json`

`programId` (req) + `milestones[]`. A milestone is an *unlock event* at thresholds
above/alongside status (Extra Benefits, Suite Night Upgrades, Milestone Rewards).

| Field             | Req | Notes |
|-------------------|-----|-------|
| `id`              | ✓   | Unique within the set. |
| `metricId`        | ✓   | Which metric standing drives it. |
| `trigger`         | ✓   | `{type:"thresholds", values:[…]}` or `{type:"interval", start, step, end}`. |
| `requiredTierId`  |     | Only active while this exact tier is held. |
| `eligibleSources` |     | Restrict counting to certain earning sources. |
| `choose`          | ✓   | `true` = pick 1 of `options`; `false` = all auto-granted. |
| `options`         | ✓   | Rewards (see below). |

**Reward option:** `id`, `labelKey` (localized), optional `giftable`, `grantsKind`
(`suiteNightUpgrade` \| `freeNightCertificate` \| `upgradeVoucher` \| `loungePass` \| `other`),
`grantsQuantity`.

---

## Program links — `*.links.json`

Root is an **array** of directed cross-program links.

| Field            | Req | Notes |
|------------------|-----|-------|
| `id`             | ✓   | Unique link id. |
| `fromProgramId`  | ✓   | Source program. |
| `toProgramId`    | ✓   | Destination program. |
| `type`           | ✓   | `pointConversion` \| `eliteNightCredit` \| `statusBenefit`. |
| `toMetricId`     | ✓   | Destination metric (`""` for `statusBenefit`). |
| `source`         | ✓   | Provenance stamped on the contribution (usually `partner` / `statusMatch`). |
| `pointsPerStay`  |     | Credit per qualifying stay. |
| `minNights`      |     | Minimum nights to qualify. |
| `perNights`      |     | Credit per N-night block instead of flat per stay. |
| `perNight`       |     | `eliteNightCredit`: nights per stay-night (default 1). |
| `requiresPaidStay` |   | Default `true`. |
| `requiresTierIds`|     | `statusBenefit`: source tiers that grant the benefit. |
| `grantsTierId`   |     | `statusBenefit`: destination tier the match grants (display-only). |

> A yearly cap on credited amounts is **not** set here — it lives on the destination metric's
> `purchasedCap`, so it composes with all other non-organic earnings. Example: Marriott → Miles
> & More awards 40 points per paid stay, capped at 120/yr via `points.purchasedCap`.

---

## VAT rates — `vat-rates.json`

A flat object mapping ISO 3166-1 alpha-2 country code → lodging VAT rate (`0`–`1`). Used to
estimate net eligible spend when a hotel bill doesn't break out the tax.

## Service-charge rates — `service-rates.json`

A flat object mapping ISO 3166-1 alpha-2 country code → lodging **service-charge** ("++")
rate (`0`–`1`), e.g. `{ "TH": 0.10 }`. Removed on top of VAT for programs that earn only on
the pure room rate (`eligible = gross / (1 + service) / (1 + vat)`). Applied only when the
bill has no broken-out tax amount; an explicit tax amount always wins. Heuristic — not every
rate carries a service charge — so include a country **only** where it's standard/mandatory
for hotels; otherwise leave it out and rely on the per-booking tax override.
