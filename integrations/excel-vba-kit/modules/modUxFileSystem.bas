Attribute VB_Name = "modUxFileSystem"
Option Explicit

' uneXpected Excel VBA Toolkit
' Rewritten from selected FileExist, ListFilesInFolder, SelectFile, and folder-picker patterns.
' Read-only inventory: this module does not create, overwrite, move, or delete files.

Public Function UxFileExists(ByVal filePath As String) As Boolean
    Dim attributes As Long

    If Len(Trim$(filePath)) = 0 Then Exit Function

    On Error GoTo NotFound
    attributes = GetAttr(filePath)
    UxFileExists = ((attributes And vbDirectory) = 0)
    Exit Function

NotFound:
    UxFileExists = False
End Function

Public Function UxFolderExists(ByVal folderPath As String) As Boolean
    Dim attributes As Long

    If Len(Trim$(folderPath)) = 0 Then Exit Function

    On Error GoTo NotFound
    attributes = GetAttr(folderPath)
    UxFolderExists = ((attributes And vbDirectory) = vbDirectory)
    Exit Function

NotFound:
    UxFolderExists = False
End Function

Public Function UxSelectFolder( _
    Optional ByVal dialogTitle As String = "Select a folder", _
    Optional ByVal initialFolder As String = vbNullString) As String

    Dim dialog As FileDialog

    Set dialog = Application.FileDialog(msoFileDialogFolderPicker)
    With dialog
        .Title = dialogTitle
        .AllowMultiSelect = False
        If Len(initialFolder) > 0 Then
            If UxFolderExists(initialFolder) Then .InitialFileName = initialFolder
        End If
        If .Show = -1 Then UxSelectFolder = .SelectedItems(1)
    End With
End Function

Public Function UxSelectFile(Optional ByVal dialogTitle As String = "Select a file") As String
    Dim dialog As FileDialog

    Set dialog = Application.FileDialog(msoFileDialogFilePicker)
    With dialog
        .Title = dialogTitle
        .AllowMultiSelect = False
        If .Show = -1 Then UxSelectFile = .SelectedItems(1)
    End With
End Function

' Returns a Collection of four-item arrays:
'   item(0) = file name, item(1) = full path,
'   item(2) = size in bytes, item(3) = last-modified date.
' An empty folder returns an empty Collection. Access or I/O errors are raised to the caller.
Public Function UxListFiles( _
    ByVal folderPath As String, _
    Optional ByVal includeSubfolders As Boolean = False) As Collection

    Dim fso As Object
    Dim rootFolder As Object
    Dim result As Collection

    If Not UxFolderExists(folderPath) Then
        Err.Raise vbObjectError + 7110, "UxListFiles", "The selected folder does not exist or is not accessible."
    End If

    Set fso = CreateObject("Scripting.FileSystemObject")
    Set rootFolder = fso.GetFolder(folderPath)
    Set result = New Collection

    UxAppendFolderFiles rootFolder, includeSubfolders, result
    Set UxListFiles = result
End Function

Private Sub UxAppendFolderFiles( _
    ByVal folder As Object, _
    ByVal includeSubfolders As Boolean, _
    ByRef result As Collection)

    Dim fileItem As Object
    Dim subFolder As Object

    For Each fileItem In folder.Files
        result.Add Array( _
            CStr(fileItem.Name), _
            CStr(fileItem.Path), _
            CDbl(fileItem.Size), _
            CDate(fileItem.DateLastModified))
    Next fileItem

    If includeSubfolders Then
        For Each subFolder In folder.SubFolders
            UxAppendFolderFiles subFolder, True, result
        Next subFolder
    End If
End Sub
