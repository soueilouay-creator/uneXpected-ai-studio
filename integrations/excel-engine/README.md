# uneXpected Excel Engineering Engine

The server-side XLSX worker is part of a general-purpose spreadsheet workflow alongside the desktop VBA toolkit and macro-free Excel methods.

## Engine provenance

- Library: [Excelize](https://github.com/qax-os/excelize)
- Pinned module: `github.com/xuri/excelize/v2 v2.11.1-0.20261029001137-c5fd73bde8f6`
- Upstream source commit: `c5fd73bde8f611a2f9c30eaf7b0494f2189cb79a` (2026-10-29)
- Release state: this is a pre-tag source revision containing the security hardening listed for the planned v2.11.1 release; the formal tag is scheduled for 2026-11-02 and is not claimed as already released.
- License: BSD 3-Clause; see LICENSE.
- Go requirement: 1.26.0 or later.

Excelize is consumed as a dependency. No upstream implementation files are copied into this repository.

## Operations

Build the CLI from this directory:

    go build -o bin/ux-excel ./cmd/ux-excel

Inspect a workbook with a bounded streaming preview:

    bin/ux-excel inspect --input ./sample.xlsx --preview-rows 10

Generate a workbook using a JSON spec:

    {
      "sheets": [
        {
          "name": "Overview",
          "headers": ["ID", "Name", "Status"],
          "rows": [["R-001", "Example", "Open"]]
        }
      ]
    }

    bin/ux-excel generate --input-spec ./workbook.json --output ./new-workbook.xlsx

The generator writes scalar values and a basic formatted header row. It does not currently insert formulas, tables, charts, validations or arbitrary styles. It does not execute VBA, macros, DDE or external connections; formula calculation must be verified in a compatible spreadsheet application.

## Native provider workflow

The Node server exposes native client-function tools to:
- OpenAI Responses API: `excel_inspect` and `excel_generate`
- Anthropic Messages API: `excel_inspect` and `excel_generate`

A user uploads a workbook to authenticated `POST /excel/upload`. The UI keeps the returned file reference in memory and passes it in the `excelFiles` field to `POST /orchestrate`. Only workbook IDs attached to that request may be inspected. The model sees bounded sheet previews, not the complete workbook bytes. Generated workbooks are returned as authenticated short-lived artifacts via `GET /excel/download/{id}`.

The provider round-trip tests in CI use mocked provider responses; they verify tool schema delivery, actual worker execution, tool results, artifact download and workbook read-back. Live OpenAI and Anthropic calls are not claimed by those tests. OpenRouter and Local mode do not support attached workbook tools; the gateway must not claim a text-only fallback inspected a workbook.

## Guardrails and parser preflight

- Inspection accepts .xlsx only and rejects files outside the 1-byte to 20-MiB range.
- The ZIP central directory is checked before Excelize opens the file: maximum 4,096 entries, 64 MiB total declared uncompressed size, and 8 MiB per XML/relationships part. Zip64 values are read as unsigned 64-bit sizes and rejected before Excelize converts or allocates them.
- Shared-string cells are prechecked. Negative, malformed or out-of-range shared-string indices are rejected before the reader consumes them.
- Excelize decompression is capped at 64 MiB, with worksheet/shared-string XML capped at 8 MiB.
- Workbooks are limited to 20 sheets, 50,000 observed rows per sheet and 100 columns.
- CLI previews are limited to 20 rows; native provider previews are limited to 10 rows per sheet.
- Generation accepts 1 to 20 uniquely named sheets, 1 to 100 unique non-empty headers per sheet, and no more than 50,000 data rows or 100 values per row.
- Uploads and generated artifacts are limited to 20 MiB each. A process can hold at most 12 temporary items / 80 MiB.
- Temporary uploaded workbooks and artifacts expire after 30 minutes. Files are process-local and are not shared across server replicas or restarts.
- The Node UI holds only file references in memory, not workbook bytes in browser backups.
- Output must be .xlsx; an existing output file is never overwritten.
- Do not log cell contents or persist uploaded workbooks.

### Upstream security scope

The pinned upstream pre-tag commit is the Excelize source revision associated with the planned v2.11.1 security fixes. The worker also restricts its exposed method surface to ZIP preflight, worksheet iteration, cell reads and new workbook generation. It does not call pivot-table, slicer, conditional-formatting retrieval, decryption or formula-calculation APIs. This is defense-in-depth, not a claim that every Excel or OOXML risk is eliminated.

## Related specialist material

- Coordinator instructions: agent/EXCEL_COORDINATOR.md
- Worker contracts: agent/TOOL_CONTRACTS.md
- Excel specialist: ../../specialists/excel/AGENT.md
- Routing: ../../specialists/excel/ROUTING.md
- Seven reusable skills: ../../specialists/excel/skills/
- Existing VBA library: ../excel-vba-kit/

## Verification boundary

Go tests verify worker behavior. Node tests verify the HTTP and mocked provider-tool boundaries. The Docker build proves production-image packaging. These checks do not execute Microsoft Excel desktop, validate every Excel feature or activate the separate uneXpected v7 agent registry.
