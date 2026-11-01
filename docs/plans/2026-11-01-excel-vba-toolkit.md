# General-Purpose Excel Toolkit — Implementation Record

> Execution record for `feature/excel-vba-toolkit`.

**Goal:** Provide a reusable, industry-neutral Excel automation foundation with safer VBA helpers, workbook validation, and general routing guidance.

**Architecture:** Keep the toolkit as importable VBA modules under `integrations/excel-vba-kit/`. Track source provenance and MIT licensing in a manifest. Define a general Excel specialist under `specialists/excel-vba/`. Validate source contracts and safety rules through the Node.js 22 test runner and a dedicated GitHub Actions workflow. Keep desktop VBA execution outside the Node.js/Render runtime.

**Tech Stack:** VBA 7 / Windows desktop Excel, Node.js 22 built-in test runner, GitHub Actions.

## Global constraints

- Keep this integration isolated to its feature branch; do not merge to `main` or deploy Render.
- Preserve upstream MIT attribution and the reviewed source tree SHA.
- Keep the core industry-neutral; domain-specific packs are optional extensions.
- Inspect the actual workbook schema before adding business-specific logic.
- Require explicit Workbook/Worksheet/Range references.
- Keep inventory and data-validation helpers read-only.
- Never bypass protection, break external links, mutate Outlook, or overwrite source files by default.
- Capture and restore every Excel application setting changed by performance helpers.
- Treat the specialist profile as documentation until connected to the authoritative v7 registry.
- Node tests are static contract checks only; Excel compile/runtime validation is a separate desktop gate.

## Delivered core modules

1. `modUxWorkbook.bas`: explicit workbook/sheet checks and last-used row/column discovery.
2. `modUxFileSystem.bas`: read-only file/folder checks, inventory, and selection dialogs.
3. `modUxText.bas`: case-insensitive keyword search.
4. `modUxDataValidation.bas`: header lookup, missing-header checks, blank counting, and duplicate-cell identification.
5. `modUxApplicationState.bas`: reversible application performance settings.
6. `modUxDiagnostics.bas`: append-only sanitized error logging.

## General-use coverage

Documentation and routing cover data quality, inventory/resource registers, sales/customer exports, finance/budget extracts, project/task tracking, scheduling/attendance, research, and operational datasets. Examples are generic and do not assume a particular employer or industry. Domain-specific rules are added only on request and after workbook inspection.

## Verification

- Static tests verify provenance, required source files, explicit object references, read-only helpers, reversible settings, sanitized diagnostics, specialist guidance, and general-purpose positioning.
- GitHub Actions runs Node.js 22 syntax and contract tests.
- Desktop Excel compilation and runtime behavior remain unverified until modules are imported and exercised in a supported Office installation.
- The package does not execute VBA on Render and does not automatically register runtime specialist dispatch.
