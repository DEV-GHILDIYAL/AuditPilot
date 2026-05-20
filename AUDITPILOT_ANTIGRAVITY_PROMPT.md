# AuditPilot — Antigravity Build Prompt

Read the full specification file `AUDITPILOT_SPEC.md` before writing any code. Everything you need — architecture, tech stack, widget logic, IPC channels, UI layout, data flow — is defined there. Treat it as the source of truth.

---

## What You Are Building

AuditPilot is a desktop application (Electron + React + Vite) that automates QA audits of multilingual web content. Users upload an Excel file, select which rows and columns to process, build a visual automation flow using draggable widgets, run it, and get a pass/fail Excel report.

The automation engine uses Playwright (headless Chromium) running inside the Electron main process. The UI runs in the Electron renderer (React 18 + Tailwind CSS). Communication between the two happens via Electron IPC.

---

## Build Phase 1 — What to Build Now

Build Phase 1 (Core MVP) as defined in Section 11 of the spec. This includes:

1. **Project scaffold** — Electron + React + Vite + Tailwind CSS fully wired together. Playwright installed as a Node dependency in the electron side. SheetJS and Zustand installed. React Flow installed.

2. **App shell** — Sidebar navigation, TopBar, dark theme applied globally using the color tokens from Section 5.1. Fonts: DM Sans (UI), JetBrains Mono (data values). Routes: Home, Upload, FlowBuilder (placeholder in Phase 1), RunMonitor, Report.

3. **Home screen** — List of saved projects via `electron-store`. "New Project" button. Empty state when no projects exist.

4. **Upload page** — Three-step flow:
   - Step 1: File dropzone accepting `.xlsx`, `.xls`, `.csv`. On upload, parse using SheetJS via IPC, show preview table (first 5 rows).
   - Step 2: Row range input (text input supporting multi-range like `2–101, 106–202`). Real-time validation. Show selected row count.
   - Step 3: Column role assignment table. One row per column, role dropdown. Validate that `page_url` role is assigned before proceeding.

5. **Default hardcoded flow** — In Phase 1, skip the visual canvas. Instead, auto-run the standard 4-widget flow in sequence: Open URL → Find Text → Find Button → Match Redirect URL. The FlowBuilder page in Phase 1 can be a placeholder that shows this default flow as a static diagram.

6. **Playwright runner** (runs in Electron main process):
   - `runner.js` orchestrates sequential row execution
   - Calls each widget executor in order: `openUrl.js`, `findText.js`, `findButton.js`, `matchRedirectUrl.js`
   - Each widget exports `async execute(page, config, rowData) → { pass: boolean, reason: string }`
   - New Playwright browser context per row
   - Emits IPC events per row result and per log line
   - Respects stop-on-fail setting

7. **Run Monitor page** — Live progress table. Columns: Row # | Language | URL | Content Check | Button Check | Redirect Check | Overall. Updates in real time via IPC. Live log pane at bottom. Pause and Stop buttons.

8. **Report page** — Summary cards (Total, Passed, Failed, Pass Rate). Filterable results table. Export button that calls main process to write `.xlsx` report using SheetJS with color-coded formatting as defined in Section 6.

9. **Settings page** — Timeout settings (page load, element wait). Stop-on-fail toggle. Report save location.

---

## Critical Implementation Rules

**Electron IPC:** All Playwright code runs ONLY in the main process. Never import Playwright in the renderer. Use the IPC channels defined in Section 8 of the spec exactly as specified — channel names must match.

**Excel parsing:** Use SheetJS. Parse happens in main process via IPC. Do not use any server or external API — fully offline.

**Playwright:** Install `playwright` (not `playwright-core`). Run `npx playwright install chromium` as a post-install step. Each row gets its own `browser.newContext()` and `context.newPage()`. Always close the context after the row completes regardless of pass/fail.

**Row isolation:** Failures in one row must never affect other rows. Wrap each row execution in try/catch. If Playwright crashes mid-row, catch it, mark the row as FAIL with reason "runner crash", and continue to next row.

**Excel report output:** Use SheetJS to build the output. Apply cell background colors as defined in Section 6 (green for PASS, red for FAIL, grey for SKIPPED). Auto-fit column widths.

**State management:** Use Zustand. Two stores: `projectStore` (project config, row ranges, column map) and `flowStore` (flow nodes/edges — Phase 2, just scaffold it now).

**No placeholder data:** Do not generate mock/fake rows in the UI. All data must come from the actual uploaded Excel file.

**UI quality:** Follow the design tokens in Section 5.1 exactly. Use `DM Sans` and `JetBrains Mono` from Google Fonts. Apply dark theme globally. The tool is used by QA teams — it must look dense, precise, and professional, not generic.

**File structure:** Follow the folder structure defined in Section 3 of the spec exactly. Do not deviate from it.

---

## What NOT to Do

- Do not add any AI or LLM features — this is a pure automation tool
- Do not use any cloud services, analytics, or telemetry
- Do not build the visual React Flow canvas in Phase 1 (placeholder only)
- Do not use `puppeteer` — use `playwright` only
- Do not use `axios` for page loading — Playwright handles all browser navigation
- Do not load all Excel rows into memory at once for large files — stream/chunk them
- Do not use inline styles — use Tailwind utility classes throughout

---

## Deliverable

At the end of Phase 1, the app must:
1. Launch as an Electron desktop window
2. Accept an Excel file upload
3. Let the user configure row ranges and column roles
4. Run the default 4-step audit flow via Playwright on all selected rows
5. Show live progress during the run
6. Export a color-coded pass/fail Excel report

Start with the scaffold (package.json, Electron main, Vite config, Tailwind config) and confirm it boots before building features.
