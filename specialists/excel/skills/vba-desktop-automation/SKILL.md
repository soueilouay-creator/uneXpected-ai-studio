# VBA desktop automation

**Use for:** Windows desktop Excel object model, UI, events, COM or installed Office components.

1. Confirm desktop Excel version and macro acceptance.
2. Inspect workbook structure and existing VBA before changing code.
3. Prefer reviewed modules in integrations/excel-vba-kit/modules/.
4. Use explicit workbook/worksheet/range variables; avoid implicit active workbook, active sheet or selection.
5. Capture and restore application state on success and error paths.
6. Work on a copy; require approval for destructive/external actions.
7. Compile and test in real desktop Excel.

Node.js/Render and Excelize do not execute VBA. Static source checks are not compilation.
