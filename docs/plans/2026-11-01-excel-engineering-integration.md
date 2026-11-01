# Excel Engineering Integration Implementation Plan

> **For agentic workers:** Use the host's available task-by-task implementation workflow. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a secure Excelize-based server worker, link it to the existing Node service, and teach the Excel specialist to route workbook tasks across Excelize, VBA and macro-free techniques.

**Architecture:** A Go 1.25+ worker pinned to Excelize v2.11.0 exposes bounded inspect and generate commands. Node.js invokes it using fixed arguments and temporary files through authenticated routes. The Excel coordinator's instructions and skill catalogue guide Excel-related model calls, while the existing desktop VBA toolkit remains a separate engine.

**Tech Stack:** Go 1.25, Excelize v2.11.0 (BSD 3-Clause), Node.js 22, built-in Node HTTP/child-process/file APIs, GitHub Actions, Docker multi-stage build.

## Global Constraints

- Keep changes on `feature/excel-vba-toolkit`; do not merge to `main` or deploy.
- Do not execute macros, formulas, external links, DDE, embedded objects or user-supplied code.
- Accept only `.xlsx` in the first upload endpoint; write new `.xlsx` outputs only.
- Enforce 20 MiB input, 64 MiB unzip, 8 MiB worksheet/shared-string XML, 20 worksheets, 50,000 rows per sheet, 100 columns, maximum 20 preview rows, 1 MiB JSON request and 30-second worker timeout.
- Require bearer authorization and existing rate limiting for all Excel API routes.
- Never overwrite source files, expose filesystem paths, persist uploaded workbooks, or log cell contents.
- Use fixed executable paths and argument arrays; never spawn a shell using user input.
- Excelize does not execute VBA and does not replace Excel's full formula calculation engine.
- Load Excel coordinator guidance for Excel-related OpenAI/Anthropic requests. Specialist files remain role/skill specifications until the separate v7 registry host is updated and verified.
- Preserve Excelize BSD 3-Clause and existing VBA toolkit MIT provenance.

---

### Task 1: Excelize workbook engine and CLI

**Files:**
- Create: `integrations/excel-engine/go.mod`
- Create: `integrations/excel-engine/go.sum`
- Create: `integrations/excel-engine/LICENSE`
- Create: `integrations/excel-engine/internal/workbook/workbook.go`
- Create: `integrations/excel-engine/internal/workbook/workbook_test.go`
- Create: `integrations/excel-engine/cmd/ux-excel/main.go`
- Test: `integrations/excel-engine/internal/workbook/workbook_test.go`

**Interfaces:**
- `WorkbookSpec{Sheets []SheetSpec}`
- `SheetSpec{Name string; Headers []string; Rows [][]any}`
- `GenerateWorkbook(outputPath string, spec WorkbookSpec) error`
- `InspectWorkbook(inputPath string, previewRows int) (Inspection, error)`
- CLI: `ux-excel inspect --input PATH --preview-rows N`
- CLI: `ux-excel generate --input-spec PATH --output PATH`

- [ ] **Step 1: Add focused failing Go tests**

Test a two-sheet workbook round-trip; assert sheet names, data row counts, max column counts and bounded previews. Assert empty sheet list, duplicate/blank sheet names, more than 20 sheets, more than 50,000 rows, more than 100 columns, invalid preview limits and invalid/non-XLSX input return errors without creating an output file.

- [ ] **Step 2: Verify red**

Run: `cd integrations/excel-engine && go test ./...`
Expected: failure because workbook types and functions are not implemented.

- [ ] **Step 3: Implement the minimum worker**

Pin `github.com/xuri/excelize/v2 v2.11.0`. Use Excelize streaming `Rows` iteration for inspection. Open input with explicit unzip limits. Create workbooks with a reusable header style; set supplied values only. Do not calculate formulas.

- [ ] **Step 4: Verify green**

Run: `cd integrations/excel-engine && go test ./...`
Expected: all workbook unit tests pass.

- [ ] **Step 5: Verify CLI**

Run: `go run ./cmd/ux-excel --help` and CLI round-trip fixture commands.
Expected: valid JSON inspection and a readable generated XLSX.

- [ ] **Step 6: Commit**

`feat: add bounded Excelize workbook engine`

### Task 2: Authenticated Node API and integration tests

**Files:**
- Create: `excel-engine.mjs`
- Create: `test/excel-engine.test.mjs`
- Modify: `server.js`
- Test: `test/excel-engine.test.mjs`

**Interfaces:**
- `runExcelWorker(args, options)` invokes `EXCEL_WORKER_PATH` or `/app/bin/ux-excel` with `execFile`.
- `POST /excel/inspect`: raw `.xlsx` body; returns the worker inspection JSON.
- `POST /excel/generate`: JSON `WorkbookSpec`; returns XLSX bytes with the correct MIME type and a safe attachment name.

- [ ] **Step 1: Add HTTP tests**

Test missing/wrong bearer token (401); valid XLSX inspection (200 JSON); non-ZIP/invalid XLSX (400); request beyond 20 MiB (413); malformed generate spec (400); valid generate (200 XLSX MIME + ZIP signature); worker missing/timeout (502); and temporary directory cleanup after both success and failure.

