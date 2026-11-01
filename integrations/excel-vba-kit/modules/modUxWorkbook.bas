Attribute VB_Name = "modUxWorkbook"
Option Explicit

' uneXpected Excel VBA Toolkit
' Rewritten from selected worksheet-inspection patterns in aaronkeene/ExcelVBA.
' Source snapshot: ec5def4edaf787ed06371a97a9709cdc166d45f2

Public Function UxWorksheetExists(ByVal wb As Workbook, ByVal worksheetName As String) As Boolean
    Dim ws As Worksheet

    If wb Is Nothing Then
        Err.Raise vbObjectError + 7101, "UxWorksheetExists", "A workbook object is required."
    End If

    For Each ws In wb.Worksheets
        If StrComp(ws.Name, worksheetName, vbTextCompare) = 0 Then
            UxWorksheetExists = True
            Exit Function
        End If
    Next ws
End Function

Public Function UxLastUsedRow(ByVal ws As Worksheet) As Long
    Dim lastCell As Range

    If ws Is Nothing Then
        Err.Raise vbObjectError + 7102, "UxLastUsedRow", "A worksheet object is required."
    End If

    Set lastCell = ws.Cells.Find( _
        What:="*", _
        After:=ws.Cells(1, 1), _
        LookIn:=xlFormulas, _
        LookAt:=xlPart, _
        SearchOrder:=xlByRows, _
        SearchDirection:=xlPrevious, _
        MatchCase:=False, _
        SearchFormat:=False)

    If Not lastCell Is Nothing Then UxLastUsedRow = lastCell.Row
End Function

Public Function UxLastUsedColumn(ByVal ws As Worksheet) As Long
    Dim lastCell As Range

    If ws Is Nothing Then
        Err.Raise vbObjectError + 7103, "UxLastUsedColumn", "A worksheet object is required."
    End If

    Set lastCell = ws.Cells.Find( _
        What:="*", _
        After:=ws.Cells(1, 1), _
        LookIn:=xlFormulas, _
        LookAt:=xlPart, _
        SearchOrder:=xlByColumns, _
        SearchDirection:=xlPrevious, _
        MatchCase:=False, _
        SearchFormat:=False)

    If Not lastCell Is Nothing Then UxLastUsedColumn = lastCell.Column
End Function
