# uneXpected Excel VBA Toolkit

A small, reviewed set of importable Excel VBA modules adapted from useful patterns in [aaronkeene/ExcelVBA](https://github.com/aaronkeene/ExcelVBA). The upstream repository is a library of standalone routines, not a complete spreadsheet framework. This package rewrites selected patterns around explicit workbook references, narrow side effects, and visible failure behavior.

## Provenance and license

- Upstream repository: https://github.com/aaronkeene/ExcelVBA
- Reviewed upstream tree snapshot: `ec5def4edaf787ed06371a97a9709cdc166d45f2`
- Upstream license: MIT; the original notice is preserved in [LICENSE](./LICENSE).
- Selected source patterns reviewed: `FileExist.vba`, `FindLastRow.vba`, `FindLastCol.vb`, `FindKeyword.vb`, `ListFilesInFolder.vb`, `SelectFile.vb`, `GetOutputFolder.vb`, `SpeedUp.vb`, and `Utilities/errMessage.vb`.
- The modules in this package are rewritten implementations, not a wholesale copy of the upstream repository. See `manifest.json` for a machine-readable record.

## Included modules

| Module | Purpose | Main public entry points |
|---|---|---|
| `modUxWorkbook.bas` | Explicit-workbook inspection | `UxWorksheetExists`, `UxLastUsedRow`, `UxLastUsedColumn` |
| `modUxFileSystem.bas` | Read-only file and folder inspection | `UxFileExists`, `UxFolderExists`, `UxListFiles`, `UxSelectFolder`, `UxSelectFile` |
| `modUxText.bas` | Case-insensitive keyword matching | `UxFindKeywords` |
| `modUxApplicationState.bas` | Reversible performance mode | `UxBeginFastMode`, `UxRestoreApplicationState`, `UxApplicationState` |
| `modUxDiagnostics.bas` | Append-only error log | `UxAppendErrorLog` |

## Compatibility and runtime boundary

Target: Microsoft Excel 2010 or newer on Windows desktop. Import the `.bas` files into a macro-enabled workbook (`.xlsm` or `.xlsb`) using the Visual Basic Editor. The file-system module uses late-bound `Scripting.FileSystemObject`; it does not require adding a VBA reference manually. The file/folder picker functions use the Office `FileDialog` object.

**VBA does not execute in the Node.js/Render service.** This is a source/tooling integration for an Excel desktop environment. It does not make the web app an Excel execution host, and it is not registered automatically as a live specialist in the separate uneXpected v7 runtime registry.

## Usage examples

```vb
Option Explicit

Public Sub ExampleInspectWorkbook()
    Dim wb As Workbook
    Dim ws As Worksheet

    Set wb = ThisWorkbook
    If UxWorksheetExists(wb, "Maintenance") Then
        Set ws = wb.Worksheets("Maintenance")
        Debug.Print "Last used row: " & UxLastUsedRow(ws)
        Debug.Print "Last used column: " & UxLastUsedColumn(ws)
    End If
End Sub
```

```vb
Option Explicit

Public Sub ExampleListFiles()
    Dim folderPath As String
    Dim fileItems As Collection
    Dim item As Variant

    folderPath = UxSelectFolder("Choose the maintenance documents folder")
    If Len(folderPath) = 0 Then Exit Sub ' User cancelled.

    Set fileItems = UxListFiles(folderPath, False)
    For Each item In fileItems
        Debug.Print item(0), item(1), item(2), item(3)
    Next item
End Sub
```

```vb
Option Explicit

Public Sub ExampleBulkUpdatePattern()
    Dim appState As UxApplicationState
    Dim restoreSucceeded As Boolean
    Dim originalNumber As Long
    Dim originalDescription As String

    On Error GoTo Failed
    UxBeginFastMode appState

    ' Put only the intended, bounded bulk operation here.

CleanExit:
    If appState.IsCaptured Then
        restoreSucceeded = UxRestoreApplicationState(appState)
        If Not restoreSucceeded Then Debug.Print "Warning: one or more Excel settings could not be restored."
    End If
    Exit Sub

Failed:
    originalNumber = Err.Number
    originalDescription = Err.Description
    Debug.Print "Bulk update failed: " & originalNumber & " - " & originalDescription
    Resume CleanExit
End Sub
```

## Safety contract

- Functions that inspect workbooks require an explicit `Workbook` or `Worksheet`; they do not silently target `ActiveWorkbook`, `ActiveSheet`, or `Selection`.
- File inventory is read-only. No helper creates, overwrites, moves, renames, or deletes files.
- A cancelled file/folder picker returns an empty string and does not trigger a follow-up action.
- `UxAppendErrorLog` appends to a caller-selected file in an existing folder. It does not create folders. Do not put passwords, API keys, access tokens, personal data, or confidential workbook values in log context.
- `UxBeginFastMode` captures only the application settings it changes. Always call `UxRestoreApplicationState` on every success and failure path, and inspect its Boolean result.
- No module removes protection, breaks external links, sends email, changes Outlook messages, saves over an existing workbook, or performs network requests.
- Review every macro and test it against a disposable copy before using it on production data.

## Excluded upstream routines

- Password-removal routine (`RemovePasswords.vba`): attempts to bypass workbook/worksheet protection; excluded.
- `BreakExternalLinks.vb`: can permanently sever external links; excluded from the default toolkit.
- `SaveOutlookAttachments.vba`: changes message read state and can overwrite same-named files; excluded pending a separately designed workflow with collision handling and explicit user consent.
- `SpeedUp.vb`: changes broad Excel/workbook settings, including link-update behavior; replaced with the narrow, reversible state helper in this package.

## Verification status

The repository test `node --test test/excel-vba-kit.test.mjs` checks the manifest, source files, safety invariants, provenance, and specialist instructions. These are static checks, **not a VBA compiler or Excel runtime test**. At the time of packaging, the modules were not executed in desktop Excel and have not been imported or compiled in a real Office installation. Before production use, import them into a disposable workbook, compile the entire VBA project, and exercise success, cancellation, empty-folder, access-denied, and error-restoration paths on supported Excel installations.

## Maintenance GMAO use

This toolkit supplies reusable building blocks; it does not claim to contain a finished GMAO or know the column layout of any existing maintenance workbook. A separate maintenance specialization should inspect the actual workbook schema before adding machine, compressor, UV-lamp, spare-parts, or preventive-maintenance automation.
