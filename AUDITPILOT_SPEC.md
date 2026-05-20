# AuditPilot — Complete Project Specification

**Version:** 1.0.0  
**Type:** Desktop Application (Electron + React)  
**Purpose:** Automated QA audit tool for multilingual content validation across web pages, driven by structured Excel input.  
**Automation Engine:** Playwright (headless Chromium) embedded inside Electron  
**Target Users:** QA teams at companies managing multilingual web content (SaaS, e-commerce, CMS)

---

## 1. Product Overview

AuditPilot is a desktop automation tool that:

1. Accepts an Excel (.xlsx) file with rows describing multilingual page variants
2. Lets the user configure exactly which rows and columns to process
3. Builds a visual flow that gets executed per row: open URL → check page content → check button text → check button redirect URL
4. Outputs a pass/fail audit report as a downloadable Excel file

The tool is **not locked** to one fixed audit logic. Users can define reusable "Widget" blocks (e.g., Open URL, Find Text, Find Button, Match URL) and connect them into a flow. This makes AuditPilot a **general-purpose visual QA automation builder**, not a one-trick script.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Desktop shell | **Electron** (latest stable) |
| Frontend UI | **React 18** + **Vite** |
| Styling | **Tailwind CSS** + custom design tokens |
| Automation engine | **Playwright** (headless Chromium, Node.js API) |
| Excel read/write | **SheetJS (xlsx)** |
| State management | **Zustand** |
| Flow builder | **React Flow** (node-based visual canvas) |
| IPC (Electron ↔ UI) | Electron `ipcMain` / `ipcRenderer` |
| Storage | Local JSON files via `electron-store` |
| Notifications | Electron native notifications |

---

## 3. Application Architecture

```
auditpilot/
├── electron/
│   ├── main.js              # Electron entry, window setup, IPC handlers
│   ├── automation/
│   │   ├── runner.js        # Playwright orchestrator — runs flow per row
│   │   ├── widgets/         # One file per widget type (executor logic)
│   │   │   ├── openUrl.js
│   │   │   ├── findText.js
│   │   │   ├── findButton.js
│   │   │   └── matchRedirectUrl.js
│   │   └── reporter.js      # Builds pass/fail Excel output
│   └── preload.js           # Context bridge for IPC
│
├── src/
│   ├── App.jsx
│   ├── pages/
│   │   ├── Home.jsx         # Landing / project dashboard
│   │   ├── Upload.jsx       # Excel upload + row/column selector
│   │   ├── FlowBuilder.jsx  # Visual flow canvas (React Flow)
│   │   ├── RunMonitor.jsx   # Live run progress per row
│   │   └── Report.jsx       # Final pass/fail results + export
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.jsx
│   │   │   └── TopBar.jsx
│   │   ├── upload/
│   │   │   ├── FileDropzone.jsx
│   │   │   ├── RowRangeSelector.jsx
│   │   │   └── ColumnPicker.jsx
│   │   ├── flow/
│   │   │   ├── WidgetNode.jsx       # React Flow custom node
│   │   │   ├── WidgetPanel.jsx      # Drag-from sidebar
│   │   │   └── EdgeConnector.jsx
│   │   ├── monitor/
│   │   │   ├── ProgressTable.jsx
│   │   │   └── LiveLog.jsx
│   │   └── report/
│   │       ├── ResultsTable.jsx
│   │       └── ExportButton.jsx
│   ├── store/
│   │   ├── projectStore.js  # Zustand — current project state
│   │   └── flowStore.js     # Zustand — flow nodes/edges
│   └── utils/
│       ├── excelParser.js
│       └── ipcBridge.js
│
├── package.json
├── vite.config.js
└── electron-builder.config.js
```

---

## 4. Core Concepts

### 4.1 Project

A **Project** is a saved configuration containing:
- Path to the Excel file
- Selected row ranges
- Selected columns (and their roles)
- The built flow (nodes + edges)
- Past run history

Multiple projects can be saved and reopened from the Home screen.

