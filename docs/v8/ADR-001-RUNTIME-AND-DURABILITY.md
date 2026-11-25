# ADR-001 — Keep the existing Python V8 runtime and checkpoint engine

- **Status:** Accepted for the V8 integration direction; production release remains blocked
- **Date:** 2026-11-25
- **Decision owners:** uneXpected project owner and V8 engineering workflow
- **Scope:** Primary agent runtime, specialist registry, durable workflow engine, and the Node Studio/PWA integration boundary
- **Supersedes:** The provisional framework decision in `COMPONENT_DECISIONS.md` that held DBOS pending in-flight recovery proof

## Decision

1. **Keep the existing Python V8 Coordinator as the one primary agent runtime.** It owns the canonical 38-role registry, Skills, policy/permissions, approvals, provider router, MCP gateway, subagent lifecycle and task coordination.
2. **Keep the existing uneXpected StateStore/PostgresStateStore plus WorkflowRunner checkpoint ledger as the one durable-workflow implementation.** Do not add DBOS Transact TypeScript while the existing implementation meets the tested checkpoint, approval and recovery contracts.
3. **Keep the Node.js 22 Studio/PWA as the preserved user-facing client and compatibility facade.** Its existing chat/provider routes, local workspace and read-only TAAFT integration remain in place. The new runtime-status bridge remains read-only until endpoint, transport and authentication are independently verified.
4. **Do not install Mastra, DBOS Transact TypeScript, a second coordinator, or a second provider router in this increment.** External frameworks remain capability candidates, not owners of uneXpected's control plane.
5. **Do not connect or migrate the populated hosted database as part of this decision.** Production durability remains blocked until an authorized current backup/export, independent restore/read-back and schema/access review are available.

## Evidence from the owned repositories

### Existing agent runtime

The current `soueilouay-creator/uneXxxx` main branch is at `2828fe281b60ea0a343b24973b411bbad650e93e`. Its Python 3.12 Docker image runs `python -m unexpected_runtime.http_api`. The Coordinator constructs the AgentRegistry, SkillRegistry, ProviderRouter, permission policy, approval verifier, capability registry, MCPToolGateway and SubagentRunner. The checked-in manifest declares 38 active roles (37 legacy profiles).

The current core therefore already implements the role and policy ownership that a second Mastra coordinator would otherwise duplicate. The Node Studio remains a separate preserved client, not a replacement runtime.

### Existing durable execution

The owned core contains:
- Versioned workflow checkpoints and revision-checked state updates.
- Per-stage checkpoints with request hashes and attempt tokens.
- Durable stage approval intents tied to workflow, stage, task, action digest and permission.
- Idempotency claims and approval execution intents.
- PostgreSQL and SQLite StateStore adapters.

The main-branch `WorkflowRunner` deliberately fails closed when an interrupted stage is ambiguous. The process-recovery test terminates a child process after a stage has been claimed, reopens the store, and proves that a second run is blocked without invoking the stage callback or changing the original attempt token. This is **safe recovery protection, not automatic replay of an ambiguous in-flight side effect**. Completed-stage reconciliation and approval pause/resume have separate tests.

