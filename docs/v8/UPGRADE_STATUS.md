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


## Post-commit verification

- Read-back: all five companion documents plus this status file were fetched from `upgrade/v8-foundation`; the GitHub tree confirms six tracked files under `docs/v8/`.
- Branch tip after the documentation batch: `ec6b72c862d5d983064e05802500097d9b438707`.
- GitHub Actions history checked: the latest ten listed runs were Excel toolkit runs on `feature/excel-vba-toolkit`, not V8 tests. They are not evidence that this branch passes.
- The existing mobile integration workflow is triggered by selected source/test paths and pull requests to `main`; it does not include `docs/v8/**`. The TAAFT workflow is likewise scoped to its connector files. Therefore this docs-only branch did not trigger either workflow.
- No test or Docker build was executed in this environment. Documentation content and branch persistence are read-back verified; runtime integration remains unverified.


## CI baseline established on V8 branch

- Extended the existing `.github/workflows/mobile-integration.yml` triggers to include `upgrade/v8-*`, `docs/v8/**` and `workflow_dispatch`. Existing test/build steps were retained.
- Workflow run: [42618937850 — uneXpected Phone Integration](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/42618937850)
- Run commit: `99cc804764993d691128aa15ca7c93f1dcc487ae`.
- GitHub recorded the workflow as `completed` with conclusion `success`.
- Successful steps: restore the archived public/mobile assets; JavaScript syntax checks; mobile and authenticated gateway HTTP tests; production Docker image build.
- This is a targeted integration workflow, not the complete V8 acceptance suite. The TAAFT-specific workflow was not part of this run, and no live paid provider tests were performed.
- The workflow output confirms the existing archive-backed build still works on this branch. The archive and original assets remain present; no user data or production deployment was changed.


## Run 2 — 2026-11-10

**Status:** Repository baseline and TAAFT CI coverage extended; existing Neon database discovered and audited at metadata/count level. Runtime integration remains blocked pending backup and source-code audit.

### Completed

- Rechecked `main` at `6f5bc823e1ffd9284abae7dbbb6c1dae97ebf90b` and reused `upgrade/v8-foundation`. The branch is now 10 commits ahead and 0 behind main.
- Added `docs/v8/REPOSITORY_INVENTORY.md` and updated the V8 README with the current CI baseline.
- Extended `.github/workflows/taaft-integration.yml` to run on `upgrade/v8-*`, `docs/v8/**` and manual dispatch. Existing triggers were retained.
- Audited the connected Neon project and its public schema without changing data.
- Updated the architecture and component decision records: DBOS is on hold until the existing custom schema and recovery path are understood.

### Verified

- Inventory/CI commit: [a06cd916a6b02ca76b6b65adba1676c88b72efc0](https://github.com/soueilouay-creator/uneXpected-ai-studio/commit/a06cd916a6b02ca76b6b65adba1676c88b72efc0).
- [TAAFT workflow 42745182217](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/42745182217): 3 tests passed, 0 failed; syntax checks passed.
- [Mobile workflow 42745182284](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/42745182284): 30 tests passed, 0 failed; archive restoration, syntax checks and production Docker image build passed.
- Combined: 33 deterministic tests passed, 0 failed. The follow-up documentation commit [34b9e7cd4bdc5f0ab96d5cc24592b2ba8dc5b0f6](https://github.com/soueilouay-creator/uneXpected-ai-studio/commit/34b9e7cd4bdc5f0ab96d5cc24592b2ba8dc5b0f6) was also verified by [TAAFT run 42746150540](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/42746150540) (3/3) and [mobile run 42746150889](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/42746150889) (30/30, syntax checks and Docker build).
- Neon `main` has the two migration records and zero operational rows in the inspected tables. `v8-migration-test` contains 41 tasks, 261 events, 9 agent-version records, 5 outcomes and idempotency records. Only aggregate counts and migration names were read; no payloads were read.

### Blocked / not verified

- No trusted local clone could be obtained because the execution container could not resolve `github.com`; archive-backed IndexedDB source remains uninspected.
- The Neon project is on the Free plan and at 10/10 branches. It has one manual snapshot on main, no automatic snapshot schedule on main or v8-migration-test, and a 6-hour history window. The older restore-rehearsal branch has fewer records than the current migration-test branch; the matching cutover-backup branch had no SQL endpoint available. A current rollback path for the populated test branch is not verified.
- The canonical Node service does not currently connect to the inspected Neon project. The source for `001_initial.sql` and `002_idempotency_claims.sql` has not yet been located.
- Render resource inventory is blocked because the Render connector requires explicit workspace selection; no workspace was selected in this non-interactive run.
- Endpoint metadata reports passwordless access enabled, an empty IP allowlist and public connections not blocked. This needs a security review before application use; no settings were changed.

### Preservation / cost

- No database writes, migrations, branch/snapshot creation, deletions, package installs, provider API calls or production deployments occurred.
- Existing repo files, archives, branches, PWA and TAAFT behavior were retained.
- Neon read-only metadata and aggregate queries used the existing Free-plan compute allowance; no paid plan or charge was initiated. Exact remaining monthly allowance is not exposed.
- GitHub Actions ran on the repository's existing CI setup; account-specific billing impact is not visible.

### Next increment

Locate the source migration/runtime code that produced the Neon schema, then verify a current zero-cost backup/export and restore read-back path for the populated `v8-migration-test` branch before any schema or workflow-engine write.


## Run 2 — repository integration map and runtime selection

- Added [REPO_INTEGRATION_MAP.md](./REPO_INTEGRATION_MAP.md) identifying the existing Node Studio/PWA repository, the Python V8 core repository uneXxxx, the V7.3.1 role/workflow source uneXpected-, and the empty uneXpectedworkflow repository.
- The V8 core repository is at commit 8a67c823292901305cad670a60c2f24f0a047267. Its CI run 42383567744 passed 268 tests with 1 skipped; its hosted verification run 42383567757 passed on 2026-11-07, including completed-task retrieval after a Render restart.
- The V7 and V8 AGENT_CATALOG.json files are identical; 37 of 38 role profiles are byte-identical. Preserve both versioned manifests.
- Architecture decision: use the existing Python V8 Coordinator/38-role registry as the core integration candidate. Mastra is not selected as a second runtime. Reuse the existing MCP gateway and provider router. DBOS remains a candidate only for the unverified in-flight recovery gap.
- The V8 workflow persists completed tasks, but in-flight crash recovery is not proven: the lifecycle runner is in-process and the queue claims only queued tasks. This remains a release blocker.
- V8 marks industrial-maintenance-sales as an active automatic Skill. The owner has stopped that project; preserve its files but add a dormant-project activation gate before integrating the runtime.
- The V8 README's earlier exclusion of Node/PWA is superseded by the current preservation requirement. Keep the Node Studio/PWA and its IndexedDB data as clients/data sources.
- No code was changed in the other owned repositories and no hosted restart was repeated.
