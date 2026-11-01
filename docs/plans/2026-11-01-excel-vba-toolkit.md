# Excel VBA Toolkit Implementation Plan

> Implementation record for the isolated `feature/excel-vba-toolkit` branch.

**Goal:** Add a provenance-tracked Excel VBA source package and specialist role specification without changing existing uneXpected orchestration behavior.

**Architecture:** Importable VBA modules live under `integrations/excel-vba-kit/`; a manifest and preserved MIT notice record provenance. Specialist guidance lives under `specialists/excel-vba/`. A Node.js 22 static test and dedicated GitHub Actions workflow enforce source-contract and safety checks. VBA execution is not connected to the Node.js/Render service.

**Tech Stack:** VBA 7 / Windows desktop Excel, Node.js 22 built-in test runner, GitHub Actions, GitHub feature branch.

## Constraints

- Keep changes isolated to `feature/excel-vba-toolkit`; do not merge to `main` or deploy Render.
- Preserve upstream MIT attribution and pin the reviewed tree SHA.
- Require explicit Workbook/Worksheet references; make file inventory read-only.
- Never bypass protection, break external links, mutate Outlook state, or overwrite source files.
- Capture and restore every Excel application setting changed by performance helpers.
- Treat specialist documents as specifications, not proof of active runtime registration.
- Node tests are static checks only; Excel compile/runtime verification remains a desktop gate.

## Task 1 — Curated VBA package

**Files:** `integrations/excel-vba-kit/{README.md,LICENSE,manifest.json}`, five modules under `modules/`, and `test/excel-vba-kit.test.mjs`.

**Interfaces:** `UxWorksheetExists(wb, worksheetName)`, `UxLastUsedRow(ws)`, `UxLastUsedColumn(ws)`, `UxFileExists(filePath)`, `UxFolderExists(folderPath)`, `UxSelectFolder(...)`, `UxSelectFile(...)`, `UxListFiles(folderPath, includeSubfolders)`, `UxFindKeywords(textToSearch, keywordRange, delimiter)`, `UxBeginFastMode(state)`, `UxRestoreApplicationState(state)`, and `UxAppendErrorLog(...)`.

- [x] Add a static test for manifest provenance, module import headers, explicit workbook references, safe file operations, reversible application state, and append-only sanitized logging.
- [x] Observe the initial test failure caused by the missing package manifest.
- [x] Add five `.bas` modules with `Option Explicit`, narrow side effects, and explicit object arguments.
- [x] Preserve the upstream MIT license notice and record the reviewed source tree SHA.
- [x] Run the focused Node test; final result: 7 tests passed, 0 failed.

## Task 2 — Specialist profile and safety boundaries

**Files:** `specialists/excel-vba/AGENT.md`, `ROUTING.md`, `SAFETY.md`, plus the focused test.

- [x] Document when to route Excel/VBA tasks and when to prefer macro-free spreadsheet work.
- [x] Require inspection of the actual workbook schema before creating workbook-specific automation.
- [x] Record provenance, approval, backup, safety, and evidence requirements.
- [x] Explicitly state that repository documentation does not activate an external runtime registry.

## Task 3 — CI and repository handoff

**Files:** `.github/workflows/excel-vba-kit.yml`, this plan, and no existing application runtime files.

- [x] Add a workflow scoped to toolkit, specialist, plan, and test paths using Node.js 22.
- [x] Run `node --check test/excel-vba-kit.test.mjs`.
- [x] Run `node --test test/excel-vba-kit.test.mjs`.
- [x] Commit the changes on the feature branch and read back the branch tree and key files.

## Excluded upstream routines

- `RemovePasswords.vba`: attempts to bypass workbook/worksheet protection.
- `BreakExternalLinks.vb`: can permanently sever external links.
- `SaveOutlookAttachments.vba`: changes message read state and risks same-name file collisions.
- `SpeedUp.vb`: changes broad Excel/workbook settings, including link-update behavior; replaced by a narrow reversible helper.

## Verification still required

- Import the modules into a disposable macro-enabled workbook in supported Windows desktop Excel.
- Compile the full VBA project and exercise normal, cancellation, empty-folder, inaccessible-folder, and application-state restoration paths.
- Add the specialist role to the authoritative uneXpected v7 registry only when that registry/package is available to this integration workflow.
- Inspect the actual maintenance workbook schema before creating GMAO-specific macros.

The repository branch contains source, documentation, tests, and CI configuration. It has not been merged into `main`, deployed to Render, imported into desktop Excel, or activated in the separate v7 runtime registry.
