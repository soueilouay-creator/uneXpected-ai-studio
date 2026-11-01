Attribute VB_Name = "modUxText"
Option Explicit

' uneXpected Excel VBA Toolkit
' Rewritten from the FindKeyword pattern in aaronkeene/ExcelVBA.

Public Function UxFindKeywords( _
    ByVal textToSearch As String, _
    ByVal keywordRange As Range, _
    Optional ByVal delimiter As String = ", ") As String

    Dim keywordCell As Range
    Dim keyword As String
    Dim matches As String

    If keywordRange Is Nothing Then
        Err.Raise vbObjectError + 7120, "UxFindKeywords", "A keyword range is required."
    End If

    For Each keywordCell In keywordRange.Cells
        If Not IsError(keywordCell.Value2) Then
            keyword = Trim$(CStr(keywordCell.Value2))
            If Len(keyword) > 0 Then
                If InStr(1, textToSearch, keyword, vbTextCompare) > 0 Then
                    If Len(matches) > 0 Then matches = matches & delimiter
                    matches = matches & keyword
                End If
            End If
        End If
    Next keywordCell

    UxFindKeywords = matches
End Function
