# uneXpected V8 execution log

This log is append-oriented. Earlier run entries must be retained.

## Run 2 — 2026-11-10

**Phase:** Phase 0 — baseline and preservation; Phase 1 architecture decisions updated.  
**Repository:** [soueilouay-creator/uneXpected-ai-studio](https://github.com/soueilouay-creator/uneXpected-ai-studio)  
**Base:** `main` at `6f5bc823e1ffd9284abae7dbbb6c1dae97ebf90b`.  
**Working branch:** `upgrade/v8-foundation`, 10 commits ahead and 0 behind main at the end of the repository comparison.

### Commits and changed paths

Implementation/inventory/CI commit: [`a06cd916a6b02ca76b6b65adba1676c88b72efc0`](https://github.com/soueilouay-creator/uneXpected-ai-studio/commit/a06cd916a6b02ca76b6b65adba1676c88b72efc0)

- Added `docs/v8/REPOSITORY_INVENTORY.md`.
- Updated `docs/v8/README.md`.
- Updated `.github/workflows/taaft-integration.yml` additively so V8 branches and V8 docs run TAAFT checks; added manual dispatch while preserving existing triggers.

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
