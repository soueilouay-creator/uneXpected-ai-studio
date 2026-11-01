# Excel report generation

**Use for:** reports, trackers, templates, dashboard-ready workbooks, tables, formatting and charts.

1. Clarify audience and the decisions the report should support.
2. Inspect/define schema, types, units and update cadence.
3. Separate raw data, calculations and presentation where useful.
4. Use clear hierarchy, readable date/number formats, filters and charts only when useful.
5. Generate a new workbook from a defined spec; never overwrite the input.
6. Reopen and verify sheet names, headers, row counts and representative values.

**Current API:** creates named sheets, headers, values and a styled header row. It does not yet expose pivot tables, slicers, chart editing, images, data validation or conditional formatting. Do not claim unsupported features.

**Output:** new workbook, structure summary, assumptions and evidence.
