# V8 durability and recovery gap audit

**Audit date:** 2026-11-10  
**Integration branch:** `upgrade/v8-foundation` in [uneXpected-ai-studio](https://github.com/soueilouay-creator/uneXpected-ai-studio)  
**Core source:** [uneXxxx](https://github.com/soueilouay-creator/uneXxxx) `main` at `8a67c823292901305cad670a60c2f24f0a047267`  
**Method:** Read-only repository, CI, Render and Neon inspection. No runtime restart, provider call, database write, migration, backup creation or restore was performed.

## Executive finding

The existing Python V8 core already has a real PostgreSQL-backed state store, task/event persistence, single-flight idempotency claims and one-use approval records. Replacing it with DBOS or adding Mastra would create unnecessary overlap before the existing recovery contract is understood.

The remaining durability defect is narrower and more important: **completed task state survives a restart, but a task or multi-stage workflow interrupted while running cannot currently be resumed from a durable checkpoint.** The queue only claims tasks in `queued` state, while the lifecycle runner keeps its intermediate state in process memory. This remains a V8 release blocker.

## 1. Source and migration mapping

The migration source is now located in the core repository:

| File | Observed responsibility |
|---|---|
| `migrations/001_initial.sql` | Creates the v1 operational schema: `tasks`, `events`, `agent_memory`, `shared_knowledge`, `idempotency`, `outcomes`, `proposals`, `agent_versions`, `baselines`, `capabilities`, `consumed_approvals`, and `schema_migrations`. |
| `migrations/002_idempotency_claims.sql` | Additively creates `idempotency_claims` with running/completed/failed states and a state/update-time index. |
| `unexpected_runtime/postgres_storage.py` | PostgreSQL adapter. It validates schema version 2, persists tasks/events/memory/outcomes and implements `claim_next`. |
| `unexpected_runtime/storage.py` | SQLite development adapter with equivalent task queue and idempotency behavior. |
| `unexpected_runtime/postgres_idempotency.py` | PostgreSQL single-flight claim/replay implementation. |
| `unexpected_runtime/coordinator.py` | Owns task invocation, queue execution and the seven-stage lifecycle. |
| `unexpected_runtime/workflow.py` | Generic in-process `WorkflowRunner` for plan, execute, verify, improve, deliver and learn. |

No migration 003 or workflow-checkpoint table is present in the audited `uneXxxx/main` tree. The existing Postgres adapter requires schema version 2; do not raise that requirement or apply a new migration to a populated database until backup and compatibility checks pass.

## 2. Crash-recovery gap

### Task queue

Both `PostgresStateStore.claim_next` and the SQLite `StateStore.claim_next` select only rows with `status='queued'`, then change the selected row to `running`. `Coordinator.run_queued` repeatedly calls that method.

There is no audited stale-running-task lease, heartbeat recovery, interrupted-task transition or safe requeue path. If the process exits after changing a task to `running`, a later worker will not select that row.

The idempotency claim lease is a separate mechanism. The SQLite test `test_expired_running_claim_can_be_recovered` proves that an expired claim can be acquired by a new task ID. It does not restore the old task row, reconstruct an interrupted workflow, or prove that an external side effect cannot be repeated.

### Multi-stage workflow

`Coordinator.run_lifecycle` creates a new random workflow ID and retains `stage_task_ids`, `worker_task_ids`, `completed_stages`, the plan context and improvement counters in local variables/closures. It writes `workflow_stage_outcome` and related events as stages complete, but no durable workflow-state object or resume entry point was found.

`WorkflowRunner.run` holds its plan, execution candidate, feedback, verification history, correction count and improvement count in memory. It has no checkpoint callback or resume API. A process crash therefore loses the runner's current state even when individual task/event rows were persisted.

The lifecycle's stage invocations also do not pass a deterministic stage-level idempotency key. Reconstructing a workflow by blindly starting it again could repeat model calls and, as capabilities expand, risk repeating side effects. Recovery must use persisted stage identity and explicit idempotency/approval rules rather than replaying the whole workflow.

### What existing tests prove—and do not prove

- `tests/test_postgres_integration.py::test_state_store_task_memory_knowledge_audit_and_queue` proves a queued task can be claimed, marked completed and read back in the same test process.
- `tests/test_postgres_integration.py::test_postgres_full_seven_stage_lifecycle_persists_all_stage_outcomes` proves a completed lifecycle writes the expected stage-outcome event sequence.
- `tests/test_idempotency_claims.py::test_expired_running_claim_can_be_recovered` proves an expired idempotency claim can be reclaimed; it does not recover the old task or workflow.
- `tests/test_workflow_seven_stage_proof.py` verifies the normal lifecycle and fail-closed mock/unverified-provider behavior.

The historical core CI run [42383567744](https://github.com/soueilouay-creator/uneXxxx/actions/runs/42383567744) passed 268 tests with 1 skipped and used an ephemeral PostgreSQL service. The historical hosted verification [42383567757](https://github.com/soueilouay-creator/uneXxxx/actions/runs/42383567757) verified completed-task retrieval after a Render restart. Neither test proves a crash during a running stage followed by safe resume.

## 3. Current hosted topology observed

Render workspace metadata was read using the previously confirmed **My Workspace** workspace:

| Service | Source | Deployment policy | Observed configuration |
|---|---|---|---|
| `unexpected-v8-command-center` | `soueilouay-creator/uneXxxx`, branch `main` | Auto-deploy off | Free plan, Frankfurt, one instance, health path `/health`; latest listed live deployment is `dep-dbnjm095efls73bhjikg`, commit `8a67c823292901305cad670a60c2f24f0a047267`, finished 2026-11-07 14:52:19 UTC. |
| `unexpected-ai-studio` | `soueilouay-creator/uneXpected-ai-studio`, branch `main` | Auto-deploy on | Separate Free Docker service; preserves the Node Studio and Phone PWA surface. |
| `unexpected-v8-unified-test` | `soueilouay-creator/uneXpected-`, branch `feature/unified-v8-consolidation` | Auto-deploy off | Separate test service; left untouched. |

Render listed no managed PostgreSQL instances. The V8 database is external Neon. Private Render environment values were not read, so the currently configured `DATABASE_URL` branch and current provider-secret readiness are not independently verified. Render reported the V8 service as not suspended and its latest deployment as live; **a fresh HTTP health/auth/provider probe was not completed**. No service, environment, deployment, restart or DNS setting was changed.

## 4. Neon preservation and backup boundary

The existing Neon project is `unexpected-v8-unified` (project ID `tiny-glade-03545028`), PostgreSQL 17 in EU Central. The read-only branch inventory returned **10 of 10 branches**. No branch capacity is available without changing existing resources.

The populated `v8-migration-test` branch contains existing records. The last aggregate-only inventory recorded 41 tasks, 261 events, 9 agent-version rows, 5 outcomes, and idempotency/idempotency-claim rows. No payloads or user content were read during this audit.

Current read-only snapshot inspection returned one manual snapshot, `uneXpected-pre-cutover-main-2026-11-07`, sourced from the empty `main` branch. Both `main` and `v8-migration-test` returned empty automatic snapshot schedules. The branch `cutover-backup-20261107-v8-migration-test` exists as a child of the populated branch, but the current endpoint inventory did not expose a compute endpoint for it; it is **not a verified backup** until its contents can be read back and compared.

Endpoint metadata still reports passwordless access enabled, no IP allowlist entries and public connections not blocked. This requires a security review before the application is connected. No endpoint or network settings were changed.

**Safety decision:** do not create/delete branches, create/replace snapshots, run migrations, change endpoint settings or write application data until a current backup/export destination and independent restore/read-back comparison are verified. The single snapshot on the empty `main` branch does not protect the populated migration-test branch.

## 5. Architecture decisions

1. Keep the existing Python V8 Coordinator, 38-role registry, ProviderRouter, MCP gateway and PostgresStateStore as the primary integration candidate.
2. Do not add Mastra as a second primary runtime.
3. Keep DBOS deferred. First add and test recovery to the existing StateStore; adopt DBOS only if the existing design cannot meet a measured requirement without duplicating task/event state.
4. Do not install Langfuse, Promptfoo, Mem0, Composio or OpenHands in this increment; no measured gap or cost/compatibility review justifies a new dependency yet.
5. Keep the Node Studio/PWA as a preserved client surface. Do not rebind Render, change deployment configuration or migrate IndexedDB as part of this audit.
6. Keep the industrial-maintenance-sales Skill files as historical assets, but enforce the owner's stopped-project state before any automatic Skill trigger or execution.

## 6. Next engineering increment

Create a dedicated feature branch in `uneXxxx` and add a deterministic crash-during-stage test using the existing ephemeral PostgreSQL CI service and SQLite adapter. Then implement the smallest additive checkpoint/recovery contract that:

- persists workflow identity, current stage, attempt number, required inputs/results and checkpoint version;
- resumes only from a validated completed checkpoint;
- uses deterministic stage idempotency keys and detects mismatched request/checkpoint hashes;
- never replays protected side effects automatically; require a fresh valid approval when necessary;
- marks unrecoverable/ambiguous work as interrupted for review rather than guessing;
- proves restart/replay behavior and no duplicate side effects in CI.

Keep all work on a feature branch and open a draft PR. Do not apply migration 003 to Neon or deploy it until a verified backup/restore path exists.

## Preservation and cost result

No core application source, PWA, role profile, migration, deployment, environment variable, database row, branch or snapshot was changed. No package was installed and no model/provider API was called. No production restart or deployment occurred. Read-only Neon inspection used existing Free-plan compute allowance; exact remaining quota is not exposed. GitHub Actions billing impact is account-specific and was not visible. No new paid service or charge was initiated.
