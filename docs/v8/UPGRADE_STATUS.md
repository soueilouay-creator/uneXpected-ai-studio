# uneXpected V8 upgrade status

**Run:** 1 — foundation baseline  
**Date:** 2026-11-09  
**Status:** Foundation documentation committed; implementation has not yet begun.  
**Base branch:** `main`  
**Base commit:** `6f5bc823e1ffd9284abae7dbbb6c1dae97ebf90b`  
**Working branch:** `upgrade/v8-foundation`

## Completed

- Rechecked current default branch commit and observed `main` at the SHA above.
- Listed current branches; no existing `upgrade/v8-*` branch was present at inspection time.
- Created the additive branch `upgrade/v8-foundation` from the observed main commit.
- Inspected current README, server, Dockerfile, Render blueprint, PWA design specification, TAAFT connector guidance, orchestration tests, provider test stubs, TAAFT tests, mobile PWA tests and workflow directories.
- Added V8 architecture, component decisions, threat model and preservation/migration protocol documents under `docs/v8/`.

## Verified observations

- Existing app is Node.js 22 with a native HTTP service and Docker/Render deployment configuration.
- Existing user-facing mobile/PWA source and profile registries are tracked in the repository.
- Existing provider integration covers OpenAI, Anthropic and OpenRouter, with explicit provenance and mocked fallback tests.
- Existing TAAFT connector is documented as public, read-only catalog access with an explicit allowlist.
- Current Dockerfile decodes `source.tar.gz.b64`, extracts a bundled application tree, then overlays tracked source files.
- Existing test files include orchestration fallback, provider fetch mocks, TAAFT allowlist and mobile PWA behavior.
- Existing GitHub workflow directory contains mobile integration and TAAFT integration workflows.

## Not yet verified / not completed

- No local full test/build run has been performed in this increment.
- No API provider live test has been performed; no billable calls were made.
- No new third-party packages have been installed.
- No database or external service has been created.
- No deployment was triggered or changed.
- No existing user data was accessed, migrated or modified.
- No production durability, agent framework integration, model routing upgrade, tool registry or observability integration is complete.

## Next increment

Inspect GitHub Actions history and test execution availability, map the archive-backed build composition and mobile IndexedDB schema, then establish a reproducible non-destructive baseline. Continue with the first code-level adapter only after current package/build structure is understood.
