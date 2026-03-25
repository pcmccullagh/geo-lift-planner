import { useState, useRef, useCallback, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  BarChart, Bar, Cell,
} from "recharts";

// ─── Slack Design Tokens ─────────────────────────────────────────────
const COLORS = {
  aubergine: "#4A154B",
  aubergineDark: "#3C1042",
  white: "#FFFFFF",
  offWhite: "#F8F8F8",
  lightGray: "#DDDDDD",
  mediumGray: "#868686",
  darkGray: "#1D1C1D",
  blue: "#1264A3",
  green: "#2BAC76",
  yellow: "#ECB22E",
  red: "#E01E5A",
  lightBlueBg: "#E8F5FA",
  lightGreenBg: "#E8F8F0",
  lightYellowBg: "#FDF4E3",
  lightRedBg: "#FDE8EF",
};

// ─── Tooltip Content ─────────────────────────────────────────────────
const TOOLTIPS = {
  geoLiftTest: "A matched-market experiment: some markets get your campaign (test), others don't (control). After the test, the difference in performance between groups estimates the campaign's true incremental impact — filtering out organic trends and seasonality.",
  dma: "A geographic region defined by Nielsen, typically centered on a metro area. The US has 210 DMAs. They're the standard unit for TV and digital media planning, which is why geo-lift tests use them.",
  kpiType: "The metric you want to measure lift on. Organic + Direct Traffic is higher-frequency and smoother; Team Creates is lower-volume and lumpier, which affects how many DMAs and weeks you'll need.",
  dateColumn: "The column containing daily dates. The tool needs at least 4 weeks of daily data to establish baseline patterns, with 13–26 weeks being ideal.",
  geoColumn: "The column identifying each geographic market (DMA, metro area, state, etc.). Each unique value becomes one market unit in your test design.",
  metricColumn: "The column containing the daily metric values you want to measure lift on — typically traffic counts or team creation events.",
  dataMinimum: "8 weeks of daily data is the minimum for stable seasonality estimation. 13–26 weeks (one to two quarters) is ideal. Beyond 52 weeks, older data may reflect different market conditions.",
  solveMode: "Choose how you want to plan your test. 'Recommend' finds the optimal balance of budget, DMAs, and duration to hit 80% power at your target MDE — start here and adjust. Or lock one input (budget, DMAs, or timeline) if you already have a hard constraint, and the tool will optimize around it.",
  testBudget: "The total amount of incremental media spend you'll deploy in the test markets during the experiment. This is typically your hard constraint — the tool will optimize other inputs around it.",
  numDMAs: "How many metro areas will receive the campaign. More DMAs means more data points, which increases your ability to detect a real effect — but also increases cost and operational complexity.",
  testDuration: "How many weeks the experiment will run. Longer tests collect more data and can detect smaller effects, but delay your results and cost more.",
  mde: "The smallest percentage lift you need the test to be able to detect. A 10% MDE means: if the campaign truly causes a 10% increase, this test design will catch it. Smaller MDEs require bigger, longer, or more expensive tests.",
  alpha: "The probability of a false positive — concluding the campaign worked when it actually didn't. An α of 0.10 means a 10% false positive risk. Geo tests commonly use 0.10 because the limited number of markets makes stricter thresholds (like 0.05) very hard to achieve.",
  power: "The probability of detecting a real effect when one exists. 80% power means: if the campaign truly works, there's an 80% chance this test will detect it and a 20% chance it'll miss it (false negative).",
  controlTestRatio: "How many control DMAs to match per test DMA. A 2:1 ratio (2 controls per test market) provides more stable baselines but requires more markets. 1:1 is standard for most geo tests.",
  correlation: "Measures how closely the test and control groups' historical trends move together, from 0 (no relationship) to 1 (perfectly in sync). Above 0.90 is excellent. Below 0.85 means the groups may not be comparable enough for a clean read.",
  volumeSimilarity: "How closely the total metric volume of the test and control groups match. A 5% difference is great; above 15% means one group is significantly larger, which can bias results.",
  dowSimilarity: "Whether the test and control groups have similar day-of-week patterns (e.g., both see Monday peaks and weekend dips). High similarity (>0.95) means the groups behave alike on a weekly cycle.",
  compositeScore: "A weighted blend of correlation (50%), volume similarity (20%), and day-of-week similarity (30%). This single number summarizes overall match quality. Above 0.90 is strong; below 0.85 needs attention.",
  tier: "DMAs are grouped into 4 tiers based on metric volume (Tier 1 = smallest 25%, Tier 4 = largest 25%). Stratified matching ensures the control group has a similar mix of market sizes as the test group, preventing skew.",
  powerGauge: "This indicator shows whether your current test design is likely to detect a real campaign effect. Green (≥80%) = strong design. Yellow (60–79%) = moderate risk of missing a real effect. Red (<60%) = high risk of inconclusive results.",
  mdeCurve: "This chart shows the tradeoff between effect size and detectability. Read it as: 'For my current design, how big would the campaign effect need to be for the test to catch it?' The steeper the curve rises, the more sensitive your design is.",
  testDesignType: "A 2-cell test (standard) has one treatment group and one control group — it measures whether the campaign works. A 3-cell test (dose-response) adds a second treatment group at a different spend level, letting you measure whether more spend produces proportionally more lift or hits diminishing returns.",
  threeCellLow: "The 'low spend' treatment cell receives your base spend level. This is the baseline treatment you're testing against the control.",
  threeCellHigh: "The 'high spend' treatment cell receives a multiple of the low spend level (e.g., 2x or 3x). Comparing lift in the high cell vs. the low cell reveals whether incremental spend produces proportional returns.",
  spendMultiplier: "How much more the high-spend cell receives compared to the low-spend cell. A 2x multiplier means if low-spend DMAs get $1,000/week, high-spend DMAs get $2,000/week. Higher multipliers make the dose-response effect easier to detect but cost more.",
  diminishingReturns: "Diminishing returns means each additional dollar of spend produces less incremental lift than the last. If the high-spend cell (2x budget) only produces 1.3x the lift of the low-spend cell, you're seeing diminishing returns — and may want to spread budget across more markets instead of concentrating it.",
  spendEfficiency: "An optional prior belief about how much lift a given spend level will generate. Enter a reference spend ($/DMA/week) and the lift % you'd expect at that level. The tool scales linearly to your current spend and marks the expected lift on the MDE curve — letting you see whether your budget is likely to generate a detectable effect, not just a measurable one.",
  monteCarlo: "The tool tests 10,000 random combinations of control DMAs and picks the one that best mirrors the test group's historical patterns. This brute-force approach ensures you're not stuck with a mediocre match when a better one exists.",
  preTimeSeries: "These charts show how the test and control groups' metrics moved historically. You want the two lines to track each other closely — that's the 'parallel trends' assumption that makes the test valid.",
  indexedTimeSeries: "Both groups are rebased to 100 at Week 1, so you can compare relative trends regardless of absolute volume differences. If the lines stay close together, the groups have similar growth/decline patterns.",
};

// ─── CSV Parser (lightweight, handles quoted fields) ──────────────────
function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };

  function splitLine(line) {
    const result = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else if (ch === "\t" && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  }

  const headers = splitLine(lines[0]);
  const rows = lines.slice(1).map((line) => {
    const vals = splitLine(line);
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = vals[i] || "";
    });
    return obj;
  });
  return { headers, rows };
}

// ─── Column Detection Heuristics ─────────────────────────────────────
function detectColumns(headers, rows) {
  const sample = rows.slice(0, 50);
  const datePatterns = /date|time|day|period|week|month/i;
  const geoPatterns = /dma|metro|market|region|geo|state|city|area|subdivision|location|concatenation/i;
  const metricPatterns = /traffic|visits|sessions|creates|conversions|volume|count|metric|value|total/i;

  let dateCol = null, geoCol = null, metricCol = null;

  // Score each column
  for (const h of headers) {
    // Date detection
    if (!dateCol && datePatterns.test(h)) {
      const parsed = sample.filter((r) => !isNaN(Date.parse(r[h]))).length;
      if (parsed > sample.length * 0.5) dateCol = h;
    }
    // Geo detection
    if (!geoCol && geoPatterns.test(h)) {
      const unique = new Set(sample.map((r) => r[h])).size;
      if (unique > 1 && unique < sample.length * 0.8) geoCol = h;
    }
    // Metric detection
    if (!metricCol && metricPatterns.test(h)) {
      const numeric = sample.filter((r) => !isNaN(parseFloat(r[h]))).length;
      if (numeric > sample.length * 0.5) metricCol = h;
    }
  }

  // Fallback: try parsing values if name heuristics missed
  if (!dateCol) {
    for (const h of headers) {
      const parsed = sample.filter((r) => !isNaN(Date.parse(r[h]))).length;
      if (parsed > sample.length * 0.7) { dateCol = h; break; }
    }
  }
  if (!metricCol) {
    for (const h of headers) {
      if (h === dateCol || h === geoCol) continue;
      const numeric = sample.filter((r) => !isNaN(parseFloat(r[h])) && r[h] !== "").length;
      if (numeric > sample.length * 0.7) { metricCol = h; break; }
    }
  }
  if (!geoCol) {
    for (const h of headers) {
      if (h === dateCol || h === metricCol) continue;
      const unique = new Set(sample.map((r) => r[h])).size;
      if (unique > 1 && unique < sample.length * 0.9) { geoCol = h; break; }
    }
  }

  return { dateCol, geoCol, metricCol };
}

// ─── Data Validation ─────────────────────────────────────────────────
function validateData(rows, dateCol, geoCol, metricCol) {
  const warnings = [];
  const errors = [];

  // Parse dates and metrics
  let validRows = 0;
  let invalidDates = 0;
  let invalidMetrics = 0;
  const geoSet = new Set();
  const dateSet = new Set();
  const geoDays = {};

  for (const row of rows) {
    const d = Date.parse(row[dateCol]);
    const m = parseFloat(row[metricCol]);
    const g = row[geoCol];

    if (isNaN(d)) { invalidDates++; continue; }
    if (isNaN(m)) { invalidMetrics++; continue; }

    geoSet.add(g);
    dateSet.add(row[dateCol]);
    if (!geoDays[g]) geoDays[g] = new Set();
    geoDays[g].add(row[dateCol]);
    validRows++;
  }

  if (invalidDates > 0) warnings.push(`${invalidDates} rows with unparseable dates were skipped.`);
  if (invalidMetrics > 0) warnings.push(`${invalidMetrics} rows with non-numeric metric values were skipped.`);

  // Check DMA count
  const totalDMAs = geoSet.size;
  const droppedDMAs = [];
  const validDMAs = [];
  for (const geo of geoSet) {
    if (geoDays[geo].size < 28) {
      droppedDMAs.push(geo);
    } else {
      validDMAs.push(geo);
    }
  }

  if (droppedDMAs.length > 0) {
    warnings.push(`${droppedDMAs.length} DMA(s) dropped — fewer than 28 days of data: ${droppedDMAs.slice(0, 5).join(", ")}${droppedDMAs.length > 5 ? "..." : ""}`);
  }

  // Date range
  const dates = Array.from(dateSet).map((d) => new Date(d)).sort((a, b) => a - b);
  const startDate = dates[0];
  const endDate = dates[dates.length - 1];
  const weeks = Math.round((endDate - startDate) / (7 * 24 * 60 * 60 * 1000));

  if (weeks < 8) warnings.push("Fewer than 8 weeks of data — results may be unreliable. 13+ weeks recommended.");
  if (validDMAs.length < 30) warnings.push("Fewer than 30 DMAs — small pool limits matching quality.");

  // Missing days check
  const totalPossibleDays = dateSet.size;
  let totalMissingDays = 0;
  for (const geo of validDMAs) {
    totalMissingDays += totalPossibleDays - geoDays[geo].size;
  }
  const missingPct = (totalMissingDays / (validDMAs.length * totalPossibleDays)) * 100;
  if (missingPct > 10) warnings.push(`${missingPct.toFixed(1)}% of DMA-days are missing — consider filling or excluding affected DMAs.`);

  // Coefficient of variation
  const geoTotals = validDMAs.map((geo) => {
    return rows.filter((r) => r[geoCol] === geo).reduce((sum, r) => sum + (parseFloat(r[metricCol]) || 0), 0);
  });
  const mean = geoTotals.reduce((a, b) => a + b, 0) / geoTotals.length;
  const sd = Math.sqrt(geoTotals.reduce((sum, v) => sum + (v - mean) ** 2, 0) / geoTotals.length);
  const cv = (sd / mean) * 100;
  if (cv > 200) warnings.push("Extreme variance between DMAs detected (CV > 200%) — stratification will be critical.");

  return {
    validRows,
    totalDMAs,
    validDMAs: validDMAs.length,
    droppedDMAs: droppedDMAs.length,
    startDate: startDate?.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    endDate: endDate?.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    weeks,
    warnings,
    errors,
  };
}

// ─── Tooltip Component ───────────────────────────────────────────────
function Tooltip({ content, children }) {
  const [show, setShow] = useState(false);
  const [pinned, setPinned] = useState(false);
  const ref = useRef(null);
  const tooltipRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (pinned && ref.current && !ref.current.contains(e.target)) {
        setPinned(false);
        setShow(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [pinned]);

  return (
    <span ref={ref} style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
      {children}
      <span
        onMouseEnter={() => { if (!pinned) setShow(true); }}
        onMouseLeave={() => { if (!pinned) setShow(false); }}
        onClick={() => { setPinned(!pinned); setShow(!pinned); }}
        style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 18, height: 18, borderRadius: "50%", backgroundColor: COLORS.aubergine,
          color: COLORS.white, fontSize: 11, fontWeight: 700, cursor: "pointer",
          marginLeft: 6, flexShrink: 0, lineHeight: 1,
        }}
      >
        ?
      </span>
      {show && (
        <span
          ref={tooltipRef}
          style={{
            position: "absolute", bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)",
            backgroundColor: COLORS.white, border: `1px solid ${COLORS.lightGray}`,
            borderRadius: 8, padding: "12px 14px", fontSize: 13, lineHeight: 1.5,
            color: COLORS.darkGray, maxWidth: 280, width: "max-content",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)", zIndex: 1000,
            fontFamily: "'Lato', sans-serif", fontWeight: 400,
          }}
        >
          {content}
        </span>
      )}
    </span>
  );
}

