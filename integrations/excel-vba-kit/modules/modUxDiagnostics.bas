Attribute VB_Name = "modUxDiagnostics"
Option Explicit

' uneXpected Excel VBA Toolkit
' Rewritten from the upstream errMessage pattern.
' The caller chooses the log file; its parent folder must already exist.

Public Sub UxAppendErrorLog( _
    ByVal logFilePath As String, _
    ByVal routineName As String, _
    ByVal errorNumber As Long, _
    ByVal errorDescription As String, _
    Optional ByVal context As String = vbNullString)

    Dim separatorPosition As Long
    Dim parentFolder As String
    Dim fileNumber As Integer
    Dim originalNumber As Long
    Dim originalSource As String
    Dim originalDescription As String

    If Len(Trim$(logFilePath)) = 0 Then
        Err.Raise vbObjectError + 7140, "UxAppendErrorLog", "A log file path is required."
    End If

    separatorPosition = InStrRev(logFilePath, Application.PathSeparator)
    If separatorPosition = 0 Then
        Err.Raise vbObjectError + 7141, "UxAppendErrorLog", "Use a full log file path inside an existing folder."
    End If

    If separatorPosition = 3 And Mid$(logFilePath, 2, 1) = ":" Then
        parentFolder = Left$(logFilePath, separatorPosition)
    Else
        parentFolder = Left$(logFilePath, separatorPosition - 1)
    End If

    If Not UxFolderExists(parentFolder) Then
        Err.Raise vbObjectError + 7142, "UxAppendErrorLog", "The log destination folder does not exist or is not accessible."
    End If

    fileNumber = FreeFile
    On Error GoTo WriteFailed
    Open logFilePath For Append As #fileNumber
    Print #fileNumber, _
        Format$(Now, "yyyy-mm-dd hh:nn:ss") & vbTab & _
        UxSingleLine(routineName) & vbTab & _
        CStr(errorNumber) & vbTab & _
        UxSingleLine(errorDescription) & vbTab & _
        UxSingleLine(context)
    Close #fileNumber
    Exit Sub

WriteFailed:
    originalNumber = Err.Number
    originalSource = Err.Source
    originalDescription = Err.Description
    On Error Resume Next
    Close #fileNumber
    On Error Goto 0
    Err.Raise originalNumber, originalSource, originalDescription
End Sub

Private Function UxSingleLine(ByVal value As String) As String
    value = Replace(value, vbCr, " ")
    value = Replace(value, vbLf, " ")
    UxSingleLine = value
End Function
