# uneXpected Excel VBA Toolkit

A general-purpose, cross-industry library of importable Excel VBA utilities. It is a reusable foundation for spreadsheet inspection, data quality, file inventories, safe bulk operations, and diagnostics—not a preconfigured workbook for one employer, department, or industry.

## Where it can help

- **Data quality:** required-column checks, blank counts, duplicate detection, keyword matching, and data-boundary discovery.
- **Inventory and resources:** inspect lists, validate identifiers, review file evidence, and locate missing fields.
- **Sales and customer operations:** check CRM exports, required contact fields, duplicate records, and activity lists.
- **Finance and administration:** validate budget/export layouts, count missing values, and inspect transaction extracts before reconciliation.
- **Project tracking and workflows:** check task registers, status fields, dates, owners, and reporting ranges.
- **Scheduling and service records:** inspect rosters, attendance tables, service logs, and recurring schedules.
- **Research and operations:** validate survey extracts, study logs, quality records, and operational datasets.

These are examples, not built-in business rules. The specialist must inspect the actual workbook and confirm the user's definitions before applying domain logic. Optional industry packs can be added independently without making the core package industry-specific.

## Included modules

| Module | Purpose | Main public entry points |
|---|---|---|
| `modUxWorkbook.bas` | Explicit-workbook inspection | `UxWorksheetExists`, `UxLastUsedRow`, `UxLastUsedColumn` |
| `modUxFileSystem.bas` | Read-only file/folder inspection | `UxFileExists`, `UxFolderExists`, `UxListFiles`, `UxSelectFolder`, `UxSelectFile` |
| `modUxText.bas` | Case-insensitive keyword matching | `UxFindKeywords` |
| `modUxDataValidation.bas` | Read-only data-quality checks | `UxFindHeaderColumn`, `UxMissingHeaders`, `UxCountBlankCells`, `UxFindDuplicateCells` |
| `modUxApplicationState.bas` | Reversible performance mode | `UxBeginFastMode`, `UxRestoreApplicationState`, `UxApplicationState` |
| `modUxDiagnostics.bas` | Append-only error log | `UxAppendErrorLog` |

## General usage examples

### Inspect a table without assuming its business purpose

```vb
Option Explicit

Public Sub ExampleInspectDataSheet()
    Dim wb As Workbook
    Dim ws As Worksheet

    Set wb = ThisWorkbook
    If UxWorksheetExists(wb, "Data") Then
        Set ws = wb.Worksheets("Data")
        Debug.Print "Last used row: " & UxLastUsedRow(ws)
        Debug.Print "Last used column: " & UxLastUsedColumn(ws)
    End If
End Sub
```

### Check headers and data quality

```vb
Option Explicit

Public Sub ExampleValidateDataset()
    Dim ws As Worksheet
    Dim missing As Collection
    Dim duplicates As Collection
    Dim item As Variant

    Set ws = ThisWorkbook.Worksheets("Data")
    Set missing = UxMissingHeaders(ws.Range("A1:H1"), _
        Array("Record ID", "Date", "Owner", "Status"))

    For Each item In missing
        Debug.Print "Missing header: " & CStr(item)
    Next item

    Debug.Print "Blank cells: " & UxCountBlankCells(ws.Range("A2:H500"))
    Set duplicates = UxFindDuplicateCells(ws.Range("A2:A500"))
    For Each item In duplicates
        Debug.Print "Duplicate value at: " & CStr(item)
    Next item
End Sub
```

### List supporting files without changing them

```vb
Option Explicit

Public Sub ExampleListFiles()
    Dim folderPath As String
    Dim fileItems As Collection
    Dim item As Variant

    folderPath = UxSelectFolder("Choose a folder to inspect")
    If Len(folderPath) = 0 Then Exit Sub ' User cancelled.

    Set fileItems = UxListFiles(folderPath, False)
    For Each item In fileItems
        Debug.Print item(0), item(1), item(2), item(3)
    Next item
End Sub
```

### Perform a bounded bulk operation safely

```vb
Option Explicit

Public Sub ExampleBulkUpdatePattern()
    Dim appState As UxApplicationState
    Dim restoreSucceeded As Boolean
    Dim originalNumber As Long
    Dim originalDescription As String

    On Error GoTo Failed
    UxBeginFastMode appState

    ' Add only the intended, bounded operation here.

CleanExit:
    If appState.IsCaptured Then
        restoreSucceeded = UxRestoreApplicationState(appState)
        If Not restoreSucceeded Then Debug.Print "Warning: Excel settings were not fully restored."
    End If
    Exit Sub

Failed:
    originalNumber = Err.Number
    originalDescription = Err.Description
    Debug.Print "Operation failed: " & originalNumber & " - " & originalDescription
    Resume CleanExit
End Sub
```

## Compatibility and runtime boundary

Target: Microsoft Excel 2010 or newer on Windows desktop. Import the `.bas` files into a macro-enabled workbook (`.xlsm` or `.xlsb`) using the Visual Basic Editor. File-system enumeration uses late-bound `Scripting.FileSystemObject`; duplicate detection uses late-bound `Scripting.Dictionary`. The modules do not require manually adding those scripting references.

**VBA does not execute in the Node.js/Render service.** This is a source/tooling integration for Excel desktop. It does not make the web app an Excel execution host, and adding a specialist profile to this repository does not activate runtime dispatch in the separate uneXpected v7 registry.

## Safety contract

- Workbook inspection requires explicit `Workbook` or `Worksheet` objects; helpers do not silently target `ActiveWorkbook`, `ActiveSheet`, or `Selection`.
- Data-validation helpers are read-only. They return findings; they do not edit, clear, sort, or remove data.
- File inventory is read-only. No helper creates, overwrites, moves, renames, or deletes files.
- A cancelled file/folder picker returns an empty string and does not trigger a follow-up action.
- `UxAppendErrorLog` appends to a caller-selected file in an existing folder. It does not create folders. Never put credentials, personal data, or confidential cell contents in log context.
- `UxBeginFastMode` captures only the application settings it changes. Always restore on success and failure paths and inspect the Boolean result.
- No module removes protection, breaks external links, sends email, changes Outlook messages, saves over an existing workbook, or performs network requests.
- Prefer a disposable copy and a preview before consequential workbook changes.

## Provenance and license

- Upstream repository: https://github.com/aaronkeene/ExcelVBA
- Reviewed upstream tree snapshot: `ec5def4edaf787ed06371a97a9709cdc166d45f2`
- Upstream license: MIT; original notice is preserved in [LICENSE](./LICENSE).
- The modules are independently rewritten implementations based on selected upstream patterns, not a wholesale copy. See `manifest.json` for the machine-readable provenance record.

## Excluded upstream routines

- Password-removal routine (`RemovePasswords.vba`): attempts to bypass workbook/worksheet protection; excluded.
- `BreakExternalLinks.vb`: can permanently sever external links; excluded from default automation.
- `SaveOutlookAttachments.vba`: changes message read state and can overwrite same-named files; excluded pending a separately designed consent-based workflow.
- `SpeedUp.vb`: changes broad Excel/workbook settings, including link-update behavior; replaced with a narrow reversible state helper.

## Verification status

`node --test test/excel-vba-kit.test.mjs` checks the manifest, source contracts, safety invariants, provenance, and specialist instructions. These are static checks, **not a VBA compiler or Excel runtime test**. The modules are not executed in desktop Excel yet and have not been imported or compiled in a real Office installation. Before production use, import them into a disposable workbook, compile the full VBA project, and test normal, cancellation, empty-range, duplicate-detection, inaccessible-folder, and error-restoration paths in supported Excel desktop versions.