// ─── Dotted Term (first-use concept tooltip) ─────────────────────────
function Term({ tooltip, children }) {
  return (
    <Tooltip content={tooltip}>
      <span style={{ borderBottom: `1.5px dotted ${COLORS.mediumGray}`, cursor: "help" }}>{children}</span>
    </Tooltip>
  );
}

// ─── Stage Stepper ───────────────────────────────────────────────────
function Stepper({ currentStage }) {
  const stages = ["Upload Data", "Scenario Planner", "Test Design"];
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 0", gap: 0 }}>
      {stages.map((label, i) => {
        const num = i + 1;
        const isActive = num === currentStage;
        const isComplete = num < currentStage;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 100 }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                backgroundColor: isComplete ? COLORS.green : isActive ? COLORS.aubergine : COLORS.lightGray,
                color: isComplete || isActive ? COLORS.white : COLORS.mediumGray,
                fontSize: 14, fontWeight: 700,
              }}>
                {isComplete ? "✓" : num}
              </div>
              <span style={{
                marginTop: 6, fontSize: 12, fontWeight: isActive ? 700 : 400,
                color: isActive ? COLORS.aubergine : COLORS.mediumGray,
                letterSpacing: "0.02em",
              }}>
                {label}
              </span>
            </div>
            {i < stages.length - 1 && (
              <div style={{
                width: 80, height: 2, backgroundColor: isComplete ? COLORS.green : COLORS.lightGray,
                marginBottom: 20, marginLeft: 4, marginRight: 4,
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── File Dropzone ───────────────────────────────────────────────────
function FileDropzone({ onFileLoaded }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const handleFile = useCallback((file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const { headers, rows } = parseCSV(text);
      onFileLoaded({ fileName: file.name, headers, rows });
    };
    reader.readAsText(file);
  }, [onFileLoaded]);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
      onClick={() => inputRef.current?.click()}
      style={{
        border: `2px dashed ${dragging ? COLORS.aubergine : COLORS.lightGray}`,
        borderRadius: 12, padding: "48px 24px", textAlign: "center", cursor: "pointer",
        backgroundColor: dragging ? "#F6EDF6" : COLORS.offWhite,
        transition: "all 0.2s ease",
      }}
    >
      <input ref={inputRef} type="file" accept=".csv,.tsv,.xlsx" style={{ display: "none" }}
        onChange={(e) => handleFile(e.target.files[0])} />
      <div style={{ fontSize: 36, marginBottom: 12 }}>📊</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.darkGray, marginBottom: 4 }}>
        Drop your data file here, or click to browse
      </div>
      <div style={{ fontSize: 13, color: COLORS.mediumGray }}>
        Accepts CSV, TSV, or XLSX — daily data by DMA with a metric column
      </div>
    </div>
  );
}

// ─── Column Mapper ───────────────────────────────────────────────────
function ColumnMapper({ headers, detected, mapping, setMapping }) {
  const fields = [
    { key: "dateCol", label: "Date column", tooltip: TOOLTIPS.dateColumn },
    { key: "geoCol", label: "Geographic unit column", tooltip: TOOLTIPS.geoColumn },
    { key: "metricCol", label: "Metric column", tooltip: TOOLTIPS.metricColumn },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {fields.map(({ key, label, tooltip }) => (
        <div key={key}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: COLORS.darkGray }}>{label}</label>
            <Tooltip content={tooltip}><span /></Tooltip>
            {detected[key] && mapping[key] === detected[key] && (
              <span style={{
                marginLeft: 8, fontSize: 11, color: COLORS.green, fontWeight: 700,
                backgroundColor: COLORS.lightGreenBg, padding: "2px 8px", borderRadius: 4,
              }}>Auto-detected</span>
            )}
          </div>
          <select
            value={mapping[key] || ""}
            onChange={(e) => setMapping({ ...mapping, [key]: e.target.value })}
            style={{
              width: "100%", padding: "8px 12px", borderRadius: 4, fontSize: 14,
              border: `1px solid ${COLORS.lightGray}`, color: COLORS.darkGray,
              fontFamily: "'Lato', sans-serif", backgroundColor: COLORS.white,
              outline: "none",
            }}
          >
            <option value="">— Select column —</option>
            {headers.map((h) => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>
      ))}
    </div>
  );
}

// ─── Data Preview Table ──────────────────────────────────────────────
function DataPreview({ headers, rows }) {
  const preview = rows.slice(0, 8);
  return (
    <div style={{ overflowX: "auto", borderRadius: 8, border: `1px solid ${COLORS.lightGray}` }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: "'Lato', sans-serif" }}>
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h} style={{
                padding: "10px 12px", textAlign: "left", backgroundColor: COLORS.offWhite,
                borderBottom: `1px solid ${COLORS.lightGray}`, fontSize: 11,
                fontWeight: 700, color: COLORS.mediumGray, textTransform: "uppercase",
                letterSpacing: "0.05em", whiteSpace: "nowrap",
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {preview.map((row, i) => (
            <tr key={i} style={{ backgroundColor: i % 2 === 0 ? COLORS.white : COLORS.offWhite }}>
              {headers.map((h) => (
                <td key={h} style={{
                  padding: "8px 12px", borderBottom: `1px solid ${COLORS.lightGray}`,
                  color: COLORS.darkGray, whiteSpace: "nowrap",
                }}>{row[h]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ padding: "8px 12px", fontSize: 12, color: COLORS.mediumGray, backgroundColor: COLORS.offWhite }}>
        Showing first {preview.length} of {rows.length.toLocaleString()} rows
      </div>
    </div>
  );
}

// ─── KPI Selector ────────────────────────────────────────────────────
function KPISelector({ kpi, setKpi }) {
  const options = [
    { value: "traffic", label: "Organic + Direct Web Traffic", desc: "Daily site visits from organic search and direct channels" },
    { value: "teamcreates", label: "Team Creates", desc: "Daily new Slack workspace/team creation events" },
  ];
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.darkGray }}>KPI Type</span>
        <Tooltip content={TOOLTIPS.kpiType}><span /></Tooltip>
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setKpi(opt.value)}
            style={{
              flex: 1, padding: "12px 16px", borderRadius: 8, cursor: "pointer",
              border: kpi === opt.value ? `2px solid ${COLORS.aubergine}` : `1px solid ${COLORS.lightGray}`,
              backgroundColor: kpi === opt.value ? "#F6EDF6" : COLORS.white,
              textAlign: "left", transition: "all 0.15s ease",
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 700, color: kpi === opt.value ? COLORS.aubergine : COLORS.darkGray }}>
              {opt.label}
            </div>
            <div style={{ fontSize: 12, color: COLORS.mediumGray, marginTop: 2 }}>{opt.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Validation Results ──────────────────────────────────────────────
function ValidationResults({ results }) {
  if (!results) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Summary card */}
      <div style={{
        padding: "20px 24px", borderRadius: 8, backgroundColor: COLORS.lightBlueBg,
        border: `1px solid #C4DEF0`,
      }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.darkGray, marginBottom: 4 }}>
          Data Summary
        </div>
        <div style={{ fontSize: 14, color: COLORS.darkGray, lineHeight: 1.6 }}>
          Your data covers <strong>{results.validDMAs} DMAs</strong> over <strong>{results.weeks} weeks</strong> ({results.startDate} – {results.endDate}).
          {results.droppedDMAs > 0 && <> <span style={{ color: COLORS.yellow }}>⚠</span> {results.droppedDMAs} DMA(s) were dropped due to insufficient data.</>}
          <br />{results.validRows.toLocaleString()} valid data points loaded.
        </div>
      </div>

      {/* Warnings */}
      {results.warnings.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {results.warnings.map((w, i) => (
            <div key={i} style={{
              padding: "12px 16px", borderRadius: 8, backgroundColor: COLORS.lightYellowBg,
              border: `1px solid #F0DFB8`, fontSize: 13, color: COLORS.darkGray,
              display: "flex", alignItems: "flex-start", gap: 8,
            }}>
              <span style={{ fontSize: 16, lineHeight: 1 }}>⚠️</span>
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Guidance Panel ──────────────────────────────────────────────────
function GuidancePanel() {
  return (
    <div style={{
      padding: "20px 24px", borderRadius: 8, border: `1px solid ${COLORS.lightGray}`,
      backgroundColor: COLORS.white, marginBottom: 24,
    }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: COLORS.darkGray }}>
          Data Requirements
        </span>
        <Tooltip content={TOOLTIPS.dataMinimum}><span /></Tooltip>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px", fontSize: 13, color: COLORS.darkGray }}>
        <div>
          <span style={{ fontWeight: 700, color: COLORS.aubergine }}>Minimum:</span>{" "}
          8 weeks of daily data
        </div>
        <div>
          <span style={{ fontWeight: 700, color: COLORS.green }}>Ideal:</span>{" "}
          13–26 weeks (1–2 quarters)
        </div>
        <div>
          <span style={{ fontWeight: 700, color: COLORS.mediumGray }}>Maximum useful:</span>{" "}
          52 weeks
        </div>
        <div>
          <span style={{ fontWeight: 700, color: COLORS.blue }}>Required columns:</span>{" "}
          Date, Geography, Metric
        </div>
      </div>
      <div style={{ marginTop: 12, fontSize: 12, color: COLORS.mediumGray, lineHeight: 1.5 }}>
        Upload daily metric data broken out by <Term tooltip={TOOLTIPS.dma}>DMA</Term> or equivalent geographic unit. 
        The tool will auto-detect your column structure and confirm the mapping with you.
      </div>
    </div>
  );
}

// ─── Scenario Planner (Stage 2) ──────────────────────────────────────
function ScenarioPlanner({ validationResults, kpi, onGenerate }) {
  const [budget, setBudget] = useState(50000);
  const [numDMAs, setNumDMAs] = useState(10);
  const [weeks, setWeeks] = useState(4);
  const [mde, setMde] = useState(kpi === "teamcreates" ? 15 : 10);
  const [alpha, setAlpha] = useState(0.10);
  const [powerTarget, setPowerTarget] = useState(0.80);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [controlRatio, setControlRatio] = useState("1:1");
  const [solveMode, setSolveMode] = useState("recommend");
  const [testCells, setTestCells] = useState(2);
  const [spendMultiplier, setSpendMultiplier] = useState(2);
  const [hasAppliedRec, setHasAppliedRec] = useState(false);
  const [useSpendPrior, setUseSpendPrior] = useState(false);
  const [refSpend, setRefSpend] = useState(500);
  const [refLift, setRefLift] = useState(10);

  const maxDMAs = validationResults?.validDMAs || 50;

  // ── Recommendation Engine ──────────────────────────────────────────
  // Find the optimal (DMAs, weeks, budget) combo that hits 80% power at the target MDE
  // using the least total budget while keeping spend-per-DMA reasonable
  const recommendation = (() => {
    const targetPower = 0.80;
    const effect = mde / 100;
    const cellMultiplier = testCells === 3 ? 2 : 1; // 3-cell needs ~2x DMAs for same power
    let bestCombo = null;
    let bestScore = -Infinity;

    // Search over reasonable ranges
    for (let d = 5; d <= Math.min(30, maxDMAs); d += 1) {
      for (let w = 3; w <= 8; w += 1) {
        const effDMAs = testCells === 3 ? Math.floor(d / 2) : d;
        const base = Math.sqrt(effDMAs * w) * effect;
        const pwr = Math.min(0.99, Math.max(0.05, 1 - Math.exp(-base * 1.8)));
        if (pwr < targetPower) continue;

        // Calculate minimum budget: aim for $500/DMA/week as a reasonable floor
        const minSpendPerDMAWeek = 500;
        const spendUnits = testCells === 3
          ? (Math.floor(d / 2) * 1) + ((d - Math.floor(d / 2)) * spendMultiplier)
          : d;
        const b = minSpendPerDMAWeek * spendUnits * w;

        // Score: prefer fewer DMAs, shorter duration, and lower budget
        // (normalized so each factor contributes roughly equally)
        const score = pwr * 10 - (d / maxDMAs) * 3 - (w / 12) * 3 - (b / 200000) * 2;

        if (score > bestScore) {
          bestScore = score;
          bestCombo = { numDMAs: d, weeks: w, budget: b, power: pwr };
        }
      }
    }

    // Fallback if nothing hits 80% power
    if (!bestCombo) {
      const d = Math.min(15, maxDMAs);
      const w = 6;
      const effDMAs = testCells === 3 ? Math.floor(d / 2) : d;
      const base = Math.sqrt(effDMAs * w) * effect;
      const pwr = Math.min(0.99, Math.max(0.05, 1 - Math.exp(-base * 1.8)));
      const spendUnits = testCells === 3
        ? (Math.floor(d / 2) * 1) + ((d - Math.floor(d / 2)) * spendMultiplier)
        : d;
      bestCombo = { numDMAs: d, weeks: w, budget: 500 * spendUnits * w, power: pwr };
    }

    return bestCombo;
  })();

  const applyRecommendation = () => {
    setNumDMAs(recommendation.numDMAs);
    setWeeks(recommendation.weeks);
    setBudget(recommendation.budget);
    setHasAppliedRec(true);
  };

  // DMA distribution across cells
  const dmasPerCell = testCells === 3 ? Math.floor(numDMAs / 2) : numDMAs;
  const dmasHighCell = testCells === 3 ? numDMAs - dmasPerCell : 0;
  const controlDMAs = (controlRatio === "2:1" ? 2 : 1) * (testCells === 3 ? dmasPerCell : numDMAs);
  const totalDMAsNeeded = testCells === 3 ? dmasPerCell + dmasHighCell + controlDMAs : numDMAs + controlDMAs;

  // Budget allocation
  const totalSpendUnits = testCells === 3
    ? (dmasPerCell * 1) + (dmasHighCell * spendMultiplier)
    : numDMAs;
  const spendPerUnit = budget / (totalSpendUnits * weeks);
  const lowSpendPerDMAWeek = spendPerUnit;
  const highSpendPerDMAWeek = testCells === 3 ? spendPerUnit * spendMultiplier : 0;
  const spendPerDMAWeek = testCells === 2 ? budget / (numDMAs * weeks) : lowSpendPerDMAWeek;

  // Simplified power estimate (analytical approximation)
  // 3-cell has less power per comparison since DMAs are split across more cells
  const effectiveDMAs = testCells === 3 ? dmasPerCell : numDMAs;
  const estimatedPower = (() => {
    const n = effectiveDMAs;
    const t = weeks;
    const effect = mde / 100;
    const base = Math.sqrt(n * t) * effect;
    const raw = 1 - Math.exp(-base * 1.8);
    return Math.min(0.99, Math.max(0.05, raw));
  })();

  const powerColor = estimatedPower >= 0.8 ? COLORS.green : estimatedPower >= 0.6 ? COLORS.yellow : COLORS.red;
  const powerLabel = estimatedPower >= 0.8 ? "Strong design" : estimatedPower >= 0.6 ? "Moderate — consider adjustments" : "Underpowered — high risk of false negative";
  const powerBgColor = estimatedPower >= 0.8 ? COLORS.lightGreenBg : estimatedPower >= 0.6 ? COLORS.lightYellowBg : COLORS.lightRedBg;

  // Spend efficiency prior — expected lift at current spend, scaled linearly from reference point
  const expectedLift = (useSpendPrior && refSpend > 0 && refLift > 0 && spendPerDMAWeek > 0)
    ? Math.min(50, Math.max(0.5, (refLift * spendPerDMAWeek) / refSpend))
    : null;

  // MDE curve data
  const mdeCurveData = [];
  for (let m = 1; m <= 50; m += 1) {
    const effect = m / 100;
    const base = Math.sqrt(effectiveDMAs * weeks) * effect;
    const p = Math.min(0.99, Math.max(0.05, 1 - Math.exp(-base * 1.8)));
    mdeCurveData.push({ mde: m, power: Math.round(p * 100) });
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
      {/* Left: Inputs */}
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Solve mode */}
        <div>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.darkGray }}>Planning Mode</span>
            <Tooltip content={TOOLTIPS.solveMode}><span /></Tooltip>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[
              { value: "recommend", label: "✨ Recommend" },
              { value: "budget", label: "Fixed budget" },
              { value: "dmas", label: "Fixed DMAs" },
              { value: "timeline", label: "Fixed timeline" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setSolveMode(opt.value); setHasAppliedRec(false); }}
                style={{
                  padding: "6px 14px", borderRadius: 4, fontSize: 13, fontWeight: solveMode === opt.value ? 700 : 400,
                  border: solveMode === opt.value
                    ? `2px solid ${opt.value === "recommend" ? COLORS.blue : COLORS.aubergine}`
                    : `1px solid ${COLORS.lightGray}`,
                  backgroundColor: solveMode === opt.value
                    ? (opt.value === "recommend" ? COLORS.lightBlueBg : "#F6EDF6")
                    : COLORS.white,
                  color: solveMode === opt.value
                    ? (opt.value === "recommend" ? COLORS.blue : COLORS.aubergine)
                    : COLORS.darkGray,
                  cursor: "pointer", transition: "all 0.15s",
                  fontFamily: "'Lato', sans-serif",
                }}
              >{opt.label}</button>
            ))}
          </div>

          {/* Recommendation card — shown in Recommend mode */}
          {solveMode === "recommend" && (
            <div style={{
              marginTop: 12, padding: "16px 20px", borderRadius: 8,
              border: `1px solid #C4DEF0`, backgroundColor: COLORS.lightBlueBg,
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.blue, marginBottom: 8 }}>
                ✨ Recommended Design
              </div>
              <div style={{ fontSize: 13, color: COLORS.darkGray, lineHeight: 1.7 }}>
                To detect a <strong>{mde}%</strong> lift with 80% power{testCells === 3 ? ` using a ${spendMultiplier}x dose-response design` : ""}:
              </div>
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 10,
              }}>
                {[
                  { label: "Test DMAs", value: recommendation.numDMAs, icon: "📍" },
                  { label: "Duration", value: `${recommendation.weeks} weeks`, icon: "📅" },
                  { label: "Budget", value: `$${recommendation.budget.toLocaleString()}`, icon: "💰" },
                ].map((item) => (
                  <div key={item.label} style={{
                    padding: "10px 12px", borderRadius: 6, backgroundColor: COLORS.white,
                    border: `1px solid ${COLORS.lightGray}`, textAlign: "center",
                  }}>
                    <div style={{ fontSize: 18, marginBottom: 2 }}>{item.icon}</div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: COLORS.aubergine }}>{item.value}</div>
                    <div style={{ fontSize: 11, color: COLORS.mediumGray, marginTop: 2 }}>{item.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 12, color: COLORS.mediumGray, marginTop: 10, lineHeight: 1.5 }}>
                Estimated power: <strong style={{ color: recommendation.power >= 0.8 ? COLORS.green : COLORS.yellow }}>{Math.round(recommendation.power * 100)}%</strong> · Assumes ${500}/DMA/week min spend · Adjust the MDE slider above to see how requirements change
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                <button
                  onClick={applyRecommendation}
                  style={{
                    padding: "8px 20px", borderRadius: 4, border: "none", cursor: "pointer",
                    backgroundColor: COLORS.blue, color: COLORS.white, fontSize: 13, fontWeight: 700,
                    fontFamily: "'Lato', sans-serif", transition: "background-color 0.15s",
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = "#0D5289"}
                  onMouseLeave={(e) => e.target.style.backgroundColor = COLORS.blue}
                >
                  Apply & Customize →
                </button>
                {hasAppliedRec && (
                  <span style={{ fontSize: 12, color: COLORS.green, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                    ✓ Applied — adjust any input below
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Test Design Type */}
        <div>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.darkGray }}>Test Design</span>
            <Tooltip content={TOOLTIPS.testDesignType}><span /></Tooltip>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {[
              { value: 2, label: "2-Cell (Standard)", desc: "Treatment vs. Control" },
              { value: 3, label: "3-Cell (Dose-Response)", desc: "Low + High Spend vs. Control" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTestCells(opt.value)}
                style={{
                  flex: 1, padding: "10px 14px", borderRadius: 8, cursor: "pointer", textAlign: "left",
                  border: testCells === opt.value ? `2px solid ${COLORS.aubergine}` : `1px solid ${COLORS.lightGray}`,
                  backgroundColor: testCells === opt.value ? "#F6EDF6" : COLORS.white,
                  transition: "all 0.15s ease", fontFamily: "'Lato', sans-serif",
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: testCells === opt.value ? COLORS.aubergine : COLORS.darkGray }}>
                  {opt.label}
                </div>
                <div style={{ fontSize: 11, color: COLORS.mediumGray, marginTop: 2 }}>{opt.desc}</div>
              </button>
            ))}
          </div>

          {/* 3-Cell Visual Diagram */}
          {testCells === 3 && (
            <div style={{
              marginTop: 12, padding: "16px", borderRadius: 8, border: `1px solid ${COLORS.lightGray}`,
              backgroundColor: COLORS.offWhite,
            }}>
              {/* Cell diagram */}
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <div style={{
                  flex: 1, padding: "10px 12px", borderRadius: 6, textAlign: "center",
                  backgroundColor: COLORS.white, border: `2px solid ${COLORS.lightGray}`,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.mediumGray, textTransform: "uppercase", letterSpacing: "0.05em" }}>Control</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: COLORS.mediumGray, margin: "4px 0" }}>{controlDMAs}</div>
                  <div style={{ fontSize: 11, color: COLORS.mediumGray }}>DMAs · $0 spend</div>
                </div>
                <div style={{
                  flex: 1, padding: "10px 12px", borderRadius: 6, textAlign: "center",
                  backgroundColor: "#F6EDF6", border: `2px solid ${COLORS.aubergine}`,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.aubergine, textTransform: "uppercase", letterSpacing: "0.05em" }}>Low Spend</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: COLORS.aubergine, margin: "4px 0" }}>{dmasPerCell}</div>
                  <div style={{ fontSize: 11, color: COLORS.aubergine }}>DMAs · ${Math.round(lowSpendPerDMAWeek).toLocaleString()}/wk</div>
                </div>
                <div style={{
                  flex: 1, padding: "10px 12px", borderRadius: 6, textAlign: "center",
                  backgroundColor: "#E8D5F5", border: `2px solid ${COLORS.aubergineDark}`,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.aubergineDark, textTransform: "uppercase", letterSpacing: "0.05em" }}>High Spend</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: COLORS.aubergineDark, margin: "4px 0" }}>{dmasHighCell}</div>
                  <div style={{ fontSize: 11, color: COLORS.aubergineDark }}>DMAs · ${Math.round(highSpendPerDMAWeek).toLocaleString()}/wk</div>
                </div>
              </div>

              {/* Spend Multiplier */}
              <div>
                <div style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: COLORS.darkGray }}>High-Spend Multiplier</label>
                  <Tooltip content={TOOLTIPS.spendMultiplier}><span /></Tooltip>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {[1.5, 2, 3, 4].map((m) => (
                    <button key={m} onClick={() => setSpendMultiplier(m)}
                      style={{
                        padding: "6px 14px", borderRadius: 4, fontSize: 13,
                        fontWeight: spendMultiplier === m ? 700 : 400,
                        border: spendMultiplier === m ? `2px solid ${COLORS.aubergine}` : `1px solid ${COLORS.lightGray}`,
                        backgroundColor: spendMultiplier === m ? "#F6EDF6" : COLORS.white,
                        color: spendMultiplier === m ? COLORS.aubergine : COLORS.darkGray,
                        cursor: "pointer", fontFamily: "'Lato', sans-serif",
                      }}
                    >{m}x</button>
                  ))}
                </div>
              </div>

              {/* What this test answers */}
              <div style={{
                marginTop: 12, padding: "10px 14px", borderRadius: 6,
                backgroundColor: COLORS.lightBlueBg, border: `1px solid #C4DEF0`,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.blue }}>This test answers:</span>
                  <Tooltip content={TOOLTIPS.diminishingReturns}><span /></Tooltip>
                </div>
                <div style={{ fontSize: 12, color: COLORS.darkGray, marginTop: 4, lineHeight: 1.5 }}>
                  ① Does the campaign drive lift vs. control? ② Does {spendMultiplier}x spend produce {spendMultiplier}x lift, or do returns diminish?
                </div>
              </div>

              {/* Power note for 3-cell */}
              <div style={{
                marginTop: 8, fontSize: 12, color: COLORS.yellow, display: "flex", alignItems: "flex-start", gap: 6,
              }}>
                <span>⚠</span>
                <span>3-cell designs split your test DMAs across two treatment groups, reducing per-comparison power. You may need more total DMAs or a longer test window to maintain sensitivity.</span>
              </div>
            </div>
          )}
        </div>

        {/* Budget */}
        <div>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: COLORS.darkGray }}>Test Budget</label>
            <Tooltip content={TOOLTIPS.testBudget}><span /></Tooltip>
            {solveMode === "budget" && (
              <span style={{ marginLeft: 8, fontSize: 11, color: COLORS.aubergine, fontWeight: 700, backgroundColor: "#F6EDF6", padding: "2px 8px", borderRadius: 4 }}>Locked</span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14, color: COLORS.darkGray }}>$</span>
            <input type="number" value={budget} onChange={(e) => setBudget(Math.max(0, parseInt(e.target.value) || 0))}
              style={{
                flex: 1, padding: "8px 12px", borderRadius: 4, fontSize: 14, border: `1px solid ${COLORS.lightGray}`,
                color: COLORS.darkGray, fontFamily: "'Lato', sans-serif", outline: "none",
              }}
            />
          </div>
          {budget < 10000 && budget > 0 && (
            <div style={{ fontSize: 12, color: COLORS.yellow, marginTop: 4 }}>⚠ Budget under $10K may limit test effectiveness.</div>
          )}
        </div>

        {/* Test DMAs */}
        <div>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: COLORS.darkGray }}>Number of Test DMAs</label>
            <Tooltip content={TOOLTIPS.numDMAs}><span /></Tooltip>
            {solveMode === "dmas" && (
              <span style={{ marginLeft: 8, fontSize: 11, color: COLORS.aubergine, fontWeight: 700, backgroundColor: "#F6EDF6", padding: "2px 8px", borderRadius: 4 }}>Locked</span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <input type="range" min={3} max={Math.min(50, maxDMAs)} value={numDMAs}
              onChange={(e) => setNumDMAs(parseInt(e.target.value))}
              style={{ flex: 1, accentColor: COLORS.aubergine }}
            />
            <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.aubergine, minWidth: 30, textAlign: "right" }}>{numDMAs}</span>
          </div>
        </div>

        {/* Duration */}
        <div>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: COLORS.darkGray }}>Test Duration (weeks)</label>
            <Tooltip content={TOOLTIPS.testDuration}><span /></Tooltip>
            {solveMode === "timeline" && (
              <span style={{ marginLeft: 8, fontSize: 11, color: COLORS.aubergine, fontWeight: 700, backgroundColor: "#F6EDF6", padding: "2px 8px", borderRadius: 4 }}>Locked</span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <input type="range" min={2} max={12} value={weeks} onChange={(e) => setWeeks(parseInt(e.target.value))}
              style={{ flex: 1, accentColor: COLORS.aubergine }}
            />
            <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.aubergine, minWidth: 30, textAlign: "right" }}>{weeks}w</span>
          </div>
        </div>

        {/* MDE */}
        <div>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: COLORS.darkGray }}>Minimum Detectable Effect</label>
            <Tooltip content={TOOLTIPS.mde}><span /></Tooltip>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <input type="range" min={1} max={50} value={mde} onChange={(e) => setMde(parseInt(e.target.value))}
              style={{ flex: 1, accentColor: COLORS.aubergine }}
            />
            <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.aubergine, minWidth: 40, textAlign: "right" }}>{mde}%</span>
          </div>
        </div>

        {/* Spend Efficiency Prior */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button
              onClick={() => setUseSpendPrior(!useSpendPrior)}
              style={{
                background: "none", border: "none", cursor: "pointer", textAlign: "left",
                fontSize: 13, color: COLORS.blue, fontFamily: "'Lato', sans-serif", padding: 0,
              }}
            >
              {useSpendPrior ? "▾" : "▸"} Spend efficiency prior <span style={{ fontWeight: 400, color: COLORS.mediumGray }}>(optional)</span>
            </button>
            <Tooltip content={TOOLTIPS.spendEfficiency}><span /></Tooltip>
          </div>
          {useSpendPrior && (
            <div style={{
              marginTop: 10, padding: "16px", borderRadius: 8,
              border: `1px solid ${COLORS.lightGray}`, backgroundColor: COLORS.offWhite,
              display: "flex", flexDirection: "column", gap: 12,
            }}>
              <p style={{ fontSize: 13, color: COLORS.mediumGray, margin: 0, lineHeight: 1.5 }}>
                If you have a prior belief about how much lift a given spend level produces for this campaign type, enter it below. The tool will scale it to your current spend and mark the expected effect on the MDE curve.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: COLORS.darkGray, display: "block", marginBottom: 4 }}>
                    Reference spend ($/DMA/week)
                  </label>
                  <input
                    type="number" value={refSpend}
                    onChange={(e) => setRefSpend(Math.max(1, parseInt(e.target.value) || 1))}
                    style={{
                      width: "100%", padding: "7px 10px", borderRadius: 4, fontSize: 13,
                      border: `1px solid ${COLORS.lightGray}`, fontFamily: "'Lato', sans-serif",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: COLORS.darkGray, display: "block", marginBottom: 4 }}>
                    Expected lift at that spend (%)
                  </label>
                  <input
                    type="number" value={refLift} min={0.1} max={100} step={0.5}
                    onChange={(e) => setRefLift(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                    style={{
                      width: "100%", padding: "7px 10px", borderRadius: 4, fontSize: 13,
                      border: `1px solid ${COLORS.lightGray}`, fontFamily: "'Lato', sans-serif",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>
              {expectedLift !== null && (
                <div style={{
                  padding: "10px 14px", borderRadius: 6,
                  backgroundColor: expectedLift >= mde ? COLORS.lightGreenBg : COLORS.lightYellowBg,
                  border: `1px solid ${expectedLift >= mde ? "#B8E0CC" : "#F0DFA0"}`,
                  fontSize: 13, color: COLORS.darkGray, lineHeight: 1.5,
                }}>
                  At your current spend of <strong>${Math.round(spendPerDMAWeek).toLocaleString()}/DMA/week</strong>,
                  this implies an expected lift of <strong style={{ color: expectedLift >= mde ? COLORS.green : COLORS.yellow }}>~{expectedLift.toFixed(1)}%</strong>.
                  {expectedLift >= mde
                    ? <span style={{ color: COLORS.green }}> Your budget should be sufficient to generate a detectable effect.</span>
                    : <span style={{ color: "#8a6200" }}> This is below your {mde}% MDE — your budget may not generate enough lift for the test to be conclusive. Consider increasing spend or raising the MDE.</span>
                  }
                </div>
              )}
            </div>
          )}
        </div>

        {/* Advanced Settings */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          style={{
            background: "none", border: "none", cursor: "pointer", textAlign: "left",
            fontSize: 13, color: COLORS.blue, fontFamily: "'Lato', sans-serif", padding: 0,
          }}
        >
          {showAdvanced ? "▾" : "▸"} Advanced Settings
        </button>
        {showAdvanced && (
          <div style={{
            padding: 16, borderRadius: 8, border: `1px solid ${COLORS.lightGray}`,
            backgroundColor: COLORS.offWhite, display: "flex", flexDirection: "column", gap: 16,
          }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: COLORS.darkGray }}>Significance Level (α)</label>
                <Tooltip content={TOOLTIPS.alpha}><span /></Tooltip>
              </div>
              <select value={alpha} onChange={(e) => setAlpha(parseFloat(e.target.value))}
                style={{
                  width: "100%", padding: "8px 12px", borderRadius: 4, fontSize: 14,
                  border: `1px solid ${COLORS.lightGray}`, fontFamily: "'Lato', sans-serif",
                }}>
                <option value={0.05}>0.05 (strict)</option>
                <option value={0.10}>0.10 (standard for geo tests)</option>
                <option value={0.15}>0.15 (lenient)</option>
                <option value={0.20}>0.20 (exploratory)</option>
              </select>
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: COLORS.darkGray }}>Statistical Power Target</label>
                <Tooltip content={TOOLTIPS.power}><span /></Tooltip>
              </div>
              <select value={powerTarget} onChange={(e) => setPowerTarget(parseFloat(e.target.value))}
                style={{
                  width: "100%", padding: "8px 12px", borderRadius: 4, fontSize: 14,
                  border: `1px solid ${COLORS.lightGray}`, fontFamily: "'Lato', sans-serif",
                }}>
                <option value={0.70}>70% (acceptable)</option>
                <option value={0.80}>80% (standard)</option>
                <option value={0.90}>90% (rigorous)</option>
              </select>
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: COLORS.darkGray }}>Control:Test Ratio</label>
                <Tooltip content={TOOLTIPS.controlTestRatio}><span /></Tooltip>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {["1:1", "2:1"].map((r) => (
                  <button key={r} onClick={() => setControlRatio(r)}
                    style={{
                      padding: "6px 16px", borderRadius: 4, fontSize: 13, fontWeight: controlRatio === r ? 700 : 400,
                      border: controlRatio === r ? `2px solid ${COLORS.aubergine}` : `1px solid ${COLORS.lightGray}`,
                      backgroundColor: controlRatio === r ? "#F6EDF6" : COLORS.white,
                      color: controlRatio === r ? COLORS.aubergine : COLORS.darkGray,
                      cursor: "pointer", fontFamily: "'Lato', sans-serif",
                    }}
                  >{r}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        <button
          onClick={() => onGenerate({ budget, numDMAs, weeks, mde, alpha, powerTarget, controlRatio, testCells, spendMultiplier })}
          style={{
            padding: "12px 24px", borderRadius: 4, border: "none", cursor: "pointer",
            backgroundColor: COLORS.aubergine, color: COLORS.white, fontSize: 15, fontWeight: 700,
            fontFamily: "'Lato', sans-serif", transition: "background-color 0.15s",
            marginTop: 8,
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = COLORS.aubergineDark}
          onMouseLeave={(e) => e.target.style.backgroundColor = COLORS.aubergine}
        >
          Generate Test Design →
        </button>
      </div>

      {/* Right: Results Dashboard */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Power gauge */}
        <div style={{
          padding: "24px", borderRadius: 8, border: `1px solid ${COLORS.lightGray}`,
          backgroundColor: powerBgColor, textAlign: "center",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.darkGray }}>Estimated Power</span>
            <Tooltip content={TOOLTIPS.powerGauge}><span /></Tooltip>
          </div>
          <div style={{ fontSize: 48, fontWeight: 900, color: powerColor, lineHeight: 1 }}>
            {Math.round(estimatedPower * 100)}%
          </div>
          <div style={{ fontSize: 13, color: powerColor, fontWeight: 700, marginTop: 4 }}>{powerLabel}</div>
        </div>

        {/* Key metrics */}
        <div style={{
          padding: "16px 20px", borderRadius: 8, border: `1px solid ${COLORS.lightGray}`,
          backgroundColor: COLORS.white, display: "flex", flexDirection: "column", gap: 12,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span style={{ color: COLORS.mediumGray }}>
              {testCells === 3 ? "Low-spend per DMA/week" : "Spend per DMA per week"}
            </span>
            <span style={{ fontWeight: 700, color: spendPerDMAWeek < 100 ? COLORS.red : COLORS.darkGray }}>
              ${spendPerDMAWeek.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              {spendPerDMAWeek < 100 && <span style={{ color: COLORS.red, fontWeight: 400 }}> ⚠ low</span>}
            </span>
          </div>
          {testCells === 3 && (
            <>
              <div style={{ height: 1, backgroundColor: COLORS.lightGray }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: COLORS.mediumGray }}>High-spend per DMA/week</span>
                <span style={{ fontWeight: 700, color: COLORS.darkGray }}>
                  ${highSpendPerDMAWeek.toLocaleString(undefined, { maximumFractionDigits: 0 })} ({spendMultiplier}x)
                </span>
              </div>
            </>
          )}
          <div style={{ height: 1, backgroundColor: COLORS.lightGray }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span style={{ color: COLORS.mediumGray }}>Control DMAs needed</span>
            <span style={{ fontWeight: 700, color: COLORS.darkGray }}>
              {controlDMAs}
            </span>
          </div>
          <div style={{ height: 1, backgroundColor: COLORS.lightGray }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span style={{ color: COLORS.mediumGray }}>Total DMAs required</span>
            <span style={{
              fontWeight: 700,
              color: totalDMAsNeeded > maxDMAs ? COLORS.red : COLORS.darkGray,
            }}>
              {totalDMAsNeeded}
              {totalDMAsNeeded > maxDMAs ? ` ⚠ exceeds available (${maxDMAs})` : ` of ${maxDMAs} available ✓`}
            </span>
          </div>
          <div style={{ height: 1, backgroundColor: COLORS.lightGray }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span style={{ color: COLORS.mediumGray }}>Test window</span>
            <span style={{ fontWeight: 700, color: COLORS.darkGray }}>{weeks} weeks</span>
          </div>
          {expectedLift !== null && (
            <>
              <div style={{ height: 1, backgroundColor: COLORS.lightGray }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, alignItems: "center" }}>
                <span style={{ color: COLORS.mediumGray }}>Expected lift from spend</span>
                <span style={{
                  fontWeight: 700,
                  color: expectedLift >= mde ? COLORS.green : COLORS.yellow,
                }}>
                  ~{expectedLift.toFixed(1)}%
                  {expectedLift >= mde
                    ? <span style={{ fontWeight: 400, color: COLORS.mediumGray }}> ✓ above MDE</span>
                    : <span style={{ fontWeight: 400, color: COLORS.yellow }}> ⚠ below MDE</span>
                  }
                </span>
              </div>
            </>
          )}
        </div>

        {/* MDE Sensitivity Curve */}
        <div style={{
          padding: "16px 20px", borderRadius: 8, border: `1px solid ${COLORS.lightGray}`,
          backgroundColor: COLORS.white,
        }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.darkGray }}>MDE Sensitivity Curve</span>
            <Tooltip content={TOOLTIPS.mdeCurve}><span /></Tooltip>
          </div>
          <div style={{ position: "relative", height: 160 }}>
            <svg viewBox="0 0 400 140" style={{ width: "100%", height: "100%" }}>
              {/* Grid */}
              {[0, 25, 50, 75, 100].map((y) => (
                <line key={y} x1="40" y1={120 - y * 1.1} x2="390" y2={120 - y * 1.1}
                  stroke={COLORS.lightGray} strokeWidth="0.5" />
              ))}
              {/* 80% power line */}
              <line x1="40" y1={120 - 80 * 1.1} x2="390" y2={120 - 80 * 1.1}
                stroke={COLORS.green} strokeWidth="1" strokeDasharray="4 3" />
              <text x="42" y={120 - 80 * 1.1 - 4} fill={COLORS.green} fontSize="9" fontFamily="Lato">80% power</text>
              {/* Curve */}
              <path
                d={mdeCurveData.map((d, i) => {
                  const x = 40 + (d.mde / 50) * 350;
                  const y = 120 - d.power * 1.1;
                  return `${i === 0 ? "M" : "L"} ${x} ${y}`;
                }).join(" ")}
                fill="none" stroke={COLORS.aubergine} strokeWidth="2"
              />
              {/* Current MDE marker */}
              <circle
                cx={40 + (mde / 50) * 350}
                cy={120 - Math.round(estimatedPower * 100) * 1.1}
                r="4" fill={COLORS.aubergine}
              />
              {/* Expected lift marker (spend prior) */}
              {expectedLift !== null && (() => {
                const ex = Math.min(50, expectedLift);
                const xPos = 40 + (ex / 50) * 350;
                const color = expectedLift >= mde ? COLORS.green : COLORS.yellow;
                const powerAtExpected = (() => {
                  const base = Math.sqrt(effectiveDMAs * weeks) * (ex / 100);
                  return Math.min(0.99, Math.max(0.05, 1 - Math.exp(-base * 1.8)));
                })();
                return (
                  <g>
                    <line x1={xPos} y1={12} x2={xPos} y2={122}
                      stroke={color} strokeWidth="1.5" strokeDasharray="4 3" />
                    <circle cx={xPos} cy={120 - powerAtExpected * 100 * 1.1} r="4" fill={color} />
                    <text x={xPos} y={9} textAnchor="middle" fill={color} fontSize="8" fontFamily="Lato" fontWeight="700">
                      ~{ex.toFixed(0)}% expected
                    </text>
                  </g>
                );
              })()}
              {/* Axes labels */}
              <text x="215" y="138" textAnchor="middle" fill={COLORS.mediumGray} fontSize="9" fontFamily="Lato">MDE %</text>
              <text x="12" y="65" textAnchor="middle" fill={COLORS.mediumGray} fontSize="9" fontFamily="Lato"
                transform="rotate(-90, 12, 65)">Power %</text>
              {[5, 10, 20, 30, 40, 50].map((v) => (
                <text key={v} x={40 + (v / 50) * 350} y="130" textAnchor="middle"
                  fill={COLORS.mediumGray} fontSize="8" fontFamily="Lato">{v}%</text>
              ))}
            </svg>
          </div>
        </div>

        {/* Recommendation */}
        <div style={{
          padding: "16px 20px", borderRadius: 8, border: `1px solid #C4DEF0`,
          backgroundColor: COLORS.lightBlueBg,
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.blue, marginBottom: 4 }}>💡 Recommendation</div>
          <div style={{ fontSize: 13, color: COLORS.darkGray, lineHeight: 1.6 }}>
            {solveMode === "recommend" && !hasAppliedRec ? (
              <>Use the "Apply & Customize" button on the left to load the recommended design, then fine-tune any input. Or switch to a constraint mode if you have a fixed budget, DMA count, or timeline.</>
            ) : estimatedPower >= 0.8 ? (
              testCells === 3 ? (
                <>Based on your budget of ${budget.toLocaleString()}, a {spendMultiplier}x dose-response design with {dmasPerCell} low-spend and {dmasHighCell} high-spend DMAs for {weeks} weeks gives approximately {Math.round(estimatedPower * 100)}% power per comparison. This will detect a {mde}% lift and reveal whether {spendMultiplier}x spend produces proportional returns.</>
              ) : (
                <>Based on your budget of ${budget.toLocaleString()} and a target MDE of {mde}%, testing in {numDMAs} DMAs for {weeks} weeks gives approximately {Math.round(estimatedPower * 100)}% power to detect the effect. This is a strong design.</>
              )
            ) : (
              testCells === 3 ? (
                <>This 3-cell design has approximately {Math.round(estimatedPower * 100)}% power per comparison — below the 80% target. Splitting DMAs across two treatment cells reduces power. To improve: increase total test DMAs to {Math.min(maxDMAs, numDMAs + 6)}, extend to {Math.min(12, weeks + 2)} weeks, raise MDE to {Math.min(50, mde + 5)}%, or consider a 2-cell design first and run the dose-response as a follow-up test.</>
              ) : (
                <>This design has approximately {Math.round(estimatedPower * 100)}% power — below the 80% target. To improve: increase test DMAs to {Math.min(maxDMAs, numDMAs + 5)}, extend duration to {Math.min(12, weeks + 2)} weeks, or raise MDE target to {Math.min(50, mde + 5)}%.</>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Stage 3 Statistical Helpers ─────────────────────────────────────
function pearsonCorrelation(x, y) {
  const n = Math.min(x.length, y.length);
  if (n < 2) return 0;
  const mx = x.slice(0, n).reduce((a, b) => a + b, 0) / n;
  const my = y.slice(0, n).reduce((a, b) => a + b, 0) / n;
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) {
    const a = x[i] - mx, b = y[i] - my;
    num += a * b; dx += a * a; dy += b * b;
  }
  if (dx === 0 || dy === 0) return 0;
  return num / Math.sqrt(dx * dy);
}

function cosineSimilarity(a, b) {
  const n = Math.min(a.length, b.length);
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < n; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  if (na === 0 || nb === 0) return 0;
  return dot / Math.sqrt(na * nb);
}

function shuffleSample(arr, n) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}

function buildDMAStats(rows, dateCol, geoCol, metricCol) {
  const parsed = [];
  for (const row of rows) {
    const d = new Date(row[dateCol]);
    const m = parseFloat(row[metricCol]);
    const g = row[geoCol];
    if (!isNaN(d.getTime()) && !isNaN(m) && g) {
      parsed.push({ date: d, metric: m, geo: g, dow: d.getDay() });
    }
  }
  if (parsed.length === 0) return {};
  const minTime = parsed.reduce((a, b) => a.date < b.date ? a : b).date.getTime();
  const dmaMap = {};
  for (const { date, metric, geo, dow } of parsed) {
    if (!dmaMap[geo]) dmaMap[geo] = { weeklyTotals: {}, dowTotals: Array(7).fill(0), total: 0 };
    const wk = Math.floor((date.getTime() - minTime) / (7 * 24 * 3600 * 1000));
    dmaMap[geo].weeklyTotals[wk] = (dmaMap[geo].weeklyTotals[wk] || 0) + metric;
    dmaMap[geo].dowTotals[dow] += metric;
    dmaMap[geo].total += metric;
  }
  const allWeeks = new Set();
  for (const d of Object.values(dmaMap)) Object.keys(d.weeklyTotals).forEach(w => allWeeks.add(Number(w)));
  const sortedWeeks = Array.from(allWeeks).sort((a, b) => a - b);
  for (const [geo, d] of Object.entries(dmaMap)) {
    d.weeks = sortedWeeks.map(w => d.weeklyTotals[w] || 0);
    d.avgWeekly = d.total / (sortedWeeks.length || 1);
    d.geo = geo;
  }
  return dmaMap;
}

function assignTiers(dmaStats) {
  const dmas = Object.keys(dmaStats);
  const sorted = [...dmas].sort((a, b) => dmaStats[a].total - dmaStats[b].total);
  const n = sorted.length;
  const tiers = {};
  sorted.forEach((dma, i) => { tiers[dma] = Math.min(4, Math.floor(i / n * 4) + 1); });
  return tiers;
}

function stratifiedSample(tiers, numDMAs, excludeSet = new Set()) {
  const tierGroups = { 1: [], 2: [], 3: [], 4: [] };
  for (const [dma, tier] of Object.entries(tiers)) {
    if (!excludeSet.has(dma)) tierGroups[tier].push(dma);
  }
  const totalAvail = Object.values(tierGroups).reduce((s, g) => s + g.length, 0);
  if (totalAvail === 0) return [];
  const result = [];
  for (let tier = 1; tier <= 4; tier++) {
    const g = tierGroups[tier];
    const n = Math.round(numDMAs * g.length / totalAvail);
    result.push(...shuffleSample(g, n));
  }
  // Adjust for rounding
  const allAvail = Object.values(tierGroups).flat().filter(d => !result.includes(d));
  let idx = 0;
  while (result.length < numDMAs && idx < allAvail.length) result.push(allAvail[idx++]);
  return result.slice(0, numDMAs);
}

function aggregateGroupSeries(dmaStats, dmaList) {
  if (dmaList.length === 0) return [];
  const maxLen = Math.max(...dmaList.map(d => dmaStats[d]?.weeks?.length || 0));
  const series = Array(maxLen).fill(0);
  for (const dma of dmaList) (dmaStats[dma]?.weeks || []).forEach((v, i) => { series[i] += v; });
  return series;
}

function scoreSim(dmaStats, testDMAs, controlDMAs) {
  const testSeries = aggregateGroupSeries(dmaStats, testDMAs);
  const ctrlSeries = aggregateGroupSeries(dmaStats, controlDMAs);
  const corr = pearsonCorrelation(testSeries, ctrlSeries);
  const testTotal = testDMAs.reduce((s, d) => s + (dmaStats[d]?.total || 0), 0);
  const ctrlTotal = controlDMAs.reduce((s, d) => s + (dmaStats[d]?.total || 0), 0);
  const maxTotal = Math.max(testTotal, ctrlTotal, 1);
  const volSim = 1 - Math.abs(testTotal - ctrlTotal) / maxTotal;
  const testDow = Array(7).fill(0), ctrlDow = Array(7).fill(0);
  for (const d of testDMAs) (dmaStats[d]?.dowTotals || []).forEach((v, i) => testDow[i] += v);
  for (const d of controlDMAs) (dmaStats[d]?.dowTotals || []).forEach((v, i) => ctrlDow[i] += v);
  const dowSim = cosineSimilarity(testDow, ctrlDow);
  const composite = 0.5 * corr + 0.2 * volSim + 0.3 * dowSim;
  return { corr, volSim, dowSim, composite };
}

function runMonteCarloChunk(dmaStats, testDMAs, tiers, controlRatioNum, chunkSize, best) {
  const testSet = new Set(testDMAs);
  const tierPools = { 1: [], 2: [], 3: [], 4: [] };
  for (const [dma, tier] of Object.entries(tiers)) {
    if (!testSet.has(dma)) tierPools[tier].push(dma);
  }
  const testTierCounts = { 1: 0, 2: 0, 3: 0, 4: 0 };
  for (const d of testDMAs) testTierCounts[tiers[d] || 1]++;
  const totalControlNeeded = testDMAs.length * controlRatioNum;

  for (let i = 0; i < chunkSize; i++) {
    const controlSample = [];
    let deficit = 0;
    for (let tier = 1; tier <= 4; tier++) {
      const pool = tierPools[tier];
      const raw = testTierCounts[tier] * controlRatioNum + deficit;
      const take = Math.min(Math.round(raw), pool.length);
      deficit = raw - take;
      if (take > 0) controlSample.push(...shuffleSample(pool, take));
    }
    if (controlSample.length < Math.max(1, Math.ceil(totalControlNeeded * 0.7))) continue;
    const scores = scoreSim(dmaStats, testDMAs, controlSample);
    if (scores.corr < 0.85) continue;
    if (!best || scores.composite > best.composite) {
      best = { controlDMAs: controlSample, ...scores };
    }
  }
  return best;
}

// ─── Stage 3: Test Design Output ─────────────────────────────────────
function QualityGate({ label, value, pass, tooltip }) {
  const color = pass ? COLORS.green : COLORS.red;
  const bg = pass ? COLORS.lightGreenBg : COLORS.lightRedBg;
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "10px 14px", borderRadius: 6, border: `1px solid ${pass ? "#B8E0CC" : "#F0B8CC"}`,
      backgroundColor: bg,
    }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        <span style={{ fontSize: 14, marginRight: 8 }}>{pass ? "✓" : "✗"}</span>
        <span style={{ fontSize: 13, color: COLORS.darkGray }}>
          <Tooltip content={tooltip}>{label}</Tooltip>
        </span>
      </div>
      <span style={{ fontSize: 14, fontWeight: 700, color, fontFamily: "monospace" }}>
        {typeof value === "number" ? value.toFixed(3) : value}
      </span>
    </div>
  );
}

function TestDesignOutput({ params, rows, mapping, kpi }) {
  const [phase, setPhase] = useState("init");
  const [dmaStats, setDmaStats] = useState(null);
  const [tiers, setTiers] = useState(null);
  const [testDMAs, setTestDMAs] = useState([]);
  const [manualExcludes, setManualExcludes] = useState(new Set());
  const [manualIncludes, setManualIncludes] = useState(new Set());
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [tableSort, setTableSort] = useState({ col: "group", dir: "asc" });
  const [showAllDMAs, setShowAllDMAs] = useState(false);
  const cancelRef = useRef(false);

  const controlRatioNum = params.controlRatio === "2:1" ? 2 : 1;

  useEffect(() => {
    if (!rows || !mapping?.dateCol) return;
    const stats = buildDMAStats(rows, mapping.dateCol, mapping.geoCol, mapping.metricCol);
    const tiered = assignTiers(stats);
    setDmaStats(stats);
    setTiers(tiered);
    setTestDMAs(stratifiedSample(tiered, params.numDMAs));
    setPhase("setup");
  }, []);

  const resample = () => {
    if (!tiers) return;
    const excl = new Set([...manualExcludes]);
    const incl = [...manualIncludes].filter(d => !excl.has(d));
    const needed = Math.max(0, params.numDMAs - incl.length);
    const auto = stratifiedSample(tiers, needed, new Set([...excl, ...incl]));
    setTestDMAs([...incl, ...auto].slice(0, params.numDMAs));
  };

  const toggleExclude = (dma) => {
    setManualExcludes(prev => {
      const next = new Set(prev);
      if (next.has(dma)) next.delete(dma); else next.add(dma);
      return next;
    });
    setManualIncludes(prev => { const n = new Set(prev); n.delete(dma); return n; });
  };

  const toggleInclude = (dma) => {
    setManualIncludes(prev => {
      const next = new Set(prev);
      if (next.has(dma)) next.delete(dma); else next.add(dma);
      return next;
    });
    setManualExcludes(prev => { const n = new Set(prev); n.delete(dma); return n; });
  };

  const startMatching = () => {
    cancelRef.current = false;
    setPhase("running");
    setProgress(0);
    const TOTAL = 10000, CHUNK = 250;
    let done = 0, best = null;
    const tick = () => {
      if (cancelRef.current) return;
      best = runMonteCarloChunk(dmaStats, testDMAs, tiers, controlRatioNum, CHUNK, best);
      done += CHUNK;
      setProgress(Math.round((done / TOTAL) * 100));
      if (done < TOTAL) { setTimeout(tick, 0); }
      else { setResult(best); setPhase("done"); }
    };
    setTimeout(tick, 0);
  };

  // ── INIT ────────────────────────────────────────────────────────────
  if (phase === "init") {
    return (
      <div style={{ textAlign: "center", padding: 48, color: COLORS.mediumGray }}>
        <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
        <div>Loading data…</div>
      </div>
    );
  }

  // ── SETUP ───────────────────────────────────────────────────────────
  if (phase === "setup") {
    const allDMAs = dmaStats ? Object.keys(dmaStats) : [];
    const tierCounts = allDMAs.reduce((acc, d) => {
      const t = tiers[d];
      acc[t] = (acc[t] || 0) + 1;
      return acc;
    }, {});
    const testTierDist = testDMAs.reduce((acc, d) => {
      const t = tiers[d];
      acc[t] = (acc[t] || 0) + 1;
      return acc;
    }, {});
    const displayDMAs = showAllDMAs ? allDMAs : allDMAs.slice(0, 20);

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Tier summary */}
        <div style={{ padding: "20px 24px", borderRadius: 8, border: `1px solid ${COLORS.lightGray}`, backgroundColor: COLORS.white }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 14 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: COLORS.darkGray }}>Tier Assignment</span>
            <Tooltip content={TOOLTIPS.tier}><span /></Tooltip>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {[1, 2, 3, 4].map(t => (
              <div key={t} style={{
                padding: "12px", borderRadius: 6, textAlign: "center",
                backgroundColor: COLORS.offWhite, border: `1px solid ${COLORS.lightGray}`,
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.mediumGray, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
                  Tier {t}
                </div>
                <div style={{ fontSize: 22, fontWeight: 900, color: COLORS.aubergine }}>{tierCounts[t] || 0}</div>
                <div style={{ fontSize: 11, color: COLORS.mediumGray }}>DMAs</div>
                <div style={{ fontSize: 11, color: COLORS.blue, marginTop: 4 }}>{testTierDist[t] || 0} selected as test</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: COLORS.mediumGray, lineHeight: 1.5 }}>
            {allDMAs.length} DMAs available · {testDMAs.length} selected as test · {testDMAs.length * controlRatioNum} control slots needed ({params.controlRatio} ratio)
          </div>
        </div>

        {/* DMA selection */}
        <div style={{ padding: "20px 24px", borderRadius: 8, border: `1px solid ${COLORS.lightGray}`, backgroundColor: COLORS.white }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: COLORS.darkGray }}>Test DMA Selection</span>
              <Tooltip content="Use the toggles below to manually force specific DMAs in or out of the test group. Click 'Resample' to re-randomize the remaining slots using stratified sampling."><span /></Tooltip>
            </div>
            <button onClick={resample} style={{
              padding: "6px 14px", borderRadius: 4, border: `1px solid ${COLORS.aubergine}`,
              backgroundColor: "#F6EDF6", color: COLORS.aubergine, fontSize: 12, fontWeight: 700,
              cursor: "pointer", fontFamily: "'Lato', sans-serif",
            }}>↺ Resample</button>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ backgroundColor: COLORS.offWhite }}>
                  {["DMA", "Tier", "Avg Weekly", "Status", "Force In", "Force Out"].map(h => (
                    <th key={h} style={{
                      padding: "8px 12px", textAlign: "left", borderBottom: `1px solid ${COLORS.lightGray}`,
                      fontSize: 11, fontWeight: 700, color: COLORS.mediumGray, textTransform: "uppercase", letterSpacing: "0.05em",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayDMAs.map((dma, i) => {
                  const isTest = testDMAs.includes(dma);
                  const isIncl = manualIncludes.has(dma);
                  const isExcl = manualExcludes.has(dma);
                  return (
                    <tr key={dma} style={{ backgroundColor: i % 2 === 0 ? COLORS.white : COLORS.offWhite }}>
                      <td style={{ padding: "7px 12px", borderBottom: `1px solid ${COLORS.lightGray}`, color: COLORS.darkGray, fontFamily: "monospace", fontSize: 12 }}>{dma}</td>
                      <td style={{ padding: "7px 12px", borderBottom: `1px solid ${COLORS.lightGray}` }}>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 4,
                          backgroundColor: ["", "#E8F5FA", "#E8F8F0", "#FDF4E3", "#FDE8EF"][tiers[dma]],
                          color: [COLORS.blue, COLORS.blue, COLORS.green, COLORS.yellow, COLORS.red][tiers[dma]],
                        }}>T{tiers[dma]}</span>
                      </td>
                      <td style={{ padding: "7px 12px", borderBottom: `1px solid ${COLORS.lightGray}`, fontFamily: "monospace", fontSize: 12, color: COLORS.darkGray }}>
                        {Math.round(dmaStats[dma]?.avgWeekly || 0).toLocaleString()}
                      </td>
                      <td style={{ padding: "7px 12px", borderBottom: `1px solid ${COLORS.lightGray}` }}>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
                          backgroundColor: isExcl ? COLORS.lightRedBg : isTest ? COLORS.lightGreenBg : COLORS.offWhite,
                          color: isExcl ? COLORS.red : isTest ? COLORS.green : COLORS.mediumGray,
                        }}>
                          {isExcl ? "Excluded" : isTest ? "Test" : "Control pool"}
                        </span>
                      </td>
                      <td style={{ padding: "7px 12px", borderBottom: `1px solid ${COLORS.lightGray}` }}>
                        <input type="checkbox" checked={isIncl} onChange={() => toggleInclude(dma)}
                          style={{ accentColor: COLORS.green, cursor: "pointer", width: 16, height: 16 }} />
                      </td>
                      <td style={{ padding: "7px 12px", borderBottom: `1px solid ${COLORS.lightGray}` }}>
                        <input type="checkbox" checked={isExcl} onChange={() => toggleExclude(dma)}
                          style={{ accentColor: COLORS.red, cursor: "pointer", width: 16, height: 16 }} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {allDMAs.length > 20 && (
            <button onClick={() => setShowAllDMAs(!showAllDMAs)} style={{
              marginTop: 8, background: "none", border: "none", cursor: "pointer",
              fontSize: 12, color: COLORS.blue, fontFamily: "'Lato', sans-serif", padding: "4px 0",
            }}>
              {showAllDMAs ? "Show fewer" : `Show all ${allDMAs.length} DMAs`}
            </button>
          )}
        </div>

        <button onClick={startMatching} style={{
          padding: "13px 28px", borderRadius: 4, border: "none", cursor: "pointer",
          backgroundColor: COLORS.aubergine, color: COLORS.white, fontSize: 15, fontWeight: 700,
          fontFamily: "'Lato', sans-serif", alignSelf: "flex-start",
        }}
          onMouseEnter={e => e.target.style.backgroundColor = COLORS.aubergineDark}
          onMouseLeave={e => e.target.style.backgroundColor = COLORS.aubergine}
        >
          Run Control Matching (10,000 sims) →
        </button>
      </div>
    );
  }

  // ── RUNNING ─────────────────────────────────────────────────────────
  if (phase === "running") {
    return (
      <div style={{ textAlign: "center", padding: "60px 24px" }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>🎲</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.darkGray, marginBottom: 4 }}>
          Running Monte Carlo Matching
        </div>
        <Tooltip content={TOOLTIPS.monteCarlo}>
          <div style={{ fontSize: 13, color: COLORS.mediumGray, marginBottom: 32 }}>
            Testing 10,000 random control group combinations…
          </div>
        </Tooltip>
        <div style={{ maxWidth: 480, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: COLORS.mediumGray, marginBottom: 6 }}>
            <span>Progress</span><span>{progress}%</span>
          </div>
          <div style={{ height: 10, borderRadius: 5, backgroundColor: COLORS.lightGray, overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 5, backgroundColor: COLORS.aubergine,
              width: `${progress}%`, transition: "width 0.1s ease",
            }} />
          </div>
          <div style={{ marginTop: 16, fontSize: 12, color: COLORS.mediumGray }}>
            {Math.round(progress * 100)} / 10,000 simulations complete
          </div>
        </div>
        <button onClick={() => { cancelRef.current = true; setPhase("setup"); }} style={{
          marginTop: 32, padding: "8px 18px", borderRadius: 4, border: `1px solid ${COLORS.lightGray}`,
          backgroundColor: COLORS.white, color: COLORS.darkGray, fontSize: 13, cursor: "pointer",
          fontFamily: "'Lato', sans-serif",
        }}>Cancel</button>
      </div>
    );
  }

  // ── DONE ────────────────────────────────────────────────────────────
  if (phase !== "done" || !result) return null;

  const { controlDMAs, corr, volSim, dowSim, composite } = result;

  // Assign 3-cell groups if needed
  const half = Math.floor(testDMAs.length / 2);
  const lowSpendDMAs = params.testCells === 3 ? testDMAs.slice(0, half) : testDMAs;
  const highSpendDMAs = params.testCells === 3 ? testDMAs.slice(half) : [];

  // Build DMA assignment table rows
  const assignmentRows = [
    ...controlDMAs.map(d => ({ dma: d, group: "Control", tier: tiers[d], avgWeekly: dmaStats[d]?.avgWeekly || 0, spend: 0 })),
    ...(params.testCells === 3
      ? [
        ...lowSpendDMAs.map(d => ({ dma: d, group: "Low Spend", tier: tiers[d], avgWeekly: dmaStats[d]?.avgWeekly || 0, spend: params.budget / ((lowSpendDMAs.length + highSpendDMAs.length * params.spendMultiplier) * params.weeks) })),
        ...highSpendDMAs.map(d => ({ dma: d, group: "High Spend", tier: tiers[d], avgWeekly: dmaStats[d]?.avgWeekly || 0, spend: (params.budget / ((lowSpendDMAs.length + highSpendDMAs.length * params.spendMultiplier) * params.weeks)) * params.spendMultiplier })),
      ]
      : testDMAs.map(d => ({ dma: d, group: "Test", tier: tiers[d], avgWeekly: dmaStats[d]?.avgWeekly || 0, spend: params.budget / (testDMAs.length * params.weeks) }))
    ),
  ];

  const sortCol = tableSort.col, sortDir = tableSort.dir;
  const sortedRows = [...assignmentRows].sort((a, b) => {
    const av = a[sortCol], bv = b[sortCol];
    const res = typeof av === "number" ? av - bv : String(av).localeCompare(String(bv));
    return sortDir === "asc" ? res : -res;
  });

  const toggleSort = (col) => setTableSort(prev =>
    prev.col === col ? { col, dir: prev.dir === "asc" ? "desc" : "asc" } : { col, dir: "asc" }
  );

  // Time series chart data
  const testSeries = aggregateGroupSeries(dmaStats, testDMAs);
  const ctrlSeries = aggregateGroupSeries(dmaStats, controlDMAs);
  const numWeeks = Math.max(testSeries.length, ctrlSeries.length);
  const rawChartData = Array.from({ length: numWeeks }, (_, i) => ({
    week: `W${i + 1}`,
    test: Math.round(testSeries[i] || 0),
    control: Math.round(ctrlSeries[i] || 0),
  }));
  const base0test = testSeries[0] || 1, base0ctrl = ctrlSeries[0] || 1;
  const indexedChartData = rawChartData.map(d => ({
    week: d.week,
    test: Math.round((d.test / base0test) * 100),
    control: Math.round((d.control / base0ctrl) * 100),
  }));

  // Tier distribution
  const testTierDist = testDMAs.reduce((a, d) => { a[tiers[d]] = (a[tiers[d]] || 0) + 1; return a; }, {});
  const ctrlTierDist = controlDMAs.reduce((a, d) => { a[tiers[d]] = (a[tiers[d]] || 0) + 1; return a; }, {});
  const tierChartData = [1, 2, 3, 4].map(t => ({
    tier: `T${t}`, test: testTierDist[t] || 0, control: ctrlTierDist[t] || 0,
  }));

  // Quality gates
  const gates = [
    { label: "Pearson Correlation ≥ 0.85", value: corr, pass: corr >= 0.85, tooltip: TOOLTIPS.correlation },
    { label: "Volume Difference ≤ 15%", value: `${((1 - volSim) * 100).toFixed(1)}%`, pass: volSim >= 0.85, tooltip: TOOLTIPS.volumeSimilarity },
    { label: "DOW Similarity ≥ 0.90", value: dowSim, pass: dowSim >= 0.90, tooltip: TOOLTIPS.dowSimilarity },
    { label: "Composite Score ≥ 0.85", value: composite, pass: composite >= 0.85, tooltip: TOOLTIPS.compositeScore },
  ];
  const allPass = gates.every(g => g.pass);
  const failedGates = gates.filter(g => !g.pass);

  // CSV export
  const exportCSV = () => {
    const header = ["DMA", "Group", "Tier", "Avg Weekly Metric", "Weekly Spend"].join(",");
    const rows = sortedRows.map(r =>
      [r.dma, r.group, r.tier, Math.round(r.avgWeekly), Math.round(r.spend)].join(",")
    );
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "geo-lift-design.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  // Slack Canvas markdown
  const copyMarkdown = () => {
    const lines = [
      `# Geo-Lift Test Design`,
      `**KPI:** ${kpi === "traffic" ? "Organic + Direct Traffic" : "Team Creates"} | **Design:** ${params.testCells === 3 ? `3-Cell Dose-Response (${params.spendMultiplier}x)` : "2-Cell Standard"}`,
      `**Budget:** $${params.budget.toLocaleString()} | **Duration:** ${params.weeks} weeks | **MDE:** ${params.mde}% | **α:** ${params.alpha}`,
      ``,
      `## Match Quality`,
      `| Metric | Score | Status |`,
      `|---|---|---|`,
      `| Correlation | ${corr.toFixed(3)} | ${corr >= 0.85 ? "✅" : "❌"} |`,
      `| Volume Similarity | ${volSim.toFixed(3)} | ${volSim >= 0.85 ? "✅" : "❌"} |`,
      `| DOW Similarity | ${dowSim.toFixed(3)} | ${dowSim >= 0.90 ? "✅" : "❌"} |`,
      `| Composite | ${composite.toFixed(3)} | ${composite >= 0.85 ? "✅" : "❌"} |`,
      ``,
      `## DMA Assignments`,
      `| DMA | Group | Tier | Avg Weekly | Weekly Spend |`,
      `|---|---|---|---|---|`,
      ...sortedRows.map(r => `| ${r.dma} | ${r.group} | T${r.tier} | ${Math.round(r.avgWeekly).toLocaleString()} | $${Math.round(r.spend).toLocaleString()} |`),
    ];
    navigator.clipboard.writeText(lines.join("\n"));
  };

  const cardStyle = { padding: "20px 24px", borderRadius: 8, border: `1px solid ${COLORS.lightGray}`, backgroundColor: COLORS.white };
  const sectionLabel = { fontSize: 15, fontWeight: 700, color: COLORS.darkGray, marginBottom: 14 };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Re-run button */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={() => { setResult(null); setPhase("setup"); }} style={{
          padding: "7px 16px", borderRadius: 4, border: `1px solid ${COLORS.lightGray}`,
          backgroundColor: COLORS.white, color: COLORS.darkGray, fontSize: 13, cursor: "pointer",
          fontFamily: "'Lato', sans-serif",
        }}>← Edit DMA Selection</button>
      </div>

      {/* A: Design Summary */}
      <div style={cardStyle}>
        <div style={sectionLabel}>Design Summary</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {[
            { label: "KPI", value: kpi === "traffic" ? "Organic + Direct Traffic" : "Team Creates" },
            { label: "Test Design", value: params.testCells === 3 ? `3-Cell (${params.spendMultiplier}x)` : "2-Cell Standard" },
            { label: "Duration", value: `${params.weeks} weeks` },
            { label: "Total Budget", value: `$${params.budget.toLocaleString()}` },
            { label: "Test DMAs", value: testDMAs.length },
            { label: "Control DMAs", value: controlDMAs.length },
            { label: "MDE Target", value: `${params.mde}%` },
            { label: "Significance (α)", value: params.alpha },
          ].map(({ label, value }) => (
            <div key={label} style={{
              padding: "12px 14px", borderRadius: 6, backgroundColor: COLORS.offWhite,
              border: `1px solid ${COLORS.lightGray}`,
            }}>
              <div style={{ fontSize: 11, color: COLORS.mediumGray, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.aubergine }}>{value}</div>
            </div>
          ))}
        </div>
        {params.testCells === 3 && (
          <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {[
              { label: "Control DMAs", count: controlDMAs.length, spend: "$0/wk", color: COLORS.mediumGray, bg: COLORS.offWhite },
              { label: "Low Spend DMAs", count: lowSpendDMAs.length, spend: `$${Math.round(params.budget / ((lowSpendDMAs.length + highSpendDMAs.length * params.spendMultiplier) * params.weeks)).toLocaleString()}/wk`, color: COLORS.aubergine, bg: "#F6EDF6" },
              { label: "High Spend DMAs", count: highSpendDMAs.length, spend: `$${Math.round((params.budget / ((lowSpendDMAs.length + highSpendDMAs.length * params.spendMultiplier) * params.weeks)) * params.spendMultiplier).toLocaleString()}/wk`, color: COLORS.aubergineDark, bg: "#E8D5F5" },
            ].map(c => (
              <div key={c.label} style={{ padding: "10px 14px", borderRadius: 6, backgroundColor: c.bg, border: `1px solid ${COLORS.lightGray}`, textAlign: "center" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: c.color, textTransform: "uppercase", letterSpacing: "0.05em" }}>{c.label}</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: c.color, margin: "4px 0" }}>{c.count}</div>
                <div style={{ fontSize: 12, color: c.color }}>{c.spend}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* E: Export (put near top for discoverability) */}
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={exportCSV} style={{
          padding: "8px 18px", borderRadius: 4, border: `1px solid ${COLORS.lightGray}`,
          backgroundColor: COLORS.white, color: COLORS.darkGray, fontSize: 13, fontWeight: 700,
          cursor: "pointer", fontFamily: "'Lato', sans-serif",
        }}>⬇ Download CSV</button>
        <button onClick={copyMarkdown} style={{
          padding: "8px 18px", borderRadius: 4, border: `1px solid ${COLORS.lightGray}`,
          backgroundColor: COLORS.white, color: COLORS.darkGray, fontSize: 13, fontWeight: 700,
          cursor: "pointer", fontFamily: "'Lato', sans-serif",
        }}>📋 Copy for Slack Canvas</button>
      </div>

      {/* C: Match Quality */}
      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 14 }}>
          <span style={sectionLabel}>Match Quality Report</span>
          <Tooltip content={TOOLTIPS.compositeScore}><span /></Tooltip>
        </div>
        {!allPass && (
          <div style={{
            marginBottom: 14, padding: "12px 16px", borderRadius: 8,
            backgroundColor: COLORS.lightYellowBg, border: `1px solid #F0DFB8`, fontSize: 13, color: COLORS.darkGray,
          }}>
            <strong>⚠ {failedGates.length} quality gate{failedGates.length > 1 ? "s" : ""} failed.</strong>{" "}
            {failedGates.map(g => g.label.split("≥")[0].split("≤")[0].trim()).join(", ")}{" "}
            {corr < 0.85 && " — try increasing the DMA pool or re-running with a different random seed."}
            {volSim < 0.85 && " — consider adjusting the control:test ratio or excluding outlier DMAs."}
            {dowSim < 0.90 && " — DOW mismatch may indicate mixed market types; review tier composition."}
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
          {gates.map(g => <QualityGate key={g.label} {...g} />)}
        </div>
        {/* Tier distribution chart */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.darkGray }}>Tier Distribution</span>
          <Tooltip content={TOOLTIPS.tier}><span /></Tooltip>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={tierChartData} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.lightGray} vertical={false} />
            <XAxis dataKey="tier" tick={{ fontSize: 12, fill: COLORS.mediumGray, fontFamily: "Lato" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: COLORS.mediumGray, fontFamily: "Lato" }} axisLine={false} tickLine={false} />
            <RechartsTooltip contentStyle={{ fontSize: 12, fontFamily: "Lato", border: `1px solid ${COLORS.lightGray}`, borderRadius: 6 }} />
            <Legend wrapperStyle={{ fontSize: 12, fontFamily: "Lato" }} />
            <Bar dataKey="test" name="Test" fill={COLORS.aubergine} radius={[3, 3, 0, 0]} />
            <Bar dataKey="control" name="Control" fill={COLORS.blue} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* D: Time Series Charts */}
      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 4 }}>
          <span style={sectionLabel}>Pre-Period Time Series</span>
          <Tooltip content={TOOLTIPS.preTimeSeries}><span /></Tooltip>
        </div>
        <div style={{ fontSize: 12, color: COLORS.mediumGray, marginBottom: 14 }}>Raw weekly metric — test group vs control group</div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={rawChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.lightGray} />
            <XAxis dataKey="week" tick={{ fontSize: 11, fill: COLORS.mediumGray, fontFamily: "Lato" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: COLORS.mediumGray, fontFamily: "Lato" }} axisLine={false} tickLine={false} width={60}
              tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v} />
            <RechartsTooltip contentStyle={{ fontSize: 12, fontFamily: "Lato", border: `1px solid ${COLORS.lightGray}`, borderRadius: 6 }} />
            <Legend wrapperStyle={{ fontSize: 12, fontFamily: "Lato" }} />
            <Line type="monotone" dataKey="test" name="Test" stroke={COLORS.aubergine} strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="control" name="Control" stroke={COLORS.blue} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
        <div style={{ marginTop: 24, display: "flex", alignItems: "center", marginBottom: 4 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.darkGray }}>Indexed to Week 1 = 100</span>
          <Tooltip content={TOOLTIPS.indexedTimeSeries}><span /></Tooltip>
        </div>
        <div style={{ fontSize: 12, color: COLORS.mediumGray, marginBottom: 14 }}>Relative trend comparison — lines should track closely</div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={indexedChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.lightGray} />
            <XAxis dataKey="week" tick={{ fontSize: 11, fill: COLORS.mediumGray, fontFamily: "Lato" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: COLORS.mediumGray, fontFamily: "Lato" }} axisLine={false} tickLine={false} domain={["auto", "auto"]} />
            <RechartsTooltip contentStyle={{ fontSize: 12, fontFamily: "Lato", border: `1px solid ${COLORS.lightGray}`, borderRadius: 6 }} />
            <Legend wrapperStyle={{ fontSize: 12, fontFamily: "Lato" }} />
            <Line type="monotone" dataKey="test" name="Test (indexed)" stroke={COLORS.aubergine} strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="control" name="Control (indexed)" stroke={COLORS.blue} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* B: DMA Assignment Table */}
      <div style={cardStyle}>
        <div style={sectionLabel}>DMA Assignment Table</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ backgroundColor: COLORS.offWhite }}>
                {[
                  { col: "dma", label: "DMA" },
                  { col: "group", label: "Group" },
                  { col: "tier", label: "Tier" },
                  { col: "avgWeekly", label: "Avg Weekly Metric" },
                  { col: "spend", label: "Weekly Spend" },
                ].map(({ col, label }) => (
                  <th key={col} onClick={() => toggleSort(col)} style={{
                    padding: "9px 12px", textAlign: "left", borderBottom: `1px solid ${COLORS.lightGray}`,
                    fontSize: 11, fontWeight: 700, color: COLORS.mediumGray, textTransform: "uppercase",
                    letterSpacing: "0.05em", cursor: "pointer", userSelect: "none",
                    whiteSpace: "nowrap",
                  }}>
                    {label} {tableSort.col === col ? (tableSort.dir === "asc" ? "▲" : "▼") : "↕"}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((row, i) => {
                const groupColor = row.group === "Control" ? COLORS.mediumGray
                  : row.group === "High Spend" ? COLORS.aubergineDark : COLORS.aubergine;
                const groupBg = row.group === "Control" ? COLORS.offWhite
                  : row.group === "High Spend" ? "#E8D5F5" : "#F6EDF6";
                return (
                  <tr key={row.dma + row.group} style={{ backgroundColor: i % 2 === 0 ? COLORS.white : COLORS.offWhite }}>
                    <td style={{ padding: "8px 12px", borderBottom: `1px solid ${COLORS.lightGray}`, fontFamily: "monospace", fontSize: 12, color: COLORS.darkGray }}>{row.dma}</td>
                    <td style={{ padding: "8px 12px", borderBottom: `1px solid ${COLORS.lightGray}` }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4, backgroundColor: groupBg, color: groupColor }}>
                        {row.group}
                      </span>
                    </td>
                    <td style={{ padding: "8px 12px", borderBottom: `1px solid ${COLORS.lightGray}`, color: COLORS.mediumGray }}>T{row.tier}</td>
                    <td style={{ padding: "8px 12px", borderBottom: `1px solid ${COLORS.lightGray}`, fontFamily: "monospace", fontSize: 12, color: COLORS.darkGray }}>{Math.round(row.avgWeekly).toLocaleString()}</td>
                    <td style={{ padding: "8px 12px", borderBottom: `1px solid ${COLORS.lightGray}`, fontFamily: "monospace", fontSize: 12, color: row.spend > 0 ? COLORS.darkGray : COLORS.mediumGray }}>
                      {row.spend > 0 ? `$${Math.round(row.spend).toLocaleString()}` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 8, fontSize: 12, color: COLORS.mediumGray }}>
          {sortedRows.length} markets total · click any column header to sort
        </div>
      </div>
    </div>
  );
}

// ─── Methodology Page ─────────────────────────────────────────────────
function MethodologyPage({ onBack }) {
  const sectionStyle = {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    border: `1px solid ${COLORS.lightGray}`,
    padding: "28px 32px",
    marginBottom: 24,
  };
  const h2Style = {
    fontSize: 18,
    fontWeight: 700,
    color: COLORS.darkGray,
    marginBottom: 12,
    marginTop: 0,
  };
  const h3Style = {
    fontSize: 15,
    fontWeight: 700,
    color: COLORS.aubergine,
    marginBottom: 8,
    marginTop: 20,
  };
  const pStyle = {
    fontSize: 14,
    color: COLORS.darkGray,
    lineHeight: 1.65,
    marginBottom: 12,
    marginTop: 0,
  };
  const pillStyle = (bg, fg) => ({
    display: "inline-block",
    backgroundColor: bg,
    color: fg,
    borderRadius: 4,
    padding: "2px 10px",
    fontSize: 12,
    fontWeight: 700,
    marginRight: 8,
    verticalAlign: "middle",
  });
  const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 13,
    marginTop: 12,
  };
  const thStyle = {
    textAlign: "left",
    padding: "8px 12px",
    backgroundColor: COLORS.offWhite,
    borderBottom: `2px solid ${COLORS.lightGray}`,
    fontWeight: 700,
    color: COLORS.darkGray,
  };
  const tdStyle = {
    padding: "8px 12px",
    borderBottom: `1px solid ${COLORS.lightGray}`,
    color: COLORS.darkGray,
    verticalAlign: "top",
  };

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 32px 60px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "24px 0 28px" }}>
        <button onClick={onBack}
          style={{
            background: "none", border: "none", cursor: "pointer", fontSize: 13,
            color: COLORS.blue, fontFamily: "'Lato', sans-serif", padding: 0,
          }}>← Back</button>
        <span style={{ color: COLORS.lightGray }}>|</span>
        <span style={{ fontSize: 20, fontWeight: 700, color: COLORS.darkGray }}>Methodology</span>
      </div>

      {/* Overview */}
      <div style={sectionStyle}>
        <h2 style={h2Style}>What is a Geo-Lift Test?</h2>
        <p style={pStyle}>
          A geo-lift test (also called a matched-market experiment) is a controlled experiment that measures the
          true incremental impact of a marketing campaign by splitting geographic markets into a <strong>test
          group</strong> (which receives the campaign) and a <strong>control group</strong> (which does not).
          After the test period, the difference in performance between the two groups — after accounting for
          organic trends — estimates the campaign's causal effect on your chosen metric.
        </p>
        <p style={pStyle}>
          Unlike attribution models, which rely on statistical correlations and can be confounded by selection
          bias, a geo-lift test provides near-experimental evidence of causality because the treatment is
          randomly assigned at the market level.
        </p>
      </div>

      {/* Tool Workflow */}
      <div style={sectionStyle}>
        <h2 style={h2Style}>How This Tool Works</h2>
        <p style={pStyle}>
          The planner guides you through three stages to produce a statistically rigorous, operationally
          practical test design:
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 8 }}>
          {[
            {
              stage: "Stage 1",
              title: "Upload & Validate Data",
              bg: COLORS.lightBlueBg,
              fg: COLORS.blue,
              body: "You provide historical daily metric data at the DMA level. The tool validates data quality — checking for sufficient history (minimum 8 weeks), missing markets, date continuity, and volume floors. Strong historical data is the foundation of a reliable test design.",
            },
            {
              stage: "Stage 2",
              title: "Scenario Planning",
              bg: COLORS.lightYellowBg,
              fg: "#B07C1A",
              body: "You specify constraints — budget, number of markets, test duration, and your target minimum detectable effect (MDE). The recommendation engine solves for the optimal design that achieves your statistical power target (default 80%) within your constraints.",
            },
            {
              stage: "Stage 3",
              title: "Test Design & Market Matching",
              bg: COLORS.lightGreenBg,
              fg: COLORS.green,
              body: "The Monte Carlo matching engine tests 10,000 random combinations of control DMAs and selects the combination that best mirrors the test group's historical behaviour. The output is a deployment-ready market list with match quality metrics and diagnostic charts.",
            },
          ].map(({ stage, title, bg, fg, body }) => (
            <div key={stage} style={{
              display: "flex", gap: 16, padding: "16px 20px",
              backgroundColor: bg, borderRadius: 8,
            }}>
              <div style={{ minWidth: 90 }}>
                <span style={pillStyle(fg, COLORS.white)}>{stage}</span>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.darkGray, marginBottom: 4 }}>{title}</div>
                <p style={{ ...pStyle, marginBottom: 0 }}>{body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Data Requirements */}
      <div style={sectionStyle}>
        <h2 style={h2Style}>Data Requirements</h2>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Requirement</th>
              <th style={thStyle}>Minimum</th>
              <th style={thStyle}>Recommended</th>
              <th style={thStyle}>Why It Matters</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["History length", "8 weeks", "13–26 weeks", "Needed to estimate stable day-of-week and trend patterns for matching"],
              ["Granularity", "Daily", "Daily", "Weekly data cannot capture day-of-week seasonality, reducing match quality"],
              ["Geographic unit", "DMA", "DMA", "DMAs are the standard US media planning unit; the tool is calibrated around ~210 US DMAs"],
              ["Markets", "20 DMAs", "50+ DMAs", "More markets means more candidate control pools and stronger matching options"],
              ["Metric type", "Any numeric count", "Traffic or conversions", "The KPI affects power calculations; high-variance KPIs (e.g. team creates) require more markets or longer tests"],
            ].map(([req, min, rec, why], i) => (
              <tr key={i}>
                <td style={{ ...tdStyle, fontWeight: 700 }}>{req}</td>
                <td style={tdStyle}>{min}</td>
                <td style={tdStyle}>{rec}</td>
                <td style={tdStyle}>{why}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Statistical Design */}
      <div style={sectionStyle}>
        <h2 style={h2Style}>Statistical Design</h2>

        <h3 style={h3Style}>Minimum Detectable Effect (MDE)</h3>
        <p style={pStyle}>
          The MDE is the smallest true lift your test is designed to detect. A 10% MDE means: if the
          campaign genuinely causes a 10% increase in your metric, this test design will detect it
          (given the chosen power). Smaller MDEs require more statistical power, which means more markets,
          longer tests, or larger budgets.
        </p>
        <p style={pStyle}>
          <strong>Rule of thumb:</strong> for most brand and acquisition campaigns, a 10–15% MDE is
          realistic. If your prior campaigns have shown lifts in the 5–8% range, you will need a substantially
          larger test.
        </p>

        <h3 style={h3Style}>Statistical Power</h3>
        <p style={pStyle}>
          Power is the probability of detecting a real effect when one exists. At 80% power, there is a 1-in-5
          chance of a false negative — running a campaign that works but getting an inconclusive result.
          The tool's recommendation engine searches for designs that achieve at least 80% power.
        </p>

        <h3 style={h3Style}>Significance Level (Alpha)</h3>
        <p style={pStyle}>
          Alpha is the false-positive rate — the probability of concluding a campaign worked when it
          actually didn't. The default is α = 0.10 (10%). Geo tests commonly relax this from the
          academic standard of 0.05 because the small number of geographic markets makes achieving
          strict significance thresholds difficult. Using α = 0.10 is a practical trade-off that keeps
          tests actionable.
        </p>

        <h3 style={h3Style}>Two-Cell vs. Three-Cell Designs</h3>
        <p style={pStyle}>
          A <strong>2-cell design</strong> has one treatment group and one control group. It answers the
          question: does the campaign produce any lift?
        </p>
        <p style={pStyle}>
          A <strong>3-cell design</strong> adds a second treatment group at a higher spend level. It answers
          the additional question: does doubling spend produce proportionally more lift, or are there
          diminishing returns? Three-cell tests require roughly 50% more markets and budget but provide
          richer insight for budget allocation decisions.
        </p>
      </div>

      {/* Monte Carlo Matching */}
      <div style={sectionStyle}>
        <h2 style={h2Style}>Monte Carlo Market Matching</h2>
        <p style={pStyle}>
          Once test markets are selected, the tool must find the best possible set of control markets.
          The matching algorithm works as follows:
        </p>
        <ol style={{ paddingLeft: 20, margin: "8px 0 12px" }}>
          {[
            "Markets are stratified into four tiers based on metric volume (Tier 1 = smallest 25%, Tier 4 = largest 25%). This ensures the control pool represents a similar distribution of market sizes as the test group.",
            "10,000 random candidate control groups are drawn, with each draw respecting the tier distribution of the test markets.",
            "Each candidate is scored on three dimensions: correlation of historical trends (weight: 50%), similarity of total metric volume (weight: 20%), and similarity of day-of-week patterns (weight: 30%).",
            "The candidate with the highest composite score is selected as the control group.",
          ].map((step, i) => (
            <li key={i} style={{ fontSize: 14, color: COLORS.darkGray, lineHeight: 1.65, marginBottom: 8 }}>{step}</li>
          ))}
        </ol>
        <p style={pStyle}>
          This brute-force approach is deliberately simple: it avoids complex optimisation heuristics that can
          overfit to noise, and the 10,000-sample search space is large enough to find near-optimal solutions
          for typical US DMA pools.
        </p>
      </div>

      {/* Quality Gates */}
      <div style={sectionStyle}>
        <h2 style={h2Style}>Interpreting Match Quality</h2>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Metric</th>
              <th style={thStyle}>Strong</th>
              <th style={thStyle}>Acceptable</th>
              <th style={thStyle}>Concerning</th>
              <th style={thStyle}>What It Measures</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Correlation", "≥ 0.90", "0.85–0.89", "< 0.85", "Whether test and control trend together historically"],
              ["Volume similarity", "≤ 5%", "5–15%", "> 15%", "Whether the two groups have similar total metric scale"],
              ["Day-of-week similarity", "≥ 0.95", "0.90–0.94", "< 0.90", "Whether both groups follow the same weekly seasonality pattern"],
              ["Composite score", "≥ 0.90", "0.85–0.89", "< 0.85", "Weighted blend of the three metrics above"],
            ].map(([metric, strong, ok, bad, desc], i) => (
              <tr key={i}>
                <td style={{ ...tdStyle, fontWeight: 700 }}>{metric}</td>
                <td style={{ ...tdStyle, color: COLORS.green, fontWeight: 700 }}>{strong}</td>
                <td style={{ ...tdStyle, color: "#B07C1A", fontWeight: 700 }}>{ok}</td>
                <td style={{ ...tdStyle, color: COLORS.red, fontWeight: 700 }}>{bad}</td>
                <td style={tdStyle}>{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ ...pStyle, marginTop: 16 }}>
          <strong>Parallel trends</strong> are the central validity assumption of a geo-lift test: in the
          absence of the campaign, test and control markets would have followed the same trajectory. The
          time series charts on the output page let you visually inspect whether this assumption holds
          historically. If the lines diverge materially in the pre-period, consider resampling or adjusting
          the DMA selection.
        </p>
      </div>

      {/* Limitations */}
      <div style={sectionStyle}>
        <h2 style={h2Style}>Limitations & Caveats</h2>
        <ul style={{ paddingLeft: 20, margin: 0 }}>
          {[
            "This tool is designed for US DMA-level analysis. Non-US geographies or non-DMA units (postal codes, states) can be used but may require adjusting market counts and quality thresholds.",
            "Power calculations use simplified analytical approximations. The Monte Carlo simulation selects the best available match but cannot guarantee a perfect match if the data does not support one.",
            "Geo tests measure incremental lift during the test period in the test markets. Results may not generalise perfectly to other markets, time periods, or spend levels.",
            "The tool does not account for spillover (campaign effects leaking into nearby control markets). For campaigns with strong geographic spillover (e.g. national TV), consider using more distant or non-adjacent markets as controls.",
            "Results are not a substitute for full test-and-control analysis after the campaign runs. This tool designs the experiment; a separate analysis is required to read out results.",
          ].map((item, i) => (
            <li key={i} style={{ fontSize: 14, color: COLORS.darkGray, lineHeight: 1.65, marginBottom: 8 }}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────────
export default function GeoLiftPlanner() {
  const [stage, setStage] = useState(1);
  const [showMethodology, setShowMethodology] = useState(false);
  const [fileData, setFileData] = useState(null);
  const [mapping, setMapping] = useState({ dateCol: "", geoCol: "", metricCol: "" });
  const [detected, setDetected] = useState({});
  const [kpi, setKpi] = useState("traffic");
  const [validationResults, setValidationResults] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [designParams, setDesignParams] = useState(null);

  const handleFileLoaded = useCallback((data) => {
    setFileData(data);
    setConfirmed(false);
    setValidationResults(null);
    const det = detectColumns(data.headers, data.rows);
    setDetected(det);
    setMapping({ dateCol: det.dateCol || "", geoCol: det.geoCol || "", metricCol: det.metricCol || "" });
  }, []);

  const handleConfirmMapping = () => {
    if (!mapping.dateCol || !mapping.geoCol || !mapping.metricCol) return;
    const results = validateData(fileData.rows, mapping.dateCol, mapping.geoCol, mapping.metricCol);
    setValidationResults(results);
    setConfirmed(true);
  };

  const handleGenerateDesign = (params) => {
    setDesignParams(params);
    setStage(3);
  };

  return (
    <div style={{ fontFamily: "'Lato', sans-serif", backgroundColor: COLORS.offWhite, minHeight: "100vh" }}>
      {/* Load Lato */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Lato:wght@400;700;900&display=swap');`}</style>

      {/* Header */}
      <div style={{
        backgroundColor: COLORS.aubergine, padding: "14px 32px",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <span style={{ fontSize: 22, fontWeight: 900, color: COLORS.white, letterSpacing: "-0.02em" }}>#</span>
        <span style={{ fontSize: 16, fontWeight: 700, color: COLORS.white }}>Geo-Lift Test Planner</span>
        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginLeft: 4 }}>
          {showMethodology ? "Methodology" : stage === 1 ? "Upload Data" : stage === 2 ? "Scenario Planner" : "Test Design"}
        </span>
        <button
          onClick={() => setShowMethodology(!showMethodology)}
          style={{
            marginLeft: "auto", background: "none", border: `1px solid rgba(255,255,255,0.4)`,
            borderRadius: 4, cursor: "pointer", fontSize: 13, fontWeight: 600,
            color: showMethodology ? COLORS.white : "rgba(255,255,255,0.85)",
            fontFamily: "'Lato', sans-serif", padding: "4px 12px",
            backgroundColor: showMethodology ? "rgba(255,255,255,0.15)" : "transparent",
            transition: "background-color 0.15s",
          }}
        >
          Methodology
        </button>
      </div>

      {/* Content */}
      {showMethodology && <MethodologyPage onBack={() => setShowMethodology(false)} />}
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 32px 60px", display: showMethodology ? "none" : undefined }}>
        <Stepper currentStage={stage} />

        {/* Stage 1 */}
        {stage === 1 && (
          <div>
            <GuidancePanel />

            {!fileData && <FileDropzone onFileLoaded={handleFileLoaded} />}

            {fileData && !confirmed && (
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "12px 16px",
                  borderRadius: 8, backgroundColor: COLORS.lightGreenBg, border: `1px solid #B8E0CC`,
                }}>
                  <span style={{ fontSize: 16 }}>✅</span>
                  <span style={{ fontSize: 14, color: COLORS.darkGray }}>
                    <strong>{fileData.fileName}</strong> loaded — {fileData.rows.length.toLocaleString()} rows, {fileData.headers.length} columns
                  </span>
                  <button onClick={() => { setFileData(null); setValidationResults(null); setConfirmed(false); }}
                    style={{
                      marginLeft: "auto", background: "none", border: "none", cursor: "pointer",
                      fontSize: 12, color: COLORS.blue, fontFamily: "'Lato', sans-serif",
                    }}>Upload different file</button>
                </div>

                <DataPreview headers={fileData.headers} rows={fileData.rows} />

                <div style={{
                  padding: "24px", borderRadius: 8, border: `1px solid ${COLORS.lightGray}`,
                  backgroundColor: COLORS.white,
                }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.darkGray, marginBottom: 16 }}>
                    Confirm Column Mapping
                  </div>
                  <ColumnMapper
                    headers={fileData.headers}
                    detected={detected}
                    mapping={mapping}
                    setMapping={setMapping}
                  />
                  <div style={{ marginTop: 20 }}>
                    <KPISelector kpi={kpi} setKpi={setKpi} />
                  </div>
                  <button
                    onClick={handleConfirmMapping}
                    disabled={!mapping.dateCol || !mapping.geoCol || !mapping.metricCol}
                    style={{
                      marginTop: 20, padding: "10px 24px", borderRadius: 4, border: "none",
                      cursor: mapping.dateCol && mapping.geoCol && mapping.metricCol ? "pointer" : "not-allowed",
                      backgroundColor: mapping.dateCol && mapping.geoCol && mapping.metricCol ? COLORS.aubergine : COLORS.lightGray,
                      color: COLORS.white, fontSize: 14, fontWeight: 700,
                      fontFamily: "'Lato', sans-serif", transition: "background-color 0.15s",
                    }}
                  >
                    Confirm Mapping & Validate
                  </button>
                </div>
              </div>
            )}

            {confirmed && validationResults && (
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "12px 16px",
                  borderRadius: 8, backgroundColor: COLORS.lightGreenBg, border: `1px solid #B8E0CC`,
                }}>
                  <span style={{ fontSize: 16 }}>✅</span>
                  <span style={{ fontSize: 14, color: COLORS.darkGray }}>
                    <strong>{fileData.fileName}</strong> — mapping confirmed
                  </span>
                  <button onClick={() => { setConfirmed(false); setValidationResults(null); }}
                    style={{
                      marginLeft: "auto", background: "none", border: "none", cursor: "pointer",
                      fontSize: 12, color: COLORS.blue, fontFamily: "'Lato', sans-serif",
                    }}>Edit mapping</button>
                </div>

                <ValidationResults results={validationResults} />

                <button
                  onClick={() => setStage(2)}
                  style={{
                    padding: "12px 24px", borderRadius: 4, border: "none", cursor: "pointer",
                    backgroundColor: COLORS.aubergine, color: COLORS.white, fontSize: 15, fontWeight: 700,
                    fontFamily: "'Lato', sans-serif", alignSelf: "flex-start", transition: "background-color 0.15s",
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = COLORS.aubergineDark}
                  onMouseLeave={(e) => e.target.style.backgroundColor = COLORS.aubergine}
                >
                  Continue to Scenario Planner →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Stage 2 */}
        {stage === 2 && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
              <button onClick={() => setStage(1)}
                style={{
                  background: "none", border: "none", cursor: "pointer", fontSize: 13,
                  color: COLORS.blue, fontFamily: "'Lato', sans-serif",
                }}>← Back to Upload</button>
            </div>
            <ScenarioPlanner
              validationResults={validationResults}
              kpi={kpi}
              onGenerate={handleGenerateDesign}
            />
          </div>
        )}

        {/* Stage 3 */}
        {stage === 3 && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
              <button onClick={() => setStage(2)}
                style={{
                  background: "none", border: "none", cursor: "pointer", fontSize: 13,
                  color: COLORS.blue, fontFamily: "'Lato', sans-serif",
                }}>← Back to Scenario Planner</button>
            </div>
            <TestDesignOutput
              params={designParams}
              rows={fileData?.rows}
              mapping={mapping}
              kpi={kpi}
            />
          </div>
        )}
      </div>
    </div>
  );
}