### 4.2 Row Range Selector

Users enter row ranges as text inputs, not by clicking cells. Examples:
- Single range: `1–100`
- Multiple ranges: `1–100, 106–202, 250–300`

Gaps between ranges are intentional and respected. Rows outside selected ranges are skipped entirely.

Row numbers correspond to Excel row numbers (1-indexed, including header).

### 4.3 Column Role Assignment

After uploading Excel, user sees a table preview of the first 5 rows. Each column shows its header. User assigns a **role** to each column they want to use:

| Role | Description |
|---|---|
| `language` | Language code or name (e.g., `en`, `fr`, `nl`) |
| `page_url` | Full URL of the page to audit |
| `expected_content` | Text string that should appear on the page |
| `button_name` | Text label of the button to find |
| `button_redirect_url` | URL the button should navigate to |
| `ignore` | Column is skipped |

User can map any column to any role. This makes the tool work with any Excel schema.

### 4.4 Widget System

A **Widget** is a flow step that performs one atomic action and returns pass/fail. Available widgets:

#### Widget: Open URL
- **Input:** Column mapped to `page_url`
- **Action:** Playwright opens the URL in headless Chromium
- **Pass condition:** Page loads with HTTP 200, no timeout
- **Fail condition:** Timeout, 4xx/5xx, network error
- **Output to next widget:** Playwright `page` object (live browser context)

#### Widget: Find Text
- **Input:** Column mapped to `expected_content`, Playwright `page` from previous step
- **Action:** Searches visible page text (innerText) for the expected string
- **Pass condition:** Text found (case-insensitive match by default; option for exact match)
- **Fail condition:** Text not found on page
- **Config options:** Case sensitive toggle, partial vs exact match toggle

#### Widget: Find Button
- **Input:** Column mapped to `button_name`, Playwright `page`
- **Action:** Searches for a button/link/CTA with matching visible text
- **Pass condition:** Element with that text found and is visible
- **Fail condition:** No matching element found, or element hidden
- **Config options:** Element type filter (button, a, any clickable), visibility check toggle

#### Widget: Match Redirect URL
- **Input:** Column mapped to `button_redirect_url`, Playwright `page`, button element from Find Button step
- **Action:** Clicks the button, waits for navigation, captures final URL after all redirects
- **Pass condition:** Final URL matches expected redirect URL (configurable: exact or contains)
- **Fail condition:** URL mismatch, navigation error, no redirect
- **Config options:** Match type (exact, starts-with, contains), timeout setting

#### Widget: Screenshot on Fail (optional)
- **Input:** Playwright `page`
- **Action:** Captures screenshot only when the row fails
- **Output:** Screenshot saved to project folder, path included in report

### 4.5 Flow Execution

The runner processes rows sequentially:

```
For each selected row:
  1. Read column values per assigned roles
  2. Execute each widget node in flow order (left → right / top → bottom)
  3. If a widget fails AND "stop on fail" is ON → mark row FAIL, skip remaining widgets, move to next row
  4. If a widget fails AND "stop on fail" is OFF → continue, record which widgets failed
  5. After all widgets → row result = PASS (all passed) or FAIL (any failed)
  6. Emit IPC event → UI updates live progress table
  7. Close browser context for this row (new context per row for isolation)
```

Concurrency: **1 row at a time** by default (safe, predictable). Optional: configurable parallel workers (2–4) for faster runs, shown as an advanced setting.

---

## 5. UI / UX Specification

### 5.1 Overall Visual Design

- **Theme:** Dark mode primary, light mode toggle available
- **Color palette:**
  - Background: `#0E0E10`
  - Surface: `#1A1A1F`
  - Border: `#2E2E38`
  - Accent: `#5B8DEF` (blue)
  - Success: `#34D399` (green)
  - Failure: `#F87171` (red)
  - Warning: `#FBBF24`
  - Text primary: `#F4F4F5`
  - Text muted: `#71717A`
