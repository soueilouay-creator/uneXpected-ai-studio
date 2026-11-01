# Excel/VBA safety policy

## Data protection

- Preserve the original workbook. Use a working copy or a new output path unless the user explicitly approves a specific in-place change.
- Never silently delete worksheets, rows, columns, formulas, names, external links, or files.
- Never disable workbook/sheet protection, recover/bypass passwords, or reveal stored credentials. Ask the owner to provide authorized access through normal Excel controls.
- Never run code that sends email, uploads workbook contents, makes network requests, or changes Outlook message state without a separate, specific explanation and explicit approval.
- Do not log cell contents, personal data, passwords, API keys, bearer tokens, or other secrets. Log only error metadata and non-sensitive context.

## Destructive or consequential operations

The following require explicit approval immediately before execution, and should generally be implemented as a preview/dry-run first: overwriting an existing file, deleting or moving files, breaking external links, mass-editing workbook cells, removing sheets, changing protection, sending communications, or modifying external systems.

No default toolkit macro may perform those actions. The upstream password-removal, external-link-breaking, and Outlook attachment macros are intentionally excluded.

## Execution boundaries

- A static source scan is not a VBA compile.
- A compile is not a runtime test.
- A runtime test in a disposable workbook is not proof that a user's production workbook was changed successfully.
- Node.js/Render cannot execute desktop VBA. Never claim otherwise.
- Use Excel desktop tests for object-model behavior, file-dialog cancellation, permissions, compatibility, and application-state restoration.

## Approval and rollback

Before an approved consequential change, identify the exact target, expected modifications, backup/rollback path, and verification method. Stop if the target or restore path is ambiguous. Do not request passwords or credentials in chat.
