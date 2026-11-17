# uneXpected V8 execution log

This log is append-oriented. Earlier run entries must be retained.

## Run 2 — 2026-11-10

**Phase:** Phase 0 — baseline and preservation; Phase 1 architecture decisions updated.  
**Repository:** [soueilouay-creator/uneXpected-ai-studio](https://github.com/soueilouay-creator/uneXpected-ai-studio)  
**Base:** `main` at `6f5bc823e1ffd9284abae7dbbb6c1dae97ebf90b`.  
**Working branch:** `upgrade/v8-foundation`, 10 commits ahead and 0 behind main at the end of the repository comparison.

### Commits and changed paths

Inventory/CI commit: [`a06cd916a6b02ca76b6b65adba1676c88b72efc0`](https://github.com/soueilouay-creator/uneXpected-ai-studio/commit/a06cd916a6b02ca76b6b65adba1676c88b72efc0)

- Added `docs/v8/REPOSITORY_INVENTORY.md`.
- Updated `docs/v8/README.md`.
- Updated `.github/workflows/taaft-integration.yml` additively so V8 branches and V8 docs run TAAFT checks; added manual dispatch while preserving existing triggers.

Architecture/database-audit commit: [34b9e7cd4bdc5f0ab96d5cc24592b2ba8dc5b0f6](https://github.com/soueilouay-creator/uneXpected-ai-studio/commit/34b9e7cd4bdc5f0ab96d5cc24592b2ba8dc5b0f6). Its CI verification also passed: [TAAFT run 42746150540](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/42746150540) (3/3) and [mobile run 42746150889](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/42746150889) (30/30, syntax checks and Docker build).

This run's documentation follow-up records the Neon discovery and holds DBOS pending an audit:

- Updated `docs/v8/REPOSITORY_INVENTORY.md`.
- Updated `docs/v8/ARCHITECTURE.md`.
- Updated `docs/v8/COMPONENT_DECISIONS.md`.
- Updated `docs/v8/README.md`.
- Updated `docs/v8/UPGRADE_STATUS.md`.
- Added `docs/v8/RUN_LOG.md`.

### CI evidence

- [TAAFT integration run 42745182217](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/42745182217): **3 tests passed, 0 failed**; JavaScript syntax checks passed.
- [Mobile integration run 42745182284](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/42745182284): **30 tests passed, 0 failed**; mobile asset restoration, syntax checks and production Docker image build passed.
- Total for these two deterministic suites: **33 passed, 0 failed**.
- No live provider API request was made.

### Existing Neon database — read-only discovery

- Found an existing PostgreSQL 17 project named `unexpected-v8-unified` on the Neon Free plan in EU Central.
- The Free plan is $0/month within its limits: 100 CU-hours/project/month, 1 GB storage, 10 branches, one manual snapshot and 6-hour history ([official plan limits](https://neon.com/faqs/free-plan-limits-and-quotas)).
- The project is at 10/10 branches. No branch or snapshot was created, deleted or changed.
- The public schema contains 15 tables, including `tasks`, `events`, `agent_versions`, `agent_memory`, `idempotency`, `idempotency_claims`, `consumed_approvals` and `workspace_records`.
- `main` has two schema migrations and zero rows in the inspected operational tables.
- `v8-migration-test` contains 41 tasks, 261 events, 9 agent-version records, 5 outcomes, 1 idempotency record and 1 idempotency-claim record. It is populated and must not be treated as disposable.
- `cutover-restore-rehearsal-20261107` contains fewer records (24 tasks, 139 events, 8 agent versions, 2 outcomes); it is not a verified current copy of the populated migration-test branch.
- `cutover-backup-20261107-v8-migration-test` has no compute endpoint available to the connector, so its data could not be read back.
- The only manual snapshot returned is `uneXpected-pre-cutover-main-2026-11-07` on main. No automatic snapshot schedule was returned for main or v8-migration-test; history retention is 6 hours.
- Aggregate counts and migration names were read only. No task, event, agent, memory or outcome payloads were queried.

### Blockers and safety

- The canonical Node server does not currently connect to this Neon project. The source files for `001_initial.sql` and `002_idempotency_claims.sql` have not yet been located.
- The project has no spare branch capacity, and the populated test branch has no verified current rollback copy. No DBOS install or schema migration is safe yet.
- Neon endpoint metadata reports passwordless access enabled, an empty IP allowlist and public connections not blocked. Review before application connection; no setting changed.
- Render resource inspection remains blocked by an explicit workspace-selection requirement.
- A local clone attempt failed because the execution container could not resolve `github.com`; archive-backed IndexedDB source remains uninspected.

### Preservation and cost

No database writes, migrations, branch/snapshot creation, deletions, package installs, provider calls or production deployments occurred. Existing repo files, branches, archives, PWA, user records and integrations were retained. Read-only Neon queries used the existing Free-plan compute allowance; no paid plan or charge was initiated. Exact remaining monthly compute allowance and account-level billing impact are not visible.

### Next task

Find the migration and runtime source that created the Neon schema. Map its current task/event/idempotency behavior and establish a verified, zero-cost backup/export plus restore read-back path for the populated `v8-migration-test` branch before any write.


### Repository integration and runtime selection — 2026-11-10

- Added [REPO_INTEGRATION_MAP.md](./REPO_INTEGRATION_MAP.md) and aligned the architecture/component decision records in commit [5f1ee7bfeacc737dbc25a87ddfac6c81f2697640](https://github.com/soueilouay-creator/uneXpected-ai-studio/commit/5f1ee7bfeacc737dbc25a87ddfac6c81f2697640).
- Confirmed the existing Python V8 core in [uneXxxx](https://github.com/soueilouay-creator/uneXxxx) at commit 8a67c823292901305cad670a60c2f24f0a047267, and the V7.3.1 source in [uneXpected-](https://github.com/soueilouay-creator/uneXpected-) at commit 59deef5e49208c01d03ccfc6d2e162db54309235.
- V8 CI [42383567744](https://github.com/soueilouay-creator/uneXxxx/actions/runs/42383567744): 268 tests passed, 1 skipped; ephemeral PostgreSQL 16, migrations, regression/security tests, Docker build and container smoke passed.
- V8 hosted verification [42383567757](https://github.com/soueilouay-creator/uneXxxx/actions/runs/42383567757) passed on 2026-11-07. It verified health, bearer authentication, 38 roles, MCP and completed-task retrieval after a Render restart. That workflow restarts Render; it was not re-run.
- V7/V8 AGENT_CATALOG.json files are byte-identical; 37 of 38 role files are identical. The V8 sales-intel profile adds an industrial-maintenance Skill that is active/automatic. It remains dormant by owner policy until explicit restart.
- Current V8 task persistence is verified, but in-flight workflow recovery is not. WorkflowRunner holds stage state in memory and claim_next only claims queued tasks; no stale-running recovery was found.
- The owner requirement to preserve the Node PWA supersedes the V8 repository's earlier exclusion of it. Keep all clients and local data; integrate through a shared API.
- The Node branch CI on commit e7f3b77e5b82eca124984fd24b86e2deea5d0541 passed [30/30 mobile tests](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/42746274128) and [3/3 TAAFT tests](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/42746274019).


## Run 3 — 2026-11-10

**Phase:** Phase 0 source/runtime audit; Phase 1 architecture and durability decisions.  
**Integration repository:** [soueilouay-creator/uneXpected-ai-studio](https://github.com/soueilouay-creator/uneXpected-ai-studio)  
**Core repository inspected:** [soueilouay-creator/uneXxxx](https://github.com/soueilouay-creator/uneXxxx), `main` at `8a67c823292901305cad670a60c2f24f0a047267`.  
**Working branch:** `upgrade/v8-foundation`; pre-increment head `100423a87828f13af448aeff0297934d332477ae`.

### Completed

- Located the exact PostgreSQL migrations and inspected the PostgreSQL/SQLite state stores, idempotency claims, coordinator queue, lifecycle implementation and workflow runner.
- Added `docs/v8/DURABILITY_GAP_AUDIT.md`; updated the V8 README, upgrade status and this append-only run log.
- Rechecked the existing Render workspace and service metadata. V8 core service source is `uneXxxx/main`, auto-deploy disabled; Node Studio/PWA remains a separate service from `uneXpected-ai-studio/main`, auto-deploy enabled. Render lists no managed PostgreSQL instance.
- Rechecked Neon branches, endpoints and snapshots without writing data. Project has 10/10 branches; one manual snapshot is on the empty main branch; no automatic schedule is configured on main or v8-migration-test.
- Confirmed the current Node integration branch has a successful mobile workflow (30/30, Docker build) and TAAFT workflow (3/3).

### Verified findings

- Core code persists tasks/events and has idempotency claims, but `claim_next` only selects queued tasks. A task left running by a process crash is not selected by the next worker.
- The generic `WorkflowRunner` and `Coordinator.run_lifecycle` retain intermediate stage state in memory. Stage outcome events are persisted, but no durable workflow checkpoint/resume API was found.
- The existing idempotency lease test only proves that a claim can be reclaimed; it does not recover the old task or prevent duplicate stage side effects.
- The core CI and hosted restart evidence prove completed-task persistence, not crash-during-stage recovery.
- The populated Neon migration-test branch still has no independently verified backup/export and restore read-back. The backup-named child branch has no current compute endpoint in the endpoint inventory and cannot be treated as a verified backup.
- Render service configuration/deployment metadata was read. Current HTTP health, private environment values and active Neon DATABASE_URL branch remain unverified.

### Evidence

- [Current mobile workflow 42747940453](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/42747940453): 30 tests passed, 0 failed; Docker image build succeeded.
- [Current TAAFT workflow 42747940655](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/42747940655): 3 tests passed, 0 failed.
- [Core CI 42383567744](https://github.com/soueilouay-creator/uneXxxx/actions/runs/42383567744): 268 passed, 1 skipped, on 2026-11-07.
- [Core hosted verification 42383567757](https://github.com/soueilouay-creator/uneXxxx/actions/runs/42383567757): completed-task persistence after a Render restart, on 2026-11-07.

### Preservation and cost

No core source files, open core PRs, Render resources, Neon branches/snapshots/rows, PWA stores, provider secrets or user data were changed. No provider API calls, migrations, database writes, deployments, restarts, package installs or paid services were used. Read-only Neon inspection consumed existing Free-plan compute allowance; exact remaining quota and account-level GitHub Actions billing are not visible.

### Next increment

Create a feature branch in `uneXxxx` and implement a deterministic crash-during-stage recovery test plus an additive checkpoint/resume contract. Keep Neon production/test data read-only until a current backup/export and independent restore/read-back path is verified.


## Run 4 — 2026-11-11: additive workflow checkpoint ledger

**Phase:** Phase 3 — durable execution foundation.  
**Integration repository:** [uneXpected-ai-studio](https://github.com/soueilouay-creator/uneXpected-ai-studio), branch `upgrade/v8-foundation`.  
**Core repository:** [uneXxxx](https://github.com/soueilouay-creator/uneXxxx), `main` base `d04b651774b7699f3430dc36972c2de74c587839`.  
**Core feature branch:** `upgrade/v8-workflow-checkpoint-ledger-20261111`.  
**Core draft PR:** [#16 — durable workflow checkpoint ledger](https://github.com/soueilouay-creator/uneXxxx/pull/16).  
**Core head:** `e395158de06bd733aff8db2a13495bffc5d62d52`.

### Completed

- Added PostgreSQL migration `migrations/004_workflow_checkpoints.sql` with new workflow and stage checkpoint tables. The migration is additive and uses `ON DELETE RESTRICT`; it does not update or delete existing application rows.
- Added matching local SQLite schema and methods to `unexpected_runtime/storage.py`.
- Added PostgreSQL checkpoint methods to `unexpected_runtime/postgres_storage.py`.
- Added request-hash validation, idempotent checkpoint creation, unique stage identity, fail-closed duplicate stage acquisition, attempt-token-bound completion and optimistic revision updates.
- Added `tests/test_workflow_checkpoint_storage.py` and `docs/v8/WORKFLOW_CHECKPOINT_LEDGER.md`.
- Updated `FILE_INVENTORY_SHA256.txt` for all changed source/test/migration/documentation files.
- Opened the work as draft PR #16; no merge or deployment was performed.

### Verified so far

- The PR diff contains six changed files and no deleted files.
- The CI run [42946106338](https://github.com/soueilouay-creator/uneXxxx/actions/runs/42946106338) started on the exact head SHA above.
- Runtime job completed Python dependency installation, Python compilation, JavaScript syntax checks, workflow YAML/Bash validation, resource/quality contract validation, PostgreSQL migration application to the ephemeral CI database, source fixture creation and SHA-256 inventory validation.
- At log time, the full regression/security suite was still running; renderer image build was also still running. No test/build pass is claimed yet.

### Safety and preservation

- The populated Neon project, all live branches/snapshots/rows, Render services, environment secrets, provider routes, existing task/event/memory/approval records and user data were not modified.
- The new migration was applied only by the GitHub Actions ephemeral PostgreSQL CI job.
- Existing code is still not wired to call the new checkpoint API. This is storage groundwork, not a completed crash-resume implementation.
- A stage left in `started` remains ambiguous and cannot be automatically re-executed through this API. No exactly-once provider-call claim is made.
- No provider API, paid generation service, new infrastructure or production deployment was used. GitHub Actions account-level billing impact is not exposed.

### Blockers / next increment

- Await the complete runtime regression/security suite, Docker build/container smoke and renderer E2E result. Fix any failures on the feature branch and rerun CI.
- Then integrate the ledger into `Coordinator.run_lifecycle` and `WorkflowRunner`, persisting stage state/results and adding a restart test that resumes only from verified completed checkpoints while blocking ambiguous or protected stages.
- Keep Neon read-only until a current backup/export and independent restore/read-back path is verified.


### Run 4 verification update — 2026-11-11

- Core runtime job [42946106338](https://github.com/soueilouay-creator/uneXxxx/actions/runs/42946106338) completed successfully.
- Full runtime suite: **375 tests run, 0 failures, 3 skipped**. The three new checkpoint tests all passed: SQLite reopen/preservation, SQLite hash/identity rejection, and PostgreSQL checkpoint persistence with duplicate-stage replay refusal.
- CI successfully applied migrations 001–004 to the ephemeral PostgreSQL 16 service, verified the SHA-256 source inventory, built the V8 Docker image, booted the actual image and passed health/UI/authentication/38-role/task invocation smoke checks, then passed CLI smoke checks.
- The separate renderer E2E job was still building its immutable worker image at this update. The overall workflow therefore remains in progress; no full-workflow success is claimed yet.


### Preserved Studio/PWA surface verification update — 2026-11-11

- The latest integration-branch head `7d33f92354c0be1784f178caae78235a25941857` was verified by [mobile integration run 42946597768](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/42946597768): **30 tests passed, 0 failed**, and the existing Docker image build completed successfully.
- The same head passed [TAAFT integration run 42946597781](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/42946597781): **3 tests passed, 0 failed**.
- These are regression checks on the preserved Node Studio/PWA and TAAFT integration branch. They do not establish that the Node service has been deployed or that its local IndexedDB records were migrated; no such action was performed.


## Run 5 — 2026-11-16 — Approval-bound execution and database-topology audit

**Primary repository:** `main` at `6f5bc823e1ffd9284abae7dbbb6c1dae97ebf90b`; integration branch `upgrade/v8-foundation` remains a separate draft PR.  
**Runtime repository:** [`uneXxxx` PR #16](https://github.com/soueilouay-creator/uneXxxx/pull/16), draft branch `upgrade/v8-workflow-checkpoint-ledger-20261111`; current reviewed head `ecbb92b34dc292d82baac92ab86c6883ade1364a`.

### Completed this run
- Repaired the runtime's lifecycle HTTP approval parser: lifecycle stage approvals are now initialized and validated in the lifecycle branch rather than an unreachable nested non-lifecycle branch. This removed the unbound `stage_approvals` failure and restores the safe pause/resume API path.
- Preserved optional `execution_id` and `approval_reference` fields through both SQLite and PostgreSQL generic task enqueue payloads so restart recovery can reconcile queued protected tasks with their execution intent.
- Tightened regression coverage for approval binding to workflow, stage, execution, task, permission and action digest; corrected adapter-shape expectations and made protected-stage recovery denial explicitly require human review.
- Added PostgreSQL recovery coverage that runs the protected-queue recovery worker in a separate OS process and a crash-after-stage-claim test that proves a restarted process does not replay an ambiguous started stage.
- Kept all work on the existing feature branch. No merge, production deploy, Render restart, provider API call, Neon write or user-data migration was performed.

### Verified / pending
- The existing branch already contains additive PostgreSQL migrations 004–007 and SQLite/PostgreSQL checkpoint, approval-intent and stage-intent adapters. The ephemeral PostgreSQL migration-preservation step passed in CI run [43795068890](https://github.com/soueilouay-creator/uneXxxx/actions/runs/43795068890); that run later stopped at the then-stale SHA inventory, so it is not a full regression pass.
- A fresh final-head CI run is in progress for `ecbb92b34dc292d82baac92ab86c6883ade1364a`. Do not mark the full suite or renderer E2E complete until that run reports success.
- Earlier full regression on the previous branch head reported 438 tests with 3 failures and 3 errors. The failures were traced to a lifecycle HTTP parser bug, omitted task binding fields, test-fixture binding gaps and adapter/parameter mismatches; fixes are now included but remain pending final CI evidence.

### Resource and cost audit
- Render workspace `My Workspace`: no Render Postgres instances. Existing V8 command-center and unified-test web services are Free plan with auto-deploy disabled; the command-center's latest live deploy remains commit `8a67c823...` from 2026-11-07. The primary Studio service remains Free plan, auto-deploying from `main`, with latest live deploy at `6f5bc823...`.
- Neon organization plan is Free. Existing project `unexpected-v8-unified` is in `aws-eu-central-1` with 9 existing branches and idle/suspended compute endpoints. Main and `v8-migration-test` table listings show the existing legacy workspace/task/memory schema; the new runtime approval/checkpoint tables were not listed. Branches are unprotected. No endpoint was started and no SQL write was issued.
- Neon consumption details are unavailable on the Free plan (the usage endpoint returned 403), so exact remaining quota/cost cannot be verified. No database, branch, endpoint, service, dependency or paid infrastructure was created.

### Preservation
- Current primary and runtime branches remain separate from `main`; no deleted paths were present in the last branch comparisons. Existing Render deployments, Neon branches, PWA files and user data were left untouched.
- The populated Neon project remains unsuitable for automatic migration until its existing schema is mapped, a current backup/export is verified, and an independent restore/read-back rehearsal is approved.

### Next increment
- Confirm the final-head CI run, then update the approval/checkpoint decision log with verified test counts. Continue the PostgreSQL process-recovery and exact-once/idempotency audit. Keep the existing Neon project read-only until backup, schema compatibility and access hardening are independently proven.



## Run 6 — 2026-11-16 — PostgreSQL recovery test isolation

**Phase:** Phase 3 — durable execution and approval-bound recovery.  
**Studio repository:** `uneXpected-ai-studio`, main remains at `6f5bc823e1ffd9284abae7dbbb6c1dae97ebf90b`; integration branch `upgrade/v8-foundation` at `af137273512730881aba22edf6a53837892b0764`, draft PR [#13](https://github.com/soueilouay-creator/uneXpected-ai-studio/pull/13).  
**Runtime repository:** [`uneXxxx` PR #16](https://github.com/soueilouay-creator/uneXxxx/pull/16), branch `upgrade/v8-workflow-checkpoint-ledger-20261111`.

### Completed this run

- Rechecked the live Studio default branch and existing integration branch/PR before changes. The integration branch is 27 commits ahead and 0 behind main; its current diff has 12 paths and no deleted files (one existing workflow line was adjusted while adding path coverage).
- Verified the Studio integration checks on commit `af137273512730881aba22edf6a53837892b0764`: mobile suite **30/30 passed**, source-archive/mobile-assets SHA check passed, and the Docker image build completed; TAAFT suite **3/3 passed**. No production deployment was run.
- Inspected the final-head runtime CI failure on `uneXxxx` commit `ecbb92b34dc292d82baac92ab86c6883ade1364a`. The suite ran 441 tests with 3 skipped and one failure in `test_restart_readback_blocks_queued_consumed_approval_instead_of_replaying`: the shared ephemeral PostgreSQL queue let the worker claim an older queued fixture before the task created by that test.
- Fixed the test isolation defect on the existing runtime feature branch. The test now moves only its own synthetic queued row to the front of the ephemeral test queue before starting the recovery worker. No runtime production behavior or hosted data was changed.
- Updated `FILE_INVENTORY_SHA256.txt` for the modified test and read both the test and manifest back. The recorded digest matches the SHA-256 calculated before commit.
- Commits: `7912aac8e07c8f592bff975c7e11194295cca3c2` (test fixture isolation) and `16abeac70ce4a854ca220d38f2342b344b6269c0` (inventory digest).

### Verification / pending

- The failed baseline run was [43795567835](https://github.com/soueilouay-creator/uneXxxx/actions/runs/43795567835); its renderer E2E job passed, but the runtime job failed on the queue-fixture assertion above.
- Fresh final-head CI [43796453632](https://github.com/soueilouay-creator/uneXxxx/actions/runs/43796453632) is running on `16abeac70ce4a854ca220d38f2342b344b6269c0`. At log time, the PostgreSQL/runtime regression suite and immutable renderer-image build had not completed. No green result is claimed.
- Studio integration CI evidence is separate from runtime CI and does not prove the Python runtime has been deployed or that PWA IndexedDB data has been migrated.

### Preservation and cost

- No main-branch changes, deleted files, production migrations, Neon writes, Render changes/restarts/deployments, provider API calls, user-data migrations, or changes to PWA IndexedDB records were made.
- The existing source archive, mobile PWA, TAAFT connector, legacy routes and production deployment remain untouched.
- No package or infrastructure was added and no paid provider/API service was used. GitHub Actions account-level billing is not exposed by the repository checks.

### Next increment

- Verify the final-head CI result for `16abeac70ce4a854ca220d38f2342b344b6269c0`, inspect the exact runtime test count and renderer E2E output, then record the result. Keep the populated Neon project read-only until a current export, independent restore/read-back and access hardening are proven.



### Run 6 verification update — 2026-11-16

- Runtime CI [43796453632](https://github.com/soueilouay-creator/uneXxxx/actions/runs/43796453632), exact head `16abeac70ce4a854ca220d38f2342b344b6269c0`: runtime job completed successfully. The regression/security suite ran **441 tests, 0 failures, 3 skipped** in 84.751 seconds.
- The formerly failing PostgreSQL recovery test now passes. The separate-process abrupt-exit test and the 20-connection revision-winner test also pass on the ephemeral PostgreSQL 16 service.
- The PostgreSQL migration/preservation step and source SHA-256 inventory check completed successfully. The V8 Docker image built, the container smoke passed health/UI/authentication/38-agent/task-invocation checks, and CLI smoke tests completed.
- The independent renderer E2E job in the same workflow is still building its immutable worker image. The full workflow is therefore not yet green; no renderer MP4 or full-workflow pass is claimed at this point.


## Run 7 — 2026-11-17 — Full CI completion and evidence reconciliation

**Phase:** Phase 3 — durable execution and approval-bound recovery; cross-repository release-readiness verification.

### Live repository state at start of run
- Studio default branch `main`: `6f5bc823e1ffd9284abae7dbbb6c1dae97ebf90b`.
- Studio integration branch `upgrade/v8-foundation`: `307ced38497f6c44f04dec198e23a579ffbf9f04`; draft PR [#13](https://github.com/soueilouay-creator/uneXpected-ai-studio/pull/13), open and mergeable.
- Studio comparison: 31 commits ahead, 0 behind; 12 changed paths, no deleted files. The one line deletion reported in PR statistics is a workflow trigger-line replacement, not a deleted file.
- Runtime default branch `main`: `d04b651774b7699f3430dc36972c2de74c587839`.
- Runtime feature branch `upgrade/v8-workflow-checkpoint-ledger-20261111`: `16abeac70ce4a854ca220d38f2342b344b6269c0`; draft PR [#16](https://github.com/soueilouay-creator/uneXxxx/pull/16), open and mergeable.

### Completed this run
- Reconciled the previous run's pending renderer note against the completed final-head CI evidence.
- Confirmed runtime CI [43796453632](https://github.com/soueilouay-creator/uneXxxx/actions/runs/43796453632), run 343, completed with overall `success` on exact runtime head `16abeac70ce4a854ca220d38f2342b344b6269c0`.
- Confirmed the runtime regression/security suite ran **441 tests, 0 failures, 3 skipped** in **84.751 seconds**. The PostgreSQL recovery-fixture failure from run 342 is resolved on this exact head.
- Confirmed both jobs in that workflow passed:
  - `runtime-tests`: migration-preservation check, SHA-256 inventory, regression/security suite, Docker image build, actual-container health/UI/authentication/38-role/task smoke and CLI smoke.
  - `renderer-e2e`: immutable renderer worker image build, real vertical MP4 render with worker network disabled, and renderer image-identity verification.
- Confirmed the PostgreSQL migration-preservation fixture retained a pre-existing task, event, memory row and legacy consumed approval across additive migrations; no populated Neon branch was touched.
- Confirmed the 20-connection PostgreSQL revision-winner test and separate-process protected-queue recovery test passed. The abrupt-process-exit test specifically proves SQLite reopen leaves an ambiguous started stage blocked; it is not a PostgreSQL process-kill proof.
- Confirmed Studio/PWA integration checks on branch head `307ced38497f6c44f04dec198e23a579ffbf9f04`:
  - Mobile workflow [43796859415](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/43796859415): **30 tests passed**, asset restore/syntax/gateway checks and Docker image build succeeded.
  - TAAFT workflow [43796859405](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/43796859405): **3 tests passed**.
- Appended this evidence to the V8 run log and current status without rewriting earlier history. The previous branch commit `307ced38497f6c44f04dec198e23a579ffbf9f04` is the immutable rollback point for these documentation-only changes.

### Verified limitations / release blockers
- The runtime's fail-closed checkpoint behavior is verified in ephemeral CI; a stage left in `started` remains ambiguous and is not automatically replayed. This is safe refusal, not an exactly-once guarantee.
- Production PostgreSQL durability remains blocked: no current authorized Neon backup/export plus independent restore/read-back has been verified, no production migration was run, and the populated Neon project remains read-only.
- OpenAI, Anthropic and a third provider still lack authorized non-billable live compatibility tests.
- Browser IndexedDB schema/export/read-back, complete Node/Python API compatibility, MCP threat/security suite, end-to-end cost/latency observability, Promptfoo-equivalent CI coverage, and isolated engineering-sandbox acceptance remain open.
- GitHub Actions emitted a non-blocking Node 20 deprecation warning for `actions/checkout@v4` and `actions/setup-python@v5`, which the runner is forcing onto Node 24. Review compatible Node 24 action majors in a separate bounded CI-maintenance increment.

### Preservation / cost
- No changes to either `main` branch, no merge, production deployment, Render restart, DNS change, populated Neon write, provider API request, user-data migration, IndexedDB mutation or external publication.
- Existing Studio/PWA routes, source archive, TAAFT allowlist, runtime role registry and prior commits remain intact.
- No dependency or infrastructure was added. No provider/generation credits were consumed. GitHub Actions account-level billing is not exposed; exact usage cost remains unverified.

### Next increment
Inspect the CI action deprecation warning and upgrade only the affected workflow action versions after official release/runtime/security compatibility checks, preserving the current branch head and rerunning the full deterministic CI. Keep the populated Neon project read-only.
