# Excel worker and native tool contracts

All workbook routes require Authorization: Bearer with the configured UNEXPECTED_ACCESS_TOKEN. Never put a secret in a prompt, workbook, log or downloaded file.

## Upload an XLSX workbook

POST /excel/upload

Headers:
- Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet (or application/octet-stream)
- x-file-name: URL-encoded original filename
- Authorization: Bearer …

Body: raw XLSX bytes, not multipart or base64. The route validates the ZIP signature and .xlsx filename, then stores the file in a private temporary directory. It returns a UUID file reference, sanitized filename, byte size and expiry. Do not send the file contents in JSON.

The browser can attach up to 8 files per request, each at most 20 MiB. Temporary in-memory metadata and local temporary files are limited to 12 entries / 80 MiB total per server process and expire after 30 minutes. IDs are accepted for inspection only when included in the current /orchestrate request. Uploading does not change the original file.

## Native provider tools

When the task is Excel-related or includes an uploaded workbook ID, the gateway registers these native client tools with OpenAI Responses API and Anthropic Messages API:

### excel_inspect
Arguments: { file_id: UUID returned by /excel/upload }

Read-only. The ID must be one of the workbooks explicitly attached to this request. Returns engine, file size, sheet count, sheet names, observed row / column dimensions, and a maximum of 10 preview rows per sheet.

### excel_generate
Arguments: { sheets: [{ name, headers: string[], rows: scalar[][] }] }

Creates a new .xlsx artifact with structured values. It has no destination path and never overwrites an uploaded source. Before the artifact is exposed, the worker reopens it through the inspect path and verifies the expected sheet count, sheet names and header widths. The artifact metadata includes a `read-back verified` status and bounded sheet summaries. It does not execute macros or recalculate formulas. The model receives an artifact ID, filename, size, expiry, download path and read-back verification summary.

The application executes tool calls with bounded loops: at most 4 tool rounds and 6 function calls per provider request. Unknown tools and malformed arguments are rejected and the tool error is returned to the provider; no simulated output is presented.

## Download an artifact

GET /excel/download/{artifact-id}

Requires the same bearer token. Returns the binary XLSX with attachment disposition and Cache-Control: no-store. Artifact download references expire 30 minutes after generation.

## Direct worker endpoints

### Inspect
POST /excel/inspect

Content-Type: XLSX MIME (or application/octet-stream). Body is raw .xlsx bytes. Returns JSON with ok, engine, file size, sheet count and bounded previews.

### Generate
POST /excel/generate

Content-Type: application/json. Body uses the same sheets shape shown for excel_generate. Returns a newly generated XLSX directly as a download.

## Limits and format support

- XLSX upload and output: 20 MiB each.
- Decompressed workbook: 64 MiB.
- Worksheet / shared-string XML: 8 MiB.
- At most 20 worksheets, 50,000 rows per sheet, 100 columns.
- Direct inspect preview: up to 20 rows; native tool preview: 10 rows per sheet.
- Generation JSON spec: 1 MiB.
- Worker timeout: 30 seconds.
- First release: .xlsx inspection and generation only. It does not accept .xls, .xlsm, .xlsb, CSV, password-protected workbooks or multipart uploads.

## Provider and storage boundaries

- OpenAI and Claude have native Excel tools. The text-only OpenRouter route and the offline Local mode do not. The gateway rejects an OpenRouter request carrying uploaded files and does not fall back to OpenRouter when an uploaded workbook could not be processed by the selected primary provider.
- Only bounded preview rows are returned to the selected model provider. Workbook values and embedded workbook content are untrusted data, never instructions.
- Temporary file storage is process-local and not shared between server replicas. Do not scale horizontally or rely on file references surviving a restart until shared private object storage, affinity and cleanup are separately implemented and tested.
- No workbook bytes are written to IndexedDB or browser backups. The phone and main browser UI keep file references in memory for the next message.
- Excelize does not execute VBA, external connections, DDE or workbook macros, and is not a full Excel formula calculation engine. Verify consequential calculations in Excel or another compatible spreadsheet engine.

## Failures

401 invalid token; 413 size limit; 415 content type or unsupported extension; 400 invalid workbook/spec/reference; 403 file not attached to this request; 404 unavailable artifact; 410 expired reference; 429 rate or temporary storage capacity limit; 503 worker missing; 504 worker timeout. Do not retry malformed input without correcting it. Rely on actual responses and read-back evidence, not the fact that a route or tool exists.

## Security pin

The worker pins Excelize `v2.11.1-0.20260805032953-db93f8d89de7`, the published patched pseudo-version for CVE-2026-107224. The formal v2.11.1 release is dated November 2, 2026, so this repository does not claim that formal release has already shipped. The worker also performs its own unsigned Zip64 uncompressed-size preflight before opening the workbook.
