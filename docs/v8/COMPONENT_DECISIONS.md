# V8 component decision register

**Decision state:** Provisional; validate exact package versions, licenses, APIs, compatibility and costs before installing.

| Capability | Candidate | Initial decision | Why / guardrail |
|---|---|---|---|
| TypeScript agent runtime | [Mastra](https://github.com/mastra-ai/mastra) | Preferred to prototype | Native TypeScript stack; supports agents, workflows, providers, MCP, memory and evals. Review license; avoid separately licensed `ee/` directories unless terms are explicitly approved. |
| Durable workflow execution | [DBOS Transact TS](https://github.com/dbos-inc/dbos-transact-ts) | **Hold pending existing-schema audit** | A connected Neon project already contains custom task/event/idempotency/approval tables and migration history. Do not install DBOS or create a second task store until the existing migrations, restart/replay semantics and backup/restore coverage are verified. |
| Multi-provider gateway | [LiteLLM](https://github.com/BerriAI/litellm) | Optional, not first dependency | Broad provider compatibility, budgets and routing; adds a Python service. MIT applies outside `enterprise/`; pin and audit version. |
| MCP interoperability | [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) | Preferred tool protocol | Official TypeScript client/server SDK. Check current license transition and exact package API. Maintain uneXpected-owned allowlists and policy enforcement. |
| Application connectors | [Composio](https://github.com/ComposioHQ/composio) | Selective evaluation | Useful where a specific application connector is missing. Verify hosted-service costs, authentication model, data scopes and terms before use. |
| Long-term memory | [Mem0](https://github.com/mem0ai/mem0) | Optional adapter | Evaluate retrieval quality, privacy and retention. PostgreSQL/uneXpected records remain authoritative; never replace current PWA memory. |
| AI observability | [Langfuse](https://github.com/langfuse/langfuse) | Preferred evaluation candidate | Strong trace, cost, prompt and evaluation visibility. Review enterprise licensing and self-hosting requirements; keep sensitive payloads redacted. |
| Model/agent evaluation | [Promptfoo](https://github.com/promptfoo/promptfoo) | Preferred test candidate | Model comparison, regression and red-team testing. Use offline/mock tests first; real API tests require a verified free route or approved budget. |
| Coding worker | [OpenHands SDK](https://github.com/OpenHands/software-agent-sdk) | Optional isolated worker | Repository/terminal coding tasks in ephemeral workspaces. Never grant ambient production secrets or direct production writes. |

## Existing infrastructure finding — 2026-11-10

A connected Neon Free-plan PostgreSQL 17 project named `unexpected-v8-unified` already exists. Its public schema has 15 tables for tasks, events, idempotency claims, consumed approvals, agent versions/memory, capabilities, outcomes and workspace records. The recorded migrations are `001_initial.sql` and `002_idempotency_claims.sql`.

The `v8-migration-test` branch already contains 41 tasks, 261 events, 9 agent-version records and 5 outcomes. The main branch has the two migration records but zero rows in those operational tables. The existing restore-rehearsal branch is older and has lower counts than the current migration-test branch. No database payloads were read and no writes were made.

The Free project is at its 10-branch limit. It has one manual snapshot on main, no automatic snapshot schedule on main or v8-migration-test, and 6-hour history retention. The current backup/recovery branches do not yet provide a verified current rollback for the populated test branch. Therefore no schema migration, DBOS installation, branch creation or endpoint change is approved by this decision record.

The canonical Node service does not yet connect to this Neon project. First find the source migration/runtime code and verify the backup/restore path. The preferred outcome may be a small adapter over the existing schema rather than another workflow engine.

## Alternatives evaluated

| Alternative | Decision | Reason |
|---|---|---|
| [LangGraph JS](https://github.com/langchain-ai/langgraphjs) | Alternative to Mastra | Strong low-level graph orchestration; do not run both as primary agent runtimes without a demonstrated need. |
| [Microsoft Agent Framework](https://github.com/microsoft/agent-framework) | Alternative | Mature multi-agent orchestration direction, but current project stack is Node/TypeScript; compare SDK maturity and migration cost first. |
| [Trigger.dev](https://github.com/triggerdotdev/trigger.dev) | Alternative to DBOS | Durable long-running tasks and queues; avoid introducing a second competing workflow engine. Compare deployment and hosting cost against DBOS. |
| [Docker MCP Gateway](https://github.com/docker/mcp-gateway) | Optional MCP boundary | May add isolation and tool governance, but requires Docker runtime compatibility. The SDK + uneXpected policy layer is sufficient for the initial design. |
| AutoGen | Not selected | Verify maintenance status before any future consideration; Microsoft Agent Framework is the more relevant successor path. |

## Adoption gates

Before installing a package:
1. Verify upstream repository activity, latest stable release, supported runtime and Node version.
2. Inspect root and transitive licenses, including dual-license or enterprise directories.
3. Run dependency and vulnerability checks.
4. Check peer dependencies, ESM/CJS behavior, package size and compatibility with Node 22.
5. Define a narrow adapter interface and deterministic mock test.
6. Add only the package(s) needed for the current phase.
7. Record cost, new services, secrets, data flows and operational burden.
8. Keep the existing implementation operational until the replacement adapter passes compatibility and rollback tests.

No candidate is automatically approved for paid hosting or external account creation by being listed here.