- **Typography:** `JetBrains Mono` for data/code values, `DM Sans` for UI text
- **Design principle:** Dense, data-forward, utilitarian — like a dev tool, not a marketing page

### 5.2 Home Screen

- List of saved projects (project name, last run date, row count, pass rate badge)
- "New Project" button → goes to Upload page
- "Open Project" from list → loads saved config and goes to FlowBuilder
- Sidebar: logo, navigation icons (Home, Flow, Run, Report, Settings)

### 5.3 Upload Page

**Step 1 — File Upload**
- Drag-and-drop zone OR "Browse" button for `.xlsx` / `.xls` / `.csv`
- On upload: parse file, show a preview table (first 5 data rows, all columns visible)
- Show total row count

**Step 2 — Row Range Selection**
- Text input: user types ranges like `2–101, 106–202`
- Real-time validation: highlights invalid syntax in red
- Shows count of selected rows (e.g., "196 rows selected")
- Visual mini-bar showing coverage across total rows

**Step 3 — Column Role Assignment**
- Table with one row per column: Column Header | Sample Value | Role Dropdown
- Role dropdown options: language, page_url, expected_content, button_name, button_redirect_url, ignore
- Validation: warn if required roles (page_url) are not assigned
- "Proceed to Flow Builder" button → only enabled when page_url is assigned

### 5.4 Flow Builder Page

- Left panel: **Widget Library** — draggable widget cards (Open URL, Find Text, Find Button, Match Redirect URL, Screenshot on Fail)
- Center canvas: **React Flow** canvas — drop widgets here, connect with edges
- Right panel: **Widget Config** — when a node is selected, shows its config options (match type, case sensitive, timeout, etc.)
- Top bar: Run button (▶), Save Flow button, Clear Canvas button
- Default flow (auto-populated when user arrives from Upload): Open URL → Find Text → Find Button → Match Redirect URL

Flow validation:
- Must start with "Open URL" widget
- Connected widgets only (no orphan nodes allowed to run)
- Warn if `button_redirect_url` column not mapped but "Match Redirect URL" widget is in flow

### 5.5 Run Monitor Page

Triggered when user clicks Run.

- **Top:** Progress bar — `X / Y rows processed`, estimated time remaining
- **Center:** Live scrolling table:
  - Columns: Row # | Language | URL | Content Check | Button Check | Redirect Check | Overall Status
  - Each cell shows: ✅ PASS, ❌ FAIL, ⏳ Running, — Skipped
  - Color coded per status
  - Rows populate in real time as Playwright processes them
- **Bottom:** Live log pane (collapsible) — shows raw execution events ("Row 14: Opening https://...", "Row 14: Button 'Buy Now' found", etc.)
- **Controls:** Pause / Stop buttons
- On completion: "View Report" button appears

### 5.6 Report Page

- **Summary cards at top:** Total Rows | Passed | Failed | Pass Rate %
- **Filter bar:** Show All / Pass / Fail, search by language or URL
- **Results table:** Same columns as monitor, but static and filterable
- **Row detail expand:** Click any row → expand to see per-widget pass/fail detail + screenshot (if captured)
- **Export button:** Downloads `.xlsx` report file

---

## 6. Excel Output Report Format

Output file: `audit_report_YYYY-MM-DD_HHMMSS.xlsx`

Columns in output:
| Column | Description |
|---|---|
| Row # | Original Excel row number |
| Language | Value from language column |
| Page URL | URL that was audited |
| Open URL | PASS / FAIL |
| Find Text | PASS / FAIL / SKIPPED |
| Find Button | PASS / FAIL / SKIPPED |
| Match Redirect | PASS / FAIL / SKIPPED |
| Overall | PASS / FAIL |
| Fail Reason | Human-readable reason for failure (if any) |
| Screenshot Path | Relative path to screenshot file (if captured) |

Formatting:
- PASS cells: green fill (`#D1FAE5`), dark green text
- FAIL cells: red fill (`#FEE2E2`), dark red text
- SKIPPED cells: grey fill
- Header row: dark background, white bold text
- Auto-column width

