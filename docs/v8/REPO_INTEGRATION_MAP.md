# Owned repository integration map

**Audit date:** 2026-11-10  
**Canonical integration target:** [soueilouay-creator/uneXpected-ai-studio](https://github.com/soueilouay-creator/uneXpected-ai-studio)  
**Policy:** Preserve every owned repository and its data. Integrate capabilities through one uneXpected control plane.

## Repository inventory

| Repository | Observed version / head | Existing responsibility | Integration treatment |
|---|---|---|---|
| [uneXpected-ai-studio](https://github.com/soueilouay-creator/uneXpected-ai-studio) | Node.js 22; main at 6f5bc823e1ffd9284abae7dbbb6c1dae97ebf90b; V8 branch at e7f3b77e5b82eca124984fd24b86e2deea5d0541 | Existing Studio/web app, Phone PWA, local IndexedDB workspace, legacy HTTP routes, provider adapters, OpenRouter fallback and read-only TAAFT connector | **Canonical integration target.** Preserve the UI, PWA, routes, local data and current behavior. Add a client/compatibility adapter to the V8 core. |
| [uneXxxx](https://github.com/soueilouay-creator/uneXxxx) | Python V8.0.0-preview; main at 8a67c823292901305cad670a60c2f24f0a047267 | Existing V8 Coordinator, 38-role registry, provider router, SQLite/PostgreSQL state stores, idempotency and approval ledgers, MCP gateway/server, Skills, subagents, quality evaluation and desktop command center | **Existing V8 core source.** Integrate selectively into the canonical target; do not treat it as a replacement product or delete/overwrite this repository. |
| [uneXpected-](https://github.com/soueilouay-creator/uneXpected-) | Python V7.3.1; main at 59deef5e49208c01d03ccfc6d2e162db54309235 | Governed V7 runtime, canonical 38-role catalog, legacy role profiles and 120 upstream workflow-candidate mappings | Preserve as historical/source provenance and compatibility material. Reuse only reviewed differences; do not overwrite V8 records with V7 copies. |
| [uneXpectedworkflow](https://github.com/soueilouay-creator/uneXpectedworkflow) | Empty repository | No files or implementation found | No integration action. Preserve the empty repository. |

The V8 repository's previous README explicitly excluded the Node AI Studio and Phone PWA. That exclusion is superseded by the current owner requirement to preserve existing UI, PWA, local data and capabilities. The target is **one control plane and execution core with multiple preserved clients**, not two independent coordinators. The Python desktop command center and Node Phone/Studio UI can coexist as clients of the same governed API.

## Existing V8 core capabilities

The uneXxxx repository already provides:

- One Python Coordinator and a canonical 38-role registry.
- A governed seven-stage lifecycle, bounded subagent delegation, task/event persistence and resumable event-page reads.
- Provider routing for OpenAI, Anthropic, OpenRouter and OpenOx. Google Gemini, DeepSeek and xAI are not yet verified as integrated routes.
- SQLite local state and PostgreSQL hosted state, with explicit no-fallback behavior.
- PostgreSQL idempotency claims, replay checks and one-use approval consumption.
- A scoped MCP gateway and remote MCP server, hash-verified Skills and a capability registry.
- A self-improvement governor and deterministic quality-evaluation harness.
- A desktop command center and an existing Render deployment definition.

Do not add Mastra as a second primary runtime or DBOS as a second task store by default. The existing V8 runtime is the first integration candidate. Add external frameworks only if tests prove a specific missing capability that cannot be added safely to the existing core.

## CI and hosted evidence for the existing V8 repository

- [V8 command-center CI run 42383567744](https://github.com/soueilouay-creator/uneXxxx/actions/runs/42383567744), commit 8a67c823292901305cad670a60c2f24f0a047267: **268 tests passed, 1 skipped**. It used an ephemeral PostgreSQL 16 service, applied the checked-in migrations, ran regression/security tests, built the Docker image and smoke-tested the container.
- [Hosted runtime verification run 42383567757](https://github.com/soueilouay-creator/uneXxxx/actions/runs/42383567757), same commit, completed successfully on 2026-11-07. It checked health, bearer authentication, the 38-role registry, MCP tools, created a synthetic mock task, requested a Render restart and retrieved the completed task/event history from PostgreSQL afterward.
- The hosted workflow performs an actual Render restart. Do not re-run it without specific approval. Its evidence proves completed-task persistence across a restart, **not** in-flight workflow recovery or live provider API health.

## Role and Skill preservation

- AGENT_CATALOG.json is byte-identical in V7 and V8 (same Git blob SHA).
- Both agent manifests declare 38 roles; V7 is 7.3.1 and V8 is 8.0.0-preview.
- All 38 role profile paths exist in both repositories; 37 files are byte-identical. The only changed role file is agents/sales-intel.md.
- The V8 sales-intel profile adds an industrial-maintenance sales workflow. V8 skill_manifest.json marks industrial-maintenance-sales as active and invocation_mode automatic, with trigger terms such as “preventive maintenance tracker” and “sales control center”. The Python SkillRegistry automatically loads active automatic Skills when trigger terms match.
- The owner has explicitly stopped the industrial-maintenance business project. **Do not invoke or auto-load this Skill until the owner explicitly restarts that project.** Preserve the profile and Skill files, but add a user-scoped dormant-project/Skill activation gate before integrating the V8 runtime. The current V8 manifest does not have that gate.
- V8 docs/WORKFLOW_STUDIO.md says there are three active Skills, while the current skill manifest contains four; correct this documentation drift during the Skill registry integration.

## Data and durability boundaries

The V8 migration files 001_initial.sql and 002_idempotency_claims.sql in uneXxxx match the two migration records observed in the existing Neon project. Its PostgresStateStore persists tasks, events, memory, outcomes, idempotency claims and approvals.

The current V8 workflow is not yet proven crash-resumable:

- WorkflowRunner.run holds the current lifecycle stage state in memory.
- Coordinator.run_queued processes tasks returned by claim_next.
- PostgreSQL claim_next selects only rows with status='queued'; no stale-running-task recovery or workflow checkpoint-resume method was found.
- The existing restart tests complete a synthetic task before restarting, then retrieve the completed task. They do not kill the process during a running stage and prove safe recovery.

This is a durable-execution release blocker. Add a deterministic in-flight crash/restart test and a tested recovery mechanism before declaring durable workflow completion. Do not install DBOS until the existing runtime's recovery gap is measured and a safe additive integration is designed.

The Node Phone PWA's IndexedDB database name, version, stores and migration behavior remain uninspected because its supporting source is archive-backed. Preserve its local chats, projects, memories, skills and settings. Treat the PWA as a client of the unified API only after an export/backup/read-back compatibility test; do not silently sync or migrate local records.

## Integration sequence

1. Freeze the repository/version map and preserve all current branches, deployments and files.
2. Define shared API contracts: authentication, task/run IDs, provider route/provenance, event cursors, Skills, approvals, MCP tools and error states.
3. Add a read-only adapter from the Node Studio/PWA to the existing Python V8 API; retain every legacy route until compatibility tests pass.
4. Add a user-scoped project/Skill activation policy. Dormant projects must not auto-run merely because a trigger term appears.
5. Inspect and round-trip the archive-backed IndexedDB data before introducing any cross-device or server-side sync.
6. Prove in-flight task/workflow recovery on a verified backup/test environment; only then decide whether to extend the existing StateStore or add a workflow engine.
7. Combine Node and Python CI gates and test the full UI/API compatibility path.
8. Preview and rehearse rollback while keeping all old services and repositories available. No production cutover or service retirement in this program increment.

## Explicit non-actions in this audit

No changes were made to uneXxxx, uneXpected- or uneXpectedworkflow. No provider API was called, no Render restart was triggered, no Skill was invoked, no database was written, no branch was created/deleted, and no PWA data was migrated.
