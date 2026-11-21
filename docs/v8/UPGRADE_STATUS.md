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


## Run 3 — 2026-11-10: durability source and hosted topology audit

**Core source:** `uneXxxx/main` at `8a67c823292901305cad670a60c2f24f0a047267`.  
**Integration branch before this increment:** `upgrade/v8-foundation` at `100423a87828f13af448aeff0297934d332477ae`.

### Completed

- Located and inspected the exact core migration source: `migrations/001_initial.sql` and `migrations/002_idempotency_claims.sql`.
- Mapped the Python and SQLite state-store implementations, the coordinator queue, the seven-stage lifecycle and the generic workflow runner.
- Added [DURABILITY_GAP_AUDIT.md](./DURABILITY_GAP_AUDIT.md) with code-level recovery findings, test coverage, Render topology, Neon backup constraints and the next implementation contract.
- Rechecked Render using the previously confirmed My Workspace. The existing V8 core service is configured from `uneXxxx/main`, auto-deploy off, Free plan, one instance, `/health`; latest listed deployment remains live at commit `8a67c823...` from 2026-11-07. The Node Studio/PWA is a separate service from `uneXpected-ai-studio/main`, with auto-deploy on. No Render-managed PostgreSQL instance was listed.
- Rechecked Neon branch and snapshot metadata. The project remains at 10/10 branches; only the manual snapshot of the empty main branch exists, and main plus v8-migration-test have no automatic snapshot schedule.
- Verified the existing V8 integration branch checks on commit `100423a87828f13af448aeff0297934d332477ae`: mobile integration **30 passed, 0 failed**, TAAFT **3 passed, 0 failed**. Docker build completed successfully in the mobile workflow.

### Verified

