package workbook

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/xuri/excelize/v2"
)

const (
	MaxUploadBytes       int64 = 20 << 20
	MaxUnzipBytes        int64 = 64 << 20
	MaxWorksheetXMLBytes int64 = 8 << 20
	MaxSheets                  = 20
	MaxRows                    = 50_000
	MaxColumns                 = 100
	MaxPreviewRows             = 20
	EngineVersion              = "excelize-v2.11.0"
)

type WorkbookSpec struct {
	Sheets []SheetSpec `json:"sheets"`
}

type SheetSpec struct {
	Name    string   `json:"name"`
	Headers []string `json:"headers"`
	Rows    [][]any  `json:"rows"`
}

type Inspection struct {
	Engine     string        `json:"engine"`
	FileSize   int64         `json:"fileSizeBytes"`
	SheetCount int           `json:"sheetCount"`
	Sheets     []SheetResult `json:"sheets"`
}

type SheetResult struct {
	Name    string     `json:"name"`
	Rows    int        `json:"rows"`
	Columns int        `json:"columns"`
	Preview [][]string `json:"preview"`
}

func GenerateWorkbook(outputPath string, spec WorkbookSpec) error {
	if err := validateSpec(spec); err != nil {
		return err
	}
	if strings.ToLower(filepath.Ext(outputPath)) != ".xlsx" {
		return errors.New("output must use the .xlsx extension")
	}
	if _, err := os.Stat(outputPath); err == nil {
		return errors.New("output file already exists; choose a new output path")
	} else if !errors.Is(err, os.ErrNotExist) {
		return fmt.Errorf("check output path: %w", err)
	}

	file := excelize.NewFile()
	defer func() { _ = file.Close() }()

	headerStyle, err := file.NewStyle(&excelize.Style{
		Font: &excelize.Font{Bold: true, Color: "17365D"},
		Fill: excelize.Fill{Type: "pattern", Pattern: 1, Color: []string{"D9EAF7"}},
	})
	if err != nil {
		return fmt.Errorf("create header style: %w", err)
	}

	for sheetIndex, sheet := range spec.Sheets {
		if sheetIndex == 0 {
			if sheet.Name != "Sheet1" {
				if err := file.SetSheetName("Sheet1", sheet.Name); err != nil {
					return fmt.Errorf("name first sheet: %w", err)
				}
			}
		} else if _, err := file.NewSheet(sheet.Name); err != nil {
			return fmt.Errorf("create sheet %q: %w", sheet.Name, err)
		}

		for columnIndex, value := range sheet.Headers {
			cell, err := excelize.CoordinatesToCellName(columnIndex+1, 1)
			if err != nil {
				return fmt.Errorf("resolve header cell: %w", err)
			}
			if err := file.SetCellValue(sheet.Name, cell, value); err != nil {
				return fmt.Errorf("write header: %w", err)
			}
		}
		lastHeaderCell, err := excelize.CoordinatesToCellName(len(sheet.Headers), 1)
		if err != nil {
			return fmt.Errorf("resolve header range: %w", err)
		}
		if err := file.SetCellStyle(sheet.Name, "A1", lastHeaderCell, headerStyle); err != nil {
			return fmt.Errorf("style header: %w", err)
		}

		for rowIndex, row := range sheet.Rows {
			for columnIndex, value := range row {
				cell, err := excelize.CoordinatesToCellName(columnIndex+1, rowIndex+2)
				if err != nil {
					return fmt.Errorf("resolve data cell: %w", err)
				}
				if err := file.SetCellValue(sheet.Name, cell, value); err != nil {
					return fmt.Errorf("write data cell: %w", err)
				}
			}
		}
	}

	if err := file.SaveAs(outputPath); err != nil {
		_ = os.Remove(outputPath)
		return fmt.Errorf("save generated workbook: %w", err)
	}
	return nil
}

