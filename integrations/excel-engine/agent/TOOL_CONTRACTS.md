# Excel worker tool contracts

These authenticated HTTP interfaces are for a host adapter. They are not native model function tools in the current provider gateway.

## Authentication
Every request requires Authorization: Bearer with the configured UNEXPECTED_ACCESS_TOKEN. Never place a secret in prompts, files or logs.

## Inspect
POST /excel/inspect
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet (or application/octet-stream)
Body: raw .xlsx bytes, not multipart or base64.

Returns JSON: ok, engine, fileSizeBytes, sheetCount, and sheets[] with name, observed rows, observed columns and bounded preview[][].

## Generate
POST /excel/generate
Content-Type: application/json

Body:
    {
      "sheets": [
        {
          "name": "Overview",
          "headers": ["ID", "Title", "Status"],
          "rows": [["R-001", "Example", "Open"]]
        }
      ]
    }

Returns a new .xlsx download. It accepts no destination path and never overwrites an uploaded source.

## Limits
- Upload: 20 MiB.
- Decompressed workbook: 64 MiB.
- Worksheet/shared-string XML: 8 MiB.
- 20 sheets, 50,000 rows per sheet, 100 columns.
- 20 preview rows maximum (API requests 10).
- JSON spec: 1 MiB.
- Worker timeout: 30 seconds.

The first release inspects .xlsx only and generates .xlsx only. It does not accept .xls, .xlsm, .xlsb, CSV, password-protected workbooks or multipart uploads.

## Failures
401 invalid token; 413 size limit; 415 content type; 400 invalid workbook/spec; 503 worker missing; 504 timeout; 429 rate limit. Do not retry malformed input without correcting it. Rely on the actual response, not the fact that a route exists.
