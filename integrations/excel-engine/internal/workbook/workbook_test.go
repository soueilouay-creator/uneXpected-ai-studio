package workbook

import (
	"os"
	"path/filepath
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
