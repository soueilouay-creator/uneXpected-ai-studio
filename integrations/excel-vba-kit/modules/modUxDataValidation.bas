Attribute VB_Name = "modUxDataValidation"
Option Explicit

' uneXpected Excel VBA Toolkit
' General-purpose, read-only data-quality helpers.
' These routines inspect explicitly supplied ranges and never change cell values.

Public Function UxFindHeaderColumn( _
    ByVal headerRange As Range, _
    ByVal headerName As String, _
    Optional ByVal matchCase As Boolean = False) As Long

    Dim headerCell As Range
    Dim compareMode As VbCompareMethod

    If headerRange Is Nothing Then
        Err.Raise vbObjectError + 7150, "UxFindHeaderColumn", "A header range is required."
    End If
    If headerRange.Rows.Count <> 1 Or headerRange.Areas.Count <> 1 Then
        Err.Raise vbObjectError + 7151, "UxFindHeaderColumn", "Supply one contiguous header row."
    End If
    If Len(Trim$(headerName)) = 0 Then
        Err.Raise vbObjectError + 7152, "UxFindHeaderColumn", "A non-empty header name is required."
    End If

    If matchCase Then
        compareMode = vbBinaryCompare
    Else
        compareMode = vbTextCompare
    End If

    For Each headerCell In headerRange.Cells
        If Not IsError(headerCell.Value2) Then
            If StrComp(Trim$(CStr(headerCell.Value2)), Trim$(headerName), compareMode) = 0 Then
                UxFindHeaderColumn = headerCell.Column
                Exit Function
            End If
        End If
    Next headerCell
End Function

' Returns the missing required header names in the order supplied.
' requiredHeaders must be an array, for example Array("Record ID", "Date", "Status").
Public Function UxMissingHeaders( _
    ByVal headerRange As Range, _
    ByVal requiredHeaders As Variant) As Collection

    Dim result As Collection
    Dim requiredHeader As Variant

    If Not IsArray(requiredHeaders) Then
        Err.Raise vbObjectError + 7153, "UxMissingHeaders", "Required headers must be supplied as an array."
    End If

    Set result = New Collection

    For Each requiredHeader In requiredHeaders
        If Len(Trim$(CStr(requiredHeader))) = 0 Then
            Err.Raise vbObjectError + 7154, "UxMissingHeaders", "Required header names cannot be empty."
        End If
        If UxFindHeaderColumn(headerRange, CStr(requiredHeader), False) = 0 Then
            result.Add CStr(requiredHeader)
        End If
    Next requiredHeader

    Set UxMissingHeaders = result
End Function

' Counts truly empty cells and formula results containing only whitespace.
' Cells containing Excel errors are not counted as blank.
Public Function UxCountBlankCells(ByVal valueRange As Range) As Long
    Dim valueCell As Range

    If valueRange Is Nothing Then
        Err.Raise vbObjectError + 7155, "UxCountBlankCells", "A value range is required."
    End If

    For Each valueCell In valueRange.Cells
        If Not IsError(valueCell.Value2) Then
            If Len(Trim$(CStr(valueCell.Value2))) = 0 Then
                UxCountBlankCells = UxCountBlankCells + 1
            End If
        End If
    Next valueCell
End Function

' Returns the addresses of repeated non-empty values after their first occurrence.
' Matching is case-insensitive and ignores leading/trailing whitespace.
' Each returned address identifies a duplicate cell; no cell is changed.
Public Function UxFindDuplicateCells(ByVal valueRange As Range) As Collection
    Dim seen As Object
    Dim duplicates As Collection
    Dim valueCell As Range
    Dim normalizedValue As String

    If valueRange Is Nothing Then
        Err.Raise vbObjectError + 7156, "UxFindDuplicateCells", "A value range is required."
    End If

    Set seen = CreateObject("Scripting.Dictionary")
    seen.CompareMode = vbTextCompare
    Set duplicates = New Collection

    For Each valueCell In valueRange.Cells
        If Not IsError(valueCell.Value2) Then
            normalizedValue = Trim$(CStr(valueCell.Value2))
            If Len(normalizedValue) > 0 Then
                If seen.Exists(normalizedValue) Then
                    duplicates.Add valueCell.Address(False, False, xlA1, True)
                Else
                    seen.Add normalizedValue, True
                End If
            End If
        End If
    Next valueCell

    Set UxFindDuplicateCells = duplicates
End Function