func InspectWorkbook(inputPath string, previewRows int) (Inspection, error) {
	if previewRows < 0 || previewRows > MaxPreviewRows {
		return Inspection{}, fmt.Errorf("preview rows must be between 0 and %d", MaxPreviewRows)
	}
	if strings.ToLower(filepath.Ext(inputPath)) != ".xlsx" {
		return Inspection{}, errors.New("only .xlsx input is supported")
	}
	info, err := os.Stat(inputPath)
	if err != nil {
		return Inspection{}, fmt.Errorf("read input file: %w", err)
	}
	if info.Size() <= 0 || info.Size() > MaxUploadBytes {
		return Inspection{}, fmt.Errorf("input file must be between 1 byte and %d bytes", MaxUploadBytes)
	}

	file, err := excelize.OpenFile(inputPath, excelize.Options{
		UnzipSizeLimit:    MaxUnzipBytes,
		UnzipXMLSizeLimit: MaxWorksheetXMLBytes,
	})
	if err != nil {
		return Inspection{}, fmt.Errorf("open XLSX workbook: %w", err)
	}
	defer func() { _ = file.Close() }()

	sheetNames := file.GetSheetList()
	if len(sheetNames) == 0 || len(sheetNames) > MaxSheets {
		return Inspection{}, fmt.Errorf("workbook must contain between 1 and %d worksheets", MaxSheets)
	}
	result := Inspection{
		Engine:     EngineVersion,
		FileSize:   info.Size(),
		SheetCount: len(sheetNames),
		Sheets:     make([]SheetResult, 0, len(sheetNames)),
	}

	for _, sheetName := range sheetNames {
		rows, err := file.Rows(sheetName)
		if err != nil {
			return Inspection{}, fmt.Errorf("open worksheet %q: %w", sheetName, err)
		}
		sheet := SheetResult{Name: sheetName, Preview: make([][]string, 0, previewRows)}
		for rows.Next() {
			values, rowErr := rows.Columns()
			if rowErr != nil {
				_ = rows.Close()
				return Inspection{}, fmt.Errorf("read worksheet %q: %w", sheetName, rowErr)
			}
			sheet.Rows++
			if sheet.Rows > MaxRows {
				_ = rows.Close()
				return Inspection{}, fmt.Errorf("worksheet %q exceeds the %d-row limit", sheetName, MaxRows)
			}
			if len(values) > MaxColumns {
				_ = rows.Close()
				return Inspection{}, fmt.Errorf("worksheet %q exceeds the %d-column limit", sheetName, MaxColumns)
			}
			if len(values) > sheet.Columns {
				sheet.Columns = len(values)
			}
			if len(sheet.Preview) < previewRows {
				sheet.Preview = append(sheet.Preview, append([]string(nil), values...))
			}
		}
		if err := rows.Close(); err != nil {
			return Inspection{}, fmt.Errorf("finish worksheet %q: %w", sheetName, err)
		}
		result.Sheets = append(result.Sheets, sheet)
	}
	return result, nil
}

func validateSpec(spec WorkbookSpec) error {
	if len(spec.Sheets) == 0 || len(spec.Sheets) > MaxSheets {
		return fmt.Errorf("workbook must contain between 1 and %d worksheets", MaxSheets)
	}
	seen := make(map[string]struct{}, len(spec.Sheets))
	for _, sheet := range spec.Sheets {
		name := strings.TrimSpace(sheet.Name)
		if name == "" || len([]rune(name)) > 31 || strings.ContainsAny(name, ":\\/?*[]") {
			return fmt.Errorf("worksheet name %q is invalid", sheet.Name)
		}
		key := strings.ToLower(name)
		if _, ok := seen[key]; ok {
			return fmt.Errorf("worksheet name %q is duplicated", sheet.Name)
		}
		seen[key] = struct{}{}
		if len(sheet.Headers) == 0 || len(sheet.Headers) > MaxColumns {
			return fmt.Errorf("worksheet %q must have between 1 and %d headers", sheet.Name, MaxColumns)
		}
		headerSeen := make(map[string]struct{}, len(sheet.Headers))
		for _, header := range sheet.Headers {
			key := strings.ToLower(strings.TrimSpace(header))
			if key == "" {
				return fmt.Errorf("worksheet %q contains a blank header", sheet.Name)
			}
			if _, ok := headerSeen[key]; ok {
				return fmt.Errorf("worksheet %q contains duplicate headers", sheet.Name)
			}
			headerSeen[key] = struct{}{}
		}
		if len(sheet.Rows) > MaxRows {
			return fmt.Errorf("worksheet %q exceeds the %d-row limit", sheet.Name, MaxRows)
		}
		for rowIndex, row := range sheet.Rows {
			if len(row) > len(sheet.Headers) {
				return fmt.Errorf("worksheet %q row %d has more values than headers", sheet.Name, rowIndex+1)
			}
		}
	}
	return nil
}
