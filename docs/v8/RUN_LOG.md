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


### Run 7 CI action maintenance update — 2026-11-17

- In runtime PR [#16](https://github.com/soueilouay-creator/uneXxxx/pull/16), inspected the full CI workflow and verified the current official releases: `actions/checkout` v7.0.1 and `actions/setup-python` v7.1.0. Both action manifests declare the Node 24 runtime; both repositories publish MIT licenses, and their public security pages showed no published advisories at review time. Exact release commit SHAs are pinned rather than floating major tags.
- Updated both checkout steps and both Python setup steps in `uneXxxx/.github/workflows/ci.yml` to immutable SHAs; added `persist-credentials: false` to the read-only checkout steps. Runtime workflow commit: `25696eefc0d261ccc7cb07ac6dc7ca89bf461c57`.
- First verification attempt [44002008766](https://github.com/soueilouay-creator/uneXxxx/actions/runs/44002008766) exposed a stale SHA-256 manifest entry for the changed CI workflow (expected `fb69ab...`, actual `d81e29...`). The workflow itself parsed and the new action setup steps succeeded. Updated the exact manifest digest in commit `d1984e025c79bad1a937cbbb97d2d39784bedb38` and read it back.
- Corrected-head CI [44002242219](https://github.com/soueilouay-creator/uneXxxx/actions/runs/44002242219) is running on `d1984e025c79bad1a937cbbb97d2d39784bedb38`. At this log update, both Node 24 action setup steps, Python dependency setup, compilation, JavaScript syntax, workflow YAML/Bash validation, resource contracts, additive PostgreSQL migration-preservation and SHA-256 inventory steps have passed. The full runtime regression/security suite and offline renderer E2E are still in progress; no final pass is claimed.
- Studio/PWA CI on branch head `c1c8d7d2850426acd1719da152a4bb0e2bce8471` passed again: mobile **30/30** plus Docker build, and TAAFT **3/3**. Those Studio workflows still use `actions/checkout@v4` and `actions/setup-node@v4`, so their Node 20 deprecation warnings remain open for a separate update.
- No application runtime dependency, infrastructure, production service, database, provider key, user record or deployment was changed. GitHub Actions billing remains unexposed.

**Next:** verify corrected-head runtime CI [44002242219](https://github.com/soueilouay-creator/uneXxxx/actions/runs/44002242219), then assess and pin Node 24-compatible checkout/setup-node actions in the Studio workflows.


## Run 8 — 2026-11-18 — Studio CI supply-chain hardening and verification

**Phase:** Phase 0 preservation/CI baseline; Phase 9 cross-repository release readiness.  
**Studio repository:** `soueilouay-creator/uneXpected-ai-studio`, branch `upgrade/v8-foundation`, PR [#13](https://github.com/soueilouay-creator/uneXpected-ai-studio/pull/13), base `main` at `6f5bc823e1ffd9284abae7dbbb6c1dae97ebf90b`.  
**Rollback point before this increment:** `e994b07fc0a45678f5edeb732683334e67376a73`.

### Changes
- Updated `.github/workflows/mobile-integration.yml` and `.github/workflows/taaft-integration.yml` to pin the official `actions/checkout` v7.0.1 and `actions/setup-node` v7.1.0 immutable SHAs.
- Both workflows now set `permissions: contents: read`, disable checkout credential persistence, and disable setup-node's package-manager caching because these jobs do not install/cache npm dependencies.
- Upstream manifests at the exact pins declare Node 24 runtime; both upstream LICENSE files are MIT. The tested project Node remains 22.
- Action pins: checkout `3d3c42e5aac5ba805825da76410c181273ba90b1`; setup-node `949feb2413d6458794dcd2491c4babbbce0c15c1`.

### Verification
- Initial mobile run [44225337211](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/44225337211) failed in the archive checksum step: the edited shell `printf` used an escaped backslash incorrectly, causing sha256sum to treat the filename as ending with literal `\\n`. The failure was inspected; it was not a test or application regression. TAAFT on that same head passed **3/3**.
- Corrected the single checksum-print line in commit [cc26718fd2f065c42f65e9654da9cc3f269c21d8](https://github.com/soueilouay-creator/uneXpected-ai-studio/commit/cc26718fd2f065c42f65e9654da9cc3f269c21d8).
- Mobile workflow [44225409244](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/44225409244), exact head `cc26718fd2f065c42f65e9654da9cc3f269c21d8`: **30 tests passed, 0 failed, 0 skipped**; archive/mobile asset restore and checksum, syntax checks, authenticated gateway/mobile HTTP tests, and Docker image build all passed.
- TAAFT workflow [44225409376](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/44225409376), same head: **3 passed, 0 failed, 0 skipped**.
- Runtime PR #16 CI [44002242219](https://github.com/soueilouay-creator/uneXxxx/actions/runs/44002242219) is now fully green on exact head `d1984e025c79bad1a937cbbb97d2d39784bedb38`: runtime **441 tests, 0 failures, 3 skipped**; separate renderer E2E **2 tests passed**. Both jobs passed. This completes the prior run's pending renderer verification.

### Preservation / cost
- The two CI workflow files are the only application-repository files changed in this increment; existing triggers and test/build steps were preserved. No paths were deleted. The source bundle, PWA, TAAFT allowlist, user data, provider secrets, and production deployment were untouched.
- No new dependency, provider call, paid service, migration, Render setting change, or production deployment was made. GitHub Actions runner usage occurred; account billing/quota is not exposed, so exact cost remains unverified.

### Blockers / next
- Studio PR #13 remains a draft. Production Auto-Deploy for the Studio Render service is still on; the Render connector cannot change that service setting, and the saved browser profile has no verified Render sign-in. Do not merge while that guard remains unverified.
- Browser IndexedDB database/schema/export/read-back and full Python-core ↔ Node/PWA contract integration remain incomplete.
- Production durability, provider compatibility, MCP security, observability/evaluation, engineering sandbox, rollback and final release gates remain open.
- Continue with a migration-safe IndexedDB/source inventory and safe control-plane integration contract; keep Neon read-only and production deployment separate.


### Run 8 post-documentation verification — branch head e3564cdcd1c0209ae46d7f553e8f8ab3f581b2ef

- The two append-only V8 documentation commits advanced the feature branch to `e3564cdcd1c0209ae46d7f553e8f8ab3f581b2ef`. Compare still shows **40 ahead, 0 behind** and no deleted paths.
- Exact-head push-event CI [44225779441](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/44225779441) and PR-event CI [44225782982](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/44225782982) both passed mobile: **30/30 tests, 0 failed, 0 skipped**, restoration/checksum, syntax, HTTP tests and Docker build.
- Exact-head push-event TAAFT [44225779443](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/44225779443) and PR-event TAAFT [44225782956](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/44225782956) both passed: **3/3, 0 failed, 0 skipped**.
- Source inventory follow-up: the tracked `mobile-release/` directory contains only `app.js`, `index.html`, `providers.js`, `styles.css`, and `sw.js`; tracked `mobile/` contains only the icon, manifest and service worker. Database/core logic is still in the retained `source.tar.gz.b64` bundle. The raw bundle could not be materialized in this environment for extraction, so IndexedDB schema and data export/read-back remain **not verified**.


### Run 8 final branch verification — head `247315d9eb594eafd6b4dc42fb8aca5613c21c1e`

- Final head at the time of this entry: **42 commits ahead / 0 behind** `main`; the PR comparison contains **12 paths, 0 deleted paths**.
- Mobile CI passed on exact head for both push and PR events: **30/30, 0 failed, 0 skipped**, including checksum restore, syntax, authenticated HTTP tests and Docker build. Runs [44225909847](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/44225909847) and [44225913675](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/44225913675).
- TAAFT passed on exact head for both push and PR events: **3/3, 0 failed, 0 skipped**. Runs [44225909874](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/44225909874) and [44225913734](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/44225913734).
- Render service inventory still reports the Studio service `autoDeploy=yes`, trigger `commit`. No settings change was made. The previously approved disable step remains blocked by lack of a Render settings-write tool and a verified signed-in browser profile.
- This final verification confirms the CI workflow hardening and docs on this head only; it does not complete the product integration or production release.


## Run 9 — 2026-11-19

**Phase:** Phase 0 — source/build preservation and IndexedDB source inventory; Phase 1 — evidence and migration guardrails.  
**Repository:** [soueilouay-creator/uneXpected-ai-studio](https://github.com/soueilouay-creator/uneXpected-ai-studio)  
**Base:** `main` at `6f5bc823e1ffd9284abae7dbbb6c1dae97ebf90b`.  
**Working branch:** `upgrade/v8-foundation`; rollback branch `backup/v8-foundation-pre-source-hash-20261119` preserves the pre-checksum head `a23517e07b27e463e9fd4a880d1a86ba1316d8b7`. The earlier `backup/v8-foundation-pre-archive-audit-20261119` preserves the pre-audit head.

### Completed

- Added a SHA-256 guard for the retained `source.tar.gz.b64` before decoding in `Dockerfile`.
- Added the same pre-extraction SHA-256 guard to `.github/workflows/mobile-integration.yml`.
- Extended `test/mobile-pwa.test.mjs` with a deterministic source-archive and IndexedDB-source audit. It verifies gzip/base64 integrity, the exact archive checksum, the presence of the archived database and backup modules, and absence of database/store deletion APIs in the schema module.
- Added `docs/v8/ARCHIVE_INTEGRITY_AND_INDEXEDDB.md` and linked it from this V8 README.
- The CI-extracted source revealed the exact existing IndexedDB contract: database `unexpected-personal-workspace`, version 2, stores `projects`, `conversations`, `memories`, `improvements`, `settings`; backup schema `unexpected-local-backup`, version 2, with v1 compatibility.
- Identified that existing `LocalStore.importAll` and `clearAll` clear all five stores. These methods were preserved and not called. The new V8 sync/migration layer must not reuse them without an export, explicit user confirmation and read-back.

### Changed paths

- `Dockerfile`
- `.github/workflows/mobile-integration.yml`
- `test/mobile-pwa.test.mjs`
- `docs/v8/ARCHIVE_INTEGRITY_AND_INDEXEDDB.md` (new)
- `docs/v8/README.md`
- `docs/v8/RUN_LOG.md`
- `docs/v8/UPGRADE_STATUS.md`

### Verification

- Source archive: 14,852 encoded bytes; SHA-256 `02d5451e5ad6c344450a7f16607b92a8967647a75ea8b8a8f56318fffb4d5ee5`.
- Extracted `mobile/db.js`: SHA-256 `ca326fd8f4b37b4c69bb02acedcdb3468503631eb5d7fc6024d4b9f42a44db30`.
- Exact-head push CI [44447209531](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/44447209531): **31 passed, 0 failed, 0 skipped**; source archive checksum, mobile archive checksum, archive restoration, syntax, mobile/authenticated gateway tests and Docker build all passed.
- Exact-head PR CI [44447213411](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/44447213411): **31 passed, 0 failed, 0 skipped**; restore, syntax, tests and Docker build all passed.
- Two earlier audit-test runs failed on malformed regex escaping; the test was corrected before the exact-head runs. This failure history is retained rather than hidden.
- TAAFT [44446887118](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/44446887118) passed 3/3 on the preceding commit; no TAAFT source or workflow path changed in this increment.

### Preservation, cost and blockers

- Existing archive and mobile-assets archive retained; no file or store deletion, database migration, IndexedDB access, user-data export/import, Neon write, Render change, provider API call or production deployment occurred.
- No package or infrastructure added. GitHub Actions runner usage occurred; exact account-level billing/quota impact is not exposed.
- Source-level IndexedDB schema is now verified, but actual browser export/import round-trip, old-record fixture read-back and cross-service API integration remain unverified.
- Studio Render Auto-Deploy remains enabled; the setting-write path is still blocked. PR #13 remains draft and must not be merged while production auto-deploy is on.

### Next increment

Build an isolated, deterministic IndexedDB compatibility harness using a copied fixture and prove export/parse/restore/read-back equality without opening or mutating any live browser database. Then map the existing Node/Python API contract and preserve the current user-scoped project/skill activation rules.


## Run 10 — 2026-11-20: isolated IndexedDB fixture round-trip harness

**Phase:** Phase 0 — preservation proof; Phase 1 — migration-safe adapter boundary.  
**Repository:** [soueilouay-creator/uneXpected-ai-studio](https://github.com/soueilouay-creator/uneXpected-ai-studio)  
**Default branch:** `main` at `6f5bc823e1ffd9284abae7dbbb6c1dae97ebf90b`.  
**Starting feature head:** `00bab6c39fe5bd61964166448fa34d2a033d63a1`; 53 commits ahead / 0 behind main.  
**Rollback branch:** `backup/v8-foundation-pre-idb-fixture-20261120` at the starting head.

### Added

- `test/indexeddb-fixture-roundtrip.test.mjs`: isolated in-memory IndexedDB-compatible harness that loads the actual archive-restored `mobile/db.js` and `mobile/core.js` modules in CI.
- `docs/v8/INDEXEDDB_FIXTURE_ROUNDTRIP.md`: test scope, safety boundary and limitations.
- Wired the new test into both mobile workflow path filters, syntax checks and the Node test command.
- Linked the new audit from `docs/v8/README.md`.

### Coverage

- Synthetic fixture rows in projects, conversations, memories, improvements and settings.
- Actual backup v2 creation and parsing; legacy v1 parser compatibility; malformed collection rejection.
- Restore through the existing `LocalStore.importAll` only into a second disposable in-memory target pre-seeded with synthetic sentinels.
- Re-export/read-back equality and source fixture equality after target restore.

### Local preliminary validation

- `node --check /tmp/indexeddb-fixture-roundtrip.test.mjs`: exit 0.
- Harness mechanics run against a temporary contract replica: `node --test`, **1/1 passed**. This is not the acceptance result; CI against the real archive-restored modules is pending at this entry.

### Preservation and limitations

- No live browser database, local user record, backup, settings, conversation, project, memory, Neon data, Render service or production deployment was accessed or changed.
- No application module, schema, package dependency or database migration was changed.
- The fake IndexedDB adapter does not prove browser-engine scheduling, quota, multi-tab behavior or crash recovery. A browser-engine smoke test and owner-directed real backup rehearsal remain release gates.
- Existing `importAll` clears all five stores. The test confines that behavior to disposable synthetic data; it must not be reused for automatic sync.

### Costs

- New dependencies: none.
- New infrastructure: none.
- GitHub Actions runner use is expected; account-level billing/quota is not exposed and remains unverified.

### Next

Verify the CI run on the new test commit. Then map the existing Node/Python versioned API and implement a read-only contract probe before enabling any cross-service writes.


### Run 10 CI verification — code commit `d251bfbc1c4f73e843aa4998a186d1e55f26c67a`

- Mobile push [44664877162](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/44664877162): **32 passed, 0 failed, 0 skipped**. The new copied-fixture round-trip test passed against the actual archive-restored modules; syntax checks, authenticated gateway/mobile regression tests and Docker build passed.
- Mobile PR [44664883603](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/44664883603): **32 passed, 0 failed, 0 skipped**; archive restoration, syntax, test suite and Docker build passed.
- TAAFT push [44664877186](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/44664877186): **3 passed, 0 failed, 0 skipped**.
- TAAFT PR [44664883600](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/44664883600): **3 passed, 0 failed, 0 skipped**.
- All four runs completed successfully on exact code commit `d251bfbc1c4f73e843aa4998a186d1e55f26c67a`.
- Final code-commit comparison: 54 commits ahead / 0 behind `main`; 17 changed paths, **0 removed paths**. The 6 reported line deletions in existing files are edits, not file removals.
- PR #13 remains open and draft. No submitted reviews or unresolved review threads were returned.

### Production and cost re-check

- Render Studio service `unexpected-ai-studio` remains on `main`, Auto-Deploy `yes`, trigger `commit`, free plan, not suspended. Its latest live deployment still points to `6f5bc823e1ffd9284abae7dbbb6c1dae97ebf90b`. No service setting or deployment changed.
- No live IndexedDB, Neon data, provider API, secret, schema or user data was accessed.
- No new package or infrastructure. GitHub Actions runners were used; exact account-level billing/quota remains unavailable.
- The PR is still not safe to merge while Studio Auto-Deploy is enabled.


### Run 10 exact command and final documentation-head verification

**Code/test commit:** `d251bfbc1c4f73e843aa4998a186d1e55f26c67a`.  
**Documentation-only follow-up head tested:** `64730cabb26b2e26b25d21023eb4c0e02c3ecc8c`.  
**Final tested workflow runs on the documentation head:** mobile push [44665032380](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/44665032380), mobile PR [44665037301](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/44665037301), TAAFT push [44665032432](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/44665032432), TAAFT PR [44665037208](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/44665037208). All completed successfully.

The exact mobile test command in the workflow was:

```sh
node --test test/mobile-assets.test.mjs test/mobile-pwa.test.mjs test/mobile-route-smoke.test.mjs test/openrouter-ui.test.mjs test/orchestrator.test.mjs test/phone-workspace-ui.test.mjs test/mobile-provider-results.test.mjs test/indexeddb-fixture-roundtrip.test.mjs
```

Result: **exit 0; 32 passed, 0 failed, 0 skipped** on both push and pull-request events. The new fixture test passed against the real restored modules.

The exact TAAFT command was:

```sh
node --test test/taaft-integration.test.mjs
```

Result: **exit 0; 3 passed, 0 failed, 0 skipped** on both push and pull-request events.

The mobile workflow's Node syntax-check step completed successfully for the server, UI, mobile assets and all listed tests. The production Docker build command `docker build --tag unexpected-ai-studio:openrouter-test .` completed successfully on both mobile runs.

The tested documentation-only head `64730cabb26b2e26b25d21023eb4c0e02c3ecc8c` contains no additional application-code changes beyond code commit `d251bfbc1c4f73e843aa4998a186d1e55f26c67a`; it appends the final evidence to the run log and status.


## Run 11 — 2026-11-21: real Chromium IndexedDB backup/restore test

**Phase:** Phase 0 — preservation proof; Phase 1 — migration-safe compatibility boundary.  
**Repository:** [soueilouay-creator/uneXpected-ai-studio](https://github.com/soueilouay-creator/uneXpected-ai-studio)  
**Default branch:** `main` at `6f5bc823e1ffd9284abae7dbbb6c1dae97ebf90b`.  
**Feature branch code head tested:** `1fcc3afd77d3fded37c5175a7980f650bb8a1436`.  
**Branch comparison at code head:** 62 commits ahead / 0 behind; 19 changed paths, no removed paths.  
**Pre-increment rollback branch:** `backup/v8-foundation-pre-browser-idb-20261121` at `84ab188eb58f718a55fa81e429d197015f5f0b40`. Additional rollback refs were created before each follow-up test correction.

### Added

- `test/indexeddb-browser-fixture.html`: browser-side fixture using the actual restored `mobile/db.js` and `mobile/core.js` modules.
- `test/indexeddb-browser-roundtrip.test.mjs`: dependency-free Node 22 runner using preinstalled headless Chrome and Chrome DevTools Protocol.
- `docs/v8/INDEXEDDB_BROWSER_ROUNDTRIP.md`: design, safety boundary, test coverage and evidence.
- Updated `.github/workflows/mobile-integration.yml` to include the fixture/test in path filters, syntax validation and a dedicated real-Chromium CI step.
- Linked the new report from `docs/v8/README.md`.

### Browser test design

- Chrome runs with a newly created temporary profile, an ephemeral remote-debugging port, background networking disabled and no external fixture dependencies.
- Two loopback HTTP servers bind different ephemeral ports, giving source and target separate browser origins and isolated IndexedDB databases.
- Synthetic records exercise all five existing stores. The test creates and parses a v2 backup, checks legacy v1 parser compatibility and malformed-input rejection, restores only into the disposable target origin, verifies the backup allowlist, re-exports and compares records, and proves the source origin is unchanged.
- Target sentinel rows are used only to verify the existing replacement semantics inside the disposable target. The live app's `importAll` behavior is not used against user data.

### Test-driven corrections (retained)

- First browser attempts exposed that `settings` is exported as a single object, not an array. Assertions were corrected after inspecting the archived module.
- The next attempt exposed the backup's existing safe-settings allowlist: raw source-only settings fields are intentionally not guaranteed to survive export/import. Assertions now compare the restored settings against the parsed allowlist and compare all four record-array stores directly.
- Earlier failed CI runs remain visible: [44858440755](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/44858440755), [44858565520](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/44858565520), [44858683456](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/44858683456). These were test-assumption defects, not production data failures. They were corrected before the final accepted head.

### Final exact-head verification

- Mobile push [44858792009](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/44858792009), code head `1fcc3afd77d3fded37c5175a7980f650bb8a1436`: existing suite **32 passed, 0 failed, 0 skipped**; real Chromium IndexedDB test **1 passed, 0 failed**; syntax checks and production Docker image build passed.
- Mobile PR [44858797372](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/44858797372), same head: **32/32** existing tests and **1/1** real Chromium test passed; Docker image build passed.
- TAAFT PR [44858797299](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/44858797299), same head: **3/3 passed**.
- Browser runner log reports Google Chrome `157.0.8103.78`; browser test exit code 0 and duration about 6.0 seconds.

### Preservation, cost and blockers

- No browser profile belonging to the owner was opened. No live IndexedDB record, backup, project, conversation, memory, setting, Neon row, provider secret or production service was read or changed.
- No application database module, schema, user-facing endpoint or UI was modified. No package or infrastructure was added. Existing source and mobile asset archives remain unchanged and checksum-verified by the existing CI restore step.
- GitHub Actions runner usage occurred; account-level billing/quota remains unavailable. The browser was preinstalled on the runner; no browser download or API credit was used.
- This is now a real browser-engine fixture proof, **not** a user-directed backup rehearsal. Live data migration remains prohibited until a user-owned export and independent read-back are performed.
- Studio PR #13 remains draft. Render Studio Auto-Deploy is still a separate production guard; no merge or deployment was performed.

### Next

Design a pure, additive, conflict-reporting import/merge contract for projects, conversations, memories, improvements and settings. It must not call `importAll`, clear any store, or overwrite a colliding ID; prove behavior with fixtures before connecting it to the UI. Continue the read-only Node/Python control-plane contract audit in parallel only where it does not touch user data or production resources.


### Run 11 follow-up — Chromium process cleanup hardening and final code-head CI

- The first documentation-head CI after the successful browser proof exposed a temporary-profile cleanup race: Chrome was still closing a profile file when the test removed its temporary directory, producing `ENOTEMPTY`. The IndexedDB assertions themselves had passed up to cleanup.
- Updated `test/indexeddb-browser-roundtrip.test.mjs` to wait for process exit after SIGTERM, escalate to SIGKILL only after a bounded 3-second grace period, wait up to 5 seconds for forced exit, pause briefly after exit, and use bounded recursive-removal retries. The profile is not removed while Chrome is still running.
- Rollback branch before this code fix: `backup/v8-foundation-pre-chrome-cleanup-fix-20261121` at `c182b0eb40de233bbb6ebffa049cc46a2680e86b`.
- Final tested code head: `a8159cd9760a5c6be086acde8f161c0c3e605c66`.
- Mobile push [44859050107](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/44859050107) and PR [44859055816](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/44859055816): existing suite **32/32 passed**, real Chromium browser test **1/1 passed**, syntax checks and Docker build passed.
- TAAFT PR [44859055572](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/44859055572): **3/3 passed**. TAAFT push did not run for the test-only code commit; the TAAFT PR event did run and pass.
- Browser log reports Google Chrome 157.0.8103.78; browser test passed in about 11 seconds, including clean process shutdown and profile cleanup.
- Failed documentation-head runs [44858987373](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/44858987373) and [44858990032](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/44858990032) are retained as evidence of the cleanup race and were not hidden.
- No app runtime code, schema, user data, live browser profile, provider secret, database, production setting or deployment changed. No package or infrastructure added; Actions runner billing remains unverified.


### Run 11 preservation follow-up — insert-only IndexedDB fixture

- Tightened both IndexedDB fixture tests to comply with the no-store-clearing rule. They no longer call LocalStore.importAll or clearAll. The Node test double now throws if an object-store clear is attempted.
- Both fixtures seed existing target sentinels and a same-ID project collision, check primary keys with read-only requests, skip/report the collision, insert only missing records, preserve target rows and read back the inserted records. The source fixture is re-read and remains unchanged.
- Added docs/v8/ADDITIVE_INDEXEDDB_MERGE.md defining the production contract: bounded readwrite transaction, add semantics, collision reporting, settings allowlist, post-write read-back, no blind retry and no automatic nested-record merge. This contract is documented but not yet implemented as a production module or UI feature.
- Updated docs/v8/INDEXEDDB_FIXTURE_ROUNDTRIP.md and docs/v8/INDEXEDDB_BROWSER_ROUNDTRIP.md to describe the non-destructive test behavior.
- Final additive-fixture code head: 1f78f17d9a5242b846779a0acec29ef8c292559b.
- Mobile push [44859674020](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/44859674020) and PR [44859678339](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/44859678339): **32/32** existing tests and **1/1** real Chromium test passed; syntax checks and Docker build passed.
- TAAFT PR [44859678349](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/44859678349): **3/3 passed**.
- Chrome version in final push log: Google Chrome 157.0.8103.50.
- Intermediate browser attempts remain visible: [44859586407](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/44859586407) and [44859612993](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/44859612993) failed because the fixture's asynchronous settings read was inside a synchronous map callback. The final code uses an explicit async loop and both final-head push/PR runs are green.
- No application database module, live user record, browser profile, schema, provider secret, production setting or deployment changed. No package or infrastructure added; GitHub Actions billing remains unverified.


## Run 12 — 2026-11-22 — atomic additive IndexedDB adapter

**Pre-change head:** `8f1c20af2cb0d9dfa9566dcb8fde4188fb7d4612`.  
**Rollback checkpoint:** `backup/v8-foundation-pre-atomic-idb-adapter-20261122`.

### Changed paths
- Added `mobile-release/merge.js`.
- Updated `mobile-release/sw.js` to precache the new module.
- Updated `test/indexeddb-fixture-roundtrip.test.mjs`, `test/indexeddb-browser-fixture.html` and `test/indexeddb-browser-roundtrip.test.mjs` to exercise the production adapter.
- Updated `.github/workflows/mobile-integration.yml` with an explicit syntax check for the adapter.
- Updated `docs/v8/ADDITIVE_INDEXEDDB_MERGE.md` and `docs/v8/UPGRADE_STATUS.md`.

### Test design
- Node fixture: validated backup, duplicate-input rejection, insert-only behavior, collision reporting, source immutability, and read-back equality using a test double whose `clear()` always throws.
- Real Chromium fixture: two concurrent adapter calls against one disposable target origin; assert one transaction inserts the four missing records, the other reports those collisions, the pre-existing project collision is never overwritten, all sentinels survive, and source-origin records remain unchanged.
- Expected CI commands remain those in `.github/workflows/mobile-integration.yml`: syntax checks; `node --test test/mobile-assets.test.mjs test/mobile-pwa.test.mjs test/mobile-route-smoke.test.mjs test/openrouter-ui.test.mjs test/orchestrator.test.mjs test/phone-workspace-ui.test.mjs test/mobile-provider-results.test.mjs test/indexeddb-fixture-roundtrip.test.mjs`; `CHROME_BIN=... node --test test/indexeddb-browser-roundtrip.test.mjs`; Docker build; TAAFT integration test.

### Verification status
- Mobile push [44977219977](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/44977219977) and PR [44977223646](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/44977223646): **32/32 Node tests passed**, **1/1 real Chromium test passed**, syntax checks and Docker image build passed. Chrome: **157.0.8103.78**.
- TAAFT push [44977219872](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/44977219872) and PR [44977223754](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/44977223754): **3/3 passed**, 0 failures, 0 skips.
- Exact code commit tested: `da8724ca249e4cfce0c432e2208eef43bb4269b9`. All four workflow runs completed successfully.
- No user browser, user backup, local record, Neon row, provider key, production service, deployment or DNS was accessed or modified.
- No new package or infrastructure. GitHub Actions runner billing remains unverified.


## Run 13 — 2026-11-23 02:22 UTC — PostgreSQL schema-version guard

**Phase:** Phase 3 — durable execution hardening; Studio/core integration remains separate.  
**Studio baseline:** `upgrade/v8-foundation` at `5f87f289e08126780be7abf61aa4f309b0a7bacc`; `main` at `6f5bc823e1ffd9284abae7dbbb6c1dae97ebf90b`.  
**Core baseline:** `soueilouay-creator/uneXxxx/main` at `2828fe281b60ea0a343b24973b411bbad650e93e`; checkpoint/approval ledger PR #16 is merged.

### Finding and increment

The core runtime now depends on PostgreSQL migrations 003–007 (Creator Studio, workflow checkpoints, approval execution intents, exact execution bindings, and stage approval intents), but its startup guard and README still accepted schema version 2. A partially migrated database could therefore pass the initial version check and fail later when newer tables were accessed.

Created rollback branch `backup/v8-schema-guard-pre-20261123` and feature branch `upgrade/v8-schema-version-guard-20261123` in the core repository. Core code commit: [e13689e1168dfef655791881d1d7befb93c2ff59](https://github.com/soueilouay-creator/uneXxxx/commit/e13689e1168dfef655791881d1d7befb93c2ff59). Draft PR: [#18 — require complete V8 PostgreSQL schema](https://github.com/soueilouay-creator/uneXxxx/pull/18).

Changed only:
- `unexpected_runtime/postgres_storage.py`: require `schema_migrations.version >= 7` at startup; no schema writes or fallback.
- `tests/test_postgres_storage.py`: versions 1–6 fail closed; version 7 passes readiness.
- `README.md`: document migrations 001–007 and safe fresh/existing database sequences.
- `FILE_INVENTORY_SHA256.txt`: refresh exact SHA-256 entries.

### Verification on core commit e13689e

- PostgreSQL 16 runtime/regression job: **443 tests passed, 3 skipped, 0 failed**.
- PostgreSQL 17 targeted proof: **6/6 passed**, including independent-connection approval concurrency, abrupt-process recovery, pause/resume, consumed-approval restart blocking and logical backup/restore.
- Runtime job also passed Python compilation, JavaScript/workflow syntax, additive migration-preservation checks, changed-file SHA-256 inventory, Docker image build, actual container health/UI/auth/38-role/task-invocation smoke and CLI smoke.
- The separate renderer E2E job was still running when this log entry was written; its final result is not claimed here. [CI run 45099384548](https://github.com/soueilouay-creator/uneXxxx/actions/runs/45099384548).

### Preservation, costs and blockers

- No Neon migration/query write, production service change, provider request, user-data access, Render setting change or deployment was performed.
- Read-only Neon inventory: project `unexpected-v8-unified`, PostgreSQL 17, **10/10 branches**, all currently reported `archived`; branch logical-size limit 1 GiB and history retention 6 hours. No new branch or snapshot was created.
- Render read-only inventory: `unexpected-v8-command-center` remains on `main` with Auto-Deploy off; the Studio service `unexpected-ai-studio` remains on `main` with Auto-Deploy on. Keep Studio PR #13 draft and do not merge/deploy while that guard remains enabled.
- No new package or infrastructure was added. No provider/API credits were used. GitHub Actions account billing was not independently visible.
- Production backup scheduling, encrypted off-site retention and an approved production restore rehearsal remain unverified; CI backup/restore uses disposable databases only.

### Next

Finish and inspect the remaining renderer CI result, then update the Studio runtime-integration status without connecting the hosted endpoint until transport and authentication are independently verified. Keep both PRs in draft; production rollout remains a separate approval.


## Run 14 — 2026-11-24 02:10 UTC — authenticated read-only runtime status bridge

**Phase:** Phase 3 — durable execution / cross-service integration hardening.  
**Studio baseline:** `upgrade/v8-foundation` at `d938314a588fd4c6a8ce7d05ab781633ca93cfe7`; `main` at `6f5bc823e1ffd9284abae7dbbb6c1dae97ebf90b`.  
**Rollback checkpoint:** `backup/v8-foundation-pre-runtime-status-adapter-20261124` at the pre-change head.  
**Run-log rollback:** `backup/v8-foundation-pre-run14-log-20261124` at code head `edc754d8054f24720d2e013cbcd614a840801ea0`.

### Finding and increment

The Node Studio/PWA and the existing Python V8 runtime have separate HTTP and authentication boundaries. The Node Studio exposes the existing PWA and provider routes, protected by `UNEXPECTED_ACCESS_TOKEN`. The Python core exposes `GET /v1/status`, protected by `UNEXPECTED_RUNTIME_API_TOKEN` (minimum 32 ASCII characters). Neither credential is interchangeable, and the runtime token must remain server-side.

Added a read-only status bridge without changing legacy routes or enabling a hosted connection:

- Added `runtime-client.mjs`, which accepts only a server-configured HTTPS origin, exact hostname allowlist and server-side token; fixes the upstream path to `/v1/status`; rejects IP literals, non-default ports, userinfo, path/query/fragment and non-allowlisted hosts; refuses redirects; uses a five-second default timeout and 16 KiB response cap; returns only a validated field projection; and never retries or forwards upstream response bodies.
- Added authenticated `GET /v1/runtime/status` to the Node server. It uses the existing Studio bearer check and rate limiter. No URL or upstream credential is accepted from the browser.
- Missing endpoint/token configuration returns `not_configured` without a network request. The bridge does not proxy task invocation, lifecycle, approvals, MCP or any write-capable route.
- Added Docker image inclusion and CI path/syntax/test coverage.
- Added `docs/v8/INTEGRATION_CONTRACT_AUDIT.md` documenting the two service boundaries and the remaining architecture decision.

### Commits and changed paths

- Runtime client: [bbf2a019c9ac4c8720d18fa510d156c66fd0b68a](https://github.com/soueilouay-creator/uneXpected-ai-studio/commit/bbf2a019c9ac4c8720d18fa510d156c66fd0b68a).
- Client security tests: [cbc5738397a4bebd2f08c7b2e214a77a9141b9f3](https://github.com/soueilouay-creator/uneXpected-ai-studio/commit/cbc5738397a4bebd2f08c7b2e214a77a9141b9f3).
- Authenticated route smoke test: [c555df4cb464ec0f42989bea9f50c50eed4275c8](https://github.com/soueilouay-creator/uneXpected-ai-studio/commit/c555df4cb464ec0f42989bea9f50c50eed4275c8).
- Docker copy: [619a7884bcf67b18f2c83180c05b421f476f3108](https://github.com/soueilouay-creator/uneXpected-ai-studio/commit/619a7884bcf67b18f2c83180c05b421f476f3108).
- Node route: [87ebca12b85b5f0496d17b2e2c195b4f365a2d3f](https://github.com/soueilouay-creator/uneXpected-ai-studio/commit/87ebca12b85b5f0496d17b2e2c195b4f365a2d3f).
- CI wiring: [edc754d8054f24720d2e013cbcd614a840801ea0](https://github.com/soueilouay-creator/uneXpected-ai-studio/commit/edc754d8054f24720d2e013cbcd614a840801ea0).
- Integration contract audit: [811b784600050beab951a794b1b17ed787256b0f](https://github.com/soueilouay-creator/uneXpected-ai-studio/commit/811b784600050beab951a794b1b17ed787256b0f).
- Final code head before this log append: `edc754d8054f24720d2e013cbcd614a840801ea0`.

### Verification

- Studio mobile integration run [45310119676](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/45310119676): completed successfully. Syntax checks passed; **40/40 Node tests passed, 0 failed**; **1/1 real Chromium IndexedDB test passed**; production Docker image build passed.
- TAAFT run [45310119778](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/45310119778): **3/3 passed, 0 failed**.
- The 40 Node tests include seven runtime-client tests and one authenticated route smoke test. They use injected fake HTTP responses and a local Node server with runtime configuration explicitly empty; no remote runtime endpoint is contacted.
- Rechecked core PR #18 run [45099384548](https://github.com/soueilouay-creator/uneXxxx/actions/runs/45099384548): renderer E2E, PostgreSQL 17 release proof and runtime/regression jobs all completed successfully. The recorded suite results are 443 passed / 3 skipped on PostgreSQL 16 and 6/6 targeted PostgreSQL 17 proof tests.

### Preservation, cost and blockers

- Studio branch comparison before this log append: **93 commits ahead / 0 behind** `main`; **28 changed paths, 0 removed paths**. Existing source archive and mobile asset checksum checks passed in CI.
- Existing PWA, chat/provider routes, IndexedDB stores, TAAFT allowlist, source archive and backup files remain present. No live IndexedDB, user backup, Neon row, production service, Render setting, provider key or DNS record was accessed or changed.
- No provider API request, schema migration, user-data migration, package install, paid infrastructure or generation credit was used. GitHub Actions account-level billing was not independently visible.
- The hosted runtime endpoint, DNS target and credentials remain unverified. The new route is opt-in and is not wired into the PWA UI. No task/write API is bridged.
- The requested TypeScript target (Mastra + one durable workflow engine such as DBOS Transact) and the substantial existing Python runtime still require a formal architecture decision. This status-only bridge does not resolve that choice and does not create a second coordinator.
- Studio PR #13 remains draft. Studio Render Auto-Deploy was last observed enabled on 2026-11-23; it was not changed or rechecked in this run. Do not merge or deploy until that guard is independently disabled and verified.

### Next

Create a reviewed runtime architecture decision comparing the existing Python core with the requested TypeScript/Mastra + DBOS direction, including role/Skill preservation, state ownership, API compatibility, dependency licenses/security, hosting requirements, cost and rollback. Do not connect a hosted endpoint or bridge write-capable routes until that decision and endpoint/auth verification pass.


## Run 15 — 2026-11-25 — accepted runtime and durability architecture

**Phase:** Phase 2 / Phase 3 architecture freeze.  
**Pre-run Studio head:** `9f29b6da004b91cd60fc1505124e5482b5f09117`.  
**Rollback branch:** `backup/v8-foundation-pre-architecture-decision-20261125` at the pre-run head.  
**Core main:** `2828fe281b60ea0a343b24973b411bbad650e93e`.  
**Core schema-guard PR:** [#18](https://github.com/soueilouay-creator/uneXxxx/pull/18), draft head `e13689e1168dfef655791881d1d7befb93c2ff59`.

### Completed

- Added [ADR-001 — Runtime and durability](./ADR-001-RUNTIME-AND-DURABILITY.md).
- Updated [COMPONENT_DECISIONS.md](./COMPONENT_DECISIONS.md) from provisional to accepted architecture direction.
- Linked the ADR from [docs/v8/README.md](./README.md).
- Appended this run to the chronological log and appended the same status to [UPGRADE_STATUS.md](./UPGRADE_STATUS.md).
- Clarified that the Python core is the only primary coordinator and that its existing StateStore/PostgresStateStore + WorkflowRunner is the only durable-workflow implementation for V8.
- Did not install Mastra, DBOS, MCP TypeScript SDK or any other package. No runtime or data migration was performed.

### Architecture decision

- Retain the Python 3.12 V8 Coordinator, canonical 38-role registry, SkillRegistry, existing provider router, permission/approval policy, MCP gateway and bounded subagents.
- Retain existing PostgreSQL workflow/stage checkpoints, attempt tokens, revision checks, idempotency and approval intents.
- Keep the Node.js 22 Studio/PWA as the existing user-facing client and compatibility facade.
- Do not add Mastra or DBOS Transact TypeScript: the current runtime already owns these responsibilities and the new checkpoint/recovery tests pass. Adding another framework would duplicate coordination or require a larger migration without a measured gap.
- Mastra `@mastra/core` package manifest declares v1.86.0, Apache-2.0 and Node >=22.13.0. Its repository license places `ee/` directories under a separate Enterprise Edition License that is not open source and prohibits production use.
- DBOS Transact TypeScript is MIT and Postgres-backed, but is not selected while the Python checkpoint engine meets the verified contract.
- The decision and reconsideration triggers are recorded in ADR-001.

### Verification

- Core CI [45099384548](https://github.com/soueilouay-creator/uneXxxx/actions/runs/45099384548): all three jobs completed successfully — runtime/regression, PostgreSQL 17 release proof, and renderer E2E.
- Recorded core results: PostgreSQL 16 **443 passed / 3 skipped**; PostgreSQL 17 targeted concurrency, abrupt-process recovery, pause/resume, approval replay protection and backup/restore **6/6 passed**; renderer E2E passed.
- Process-recovery behavior is deliberately fail-closed: an interrupted `started` stage is not replayed automatically. It remains blocked pending a human reconciliation procedure. Do not describe this as automatic recovery.
- Studio exact pre-run head: [mobile CI #45310281272](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/45310281272) passed 40/40 Node tests, 1/1 real Chromium IndexedDB test and Docker build; [TAAFT CI #45310281333](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/45310281333) passed 3/3.
- Read-back confirmed the ADR, decision register and status/index documents on the feature branch. Final-head CI for this documentation batch is to be checked after this commit.

### Changed paths

- Added `docs/v8/ADR-001-RUNTIME-AND-DURABILITY.md`.
- Updated `docs/v8/COMPONENT_DECISIONS.md`.
- Updated `docs/v8/README.md`.
- Updated `docs/v8/UPGRADE_STATUS.md`.
- Updated `docs/v8/RUN_LOG.md`.

### Preservation, costs and blockers

- No existing file or branch was deleted; no line in application code, PWA code, source archive, mobile data adapter or TAAFT implementation was changed.
- No user IndexedDB, projects, chats, memories, settings, backups, Neon records, provider credentials or production services were accessed or modified.
- No database migration, provider API request, runtime request, Render setting change, restart, merge or deployment occurred.
- No new dependency, infrastructure, paid trial, subscription or API credit was used. GitHub Actions account-level billing remains unverified.
- Remote GitHub refs/files were verified; the connector does not expose a local working-tree status.
- Core PR #18 remains draft; current core main still has the older schema-version-2 startup guard. The version-7 guard is not yet merged.
- Production database backup/export and independent restore/read-back, interrupted-stage human reconciliation, hosted endpoint/auth, live provider compatibility, tool security, observability/evaluation, sandbox and release/rollback gates remain open.
- Studio PR #13 remains draft; the Render blueprint still declares `autoDeploy: true`. No merge/deploy was attempted.

### Next

Review the core schema-version-7 startup guard PR and define an explicit, human-approved, idempotent reconciliation path for an interrupted workflow stage. Keep the populated hosted database read-only until current backup/export and independent restore/read-back are verified.
