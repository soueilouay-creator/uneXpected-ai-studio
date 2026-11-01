# Excel Engineering Integration Design

**Status:** Approved for implementation on `feature/excel-vba-toolkit`
**Date:** 2026-11-01

## Goal

Give uneXpected a coordinated, general-purpose Excel capability that can inspect and generate modern Excel workbooks on the server, retain desktop VBA as a separate execution path, and route tasks through reusable specialist skills with verifiable evidence.

## Architecture

The system has three distinct execution surfaces:

1. **Excelize worker (server-side):** a Go 1.25+ command-line worker using Excelize v2.11.0, pinned by module version. It reads and creates OOXML workbooks in isolated temporary directories. Its first public operations are bounded workbook inspection and structured workbook generation.
2. **Existing VBA toolkit (desktop):** importable `.bas` source for tasks that must run inside Microsoft Excel desktop. It is not executed by Node.js or the Go worker.
3. **Excel Engineering coordinator and skills:** routing instructions loaded into OpenAI/Anthropic system instructions when a task is identified as Excel-related, plus role/skill documentation for host adapters and specialist workflows.

The Node.js service calls the worker with fixed executable paths and argument arrays (never shell interpolation). Authenticated HTTP routes provide inspection and generation. Files are temporary, bounded, and removed in `finally` paths. Generation writes a new file; source workbooks are never overwritten.

## Supported first release

- Input: `.xlsx` inspection only. Macro-enabled and legacy formats are rejected by this first API even though Excelize supports additional OOXML formats.
- Output: `.xlsx` generation from a JSON workbook specification containing named sheets, headers and rows.
- Inspection reports: sheet names, observed row/column counts, bounded row previews and file size.
- Generation: values plus a consistent header style; no formulas are claimed calculated by Excelize.
- Default limits: 20 MiB upload, 64 MiB decompressed archive, 8 MiB per worksheet/shared-string XML, 20 worksheets, 50,000 rows per sheet, 100 columns, 10 preview rows (maximum 20), 1 MiB JSON request, 30-second worker timeout.
- API routes: authenticated `POST /excel/inspect` (raw XLSX body) and `POST /excel/generate` (JSON specification, returns XLSX bytes).

## Routing policy

- Use Excelize for server-side `.xlsx` inspection, structured generation, bounded data processing and large-row streaming.
- Use VBA only when the requested behavior must run inside desktop Excel or use the Excel object model, Office events, desktop UI or installed add-ins.
- Prefer macro-free workbook formulas, tables and Power Query where those satisfy the requirement.
- Use Excel formulas for calculation in the workbook; Excelize formula-writing is not equivalent to Excel's calculation engine. Do not promise formula recalculation without opening in a compatible spreadsheet application.
- Ask for platform/format only when it changes the implementation and is not already known.
- Do not infer industry, employer, workbook schema or business rules. Inspect supplied workbook structure and ask for definitions when necessary.

## Safety and privacy

- Require the existing bearer token on both routes; apply the existing request rate limiter.
- Accept only OOXML `.xlsx` uploads with a valid ZIP signature; do not execute macros, formulas, external links, DDE, embedded objects or workbook content.
- Enforce compressed and decompressed size limits and application-level sheet/row/column/preview caps.
- Use per-request temporary directories, fixed file names and fixed CLI arguments. Remove all temporary files whether the worker succeeds or fails.
- Do not persist uploads, add a general filesystem path parameter, or log workbook cell contents.
- Generated files are returned as downloads and are not saved as durable user records.
- Avoid external network calls from the worker. The Go worker does not access secrets or provider credentials.

## Verification

- Go unit tests cover generation, round-trip inspection, sheet counts, row/column bounds, invalid files, and malformed specs.
- Node integration tests cover bearer authorization, invalid content, body-size limits, worker errors, inspection JSON, generation MIME/bytes, and temporary cleanup.
- CI compiles and tests Go, runs Node's existing and new tests, performs static checks, and builds the multi-stage Docker image.
- CI cannot prove Microsoft Excel desktop compatibility. VBA compile/runtime checks remain separate.
- Repository instructions do not prove registration in the separate uneXpected v7 runtime. Activation there must be verified by registry read-back and a real dispatched Excel task.

## Provenance and licensing

Use upstream Excelize release v2.11.0, tag commit `90ff348959dd842cbf3a4fbd93a78afbe18db476`, under BSD 3-Clause. Pin the Go module requirement and preserve upstream license attribution. Do not copy or modify upstream Excelize implementation source; consume it as a Go dependency. The existing VBA kit remains separately attributed under MIT.

## Explicit boundaries

- No merge to `main`.
- No Render deployment or environment-variable changes.
- No persistent storage or external workbook sharing.
- No claim that Excelize executes VBA or fully calculates Excel formulas.
- No claim that the v7 registry, external agents, or hosted deployment have been activated by repository documentation alone.
