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
