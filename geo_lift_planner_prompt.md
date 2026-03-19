# Claude Code Project Prompt: Slack Geo-Lift Test Planner

> **Project**: Web application for planning and designing geographic lift tests to measure incremental impact of Slack marketing interventions.
>
> **Stack**: React (single-page app), Tailwind CSS, client-side computation (no backend required). All statistical logic runs in-browser using JavaScript. Charts via Recharts or Chart.js. File parsing via PapaParse (CSV) or SheetJS (Excel).
>
> **Design mandate**: This app must look and feel like an official Slack internal tool. Use Slack's brand fonts (Lato), color palette (aubergine primary), and component patterns throughout. Every input, metric, and technical concept must have a plain-language tooltip — a marketer with no statistics background should be able to use this tool without external help. See the full "Visual Design: Slack Brand System" and "Tooltip & Help Text System" sections below; treat these as hard requirements, not suggestions.

---

## Visual Design: Slack Brand System

This app must look and feel like an internal Slack tool — not a generic dashboard. Follow Slack's design language precisely.

### Typography
- **Primary font**: `Lato` — Slack's brand font. **Must be loaded via Google Fonts in index.html**: `<link href="https://fonts.googleapis.com/css2?family=Lato:wght@400;700;900&display=swap" rel="stylesheet">`
- **Font stack**: `'Lato', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` — set this on `body` so it cascades everywhere
- **Monospace** (for data tables, stats, code-like values): `'SF Mono', 'Courier New', monospace`
- **Scale**: Use Slack's typographic rhythm:
  - Page titles: Lato Black (900), 28–32px
  - Section headers: Lato Bold (700), 20–24px
  - Body / labels: Lato Regular (400), 14–16px
  - Captions / helper text: Lato Regular (400), 12–13px, muted color
  - Tooltip text: Lato Regular (400), 13px
- **Letter-spacing**: Slack uses slightly tight tracking on headlines (-0.01em to -0.02em)
- **Line-height**: 1.5 for body text, 1.2 for headlines

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

**Inputs & sliders**:
- Text inputs: 1px `#DDDDDD` border, 4px border-radius, `#1D1C1D` text, focus border `#1264A3`
- Sliders: Track in `#DDDDDD`, filled portion in `#4A154B`, thumb in `#4A154B` with white border
- Dropdowns: Match text input styling

**Tables**: No heavy grid lines. Use bottom borders only (`#DDDDDD`), alternating row backgrounds (`#FFFFFF` / `#F8F8F8`). Header row: `#F8F8F8` background, Lato Bold 700, 12px uppercase text with `#868686` color and 0.05em letter-spacing.

**Navigation / stage stepper**: Horizontal stepper bar at the top. Active stage: `#4A154B` circle with white number, bold label. Completed stage: `#2BAC76` circle with checkmark. Future stage: `#DDDDDD` circle with gray number, muted label. Connecting lines between stages.

**Tooltips**: White background, 1px `#DDDDDD` border, 8px border-radius, subtle shadow, 13px Lato Regular body text, max-width 280px. Small `#4A154B` "?" icon trigger (circle with question mark, 18px). Tooltip appears on hover/click.

**Charts**: Use the Slack palette — primary data series in `#4A154B`, secondary in `#1264A3`, accent in `#2BAC76`. Grid lines in `#DDDDDD`. Axis labels in `#868686`. No chartjunk — clean, minimal, Slack-feeling.

**Status indicators**: Small colored dots or pill badges. Green dot + "Pass" for quality gates met. Red dot + "Fail" for gates missed. Yellow dot + "Warning" for borderline.

### Layout Principles
- Max content width: 1200px, centered
- Generous whitespace — Slack's UI breathes. Use 24–32px section padding, 16px between cards
- Left-aligned text throughout (Slack never center-aligns body content)
- The app should feel like it could live inside Slack's admin panel or analytics section

### App Header
- Full-width `#4A154B` header bar, 56px height
- Slack hashmark icon in white on the left (use an SVG of the 4-color Slack hash, or a simplified white `#` glyph as fallback)
- App title: "Geo-Lift Test Planner" in Lato Bold, white, 18px
- Subtitle or breadcrumb showing current stage, Lato Regular, `rgba(255,255,255,0.7)`, 13px

