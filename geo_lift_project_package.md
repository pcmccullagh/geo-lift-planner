# Slack Geo-Lift Test Planner — Project Package

## What is this?

A web app for planning and designing geographic lift tests to measure incremental impact of Slack marketing campaigns. Built as a React app with Slack's brand design system.

**Current status**: Stage 1 (Data Upload & Mapping) and Stage 2 (Scenario Planner) are fully functional as a Claude artifact. Stage 3 (Monte Carlo matching and DMA assignments) is stubbed out.

---

## Quick Start: View the Working Prototype

The fastest way to see the app is to paste the artifact code into Claude:

1. Go to [claude.ai](https://claude.ai)
2. Start a new conversation
3. Paste this message:

```
Build me a React artifact using the code below. Don't modify anything, just render it exactly as-is.
```

4. Then paste the entire contents of `geo_lift_planner.jsx` (included at the bottom of this file)
5. Claude will render the interactive app in the artifact panel

---

## Build as a Standalone Project with Claude Code

To turn this into a full deployable web app:

### Prerequisites
- Node.js 18+
- Claude Code CLI (`npm install -g @anthropic-ai/claude-code`)
- Authenticated via `claude login`

### Steps

1. Create the project directory:
```bash
mkdir geo-lift-planner && cd geo-lift-planner
```

2. Save the spec file (the entire "PROJECT SPEC" section below) as `geo_lift_planner_prompt.md` in the project root.

3. Launch Claude Code:
```bash
claude
```

4. Paste this prompt:
```
Read the spec in ./geo_lift_planner_prompt.md. This is a comprehensive specification for a React web app.

Start by:
1. Initializing a Vite + React + Tailwind project in this directory
2. Installing dependencies: papaparse, recharts, lucide-react
3. Setting up the Slack design system (Lato font, color tokens, base component styles)
4. Building the app shell with the 3-stage navigation stepper
5. Implementing Stage 1 (Data Upload & Mapping) first

Don't build all 3 stages at once — stop after Stage 1 is functional so I can test it.
```

5. Test with `npm run dev` in a separate terminal after each stage.

### Deploy to GitHub Pages
```bash
npm run build
npm install -D gh-pages
npx gh-pages -d dist
```

---

## How the App Works

### Stage 1: Data Upload & Mapping
- Drag-and-drop CSV/TSV upload
- Auto-detects date, geography, and metric columns
- User confirms mapping + selects KPI (Organic+Direct Traffic or Team Creates)
- Validates data: checks date range, DMA count, missing days, variance

### Stage 2: Scenario Planner
- **Recommend mode** (default): Finds optimal DMAs × duration × budget to hit 80% power
- **Constraint modes**: Lock budget, DMAs, or timeline and solve for the others
- **2-cell or 3-cell test design**: Standard (treatment vs control) or dose-response (low spend + high spend vs control)
- Live power estimate, MDE sensitivity curve, spend-per-DMA calculations
- Advanced settings: significance level, power target, control:test ratio

### Stage 3: Test Design Output (in progress)
- Monte Carlo matching (10,000 simulations) to find optimal control group
- DMA assignment table, match quality report, time series charts
- Export to CSV, PNG, and Slack Canvas markdown

---

## Files in This Package

1. **This file** (`geo_lift_project_package.md`) — setup instructions and context
2. **Project spec** — included below as "PROJECT SPEC" section
3. **Artifact code** — included below as "ARTIFACT CODE" section

---

# ═══════════════════════════════════════════════════════════════════
# PROJECT SPEC
# Save everything between the START and END markers below as:
# geo_lift_planner_prompt.md
# ═══════════════════════════════════════════════════════════════════

--- START SPEC ---

# Claude Code Project Prompt: Slack Geo-Lift Test Planner

> **Project**: Web application for planning and designing geographic lift tests to measure incremental impact of Slack marketing interventions.
>
> **Stack**: React (single-page app), Tailwind CSS, client-side computation (no backend required). All statistical logic runs in-browser using JavaScript. Charts via Recharts or Chart.js. File parsing via PapaParse (CSV) or SheetJS (Excel).

---

## Visual Design: Slack Brand System

This app must look and feel like an internal Slack tool — not a generic dashboard. Follow Slack's design language precisely.

### Typography
- **Primary font**: `Lato` — Slack's brand font. Load from Google Fonts: `Lato:wght@400;700;900`
- **Monospace** (for data tables, stats, code-like values): `Courier New` or `monospace` system stack
- **Scale**: Use Slack's typographic rhythm:
  - Page titles: Lato Black (900), 28–32px
  - Section headers: Lato Bold (700), 20–24px
  - Body / labels: Lato Regular (400), 14–16px
  - Captions / helper text: Lato Regular (400), 12–13px, muted color
- **Letter-spacing**: Slack uses slightly tight tracking on headlines (-0.01em to -0.02em)

### Color Palette
Use Slack's actual brand colors, not approximations:

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Aubergine (primary) | Dark purple | `#4A154B` | Primary headers, nav background, primary buttons |
| Aubergine dark | Deeper purple | `#3C1042` | Hover states on aubergine elements, sidebar active states |
| White | — | `#FFFFFF` | Page backgrounds, card backgrounds, button text on primary |
| Off-white | Light gray | `#F8F8F8` | Page body background, alternating table rows |
| Light gray | — | `#DDDDDD` | Borders, dividers, input field borders |
| Medium gray | — | `#868686` | Secondary text, placeholder text, muted labels |
| Dark gray | — | `#1D1C1D` | Primary body text, table text |
| Blue (link/accent) | — | `#1264A3` | Links, interactive text, info states |
| Green (success) | — | `#2BAC76` | Success states, passing quality gates, "powered" indicator |
| Yellow (warning) | — | `#ECB22E` | Warning states, moderate quality gates |
| Red (error/danger) | — | `#E01E5A` | Error states, failing quality gates, underpowered indicator |
| Light blue bg | — | `#E8F5FA` | Info callout backgrounds, tooltip backgrounds |
| Light green bg | — | `#E8F8F0` | Success callout backgrounds |
| Light yellow bg | — | `#FDF4E3` | Warning callout backgrounds |
| Light red bg | — | `#FDE8EF` | Error callout backgrounds |

### Component Styling

**Cards & containers**: White background, 1px `#DDDDDD` border, 8px border-radius, subtle shadow (`0 1px 3px rgba(0,0,0,0.08)`). No heavy drop shadows.

**Buttons**:
- Primary: `#4A154B` background, white text, 4px border-radius, 700 weight, slight hover darkening to `#3C1042`
- Secondary: White background, 1px `#DDDDDD` border, `#1D1C1D` text, hover background `#F8F8F8`
- Danger: `#E01E5A` background, white text

**Tables**: No heavy grid lines. Use bottom borders only (`#DDDDDD`), alternating row backgrounds (`#FFFFFF` / `#F8F8F8`). Header row: `#F8F8F8` background, Lato Bold 700, 12px uppercase text with `#868686` color and 0.05em letter-spacing.

**Navigation / stage stepper**: Horizontal stepper bar at the top. Active stage: `#4A154B` circle with white number, bold label. Completed stage: `#2BAC76` circle with checkmark. Future stage: `#DDDDDD` circle with gray number, muted label.

**Tooltips**: White background, 1px `#DDDDDD` border, 8px border-radius, subtle shadow, 13px Lato Regular body text, max-width 280px. Small `#4A154B` "?" icon trigger. Tooltip appears on hover/click.

**Charts**: Primary data series in `#4A154B`, secondary in `#1264A3`, accent in `#2BAC76`. Grid lines in `#DDDDDD`. Axis labels in `#868686`.

### Layout Principles
- Max content width: 1200px, centered
- Generous whitespace — 24–32px section padding, 16px between cards
- Left-aligned text throughout

### App Header
- Full-width `#4A154B` header bar
- App title: "Geo-Lift Test Planner" in Lato Bold, white, 18px

---

## Tooltip & Help Text System

**Every input, metric, visualization, and concept in the app must have an associated tooltip.** The audience is marketing professionals who may not have statistics backgrounds.

### Required Tooltip Content

| Element | Tooltip Text |
|---------|-------------|
| **Test Budget** | "The total amount of incremental media spend you'll deploy in the test markets during the experiment. This is typically your hard constraint." |
| **Number of Test DMAs** | "How many metro areas will receive the campaign. More DMAs = more statistical power, but higher cost and complexity." |
| **Test Duration** | "How many weeks the experiment will run. Longer tests detect smaller effects but delay results and cost more." |
| **MDE** | "The smallest percentage lift you need the test to detect. A 10% MDE means: if the campaign truly causes a 10% increase, this test will catch it." |
| **Significance Level (α)** | "The probability of a false positive. An α of 0.10 means 10% false positive risk. Geo tests commonly use 0.10." |
| **Statistical Power** | "The probability of detecting a real effect. 80% power = 80% chance of catching a real campaign effect." |
| **Pearson Correlation** | "How closely test and control trends move together. Above 0.90 is excellent. Below 0.85 is concerning." |
| **Composite Score** | "Weighted blend of correlation (50%), volume similarity (20%), and DOW similarity (30%). Above 0.90 is strong." |
| **Traffic Tier** | "DMAs grouped into 4 quartiles by volume. Stratified matching prevents control group size skew." |
| **DMA** | "A geographic region defined by Nielsen, centered on a metro area. The US has 210 DMAs." |
| **Geo-Lift Test** | "A matched-market experiment: some markets get your campaign (test), others don't (control). The difference estimates causal impact." |
| **3-Cell Test** | "A dose-response design with Control, Low Spend, and High Spend groups to measure diminishing returns." |

---

## Product Context

Slack (a Salesforce product) needs to measure the **causal, incremental impact** of marketing campaigns using geo-lift testing. Salesforce's data governance policy prohibits enhanced pixels, CAPI integrations, and PII sharing with ad platforms, making geo-lift testing strategically important.

### Supported KPIs
- **Organic + Direct Web Traffic** — daily site visits by DMA
- **Team Creates** — daily new Slack workspace creation events by DMA

---

## Application Architecture: 3 Stages

### STAGE 1: Data Upload & Mapping

- Accept CSV, TSV, or XLSX files
- Auto-detect column mapping (date, geography, metric)
- Present mapping for user confirmation with dropdowns to override
- KPI type selector
- Validation: parse dates, check DMA count, drop DMAs with <28 days, report warnings
- Data quality warnings for <8 weeks, <30 DMAs, >10% missing days, high CV

### STAGE 2: Scenario Planner

**Planning Modes:**
- **Recommend** (default): Finds optimal DMAs × duration × budget for 80% power
- **Fixed budget / Fixed DMAs / Fixed timeline**: Lock one input, optimize the rest

**Test Design Types:**
- **2-Cell (Standard)**: Treatment vs Control
- **3-Cell (Dose-Response)**: Low Spend + High Spend vs Control, with configurable spend multiplier (1.5x–4x)

**Core Inputs**: Budget, Test DMAs, Duration, MDE, Significance Level, Power Target, Control:Test Ratio

**Power Calculation**: Analytical approximation using noncentral t-distribution, with MDE sensitivity curve

### STAGE 3: Test Design Output

**DMA Selection & Matching:**
1. Tier Assignment (4 quartiles by volume)
2. Stratified random sampling for test DMAs
3. Monte Carlo Control Matching (10,000 simulations):
   - Trend Correlation (50% weight)
   - Volume Similarity (20% weight)
   - DOW Pattern Similarity (30% weight)
   - Hard filter: Pearson correlation ≥ 0.85

**Quality Gates**: Correlation ≥ 0.85, Volume diff ≤ 15%, DOW similarity ≥ 0.90, Composite ≥ 0.85

**Outputs**: Design summary, DMA assignment table, match quality report, time series charts, DMA map, export (CSV, PNG, Slack Canvas markdown)

---

## Technical Notes

- Monte Carlo matching should run in a Web Worker
- Power simulations debounced (300ms)
- Pre-compute weekly aggregates on data load
- All statistical logic runs client-side in JavaScript

### File Structure
```
src/
  App.jsx
  stages/
    DataUpload.jsx
    ScenarioPlanner.jsx
    TestDesign.jsx
  lib/
    parser.js
    stats.js
    matching.js
    power.js
    export.js
  components/
    Tooltip.jsx
    FileDropzone.jsx
    ColumnMapper.jsx
    PowerGauge.jsx
    MDECurve.jsx
    DMAMap.jsx
    MatchQuality.jsx
    TimeSeriesChart.jsx
    TierChart.jsx
  constants/
    tooltips.js
    slackTheme.js
```

---

## Edge Cases

1. Fewer than 12 DMAs: use all, warn about limited power
2. Many zero-days (Team Creates): aggregate to weekly, exclude DMAs with >50% zero-weeks
3. Budget too low: warn if per-DMA weekly spend <$100
4. All quality gates fail: show best match with warnings, don't block
5. Manual DMA selection: support override, re-run control matching only

--- END SPEC ---


# ═══════════════════════════════════════════════════════════════════
# ARTIFACT CODE
# To view the working prototype, paste the code below into Claude.ai
# with the instruction: "Build me a React artifact using this code"
# ═══════════════════════════════════════════════════════════════════

--- START ARTIFACT CODE ---

(See the geo_lift_planner.jsx file — download it from the Claude conversation
and include it alongside this document when sharing.)

--- END ARTIFACT CODE ---