CI run [45099384548](https://github.com/soueilouay-creator/uneXxxx/actions/runs/45099384548), attached to draft PR #18 head `e13689e1168dfef655791881d1d7befb93c2ff59` based on core main `2828fe281b60ea0a343b24973b411bbad650e93e`, was rechecked during this decision. Its runtime, PostgreSQL 17 release-proof and renderer-E2E jobs all completed successfully. The recorded results are:
- PostgreSQL 16 regression: 443 passed, 3 skipped.
- PostgreSQL 17 targeted release proof: 6/6 passed, including independent-connection approval concurrency, abrupt-process recovery, approval pause/resume, consumed-approval restart protection and separate-target backup/restore.
- Renderer E2E: passed.

The remaining recovery gap is operator-directed reconciliation of an interrupted `started` stage. It must never be silently replayed. Define and test that recovery procedure before declaring the durable-workflow release gate closed.

### Database schema guard

Core PR [#18](https://github.com/soueilouay-creator/uneXxxx/pull/18) remains open and draft at `e13689e1168dfef655791881d1d7befb93c2ff59`. It raises the PostgreSQL startup guard from schema version 2 to version 7 and adds tests that versions 1–6 fail closed. Its CI run above is green.

**Important:** the current core `main` still contains the older version-2 startup check. PR #18 has not been merged. Until that change is reviewed and incorporated, do not treat the version-7 startup guard as present on main, and do not use this document as approval to migrate or restart a hosted service.

### Existing Studio integration boundary

At the start of this decision, Studio PR [#13](https://github.com/soueilouay-creator/uneXpected-ai-studio/pull/13) was open and draft at `9f29b6da004b91cd60fc1505124e5482b5f09117`, 95 commits ahead and 0 behind main. The pre-decision comparison contained 28 changed paths and no removed files (7 line deletions were edits inside existing files). This ADR and the accompanying decision-register/status updates are additional documentation-only commits on that same draft branch.

Exact-head CI was rechecked:
- [Studio mobile integration #45310281272](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/45310281272): all job steps passed, including source/mobile restoration, syntax, authenticated HTTP regression, real Chromium IndexedDB round-trip and Docker image build. The associated test record is 40/40 Node tests and 1/1 Chromium test.
- [TAAFT integration #45310281333](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/45310281333): all steps passed; 3/3 integration tests.

The Node bridge added in Run 14 exposes only authenticated `GET /v1/runtime/status`. It does not forward task execution, approvals, MCP calls or writes. No hosted runtime request was made in this decision.

## Candidate evaluation

| Candidate | Current upstream evidence | Decision for uneXpected V8 |
|---|---|---|
| Existing Python Coordinator | Already owns 38 roles, Skills, policy, MCP, provider routing and workflow lifecycle; deterministic CI and PostgreSQL recovery evidence above | **Select** as the single primary runtime |
| Existing PostgresStateStore / WorkflowRunner | Already stores workflow and stage checkpoints, approval bindings and idempotency; PostgreSQL 16/17 proof passed | **Select** as the single durable-workflow implementation; retain the explicit ambiguous-stage recovery blocker |
| Mastra `@mastra/core` | Current package manifest declares version 1.86.0, Apache-2.0 and Node >=22.13.0. Repository `LICENSE.md` explicitly places directories named `ee/` under a separate Enterprise Edition License; `ee/LICENSE` states those features are source-available, not open source, and prohibits production use | **Do not install**. It would add a second Node-side agent framework or require a larger migration while the existing Python coordinator already owns the required lifecycle. Avoid all `ee/` paths. Reconsider only if a measured requirement cannot be met by the existing runtime |
| DBOS Transact TypeScript | Repository is MIT-licensed and documents a Postgres-backed TypeScript workflow library with checkpoints, queues, scheduling and recovery | **Do not install now**. The existing Python runtime already has tested Postgres checkpoints and recovery protection. Adding the TS engine would require a second Node worker or a control-plane migration and risk duplicating workflow/task state. Reconsider only if a measured gap remains; evaluate a Python-compatible option first if the runtime stays Python |
| Official MCP TypeScript SDK | No concrete Node-side tool-execution requirement has been demonstrated; the existing Python MCP gateway already applies capability and role policy | **Defer**. Keep TAAFT read-only and preserve its allowlist. Add a Node MCP client only for a narrowly scoped, reviewed use case |
| LiteLLM / Composio / Mem0 / Langfuse / Promptfoo / OpenHands | No measured gap justifies installing another service or replacing existing capability registries in this increment | **Defer** pending the relevant phase-specific benchmark, license/security review and zero-cost operating plan |

Upstream references: [Mastra core package manifest](https://github.com/mastra-ai/mastra/blob/main/packages/core/package.json), [Mastra license](https://github.com/mastra-ai/mastra/blob/main/LICENSE.md), [Mastra EE license](https://github.com/mastra-ai/mastra/blob/main/ee/LICENSE), [DBOS Transact TypeScript](https://github.com/dbos-inc/dbos-transact-ts), and [DBOS MIT license](https://github.com/dbos-inc/dbos-transact-ts/blob/main/LICENSE).

## Compatibility and preservation contract

- Keep the existing Node Studio/PWA, legacy routes, chat/provider behavior, local projects, conversations, memories, settings, backups and TAAFT allowlist.
- Keep the Python core as the only coordinator and source of operational workflow state.
- Expose additional runtime functionality through versioned, authenticated APIs. Never accept an upstream URL or runtime credential from the browser.
- Keep approval verification, idempotency and audit checks in the uneXpected control plane; a framework callback is not authorization.
- Do not migrate or merge browser IndexedDB data. The existing insert-only merge adapter remains separate from the replacement-style Restore flow and is not yet wired to the UI.
- Do not apply migrations, write to Neon, restart Render, or enable write-capable runtime routes until backups, schema readiness, auth and rollback have been independently verified.

## Costs and licensing

- No dependencies were installed or updated; no package lockfile changed.
- No new service, database, paid plan, trial or model API call was used.
- Mastra core is Apache-2.0 at the inspected package manifest, but its `ee/` directories are governed by a separate non-open-source license and are excluded.
- DBOS Transact TypeScript is MIT. Its suitability is not the same as approval to deploy a new worker or alter the existing state architecture.
- GitHub Actions account-level billing is not visible to this audit and remains unverified.

## Reconsideration triggers

Reopen this ADR only when one of these is demonstrated with a reproducible benchmark or failing acceptance test:
1. The Python Coordinator cannot meet a required Node-native integration or deployment constraint without unacceptable operational complexity.
2. The existing checkpoint engine cannot satisfy a documented crash-recovery/idempotency contract after the safe operator-reconciliation path is implemented and tested.
3. A specific MCP, provider, observability or sandbox requirement cannot be met safely by the existing adapters.

Any reconsideration must compare migration cost, data ownership, security, licenses, dependency surface, hosting cost, rollback and backwards compatibility before installing or replacing anything.

## Open release blockers

- Core PR #18's schema-version-7 guard is still draft; current main retains the older version-2 startup check.
- Ambiguous interrupted stages are safely blocked, but no complete operator-directed reconciliation workflow has been verified.
- The hosted PostgreSQL backup/export and independent restore/read-back path is not verified for the populated production database. Earlier audit found the Neon Free project at its 10-branch limit with no scheduled snapshots; recheck before any operational change.
- Studio's hosted runtime endpoint, DNS target and authentication remain unverified; the status bridge is not connected to the PWA.
- Live non-billable or specifically approved compatibility tests for OpenAI, Anthropic and a third provider remain outstanding.
- MCP security tests, provider-level provenance/cost/latency telemetry, Promptfoo-equivalent CI evaluation, full sandbox audit and final rollback/release rehearsal remain outstanding.
- Studio PR #13 and core PR #18 remain drafts. No merge or production deployment is authorized by this ADR.
