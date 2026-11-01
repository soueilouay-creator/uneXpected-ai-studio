# Excel formula engineering

**Use for:** formulas, calculations, lookups, dynamic arrays and formula debugging.

1. Confirm Excel version/locale when function support or separators matter.
2. Define inputs, outputs, rounding, blank/error handling and units.
3. Prefer structured references and bounded ranges; avoid volatile/full-column formulas unless justified.
4. Explain compatibility and include sample inputs with expected results.
5. Keep formula design, formula insertion and calculation distinct. The current native `excel_generate` tool writes scalar values only and cannot insert formulas. Excelize is not Microsoft's full calculation engine; if a different supported engine inserts a formula, explain that it was written but not recalculated.
6. Verify consequential results in Excel or a compatible calculation engine.

**Output:** formula, explanation, compatibility, test cases and recalculation limits. Never claim validation merely because a formula was written into a workbook.
