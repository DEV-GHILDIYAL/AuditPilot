# 🤖 AuditPilot

```text
       ___             __ _ _   ___  _ _      _   
      / _ \  /\  /\   / _(_) |_/ _ \(_) | ___| |_ 
     / /_)/ / /_/ /  / /_| | __/ /_)/ | |/ _ \ __|
    / ___/ / __  /  / ___| | |_/ ___/| | |  __/ |_ 
    \/     \/ /_/   /_/  |_|\__\/    |_|_|\___|\__|
                                                   
```

> **Automated multilingual content QA for web pages**

---

## What It Does

**AuditPilot** is an offline-first desktop automation client designed to streamline web localization QA and structural compliance checks. Users upload their localization matrices as standard Excel sheets, configure the target row range and column-to-widget mappings, and launch localized visual flow checks. Powered by an underlying headless Playwright browser pool, the application automates navigation, inspects localized textual copy, validates CTA buttons, verifies redirect paths, and exports beautiful, color-coded diagnostic spreadsheets containing results and automatic failure screenshots.

---

## Features

- **Visual Flow Builder**: Easily construct custom localization verification logic using a modular, drag-and-drop node graph interface.
- **Playwright Headless Automation**: Runs fully isolated Chromium sessions in the background to emulate realistic JS-rendered browsing conditions.
- **Multilingual Support**: Supports comprehensive UTF-8 language checks for checking target translated copy.
- **Parallel Workers**: A customizable concurrent worker pool (1–4 threads) that divides large spreadsheets to speed up automation processing.
- **Screenshot on Fail**: Captures viewport evidence at the precise millisecond of a failing step, saving files to local folders and linking them to reports.
- **Excel Report Export**: Automatic compilation of color-coded (green/red/gray) SheetJS reports detailing granular pass/fail states for audit runs.
- **Dark/Light Mode**: Sleek dark and light interfaces to adapt perfectly to high-contrast daylight auditing or low-light work environments.

---

## Download

Get the latest pre-compiled production build of AuditPilot for Windows:

👉 **[Download AuditPilot Installer (.exe)](https://github.com/DEV-GHILDIYAL/AuditPilot/releases/latest)**

> [!NOTE]
> **No technical expertise required.** The installation package includes the embedded engine, visual UI, and browser bundle. You do not need to install Node.js, Git, or Playwright on your system.

---

## How to Use

1. **Download & Install**: Download the `.exe` installer from the release assets and run it to install AuditPilot on your Windows workstation.
2. **Upload localization matrix**: Open the app, create a project, and drop your target translation spreadsheet (`.xlsx`, `.xls`, or `.csv`) into the Upload panel.
3. **Configure range & mappings**: Define your row boundaries (e.g., `2-50, 60-75`) and select the column header roles (which columns hold the language tags, landing URLs, expected texts, or CTA buttons).
4. **Assemble or verify flow**: Navigate to the Flow Builder to arrange validation steps, or use the default preset steps.
5. **Run the Audit**: Go to the Run Monitor page, launch execution, watch the progress streams in real-time, and download the finished audit sheet.

---

## Excel Format Schema

To parse your Excel sheets seamlessly, ensure they match or map to the following column definitions:

| Column Role Name | Target Content Description | Example Value |
| :--- | :--- | :--- |
| **`language`** | Standard country locale or language identifier | `fr-FR` |
| **`page_url`** | The landing URL that Playwright should navigate to | `https://example.com/fr` |
| **`expected_content`** | Text string to find on the target page | `Bienvenue sur notre site` |
| **`button_name`** | Text label of the primary button to find and click | `Commencer` |
| **`button_redirect_url`**| Expected URL after clicking the button above | `https://example.com/fr/signup` |

---

## Local Development

To run the codebase locally, execute the following commands in order:

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run in Development Mode**:
   Launch concurrently the Vite local server and the Electron application instance:
   ```bash
   npm run dev
   ```

3. **Run Localization Test Server**:
   Start the local localized site to test widgets offline against a structured environment:
   ```bash
   npm run test-server
   ```

4. **Verify Application Production Build**:
   Compiles Vite resources and packages the Electron project into an application bundle:
   ```bash
   npm run package
   ```

---

## Tech Stack

- **Desktop Shell**: [Electron](https://www.electronjs.org/)
- **UI Architecture**: [React](https://react.dev/)
- **Build Engine**: [Vite](https://vite.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Automation Core**: [Playwright Node](https://playwright.dev/)
- **Sheet Processing**: [SheetJS (xlsx)](https://sheetjs.com/)
- **Node Graph**: [React Flow (@xyflow/react)](https://reactflow.dev/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.