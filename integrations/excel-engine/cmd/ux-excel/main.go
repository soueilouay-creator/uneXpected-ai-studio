package main

import (
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"io"
	"os"

	"github.com/soueilouay-creator/uneXpected-ai-studio/integrations/excel-engine/internal/workbook"
)

func main() {
	if err := run(os.Args[1:]); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func run(args []string) error {
	if len(args) == 0 || args[0] == "--help" || args[0] == "-h" {
		printUsage()
		return nil
	}
	switch args[0] {
	case "inspect":
		return runInspect(args[1:])
	case "generate":
		return runGenerate(args[1:])
	default:
		return fmt.Errorf("unknown command %q", args[0])
	}
}

func runInspect(args []string) error {
	flags := flag.NewFlagSet("inspect", flag.ContinueOnError)
	input := flags.String("input", "", "XLSX input path")
	preview := flags.Int("preview-rows", 10, "maximum preview rows (0-20)")
	if err := flags.Parse(args); err != nil {
		return err
	}
	if *input == "" {
		return errors.New("inspect requires --input")
	}
	result, err := workbook.InspectWorkbook(*input, *preview)
	if err != nil {
		return err
	}
	return json.NewEncoder(os.Stdout).Encode(result)
}

func runGenerate(args []string) error {
	flags := flag.NewFlagSet("generate", flag.ContinueOnError)
	specPath := flags.String("input-spec", "", "JSON workbook specification")
	output := flags.String("output", "", "new XLSX output path")
	if err := flags.Parse(args); err != nil {
		return err
	}
	if *specPath == "" || *output == "" {
		return errors.New("generate requires --input-spec and --output")
	}
	file, err := os.Open(*specPath)
	if err != nil {
		return fmt.Errorf("open workbook specification: %w", err)
	}
	defer file.Close()

	decoder := json.NewDecoder(io.LimitReader(file, 1<<20+1))
	decoder.DisallowUnknownFields()
	var spec workbook.WorkbookSpec
	if err := decoder.Decode(&spec); err != nil {
		return fmt.Errorf("decode workbook specification: %w", err)
	}
	result, err := file.Stat()
	if err != nil {
		return err
	}
	if result.Size() > 1<<20 {
		return errors.New("workbook specification exceeds 1 MiB")
	}
	if err := workbook.GenerateWorkbook(*output, spec); err != nil {
		return err
	}
	return json.NewEncoder(os.Stdout).Encode(map[string]any{
		"ok":        true,
		"sheetCount": len(spec.Sheets),
	})
}

func printUsage() {
	fmt.Fprintln(os.Stdout, "uneXpected Excel worker")
	fmt.Fprintln(os.Stdout, "Usage:")
	fmt.Fprintln(os.Stdout, "  ux-excel inspect --input FILE.xlsx [--preview-rows 10]")
	fmt.Fprintln(os.Stdout, "  ux-excel generate --input-spec FILE.json --output NEW_FILE.xlsx")
}