- [ ] **Step 2: Verify red**

Run: `node --test test/excel-engine.test.mjs`
Expected: missing route or worker integration assertions fail.

- [ ] **Step 3: Implement API**

Reuse timing-safe `authorized` and `rateLimited`. Read at most the exact body limit. Create one temporary directory per request. Spawn the worker with fixed command and path arguments, no shell. Always remove the directory in `finally`. Return generic bounded errors, never cell values or paths in server logs.

- [ ] **Step 4: Verify green**

Run: `EXCEL_WORKER_PATH=./integrations/excel-engine/bin/ux-excel node --test test/excel-engine.test.mjs` after building the worker.
Expected: every route assertion passes.

- [ ] **Step 5: Run existing Node tests**

Run: `node --test test/*.test.mjs`
Expected: no regression in existing service tests.

- [ ] **Step 6: Commit**

`feat: expose authenticated Excel workbook operations`

### Task 3: Coordinator, routing and reusable Excel skills

**Files:**
- Create: `integrations/excel-engine/agent/EXCEL_COORDINATOR.md`
- Create: `integrations/excel-engine/agent/TOOL_CONTRACTS.md`
- Create: `specialists/excel/AGENT.md`
- Create: `specialists/excel/ROUTING.md`
- Create: `specialists/excel/skills/workbook-inspection/SKILL.md`
- Create: `specialists/excel/skills/data-quality/SKILL.md`
- Create: `specialists/excel/skills/formula-engineering/SKILL.md`
- Create: `specialists/excel/skills/report-generation/SKILL.md`
- Create: `specialists/excel/skills/large-workbook-processing/SKILL.md`
- Create: `specialists/excel/skills/vba-desktop-automation/SKILL.md`
- Create: `specialists/excel/skills/output-verification/SKILL.md`
- Modify: `specialists/excel-vba/AGENT.md`
- Modify: `specialists/excel-vba/ROUTING.md`
- Modify: `integrations/excel-engine/manifest.json`
- Modify: `server.js`
- Test: `test/excel-engine.test.mjs`

**Interfaces:**
- Excel guidance is loaded from `integrations/excel-engine/agent/EXCEL_COORDINATOR.md` and appended only for Excel-related model requests.
- Coordinator maps tasks to `excel_inspect`, `excel_generate`, macro-free spreadsheet methods or desktop VBA, and records when the host has not exposed a callable tool.
- Skill catalogue contains seven focused task procedures with inputs, outputs, safety and verification expectations.

- [ ] **Step 1: Add tests for routing guidance**

Assert the guidance file is loaded into both provider system instructions for Excel tasks, is absent for unrelated tasks, and the routing manifest links every skill file and both execution engines.

- [ ] **Step 2: Verify red**

Run: `node --test test/excel-engine.test.mjs`
Expected: coordinator-loading and routing-catalog assertions fail before implementation.

- [ ] **Step 3: Implement coordinator and skills**

Write each skill as an executable workflow specification, not a claim that a separate agent process exists. Update the existing VBA specialist to point to the shared coordinator. Preserve industry-neutral routing.

- [ ] **Step 4: Verify green**

Run: `node --test test/excel-engine.test.mjs`
Expected: coordinator guidance and manifest links pass.

- [ ] **Step 5: Commit**

`feat: coordinate Excelize and VBA specialist skills`

### Task 4: Build, CI and release evidence

**Files:**
- Modify: `Dockerfile`
- Modify: `.github/workflows/excel-vba-kit.yml`
- Modify: `README.md`
- Modify: `integrations/excel-engine/README.md`
- Create: `test/fixtures/excel-engine/workbook-spec.json`

- [ ] **Step 1: Add packaging assertions**

Check Docker worker copy path, Go version/dependency pin, CI Go test/build steps, license file, API limits, skill references and honest runtime boundary.

- [ ] **Step 2: Verify red**

Run: `node --test test/excel-engine.test.mjs`
Expected: packaging assertions fail before Docker/CI/documentation updates.

- [ ] **Step 3: Implement multi-stage build and CI**

Build worker using `golang:1.25-alpine`; copy binary into the existing Node runtime image. Add Go tests, binary build, Node integration tests and existing static tests to CI.

- [ ] **Step 4: Verify green**

Run: `node --test test/*.test.mjs`; `cd integrations/excel-engine && go test ./...`; and wait for GitHub Actions workflow to finish.
Expected: test commands and Docker image build pass.

- [ ] **Step 5: Remote read-back**

Fetch the changed files from the feature branch and compare the branch head/status. Confirm the workflow run is green.

- [ ] **Step 6: Commit**

`build: package and verify the Excel engineering engine`

---

## Unresolved operational boundary

The repository currently contains a Node.js/Render service and role documentation, but no verified v7 registry loader or Excel attachment UI. This implementation adds authenticated worker endpoints and supplies coordinator guidance to model calls; registration in the separate v7 runtime, user-facing file-picker integration, real Render deployment and Microsoft Excel desktop testing require separate evidence and are not implied by CI.
