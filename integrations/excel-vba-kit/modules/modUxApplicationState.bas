Attribute VB_Name = "modUxApplicationState"
Option Explicit

' uneXpected Excel VBA Toolkit
' A narrow, reversible replacement for broad legacy performance macros.
' Only the properties below are changed; link-update and workbook settings are untouched.

Public Type UxApplicationState
    IsCaptured As Boolean
    Calculation As XlCalculation
    ScreenUpdating As Boolean
    EnableEvents As Boolean
    DisplayAlerts As Boolean
    DisplayStatusBar As Boolean
    StatusBar As Variant
    Cursor As XlMousePointer
End Type

Public Sub UxBeginFastMode(ByRef state As UxApplicationState)
    Dim originalNumber As Long
    Dim originalSource As String
    Dim originalDescription As String

    If state.IsCaptured Then
        Err.Raise vbObjectError + 7130, "UxBeginFastMode", "This state object is already capturing an application state."
    End If

    state.Calculation = Application.Calculation
    state.ScreenUpdating = Application.ScreenUpdating
    state.EnableEvents = Application.EnableEvents
    state.DisplayAlerts = Application.DisplayAlerts
    state.DisplayStatusBar = Application.DisplayStatusBar
    state.StatusBar = Application.StatusBar
    state.Cursor = Application.Cursor
    state.IsCaptured = True

    On Error GoTo BeginFailed
    Application.ScreenUpdating = False
    Application.EnableEvents = False
    Application.DisplayAlerts = False
    Application.DisplayStatusBar = True
    Application.Calculation = xlCalculationManual
    Application.StatusBar = "uneXpected: processing..."
    Application.Cursor = xlWait
    Exit Sub

BeginFailed:
    originalNumber = Err.Number
    originalSource = Err.Source
    originalDescription = Err.Description
    On Error Resume Next
    Call UxRestoreApplicationState(state)
    On Error GoTo 0
    Err.Raise originalNumber, originalSource, originalDescription
End Sub

' Returns False if one or more properties could not be restored. It still attempts
' every restoration so a single failure does not prevent the remaining properties.
Public Function UxRestoreApplicationState(ByRef state As UxApplicationState) As Boolean
    Dim restored As Boolean

    If Not state.IsCaptured Then
        UxRestoreApplicationState = True
        Exit Function
    End If

    restored = True
    On Error Resume Next

    Err.Clear
    Application.Calculation = state.Calculation
    If Err.Number <> 0 Then restored = False

    Err.Clear
    Application.ScreenUpdating = state.ScreenUpdating
    If Err.Number <> 0 Then restored = False

    Err.Clear
    Application.EnableEvents = state.EnableEvents
    If Err.Number <> 0 Then restored = False

    Err.Clear
    Application.DisplayAlerts = state.DisplayAlerts
    If Err.Number <> 0 Then restored = False

    Err.Clear
    Application.DisplayStatusBar = state.DisplayStatusBar
    If Err.Number <> 0 Then restored = False

    Err.Clear
    Application.StatusBar = state.StatusBar
    If Err.Number <> 0 Then restored = False

    Err.Clear
    Application.Cursor = state.Cursor
    If Err.Number <> 0 Then restored = False

    On Error GoTo 0
    state.IsCaptured = False
    UxRestoreApplicationState = restored
End Function