- Migration and state-store source read-back: `uneXxxx/migrations/001_initial.sql`, `002_idempotency_claims.sql`, `unexpected_runtime/postgres_storage.py`, `storage.py`, `coordinator.py` and `workflow.py`.
- Core main CI historical run [42383567744](https://github.com/soueilouay-creator/uneXxxx/actions/runs/42383567744): 268 tests passed, 1 skipped, including ephemeral PostgreSQL, migrations, Docker build and container smoke.
- Core hosted verification historical run [42383567757](https://github.com/soueilouay-creator/uneXxxx/actions/runs/42383567757): successful completed-task persistence check after a Render restart on 2026-11-07. This restart workflow was not rerun.
- Current integration-branch mobile run [42747940453](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/42747940453): 30 passed, 0 failed; Docker build passed.
- Current integration-branch TAAFT run [42747940655](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/42747940655): 3 passed, 0 failed.
- Render service metadata and deployment list read back; current HTTP health, private environment values and active Neon DATABASE_URL target were not read.
- Neon aggregate/metadata reads only; no task/event/memory payloads were queried.

### Blocked / not verified

- In-flight task/workflow recovery is not implemented: `claim_next` only claims queued rows; workflow state is held in memory; there is no durable checkpoint/resume API.
- The populated Neon `v8-migration-test` branch has no verified current backup/export plus independent restore/read-back. The existing backup-named child branch lacks a currently listed endpoint; do not treat its name as proof of a usable backup.
- Neon remains at 10/10 branches, has only one manual snapshot on the empty main branch, and no automatic snapshot schedule on main or v8-migration-test.
- Neon endpoint metadata still reports passwordless access enabled, no IP allowlist and public connections not blocked. Security review remains required before application use.
- Current provider authentication and current HTTP health were not freshly tested. No billable provider test was sent.
- Exact IndexedDB schema remains unverified because the supporting module is archive-backed and no trusted local extraction environment was available.

### Preservation / cost

No changes were made to the Python core repository, open PRs #13/#14, Render services, Neon data/branches/snapshots, provider secrets, user data or PWA source. No migrations, package installs, paid infrastructure, provider API calls, production restarts or deployments occurred. Only read-only GitHub, Render and Neon inspection was performed. Neon read-only queries used existing Free-plan compute allowance; remaining quota and account-specific GitHub Actions billing are not exposed.

### Next increment

Create a dedicated feature branch in `uneXxxx`. Add a deterministic crash-during-stage test using the existing ephemeral PostgreSQL CI service and SQLite adapter, then implement additive checkpoint/resume semantics with stable stage idempotency and fail-closed protected-action handling. Keep the populated Neon branch read-only until a current backup/export and restore read-back are verified.


## Latest status — 2026-11-11

**Current phase:** Phase 3 — durable execution foundation.  
**Core implementation:** [uneXxxx PR #16](https://github.com/soueilouay-creator/uneXxxx/pull/16), draft, feature branch `upgrade/v8-workflow-checkpoint-ledger-20261111`.  
**Core base:** `main` at `d04b651774b7699f3430dc36972c2de74c587839`.  
**Core head:** `e395158de06bd733aff8db2a13495bffc5d62d52`.

### Current verified state

- Added an additive workflow/stage checkpoint ledger to both SQLite and PostgreSQL state-store adapters, plus PostgreSQL migration 004.
- New tests prove local-store reopen persistence, preservation of pre-existing task/memory/event records, request-hash mismatch rejection, stage acquisition without duplicate re-execution, attempt-token-bound completion and optimistic revision conflict handling.
- Core runtime CI job [42946106338](https://github.com/soueilouay-creator/uneXxxx/actions/runs/42946106338) passed: **375 tests run, 0 failures, 3 skipped** (372 passed). The PostgreSQL checkpoint test ran successfully against ephemeral PostgreSQL 16.
- Core runtime CI also passed Python compilation, JavaScript syntax, workflow YAML/Bash validation, resource contracts, migration application, SHA-256 inventory, Docker image build, container health/UI/auth/38-role/task smoke and CLI smoke.
- The separate renderer E2E job is still building its immutable worker image; the overall CI run remains in progress until that job finishes.

### Explicit limitations

- The checkpoint API is not yet connected to `Coordinator.run_lifecycle` or `WorkflowRunner`; no automatic workflow resume is claimed.
- A stage left in `started` remains ambiguous and must not be automatically replayed.
- The populated Neon branch remains read-only; a current backup/export and independent restore/read-back path is still unverified.
- No production migration, Render deployment/restart, provider API call or paid generation was performed.

### Next

Finish the renderer E2E job, then integrate checkpoint writes into the existing coordinator and add a deterministic crash/restart test that resumes only from verified completed stages and blocks ambiguous or protected work.


## Latest status — 2026-11-16

**Current phase:** Phase 3 — durable execution and approval-bound workflow recovery.  
**Primary UI/control plane:** `uneXpected-ai-studio` main remains unchanged; integration PR #13 is still separate and unmerged.  
**Runtime:** [`uneXxxx` PR #16](https://github.com/soueilouay-creator/uneXxxx/pull/16), draft branch `upgrade/v8-workflow-checkpoint-ledger-20261111`, current head `ecbb92b34dc292d82baac92ab86c6883ade1364a`.

### Completed in the feature branch
- SQLite and PostgreSQL workflow checkpoint ledgers and additive migrations 004–007.
- Approval execution intents, exact execution/task/action binding, one-use consumption and fail-closed queue recovery.
- Workflow-stage approval intents and lifecycle pause/resume integration.
- HTTP lifecycle stage-approval parsing/validation fix; generic enqueue now preserves optional execution binding metadata in both adapters.
- Regression tests for approval-binding mismatch, explicit checkpointed lifecycle, PostgreSQL concurrent revision winners, protected queued-task recovery in a separate process, and PostgreSQL process termination during a started stage.

### Verification state
- The PostgreSQL migration-preservation job passed in run [43795068890](https://github.com/soueilouay-creator/uneXxxx/actions/runs/43795068890), but that run did not complete the full suite because the SHA inventory was stale at that commit.
- Final-head CI for `ecbb92b34dc292d82baac92ab86c6883ade1364a` is pending. No test/build/security or renderer E2E success is claimed until its final conclusion is green.
- The previous full test run had 438 tests with 3 failures and 3 errors; the identified defects have been corrected and expanded tests added, but the latest results are not yet verified.

### Hosted database decision
- Render workspace `My Workspace` has no Render Postgres instance. Existing V8 web services are Free plan; command-center and unified-test services have auto-deploy disabled. The primary Studio service auto-deploys from main and was not modified.
- Neon organization is Free and contains an existing `unexpected-v8-unified` project with 9 branches. Current table listings show a legacy workspace/task/memory schema, not the new runtime approval/checkpoint tables. All branches are unprotected and compute endpoints are idle/suspended.
- The Neon consumption endpoint is unavailable on Free (403), so remaining quota and exact usage cost are unverified. Do not start an endpoint, add branches, or migrate this project until schema mapping, backup/export, independent restore/read-back and access hardening are complete.

### Release blockers
- The Python runtime feature branch is not yet integrated into the primary Node/PWA control plane; no shared API contract or IndexedDB export/read-back proof has been completed.
- Production PostgreSQL durability is not connected or verified. The existing Neon project must remain read-only.
- Multi-provider live API compatibility, memory migration, MCP scope/security audit, observability/evaluation, engineering sandbox and complete release/rollback checks remain open.
- No production deploy, DNS change, branch merge, user-data migration or paid resource creation is authorized by this status update.



## Run 6 update — 2026-11-16

- Studio integration PR [#13](https://github.com/soueilouay-creator/uneXpected-ai-studio/pull/13) remains a draft on `upgrade/v8-foundation`; main remains unchanged. Current Studio branch checks passed: mobile **30/30**, TAAFT **3/3**, mobile asset integrity and Docker build.
- Runtime PR [#16](https://github.com/soueilouay-creator/uneXxxx/pull/16) received a deterministic test-fixture isolation fix after final-head CI exposed shared-queue contamination in one PostgreSQL recovery test. The test's own synthetic task is now ordered first; the source SHA-256 manifest was updated and read back.
- Rerun [43796453632](https://github.com/soueilouay-creator/uneXxxx/actions/runs/43796453632) is pending. The earlier 441-test run had one test failure and 3 skips; do not treat the PostgreSQL recovery increment as verified until the rerun and renderer E2E both pass.
- Production durability remains blocked: no authorized/verified Neon backup and restore, no migration to the populated Neon project, and no hosted crash-recovery proof.
- No production deployment, Render restart, provider call, user-data migration or paid resource creation occurred.



### Run 6 verification update — 2026-11-16

- Runtime job in [CI run 43796453632](https://github.com/soueilouay-creator/uneXxxx/actions/runs/43796453632) passed on exact head `16abeac70ce4a854ca220d38f2342b344b6269c0`: **441 tests, 0 failures, 3 skipped**. PostgreSQL migration/preservation, SHA-256 inventory, Docker build, actual-container health/UI/auth/38-agent/task smoke and CLI smoke steps all passed.
- The PostgreSQL consumed-approval recovery test, abrupt process-exit checkpoint test and concurrent revision-winner test passed.
- The renderer E2E job is still running its immutable worker-image build. Full CI remains pending until the offline vertical-MP4 render and image-identity checks complete.


## Run 7 current verification — 2026-11-17

**Current branches and review state**
- Studio `main` remains `6f5bc823e1ffd9284abae7dbbb6c1dae97ebf90b`; draft integration PR [#13](https://github.com/soueilouay-creator/uneXpected-ai-studio/pull/13) is on `upgrade/v8-foundation`. At the start of this run its head was `307ced38497f6c44f04dec198e23a579ffbf9f04`, 31 commits ahead and 0 behind main, with no deleted paths.
- Runtime `main` remains `d04b651774b7699f3430dc36972c2de74c587839`; draft runtime PR [#16](https://github.com/soueilouay-creator/uneXxxx/pull/16) is on `upgrade/v8-workflow-checkpoint-ledger-20261111` at `16abeac70ce4a854ca220d38f2342b344b6269c0`.

**Newly verified CI**
- Runtime CI [43796453632](https://github.com/soueilouay-creator/uneXxxx/actions/runs/43796453632) is fully green on the exact PR #16 head: **441 tests, 0 failures, 3 skipped**; runtime and renderer E2E jobs both succeeded. The renderer produced a real vertical MP4 with worker network access disabled and passed image-identity verification.
- Runtime CI also passed additive PostgreSQL migration preservation, source inventory integrity, Docker build, actual-container health/UI/authentication/38-role/task smoke and CLI smoke.
- Studio mobile CI [43796859415](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/43796859415) passed **30 tests** and built the production Docker image.
- Studio TAAFT CI [43796859405](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/43796859405) passed **3 tests**.
- These are feature-branch CI checks only; no production deploy or PR merge is implied.

**Durability boundary**
- SQLite and PostgreSQL checkpoint/approval adapters, revision checks, stage pause/resume and fail-closed ambiguous-stage handling are implemented on the runtime feature branch.
- Ephemeral PostgreSQL tests prove migration preservation, checkpoint persistence, concurrent revision winner behavior and separate-process protected-queue recovery. The abrupt process-exit test currently proves SQLite reopen behavior; do not describe it as a PostgreSQL process-kill proof.
- Production durability is still a release blocker until a current authorized backup/export, independent restore/read-back and production schema/access review are verified. Existing Neon data remains untouched.

**Remaining completion gates**
- Authorized, non-billable live compatibility for OpenAI, Anthropic and at least one additional provider.
- Full Studio/Python API contract and backward-compatibility proof, including browser IndexedDB export/read-back without mutating existing records.
- MCP allowlist/scope, prompt-injection, secret-isolation, approval and audit security tests.
- Model/route/tool trajectory, latency and cost observability plus Promptfoo or equivalent deterministic evaluation in CI.
- Isolated engineering-sandbox acceptance, dependency/license/security audit, rollback rehearsal and documented release candidate.
- No production migration, deployment, merge, paid infrastructure or provider request was performed in this run.

**CI maintenance note:** GitHub Actions reported that `actions/checkout@v4` and `actions/setup-python@v5` target deprecated Node 20 and are being forced onto Node 24. This is non-blocking but should be resolved in a separately tested workflow update.


## Run 7 CI maintenance update — 2026-11-17

- Runtime PR #16 now pins `actions/checkout` v7.0.1 and `actions/setup-python` v7.1.0 by immutable commit SHA in `uneXxxx/.github/workflows/ci.yml`; both action setup steps succeeded on the new head. Checkout credentials are no longer persisted for later workflow steps.
- Runtime CI run [44002008766](https://github.com/soueilouay-creator/uneXxxx/actions/runs/44002008766) stopped at the changed-file SHA inventory check because the CI workflow digest had not yet been refreshed. The manifest was corrected and read back in runtime commit `d1984e025c79bad1a937cbbb97d2d39784bedb38`.
- Corrected-head run [44002242219](https://github.com/soueilouay-creator/uneXxxx/actions/runs/44002242219) is in progress. Action setup, compile/syntax/YAML checks, resource validation, additive PostgreSQL migration preservation and source inventory verification have passed; regression/security and renderer E2E remain pending.
- Studio/PWA CI on `c1c8d7d2850426acd1719da152a4bb0e2bce8471` passed mobile **30/30** and TAAFT **3/3**, with Docker build success. The Studio workflows still use `actions/checkout@v4` and `actions/setup-node@v4`; Node 20 deprecation warnings remain a non-blocking maintenance item.
- No production deployment, Render restart, Neon write, provider call, data migration or paid infrastructure was performed. GitHub Actions account billing remains unverified.


## Run 8 — 2026-11-18 current verification

**Current Studio branch head:** `cc26718fd2f065c42f65e9654da9cc3f269c21d8` (PR #13 remains draft; `main` unchanged at `6f5bc823e1ffd9284abae7dbbb6c1dae97ebf90b`).

### Verified this run
- Both existing Studio CI workflows use immutable SHA pins for checkout v7.0.1 and setup-node v7.1.0, with Node 24 action runtimes, read-only `contents` permission, non-persisted checkout credentials, and caching disabled.
- Mobile CI run [44225409244](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/44225409244): **30/30 passed**; checksum-verified archive/mobile restoration, syntax checks, gateway/mobile HTTP tests and Docker build passed.
- TAAFT CI run [44225409376](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/44225409376): **3/3 passed**.
- Core PR #16 run [44002242219](https://github.com/soueilouay-creator/uneXxxx/actions/runs/44002242219): exact head `d1984e025c79bad1a937cbbb97d2d39784bedb38`, runtime **441 tests, 0 failures, 3 skipped**, renderer E2E **2 passed**; both jobs green.
- Initial CI failure [44225337211](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/44225337211) was a checksum-command escaping error introduced in the workflow edit. It was diagnosed, fixed in `cc26718...`, and the corrected exact-head CI passed.

### Not complete
- Studio PR #13 is still draft and unmerged. Auto-deploy is enabled on the production Studio Render service; disabling it is blocked by unavailable Render service-setting write capability and no authenticated saved browser profile. Do not merge or deploy.
- IndexedDB schema/data export/read-back, shared API integration, provider live compatibility, MCP/security, cost/latency observability, evaluation CI, engineering sandbox and full release/rollback audit remain unverified.
- No production changes, user-data changes, paid infrastructure, provider API requests or deployments were performed. GitHub Actions account-level billing is not visible.


### Run 8 post-documentation verification — 2026-11-18
- Final tested documentation head before this status append: `e3564cdcd1c0209ae46d7f553e8f8ab3f581b2ef` (40 commits ahead, 0 behind main; no deleted paths).
- Mobile CI on that exact head passed twice (push and pull-request events): **30/30**, checksum restoration, syntax, HTTP regression and Docker build. Runs [44225779441](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/44225779441) and [44225782982](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/44225782982).
- TAAFT on that exact head passed twice, **3/3**. Runs [44225779443](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/44225779443) and [44225782956](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/44225782956).
- Preservation inspection confirmed the browser database/core implementation remains in the preserved source archive; the tracked mobile release overlays do not include the database module. Archive extraction was not completed in this environment; IndexedDB schema/data proof remains blocked.


### Run 8 final branch verification — 2026-11-18
- Current tested head before this status append: `247315d9eb594eafd6b4dc42fb8aca5613c21c1e`, **42 ahead / 0 behind** `main`, **12 changed paths / 0 deleted**.
- Mobile push and PR checks both green on this exact head: **30 passed / 0 failed / 0 skipped**. Docker build and archive/mobile checksum restoration passed. [44225909847](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/44225909847), [44225913675](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/44225913675).
- TAAFT push and PR checks both green on exact head: **3 passed / 0 failed / 0 skipped**. [44225909874](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/44225909874), [44225913734](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/44225913734).
- Studio production Render Auto-Deploy remains enabled and unmodified. Its setting-write action is unavailable; no verified browser sign-in profile is available.


## Run 9 — 2026-11-19: archive integrity and IndexedDB source audit

- Added source-bundle SHA-256 verification to the Docker build and mobile CI before extraction. The retained `source.tar.gz.b64` is 14,852 bytes with SHA-256 `02d5451e5ad6c344450a7f16607b92a8967647a75ea8b8a8f56318fffb4d5ee5`.
- Added a source-level test and [archive/IndexedDB audit](./ARCHIVE_INTEGRITY_AND_INDEXEDDB.md). The actual archived module identifies IndexedDB `unexpected-personal-workspace` version 2 with stores `projects`, `conversations`, `memories`, `improvements`, `settings`. Backup schema is `unexpected-local-backup` version 2; parser accepts v1 and v2.
- Important safety finding: existing `importAll` and `clearAll` methods clear all five stores. No such method was invoked or changed. Any future V8 sync/migration must use a separate additive path and must export/confirm/read back before replacement.
- Exact-head push CI [44447209531](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/44447209531) and PR CI [44447213411](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/44447213411) both passed **31/31**, with source checksum, archive restore, syntax, authenticated mobile/gateway tests and Docker build success.
- Rollback point: `backup/v8-foundation-pre-source-hash-20261119` at `a23517e07b27e463e9fd4a880d1a86ba1316d8b7`.
- No actual user IndexedDB records were read or changed. Browser export/import round-trip, shared API integration, provider live tests, MCP security, observability/evaluation, sandbox and release/rollback gates remain open. Production Auto-Deploy is still on; PR #13 stays draft.


## Run 10 — 2026-11-20: IndexedDB fixture harness

- Added an isolated Node test that imports the real archive-restored `mobile/db.js` and `mobile/core.js` modules after the existing asset restoration step.
- The harness creates separate source and target in-memory database factories, seeds synthetic rows in all five stores, creates/parses a v2 backup, verifies v1 compatibility and malformed-input rejection, restores only to a disposable target, and asserts export/read-back equality plus unchanged source records.
- Existing destructive `importAll` behavior is exercised only against disposable synthetic target data; no live browser data is accessed.
- New paths: `test/indexeddb-fixture-roundtrip.test.mjs`, `docs/v8/INDEXEDDB_FIXTURE_ROUNDTRIP.md`.
- Updated `.github/workflows/mobile-integration.yml` to run the test and include it in path filters; linked the report from `docs/v8/README.md`.
- Rollback branch: `backup/v8-foundation-pre-idb-fixture-20261120` at starting head `00bab6c39fe5bd61964166448fa34d2a033d63a1`.
- Local syntax check passed. A temporary contract-replica run passed 1/1, but CI against the actual restored modules is the acceptance gate and is pending.
- No dependencies, infrastructure, schema changes, live data changes, provider calls or production changes.
- Remaining: browser-engine validation, real user-directed backup rehearsal, additive conflict-safe sync design, shared Node/Python API contract, provider live compatibility, MCP/security, observability/evaluation, sandbox, production durability/recovery proof and release/rollback gates.


### Run 10 verification — 2026-11-20

- Code commit: `d251bfbc1c4f73e843aa4998a186d1e55f26c67a`.
- Mobile integration: push and PR both **32/32**, 0 failures, 0 skips; the new actual-module fixture backup/restore/read-back test passed; archive restoration, syntax, authenticated HTTP regression and Docker image build passed. Runs [44664877162](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/44664877162) and [44664883603](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/44664883603).
- TAAFT: push and PR both **3/3**, 0 failures, 0 skips. Runs [44664877186](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/44664877186) and [44664883600](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/44664883600).
- The fixture test uses two independent in-memory IndexedDB-compatible factories and synthetic records. It proves backup v2 round-trip equality, v1 parser compatibility, malformed-input rejection and source-fixture preservation. It is not a browser-engine test or a real user-data rehearsal.
- PR #13 remains draft. Render Auto-Deploy remains enabled; no merge/deployment performed. No live user data, Neon records, provider secrets or settings changed.
- No new dependencies or infrastructure. CI runner billing remains unverified.


## Run 11 — 2026-11-21: real browser IndexedDB verification

**Latest verified code head:** \`1fcc3afd77d3fded37c5175a7980f650bb8a1436\` on \`upgrade/v8-foundation\`.

### Completed and verified

- Added a real headless Chromium test using the actual archive-restored IndexedDB and backup modules.
- The source and restore target use separate loopback origins and an isolated temporary browser profile. Only synthetic fixture rows are used.
- Verified v2 backup creation, v1 parser compatibility, malformed-input rejection, read-back equality for projects/conversations/memories/improvements, safe-settings allowlist behavior, target-only replacement semantics and unchanged source-origin records.
- Mobile push [44858792009](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/44858792009): 32 existing tests passed and the real-browser test passed 1/1; syntax and Docker build passed.
- Mobile PR [44858797372](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/44858797372): same 32/32 plus 1/1 browser test; Docker build passed.
- TAAFT PR [44858797299](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/44858797299): 3/3 passed.
- No npm dependency, production code change, database migration, provider API call or infrastructure addition was made.

### Preservation status

- Existing source bundle, mobile asset bundle, PWA, Node server, TAAFT connector, routes and IndexedDB schema are retained.
- No owner browser profile or live user IndexedDB data was opened, exported, imported or changed.
- The existing \`LocalStore.importAll\` remains destructive across all five stores. It was exercised only in the isolated target origin. Do not use it for live sync.
- A user-directed real backup export and independent restore/read-back remain a separate gate.

### Remaining blockers

- Design and test a separate additive, collision-aware merge contract before any UI wiring.
- Read-only Node/Python API contract integration remains unimplemented.
- Production PostgreSQL durability and recovery are not connected to Studio.
- Live API compatibility for OpenAI, Anthropic and one additional provider remains unverified under authorized non-billable or explicitly budgeted conditions.
- MCP scope/prompt-injection/secret-isolation security tests, observability/evaluation, engineering sandbox, dependency/license/security audit and rollback/release candidate remain open.
- Studio Render Auto-Deploy remains enabled; the previously approved setting change still lacks a supported write path and verified authenticated browser session. PR #13 remains draft; no merge or deployment.
- No critical/high severity audit is claimed complete because the full security/release audit has not yet been performed.

### Cost

No new package or infrastructure. GitHub Actions runner usage occurred; exact account-level billing/quota is not exposed. No model credits or provider API requests were used.


### Run 11 follow-up — 2026-11-21: Chromium cleanup hardening

- Fixed a test-only race found after the first browser CI success: Chrome's process could still hold files in its temporary profile when the test removed that directory.
- The browser test now waits for SIGTERM, uses bounded SIGKILL escalation, waits for process exit before removing the profile, and retries recursive cleanup. It does not remove a profile while Chrome is still alive.
- Final code head \`a8159cd9760a5c6be086acde8f161c0c3e605c66\` passed mobile push [44859050107](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/44859050107) and PR [44859055816](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/44859055816): **32/32** existing tests plus **1/1** real Chromium browser test, syntax checks and Docker build.
- TAAFT PR [44859055572](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/44859055572): **3/3 passed**.
- The preceding cleanup-race failures remain visible in runs [44858987373](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/44858987373) and [44858990032](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/44858990032); they were test cleanup failures, not data or application failures.
- No production code, live user data, database, service setting, deployment, provider API or package changed. GitHub Actions billing remains unverified.
