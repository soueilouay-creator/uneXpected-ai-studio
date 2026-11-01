# uneXpected Excel Engineering Engine

This package adds server-side workbook operations beside the existing desktop VBA toolkit.

## Engine provenance

- Library: [Excelize](https://github.com/qax-os/excelize)
- Pinned module: github.com/xuri/excelize/v2 v2.11.0
- Release commit: 90ff348959dd842cbf3a4fbd93a78afbe18db476
- License: BSD 3-Clause; see LICENSE.
- Go requirement: 1.25.0 or later.

Excelize is consumed as a dependency. No upstream implementation files are copied into this repository.

## Operations

Build the CLI:

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

The generator writes values and a formatted header row. It does not execute VBA, macros, DDE, external connections or workbook formulas; formula calculation must be verified in a compatible spreadsheet application.

## Guardrails and parser preflight

- Inspection accepts .xlsx only and rejects files outside the 1-byte to 20-MiB range.
- The ZIP central directory is checked before Excelize opens the file: maximum 4,096 entries, 64 MiB total declared uncompressed size, and 8 MiB per XML/relationships part. Zip64 values are read as unsigned 64-bit sizes and rejected before Excelize converts or allocates them.
- Shared-string cells are prechecked. Negative, malformed or out-of-range shared-string indices are rejected before the pinned reader consumes them.
- Excelize decompression is capped at 64 MiB, with worksheet/shared-string XML capped at 8 MiB.
- Workbooks are limited to 20 sheets, 50,000 observed rows per sheet and 100 columns.
- Previews are limited to 20 rows.
- Generation accepts 1 to 20 uniquely named sheets, 1 to 100 unique non-empty headers per sheet, and no more than 50,000 data rows or 100 values per row.
- Output must be .xlsx; an existing output file is never overwritten.
- The Node service uses per-request temporary directories and removes them after the response.
- Do not log cell contents or persist uploads.

### Upstream security scope

Excelize v2.11.0 has upstream advisories affecting some parser/API paths. The worker therefore exposes a deliberately small method surface: XLSX ZIP preflight, worksheet iteration, cell reading, and new workbook generation. It does not call pivot-table, slicer, conditional-formatting retrieval, decryption, formula-calculation, or column-mutation APIs. Do not expand the exposed API surface without reviewing upstream advisories and adding malformed-workbook regression tests. This is defense-in-depth, not a claim that every upstream vulnerability is eliminated.

## Related specialist material

- Coordinator instructions: agent/EXCEL_COORDINATOR.md
- Worker contracts: agent/TOOL_CONTRACTS.md
- Excel specialist: ../../specialists/excel/AGENT.md
- Routing: ../../specialists/excel/ROUTING.md
- Implementation plan: ../../docs/plans/2026-11-01-excel-engineering-integration.md

## Verification boundary

Go tests verify worker behavior. Node tests verify the HTTP boundary. The Docker build proves packaging. These checks do not execute Microsoft Excel desktop and do not activate the separate uneXpected v7 agent registry by themselves.
