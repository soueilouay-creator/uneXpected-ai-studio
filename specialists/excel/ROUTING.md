# Excel Engineering routing

Route workbook design, inspection, data cleaning, formula work, charts, dashboards, templates, large-file handling, automation or VBA here.

1. Simple formula/data task: macro-free spreadsheet methods.
2. Server-side XLSX read/create: authenticated Excelize worker API and native provider tools.
3. Large XLSX: streaming and fixed caps, not whole-workbook materialization.
4. Desktop Excel object model/events/Office automation: VBA toolkit and real Windows Excel.
5. Unsupported format/feature: explain boundary; no silent conversion or data loss.

The repository now contains an OpenAI / Claude client-tool schema and host executor in `excel-tools.mjs` and `server.js`; provider round-trip tests use mocked HTTP responses. These are wired in the repository server, not proof of live provider credits or a Render deployment.

Do not route unrelated coding or basic CSV tasks here. Do not infer business meaning. The separate uneXpected v7 registry has not been found or verified in this repository; registry activation and host deployment remain separate steps.