---

## 7. Settings Page

- **Playwright settings:** Timeout per page load (default 30s), timeout per element wait (default 5s)
- **Run settings:** Stop on first fail (toggle), parallel workers (1–4 slider)
- **Report settings:** Auto-save report location, include screenshots toggle
- **Appearance:** Dark/light mode toggle
- **About:** App version, update check button

---

## 8. IPC Communication (Electron ↔ Renderer)

All automation runs in the **main process** (Node.js) via Playwright. UI is in the renderer (React). Communication via Electron IPC:

| Channel | Direction | Payload |
|---|---|---|
| `run:start` | Renderer → Main | `{ flowConfig, rows, columnMap }` |
| `run:row-result` | Main → Renderer | `{ rowIndex, results, status }` |
| `run:log` | Main → Renderer | `{ message, level }` |
| `run:complete` | Main → Renderer | `{ summary }` |
| `run:pause` | Renderer → Main | — |
| `run:stop` | Renderer → Main | — |
| `report:export` | Renderer → Main | `{ reportData, outputPath }` |
| `file:open-dialog` | Renderer → Main | — |
| `file:parse-excel` | Main → Renderer | `{ headers, rows, totalCount }` |

---

## 9. Error Handling

- **Page load fail:** Log error with HTTP status, mark Open URL as FAIL, skip remaining widgets for that row
- **Element not found:** Mark widget FAIL, log selector used and page URL
- **Redirect mismatch:** Log expected vs actual URL
- **Network offline:** Pause run, show offline banner in UI, offer resume
- **Excel parse fail:** Show error on Upload page with specific reason
- **Playwright crash:** Auto-restart Playwright browser instance, retry current row once

---

## 10. Build & Distribution

- **Build tool:** `electron-builder`
- **Platforms:** Windows (NSIS installer), macOS (DMG), Linux (AppImage)
- **Auto-update:** `electron-updater` (optional, Phase 2)
- **Code signing:** Required for macOS (Phase 2)

---

## 11. Development Phases

### Phase 1 — Core MVP
- [ ] Electron + React + Vite scaffold
- [ ] Excel upload + parse + preview
- [ ] Row range + column role selector
- [ ] Default hardcoded flow (Open URL → Find Text → Find Button → Match Redirect)
- [ ] Playwright runner (sequential, 1 row at a time)
- [ ] Live monitor table
- [ ] Excel report export
- [ ] Basic settings (timeouts)

### Phase 2 — Visual Flow Builder
- [ ] React Flow canvas
- [ ] Widget drag-and-drop from sidebar
- [ ] Widget config panel
- [ ] Custom flow save/load
- [ ] Screenshot on fail widget

### Phase 3 — Polish + Distribution
- [ ] Dark/light mode
- [ ] Parallel workers setting
- [ ] Project history dashboard
- [ ] electron-builder packaging for Win/Mac/Linux
- [ ] Auto-updater

---

## 12. Non-Functional Requirements

- **Performance:** Handle up to 10,000 rows without memory issues (stream rows, don't load all into memory)
- **Accuracy:** Playwright full browser rendering ensures JS-rendered content is checked, not just raw HTML
- **Reliability:** Each row runs in an isolated Playwright browser context — one row's failure cannot affect another
- **No cloud dependency:** Fully offline after installation. No data leaves the machine.
- **Startup time:** App should be ready within 3 seconds on a standard machine

---

## 13. Folder Naming & Conventions

- Components: PascalCase (`WidgetNode.jsx`)
- Utilities: camelCase (`excelParser.js`)
- IPC channels: `domain:action` kebab-case (`run:start`)
- Zustand stores: `useXxxStore` hook pattern
- Widget executors in `electron/automation/widgets/` export a single async function: `async execute(page, config, rowData) → { pass: boolean, reason: string }`

---

*End of AuditPilot Specification — v1.0.0*
