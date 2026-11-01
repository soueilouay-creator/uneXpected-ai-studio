package workbook

import (
	"archive/zip"
	"os"
	"path/filepath"
	"testing"
)

func TestGenerateWorkbookAndInspectRoundTrip(t *testing.T) {
	output := filepath.Join(t.TempDir(), "sample.xlsx")
	spec := WorkbookSpec{
		Sheets: []SheetSpec{
			{
				Name:    "Overview",
				Headers: []string{"ID", "Name", "Amount"},
				Rows: [][]any{
					{"A-1", "Alpha", 12.5},
					{"A-2", "Beta", 20},
				},
			},
			{
				Name:    "Notes",
				Headers: []string{"Topic", "Status"},
				Rows:    [][]any{{"Review", "Open"}},
			},
		},
	}

	if err := GenerateWorkbook(output, spec); err != nil {
		t.Fatalf("GenerateWorkbook() error = %v", err)
	}
	result, err := InspectWorkbook(output, 1)
	if err != nil {
		t.Fatalf("InspectWorkbook() error = %v", err)
	}
	if len(result.Sheets) != 2 {
		t.Fatalf("sheet count = %d, want 2", len(result.Sheets))
	}
	if result.Sheets[0].Name != "Overview" || result.Sheets[0].Rows != 3 || result.Sheets[0].Columns != 3 {
		t.Fatalf("unexpected first sheet summary: %+v", result.Sheets[0])
	}
	if len(result.Sheets[0].Preview) != 1 || result.Sheets[0].Preview[0][0] != "ID" {
		t.Fatalf("preview was not bounded or did not include header: %+v", result.Sheets[0].Preview)
	}
	if result.Sheets[1].Name != "Notes" || result.Sheets[1].Rows != 2 {
		t.Fatalf("unexpected second sheet summary: %+v", result.Sheets[1])
	}
}

func TestRejectInvalidSpecsAndLimits(t *testing.T) {
	cases := []struct {
		name string
		spec WorkbookSpec
	}{
		{name: "no sheets"},
		{name: "blank sheet name", spec: WorkbookSpec{Sheets: []SheetSpec{{Name: " ", Headers: []string{"A"}}}}},
		{name: "no headers", spec: WorkbookSpec{Sheets: []SheetSpec{{Name: "Data"}}}},
		{name: "duplicate names", spec: WorkbookSpec{Sheets: []SheetSpec{
			{Name: "Data", Headers: []string{"A"}},
			{Name: "Data", Headers: []string{"B"}},
		}}},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			target := filepath.Join(t.TempDir(), "should-not-exist.xlsx")
			if err := GenerateWorkbook(target, tc.spec); err == nil {
				t.Fatal("GenerateWorkbook() succeeded for invalid spec")
			}
		})
	}

	manySheets := WorkbookSpec{Sheets: make([]SheetSpec, 21)}
	if err := GenerateWorkbook(filepath.Join(t.TempDir(), "too-many.xlsx"), manySheets); err == nil {
		t.Fatal("GenerateWorkbook() accepted more than 20 sheets")
	}
	wide := WorkbookSpec{Sheets: []SheetSpec{{Name: "Wide", Headers: make([]string, 101)}}}
	if err := GenerateWorkbook(filepath.Join(t.TempDir(), "too-wide.xlsx"), wide); err == nil {
		t.Fatal("GenerateWorkbook() accepted more than 100 columns")
	}
	tall := WorkbookSpec{Sheets: []SheetSpec{{Name: "Tall", Headers: []string{"A"}, Rows: make([][]any, 50001)}}}
	if err := GenerateWorkbook(filepath.Join(t.TempDir(), "too-tall.xlsx"), tall); err == nil {
		t.Fatal("GenerateWorkbook() accepted more than 50,000 data rows")
	}
}

func TestInspectRejectsInvalidWorkbookAndPreviewLimits(t *testing.T) {
	bad := filepath.Join(t.TempDir(), "not-a-workbook.xlsx")
	if err := os.WriteFile(bad, []byte("not a zip"), 0o600); err != nil {
		t.Fatal(err)
	}
	if _, err := InspectWorkbook(bad, 1); err == nil {
		t.Fatal("InspectWorkbook() accepted invalid XLSX")
	}
	if _, err := InspectWorkbook(bad, 21); err == nil {
		t.Fatal("InspectWorkbook() accepted more than 20 preview rows")
	}
}

func writeXLSXFixture(t *testing.T, sharedStrings, worksheet string) string {
	t.Helper()
	path := filepath.Join(t.TempDir(), "preflight.xlsx")
	file, err := os.Create(path)
	if err != nil {
		t.Fatal(err)
	}
	archive := zip.NewWriter(file)
	entries := map[string]string{
		"xl/sharedStrings.xml": sharedStrings,
		"xl/worksheets/sheet1.xml": worksheet,
	}
	for name, content := range entries {
		entry, err := archive.Create(name)
		if err != nil {
			t.Fatal(err)
		}
		if _, err := entry.Write([]byte(content)); err != nil {
			t.Fatal(err)
		}
	}
	if err := archive.Close(); err != nil {
		t.Fatal(err)
	}
	if err := file.Close(); err != nil {
		t.Fatal(err)
	}
	return path
}

func TestPreflightRejectsNegativeAndOutOfRangeSharedStringIndexes(t *testing.T) {
	shared := "<sst><si><t>Alpha</t></si></sst>"
	for _, index := range []string{"-1", "1", "not-an-index"} {
		t.Run(index, func(t *testing.T) {
			sheet := "<worksheet><sheetData><row r=\"1\"><c r=\"A1\" t=\"s\"><v>" + index + "</v></c></row></sheetData></worksheet>"
			if err := preflightXLSX(writeXLSXFixture(t, shared, sheet)); err == nil {
				t.Fatalf("preflight accepted invalid shared-string index %q", index)
			}
		})
	}
}

func TestPreflightAllowsValidSharedStringIndex(t *testing.T) {
	shared := "<sst><si><t>Alpha</t></si></sst>"
	sheet := "<worksheet><sheetData><row r=\"1\"><c r=\"A1\" t=\"s\"><v>0</v></c></row></sheetData></worksheet>"
	if err := preflightXLSX(writeXLSXFixture(t, shared, sheet)); err != nil {
		t.Fatalf("preflight rejected valid shared-string index: %v", err)
	}
}

func TestPreflightRejectsDuplicateZIPEntries(t *testing.T) {
	path := filepath.Join(t.TempDir(), "duplicate.xlsx")
	file, err := os.Create(path)
	if err != nil {
		t.Fatal(err)
	}
	archive := zip.NewWriter(file)
	for i := 0; i < 2; i++ {
		entry, err := archive.Create("xl/worksheets/sheet1.xml")
		if err != nil {
			t.Fatal(err)
		}
		if _, err := entry.Write([]byte("<worksheet/>")); err != nil {
			t.Fatal(err)
		}
	}
	if err := archive.Close(); err != nil {
		t.Fatal(err)
	}
	if err := file.Close(); err != nil {
		t.Fatal(err)
	}
	if err := preflightXLSX(path); err == nil {
		t.Fatal("preflight accepted duplicate ZIP entries")
	}
}
