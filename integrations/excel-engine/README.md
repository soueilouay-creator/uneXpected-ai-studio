# uneXpected Excel Engineering Engine

This package adds server-side workbook operations beside the existing desktop VBA toolkit.

## Engine provenance

- Library: [Excelize](https://github.com/qax-os/excelize)
- Pinned module: `github.com/xuri/excelize/v2 v2.11.0`
- Release commit: `90ff348959dd842cbf3a4fbd93a78afbe18db476`
- License: BSD 3-Clause; see [LICENSE](./LICENSE).
- Go requirement: 1.25.0 or later.

Excelize is consumed as a dependency. No upstream implementation files are copied into this repository.

## Operations

Build the CLI:

```sh
go build -o bin/ux-excel ./cmd/ux-excel
```

Inspect a workbook with a bounded streaming preview:

```sh
bin/ux-excel inspect --input ./sample.xlsx --preview-rows 10
```

Generate a workbook using a JSON spec:

```json
{
  "sheets": [
    {
      "name": "Overview",
      "headers": ["ID", "Name", "Status"],
      "rows": [["R-001", "Example", "Open"]]
    }
  ]
}
```

```sh
bin/ux-excel generate --input-spec ./workbook.json --output ./new-workbook.xlsx
```

The generator writes values and a formatted header row. It does not execute VBA, macros, DDE, external connections or workbook formulas; formula calculation must be verified in a compatible spreadsheet application.

## Guardrails

- Inspection accepts `.xlsx` only and rejects files outside the 1-byte to 20-MiB range.
- Excelize decompression is capped at 64 MiB, with worksheet/shared-string XML capped at 8 MiB.
- Workbooks are limited to 20 sheets, 50,000 observed rows per sheet and 100 columns.
- Previews are limited to 20 rows.
- Generation accepts 1 to 20 uniquely named sheets, 1 to 100 unique non-empty headers per sheet, and no more than 50,000 data rows or 100 values per row.
- Output must be `.xlsx`; an existing output file is never overwritten.
- The Node service uses per-request temporary directories and removes them after the response.
- Do not log cell contents or persist uploads.

## Related specialist material

- [Excel coordinator instructions](./agent/EXCEL_COORDINATOR.md)
- [Tool contracts](./agent/TOOL_CONTRACTS.md)
- [Excel specialist](../../specialists/excel/AGENT.md)
- [Routing rules](../../specialists/excel/ROUTING.md)
- [Implementation plan](../../docs/plans/2026-11-01-excel-engineering-integration.md)

## Verification boundary

Go tests verify worker behavior. Node tests verify the HTTP boundary. The Docker build proves packaging. These checks do not execute Microsoft Excel desktop and do not activate the separate uneXpected v7 agent registry by themselves.