### Slack-Style Micro-Interactions
- **Transitions**: Use 150ms ease for hover states, 200ms for panel open/close. Slack feels snappy, not sluggish.
- **Loading states**: Use a pulsing `#4A154B` dot animation (3 dots, like Slack's typing indicator) for processing states (Monte Carlo running, power calculating).
- **Empty states**: When no data is uploaded yet, show a friendly illustration placeholder with Lato text like "Upload your historical data to get started" — don't leave sections blank.
- **Success moments**: When a quality gate passes or a strong design is found, use a brief green flash or checkmark animation. Keep it subtle — Slack doesn't do fireworks.
- **Error states**: Red left-border accent on the card, `#FDE8EF` background, `#E01E5A` icon. Never just red text on white — always use the container pattern.

### Favicon & Page Title
- Page title: "Geo-Lift Planner | Slack"
- Favicon: Use a simple purple square with white hash mark, or omit if complex

---

## Tooltip & Help Text System

**Every input, metric, visualization, and concept in the app must have an associated tooltip or inline help text.** The audience is marketing professionals who may not have statistics backgrounds. The goal is that a user can understand every element of the tool without leaving the app or asking for help.

### Tooltip Implementation Rules

1. **Input tooltips**: Every form input (sliders, dropdowns, text fields) must have a `?` icon next to its label. On hover or click, display a tooltip with:
   - **What it is**: One plain-language sentence defining the input
   - **Why it matters**: One sentence on how it affects the test design
   - **Example or default rationale**: Why the default value was chosen

2. **Metric tooltips**: Every statistical metric displayed (correlation, MDE, power, p-value, composite score, etc.) must have a `?` icon. Tooltips should explain:
   - **What this number means** in plain English
   - **What "good" looks like** (e.g., "A correlation above 0.90 means the control closely mirrors the test group's historical trends")
   - **What happens if it's bad** (e.g., "Low correlation means the control may not be a fair comparison, weakening your ability to isolate the campaign's effect")

3. **Chart tooltips**: Every chart should have a brief explanation either as a tooltip on the chart title or as a caption below it, explaining what the user should look for.

4. **Quality gate tooltips**: Each quality gate row should explain what the gate tests and what failing means in practical terms.

5. **Concept tooltips**: The first time a technical concept appears in the UI (e.g., "DMA," "MDE," "stratified matching," "Monte Carlo"), display it with a dotted underline and tooltip definition.

### Required Tooltip Content (include these verbatim or adapt to context)

**Stage 1 — Data Upload tooltips:**

| Element | Tooltip Text |
|---------|-------------|
| **Date Column** | "The column containing your daily dates. The tool uses these to build weekly time series and measure trend consistency. Accepted formats include YYYY-MM-DD, MM/DD/YYYY, and most standard date strings." |
| **Geographic Unit Column** | "The column identifying each market — typically DMA names (like 'Seattle-Tacoma') or metro area codes. Each unique value here becomes a testable market unit." |
| **Metric Column** | "The column with your daily KPI values (e.g., web visits, team creates). This is the number the test will try to measure lift on." |
| **KPI Type** | "Select which business metric you're testing. 'Organic + Direct Traffic' is higher-volume and easier to detect small lifts. 'Team Creates' is lower-volume and typically requires larger tests or bigger expected effects." |
| **Minimum Data Requirement (4 weeks)** | "DMAs with fewer than 4 weeks of data are dropped because there isn't enough history to establish a reliable baseline or estimate variance. 8+ weeks is recommended for meaningful results." |
| **Data Quality Warnings** | "These flags don't block you from proceeding — they highlight conditions that may reduce the reliability of your test design. You can still continue, but consider addressing the issues first." |

**Stage 2 — Scenario Planner tooltips:**

| Element | Tooltip Text |
|---------|-------------|
| **Test Budget** | "The total amount of incremental media spend you'll deploy in the test markets during the experiment. This is typically your hard constraint — the tool will optimize other inputs around it." |
| **Number of Test DMAs** | "How many metro areas will receive the campaign. More DMAs means more data points, which increases your ability to detect a real effect — but also increases cost and operational complexity." |
| **Test Duration** | "How many weeks the experiment will run. Longer tests collect more data and can detect smaller effects, but delay your results and cost more." |
| **Minimum Detectable Effect (MDE)** | "The smallest percentage lift you need the test to be able to detect. A 10% MDE means: if the campaign truly causes a 10% increase, this test design will catch it. Smaller MDEs require bigger, longer, or more expensive tests." |
| **Significance Level (α)** | "The probability of a false positive — concluding the campaign worked when it actually didn't. An α of 0.10 means a 10% false positive risk. Geo tests commonly use 0.10 because the limited number of markets makes stricter thresholds (like 0.05) very hard to achieve." |
| **Statistical Power** | "The probability of detecting a real effect when one exists. 80% power means: if the campaign truly works, there's an 80% chance this test will detect it and a 20% chance it'll miss it (false negative)." |
| **Control:Test Ratio** | "How many control DMAs to match per test DMA. A 2:1 ratio (2 controls per test market) provides more stable baselines but requires more markets. 1:1 is standard for most geo tests." |
| **Matching Method** | "How control DMAs are selected. 'Correlation-based' (default) prioritizes historical trend alignment. 'Euclidean distance' prioritizes matching absolute metric levels. Correlation-based is usually better for geo-lift tests." |
| **Per-DMA Weekly Spend** | "Your budget divided evenly across test DMAs and weeks. Use this to gut-check: is this enough spend per market to generate meaningful media impressions? If it's below $100/week, the campaign may not have enough exposure to move the needle." |
| **Power Gauge** | "This indicator shows whether your current test design is likely to detect a real campaign effect. Green (≥80%) = strong design. Yellow (60–79%) = moderate risk of missing a real effect. Red (<60%) = high risk of inconclusive results." |
| **MDE Sensitivity Curve** | "This chart shows the tradeoff between effect size and detectability. Read it as: 'For my current design, how big would the campaign effect need to be for the test to catch it?' The steeper the curve rises, the more sensitive your design is." |
| **Solve Mode** | "Lock the input you can't change (usually budget), and the tool will recommend optimal values for the others. Most teams start with 'I have a fixed budget' since media spend is typically the hardest constraint." |
| **Recommended Design Card** | "This is the tool's best recommendation given your constraints. It balances statistical rigor with practical feasibility. You can adjust inputs to explore alternatives before committing." |

**Stage 3 — Test Design Output tooltips:**

| Element | Tooltip Text |
|---------|-------------|
| **Pearson Correlation** | "Measures how closely the test and control groups' historical trends move together, from 0 (no relationship) to 1 (perfectly in sync). Above 0.90 is excellent. Below 0.85 means the groups may not be comparable enough for a clean read." |
| **Volume Similarity** | "How closely the total metric volume of the test and control groups match. A 5% difference is great; above 15% means one group is significantly larger, which can bias results." |
| **DOW Similarity** | "Whether the test and control groups have similar day-of-week patterns (e.g., both see Monday peaks and weekend dips). High similarity (>0.95) means the groups behave alike on a weekly cycle." |
| **Composite Score** | "A weighted blend of correlation (50%), volume similarity (20%), and day-of-week similarity (30%). This single number summarizes overall match quality. Above 0.90 is strong; below 0.85 needs attention." |
| **Traffic Tier** | "DMAs are grouped into 4 tiers based on metric volume (Tier 1 = smallest 25%, Tier 4 = largest 25%). Stratified matching ensures the control group has a similar mix of market sizes as the test group, preventing skew." |
| **Quality Gates** | "These are pass/fail checks that validate the test design. If any gate fails, the test can still run — but the results may be less reliable. The tool will suggest specific adjustments to fix failing gates." |
| **Pre-Period Time Series** | "These charts show how the test and control groups' metrics moved historically. You want the two lines to track each other closely — that's the 'parallel trends' assumption that makes the test valid. Big divergences mean the control may not be a fair comparison." |
| **Indexed Time Series** | "Both groups are rebased to 100 at Week 1, so you can compare relative trends regardless of absolute volume differences. If the lines stay close together, the groups have similar growth/decline patterns." |
| **Monte Carlo Matching** | "The tool tests 10,000 random combinations of control DMAs and picks the one that best mirrors the test group's historical patterns. This brute-force approach ensures you're not stuck with a mediocre match when a better one exists." |
| **DMA Map** | "Test markets (receiving the campaign) are shown in purple; control markets (no campaign) in gray. Tier is indicated by marker size. Look for geographic spread — you want test and control DMAs distributed across different regions to reduce spillover risk." |
| **Tier Distribution Chart** | "Compares how test and control groups are distributed across volume tiers. The bars should be roughly equal — if the control group is heavily skewed toward Tier 1 (small markets) while the test group has mostly Tier 4 (large markets), the match is poor." |
| **Test Start Date** | "When the campaign will begin running in test markets. The pre-period (your uploaded historical data) must end before this date. Leave a buffer of at least 1 week between your last data point and the start date." |
| **Export: Copy to Clipboard** | "Copies a markdown-formatted summary of the test design, ready to paste into a Slack Canvas or Google Doc for stakeholder review." |

**Concept tooltips (first-mention definitions):**

| Term | Tooltip Text |
|------|-------------|
| **DMA (Designated Market Area)** | "A geographic region defined by Nielsen, typically centered on a metro area. The US has 210 DMAs. They're the standard unit for TV and digital media planning, which is why geo-lift tests use them." |
| **Geo-Lift Test** | "A matched-market experiment: some markets get your campaign (test), others don't (control). After the test, the difference in performance between groups estimates the campaign's true incremental impact — filtering out organic trends and seasonality." |
| **Incremental Lift** | "The additional conversions, visits, or actions caused by your campaign — above and beyond what would have happened anyway. Geo-lift testing isolates this by comparing test markets (with campaign) to control markets (without)." |
| **Parallel Trends** | "The key assumption behind geo-lift tests: before the campaign starts, test and control markets should be trending in the same direction at a similar rate. If they are, any post-campaign divergence is likely caused by the campaign." |
| **Stratified Matching** | "A method for building a control group that mirrors the test group's composition. DMAs are sorted into tiers by size, and the control is selected to have the same proportion in each tier — preventing a mismatch like 'all big test markets vs. all small control markets.'" |
| **False Positive (Type I Error)** | "Concluding that the campaign worked when it actually didn't. The significance level (α) controls this risk. At α = 0.10, there's a 10% chance of a false positive." |
| **False Negative (Type II Error)** | "Missing a real campaign effect — concluding 'no impact' when the campaign actually worked. Statistical power controls this risk. At 80% power, there's a 20% chance of a false negative." |

### Tooltip Behavior
- **Desktop**: Show on hover with a 200ms delay (prevents flicker on mouse movement). Dismiss on mouse-out.
- **Click to pin**: Clicking the `?` icon pins the tooltip open until clicked again or clicked elsewhere. This lets users read longer tooltips without holding the mouse steady.
- **Positioning**: Auto-position to avoid overflow (prefer top or right, fall back to bottom or left near edges).
- **Consistent styling**: All tooltips use the same card style (white bg, `#DDDDDD` border, 8px radius, subtle shadow, 13px Lato Regular text, `#1D1C1D` text color, max-width 280px).

---

## Product Context

Slack (a Salesforce product) needs to measure the **causal, incremental impact** of marketing campaigns on key business metrics using geo-lift testing — a matched-market experiment where a set of DMAs (Designated Market Areas) receive paid media spend (treatment) while a matched control group does not. Post-test, the difference in metric performance between groups is attributed to the campaign.

**Important constraint**: Salesforce's data governance policy prohibits enhanced pixels, CAPI integrations, and PII sharing with ad platforms. Geo-lift testing is one of the few measurement approaches that works within these restrictions, making this tool strategically important.

### Supported KPIs
The user will select one KPI per test:
- **Organic + Direct Web Traffic** — daily site visits from organic search and direct channels, by DMA
- **Team Creates** — daily new Slack workspace/team creation events, by DMA

These KPIs have different statistical properties (traffic is high-frequency and relatively smooth; Team Creates is lower-volume and lumpier), and the tool must adapt its recommendations accordingly.

---

## Application Architecture: 3 Stages

The app flows through three sequential stages, each presented as a distinct view. The user progresses linearly but can navigate back to adjust inputs. Persist all state so nothing is lost on navigation.

---

### STAGE 1: Data Upload & Mapping

**Purpose**: Ingest historical metric data that will inform the test design. The tool needs enough pre-period data to establish stable baselines and estimate variance.

#### Data Requirements Guidance
Before upload, display a guidance panel explaining:
- **Recommended minimum**: 8 weeks of daily data (for stable weekly seasonality estimation)
- **Ideal**: 13–26 weeks (one to two full quarters captures monthly/seasonal patterns)
- **Maximum useful**: 52 weeks (beyond this, older data may reflect different market conditions)
- **Granularity**: Daily, by DMA (or equivalent geographic unit)
- **Required columns**: A date column, a geographic identifier column, and a metric/KPI column. Other columns are acceptable and will be ignored.

#### Upload Flow
1. Accept CSV, TSV, or XLSX files via drag-and-drop or file picker.
2. Parse the file and display the first 10 rows in a preview table.
3. **Auto-detect column mapping** using heuristics:
   - Date column: Look for columns with parseable date values, names like `date`, `time`, `day`, `period`
   - Geographic column: Look for columns with repeated categorical values, names like `dma`, `metro`, `market`, `region`, `geo`, `state`, `city`
   - Metric column: Look for numeric columns, names like `traffic`, `visits`, `sessions`, `creates`, `conversions`, `volume`, `count`
4. **Present the inferred mapping to the user for confirmation**, with dropdowns to override each:
   - "Date column" → [detected column, or select from list]
   - "Geographic unit column" → [detected column, or select from list]
   - "Metric column" → [detected column, or select from list]
5. Also ask the user to confirm the **KPI type** (Organic+Direct Traffic or Team Creates) — this affects downstream variance assumptions and power calculations.
6. **Validation checks** after mapping is confirmed:
   - Parse all dates; flag and report unparseable rows
   - Check for missing days per DMA (gaps in time series)
   - Drop any DMA with fewer than 28 days of data (4 weeks minimum)
   - Report: total DMAs, date range, total rows, any DMAs dropped and why
   - Show a summary: "Your data covers [X] DMAs over [Y] weeks ([start] to [end]). [Z] DMAs were dropped due to insufficient data."
7. Store the cleaned, mapped data in app state for Stage 2.

#### Data Quality Warnings
Flag (but don't block) if:
- Fewer than 8 weeks of data — "Results may be unreliable. 13+ weeks recommended."
- Fewer than 30 DMAs — "Small DMA pool limits matching quality."
- More than 10% of DMA-days are missing — "Significant gaps detected; consider filling or excluding affected DMAs."
- High coefficient of variation across DMAs (>200%) — "Extreme variance between DMAs detected; stratification will be critical."

---

### STAGE 2: Scenario Planner

**Purpose**: Help the user design a statistically sound test by manipulating key inputs and seeing how they affect test feasibility and power. The planner solves the "three-legged stool" problem: budget, DMAs, and duration are interdependent.

#### Core Inputs (Interactive Panel)

| Input | Type | Range/Constraints | Notes |
|-------|------|-------------------|-------|
| **Test Budget** | Currency input ($) | $0 – no cap, but flag if <$10K | Total incremental spend in test DMAs during the test period. This is often the hard constraint. |
| **Number of Test DMAs** | Slider + numeric input | 3 – 50 (or max available) | More DMAs = more statistical power, but higher cost and operational complexity. |
| **Test Duration (weeks)** | Slider + numeric input | 2 – 12 weeks | Longer = more power, but higher cost and delayed results. |
| **Minimum Detectable Effect (MDE)** | Slider (%) | 1% – 50% | "What's the smallest lift we need to be able to detect?" Default: 10% for traffic, 15% for Team Creates. |
| **Significance Level (α)** | Dropdown | 0.05, 0.10, 0.15, 0.20 | Default: 0.10 (standard for geo tests given limited sample sizes). |
| **Statistical Power (1-β)** | Dropdown | 0.70, 0.80, 0.90 | Default: 0.80. |

#### The Solver Logic

The tool should support three **solve modes** — the user locks two inputs and the tool solves for the third:

**Mode A: "I have a fixed budget"** (most common)
- User enters budget + MDE → Tool recommends optimal DMAs × Duration combination
- Logic: Given budget, estimate per-DMA weekly spend. Using the pre-period data variance, run power calculation to find the minimum DMAs × weeks that achieves the target power at the specified MDE and α.

**Mode B: "I have fixed DMAs"**
- User specifies which DMAs (or how many) + MDE → Tool recommends budget and duration
- Logic: Given DMA count, calculate required weeks to achieve power, then derive budget from per-DMA spend levels.

**Mode C: "I have a fixed timeline"**
- User enters duration + MDE → Tool recommends DMA count and budget
- Logic: Given weeks, calculate required DMAs for power, then estimate budget.

#### Power Calculation Approach

Use a **simulation-based power analysis** grounded in the uploaded data:

1. From the pre-period data, compute for each DMA:
   - Mean daily metric value
   - Standard deviation of daily metric value
   - Weekly aggregated mean and SD
2. For a candidate design (n test DMAs, n control DMAs, T weeks):
   - Estimate the pooled variance of the test-vs-control difference at the weekly level
   - Calculate the t-statistic threshold for the given α
   - Compute power: P(detecting a lift of MDE% | the true effect is MDE%) using a noncentral t-distribution
   - Alternatively, run 1,000 quick simulations: for each sim, add the MDE as a synthetic lift to test DMAs, run a difference-in-differences test, and record whether p < α. Power = proportion of significant results.
3. Return the power estimate and classify the design:
   - **Green**: Power ≥ 0.80 — "This design can reliably detect a [MDE]% lift."
   - **Yellow**: Power 0.60–0.79 — "This design has moderate ability to detect a [MDE]% lift. Consider increasing DMAs or duration."
   - **Red**: Power < 0.60 — "This design is underpowered. Significant risk of a false negative."

#### Scenario Planner UI

The layout should show:

**Left panel**: Input controls (the table above, as interactive form elements)

**Right panel**: Live-updating results dashboard showing:
- **Power gauge or indicator**: Green/Yellow/Red with the numeric power value
- **Estimated spend per DMA per week**: Budget ÷ (test DMAs × weeks)
- **Required control DMAs**: Matched to test count (typically 1:1 ratio, but show option for 2:1)
- **Total DMAs needed**: Test + Control
- **Feasibility check**: "You have [X] DMAs available. This design requires [Y]. ✅/⚠️"
- **MDE sensitivity chart**: A curve showing power (y-axis) vs. MDE (x-axis) for the current design, so the user can see "we can detect 15% with 80% power, but only 5% with 40% power"

#### Confidence Lever Sliders

Below the main inputs, provide an expandable "Advanced Settings" section with:
- α (significance level) slider: 0.05 ↔ 0.20
- Power target slider: 0.70 ↔ 0.90
- Control:Test ratio: 1:1 or 2:1
- Matching method: "Correlation-based" (default) or "Euclidean distance"

Show a tooltip explaining each in plain language, e.g., "α = 0.10 means we accept a 10% chance of seeing a false positive. Geo tests commonly use 0.10 because the limited number of markets makes 0.05 hard to achieve."

#### Recommendation Engine

After the user sets their constraints, display a **"Recommended Design"** card:
- "Based on your budget of $[X] and a target MDE of [Y]%, we recommend testing in [N] DMAs for [W] weeks. This gives [P]% power to detect the effect."
- If the design is underpowered at the desired MDE, show: "To achieve 80% power at [Y]% MDE, you would need to either: (a) increase budget to $[X2], (b) extend duration to [W2] weeks, or (c) increase MDE target to [Y2]%."

When the user is satisfied with the design, they click "Generate Test Design →" to proceed to Stage 3.

---

### STAGE 3: Test Design Output

**Purpose**: Produce the final test design document — DMA assignments, spend allocation, flight details, and a match quality report.

#### DMA Selection & Matching

Using the parameters from Stage 2 (number of test DMAs, duration, KPI), run the matching algorithm:

1. **Tier Assignment**: Assign all DMAs to 4 volume-based tiers (quartiles) using the pre-period metric data. Tier 1 = lowest 25% by total volume, Tier 4 = highest 25%.

2. **Test DMA Selection**: Use stratified random sampling to select the specified number of test DMAs, maintaining proportional representation across tiers. Optionally, let the user manually include/exclude specific DMAs (e.g., "Always include Seattle DMA" or "Exclude New York — we have other activity there").

3. **Monte Carlo Control Matching**: Run 10,000 simulations to find the best control group:
   - For each simulation, sample control DMAs from each tier matching the test group's tier distribution
   - Score each candidate control group on three criteria:

   | Criterion | Calculation | Weight |
   |-----------|------------|--------|
   | Trend Correlation | Pearson correlation of weekly metric time series (test aggregate vs. control aggregate) | 50% |
   | Volume Similarity | `1 - abs(test_total - control_total) / max(test_total, control_total)` | 20% |
   | Day-of-Week Pattern Similarity | Cosine similarity of 7-day distributions (Mon–Sun) | 30% |

   - Composite score = `0.50 × correlation + 0.20 × volume_similarity + 0.30 × dow_similarity`
   - **Hard filter**: Reject any control group with Pearson correlation < 0.85

4. Select the control group with the highest composite score.

5. **Quality Gates** — the match must pass ALL:

   | Metric | Minimum |
   |--------|---------|
   | Pearson correlation | ≥ 0.85 |
   | Volume difference | ≤ 15% |
   | DOW similarity | ≥ 0.90 |
   | Composite score | ≥ 0.85 |

   If any gate fails, display a warning with specific suggestions (e.g., "Try adding 2 more control DMAs" or "Relax the correlation threshold to 0.80").

#### Output Display

Render the following sections in the app:

**A. Design Summary Card**
- KPI being tested
- Test period: [start date] to [end date] (user can adjust start date; end = start + duration)
- Number of test DMAs / control DMAs
- Total budget and per-DMA weekly spend
- Target MDE, α, power

**B. DMA Assignment Table** (sortable, filterable)

| DMA | Group | Tier | Avg Weekly Metric | Weekly Spend (test only) |
|-----|-------|------|-------------------|--------------------------|
| Seattle | Test | 3 | 12,450 | $2,500 |
| Portland | Control | 3 | 11,200 | — |
| ... | ... | ... | ... | ... |

**C. Match Quality Report**
- Correlation, volume diff, DOW similarity, composite score — with green/yellow/red indicators
- Tier distribution comparison: side-by-side bar chart (test vs. control tier counts)

**D. Time Series Chart**
Two-panel chart:
- **Panel 1**: Raw weekly metric (test aggregate vs. control aggregate) over the pre-period
- **Panel 2**: Indexed to Week 1 = 100, showing relative trend alignment

**E. DMA Map**
Render a US map (use a simple SVG or topojson DMA boundary map) with:
- Test DMAs highlighted in one color (e.g., blue)
- Control DMAs in another (e.g., gray)
- Color intensity or marker size by tier

**F. Export Options**
- **Download CSV**: Full DMA assignment table with all columns
- **Download PDF/PNG**: One-page executive summary with the design summary, match quality, tier chart, and time series chart
- **Copy to Clipboard**: Plain-text summary formatted for pasting into Slack Canvas (markdown)

---

## Technical Implementation Notes

### File Structure
```
src/
  App.jsx              — Main app shell, stage navigation, global state
  stages/
    DataUpload.jsx     — Stage 1: upload, parse, map, validate
    ScenarioPlanner.jsx — Stage 2: inputs, solver, power analysis, recommendations
    TestDesign.jsx     — Stage 3: matching, outputs, exports
  lib/
    parser.js          — CSV/XLSX parsing and column detection heuristics
    stats.js           — Correlation, cosine similarity, power calculations, t-distribution
    matching.js        — Monte Carlo matching engine (runs in Web Worker for UI responsiveness)
    power.js           — Power analysis: noncentral t-distribution or simulation-based
    export.js          — CSV generation, clipboard formatting, PNG export (html2canvas)
  components/
    Tooltip.jsx        — Reusable tooltip component (hover + click-to-pin, auto-positioning, 200ms hover delay)
    ConceptTerm.jsx    — Wraps technical terms in a dotted-underline span with tooltip; tracks first-mention per session
    FileDropzone.jsx   — Drag-and-drop file upload
    ColumnMapper.jsx   — Column mapping confirmation UI with per-column tooltips
    PowerGauge.jsx     — Green/yellow/red power indicator with explanatory tooltip
    MDECurve.jsx       — MDE sensitivity chart with caption tooltip
    DMAMap.jsx         — US DMA map visualization with legend tooltip
    MatchQuality.jsx   — Quality gate indicators with per-gate tooltips
    TimeSeriesChart.jsx — Dual-panel pre-period chart with caption tooltip
    TierChart.jsx      — Tier distribution comparison bar chart with caption tooltip
  constants/
    tooltips.js        — All tooltip content strings (centralized, matches the tooltip table in the spec)
    slackTheme.js      — Slack color palette, font config, spacing tokens as JS constants
```

### Performance Considerations
- The Monte Carlo matching (10,000 iterations) should run in a **Web Worker** to avoid blocking the UI. Show a progress bar.
- Power analysis simulations (1,000 iterations) are lighter but should also be debounced — don't re-run on every slider tick, wait 300ms after the user stops adjusting.
- For large datasets (100+ DMAs, 52 weeks), pre-compute weekly aggregates once on data load and reuse them.

### Statistical Implementation Details

**Pearson Correlation**: Standard formula on weekly aggregated series. Require at least 8 weekly data points.

**Cosine Similarity**: Compute the 7-element DOW vector (total traffic per weekday across all weeks), normalize, and take the dot product.

**Power Calculation (simulation approach)**:
```
For i = 1 to 1000:
  1. Sample a synthetic pre-period: Use actual pre-period data
  2. Generate a synthetic test period of T weeks:
     - Control: extrapolate from pre-period mean + noise (sampled from pre-period residuals)
     - Test: same as control + (MDE% × control mean) as the synthetic treatment effect
  3. Run a two-sample t-test (or permutation test) on the test-period difference
  4. Record whether p < α
Power = count(significant) / 1000
```

**Spend Allocation**: Distribute budget evenly across test DMAs and weeks: `spend_per_dma_per_week = budget / (num_test_dmas × num_weeks)`. Display this prominently so the user can sanity-check it against known CPMs or media costs.

### UI/UX Principles
- **Slack-native feel**: This should look like it was built by Slack's internal tools team. Follow the Slack Brand System defined above exactly — Lato font, aubergine accents, clean card-based layouts, minimal borders, generous whitespace.
- **Tooltips everywhere**: Every input, metric, chart, and technical term must have a tooltip. See the Tooltip & Help Text System section for the full spec and required content. If an element doesn't have a tooltip, it's a bug.
- **Progressive disclosure**: Don't overwhelm. Stage 1 is simple upload. Stage 2 reveals complexity gradually (basic inputs up top, advanced settings collapsed). Stage 3 is rich but organized into tabs or cards.
- **Always explain the "why"**: Every recommendation should have a one-line rationale. Every quality gate should explain what happens if it's not met.
- **Assume the user is a marketer, not a statistician**: Use plain language with optional technical tooltips. Say "chance of detecting a real effect" not "statistical power of the noncentral t-distribution."
- **Visual hierarchy**: The most important outputs (power indicator, recommended design, match quality) should be the most visually prominent.
- **Responsive**: Should work on standard laptop screens (1440px). Mobile is not required.

---

## Edge Cases to Handle

1. **Fewer than 12 DMAs in the data**: Use all available DMAs for the test, warn that power will be limited, and skip stratification if fewer than 8 DMAs.
2. **KPI with many zero-days (Team Creates in small DMAs)**: Aggregate to weekly before analysis. If a DMA has >50% zero-weeks, exclude it and explain why.
3. **Perfect collinearity between test and control pools**: This is actually ideal — report it as a strong match.
4. **Budget too low for meaningful spend**: If per-DMA weekly spend is below $100, warn: "Budget may be too low to generate measurable media exposure in each DMA."
5. **All quality gates fail**: Don't block the user. Show the best available match with clear warnings and let them proceed or adjust.
6. **User wants to manually pick DMAs**: Support this in Stage 3 — let them override the random selection, then re-run only the control matching.
