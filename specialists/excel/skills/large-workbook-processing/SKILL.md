# Large Excel workbook processing

**Use for:** large, slow, memory-heavy or many-row workbooks.

1. Establish file size, expected rows, sheet count and processing scope.
2. Prefer Excelize row/streaming APIs; avoid GetRows for unbounded sheets.
3. Apply compressed/decompressed limits, per-sheet row limits, timeouts and bounded previews.
4. Process incrementally and checkpoint only when host supports resumable work.
5. Write new output files and compare counts/key totals.
6. Stop safely when worker limits are exceeded; request a smaller export/chunks instead of silently raising caps.

**Current limits:** 20 MiB upload, 64 MiB decompressed, 8 MiB worksheet/shared-string XML, 20 sheets, 50,000 rows/sheet, 100 columns, 20 preview rows and 30-second timeout. Excel worksheet maximums do not imply this API supports that scale.
