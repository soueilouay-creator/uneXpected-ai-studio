# V8 component decision register

**Decision state:** Provisional; validate exact package versions, licenses, APIs, compatibility and costs before installing.

| Capability | Candidate | Initial decision | Why / guardrail |
|---|---|---|---|
| Primary agent runtime | Existing Python V8 Coordinator in [uneXxxx](https://github.com/soueilouay-creator/uneXxxx) | Preferred to integrate | Already implements the 38-role registry, provider routing, MCP gateway, subagents, lifecycle, permissions and improvement governor. Keep one coordinator; do not add Mastra as a second primary runtime. |
| Durable workflow recovery | Existing V8 PostgresStateStore; [DBOS](https://github.com/dbos-inc/dbos-transact-ts) remains an alternative | **Hold pending crash-recovery proof** | The existing store persists tasks/events/idempotency/approvals and completed tasks survive restart, but no in-flight checkpoint or stale-running-task recovery was found. Add the smallest tested recovery layer; consider DBOS only if it closes this gap without duplicating task state. |
| Multi-provider gateway | Existing V8 ProviderRouter | Preferred to integrate | Already supports OpenAI, Anthropic, OpenRouter and OpenOx. Add Gemini, DeepSeek or xAI adapters only after official API/model/pricing verification. LiteLLM remains optional only if measured gaps justify another service. |
| MCP interoperability | Existing Python V8 MCPToolGateway / remote server | Preferred to integrate | Already enforces capability records, role permissions, bounded schemas and audit metadata. Adapt the read-only TAAFT connector; add the TypeScript SDK only for a proven Node-side MCP need. |
| Application connectors | [Composio](https://github.com/ComposioHQ/composio) | Selective evaluation | Useful where a specific application connector is missing. Verify hosted-service costs, authentication model, data scopes and terms before use. |
| Long-term memory | Existing V8 agent_memory plus PWA IndexedDB | Preferred to integrate | Preserve both existing stores and their scopes. Mem0 remains optional only after a concrete retrieval gap, privacy review and backup/retention tests. |
| AI observability | Existing V8 task/event traces and quality evaluation | Preferred baseline | Already records stage outcomes, provider provenance and quality reports. Add OpenTelemetry/Langfuse only after a measured gap in token/cost or cross-service tracing; redact payloads. |
| Model/agent evaluation | Existing V8 268-test CI and quality-evaluation harness | Preferred baseline | Reuse deterministic regression/security tests first. Promptfoo remains optional for a specific model-comparison/red-team gap; live API tests still require a verified free route or approved budget. |
| Coding worker | [OpenHands SDK](https://github.com/OpenHands/software-agent-sdk) | Optional isolated worker | Repository/terminal coding tasks in ephemeral workspaces. Never grant ambient production secrets or direct production writes. |

## Existing owned runtime and infrastructure finding — 2026-11-10

The Python V8 implementation in uneXxxx is already a working core candidate. Its main-branch CI passed 268 tests with 1 skipped, including an ephemeral PostgreSQL 16 service, migration application, regression/security tests, Docker build and container smoke. A separate hosted verification workflow passed on 2026-11-07: it checked the deployed service's health, bearer boundary, 38-role registry and MCP catalogue, created a synthetic task, restarted Render and retrieved the completed task/event history from PostgreSQL. That historical workflow performs a live Render restart and must not be re-run without specific approval.

The V8 repository's migrations 001 and 002 match the existing Neon schema. The V8 PostgresStateStore persists tasks, events, memory, outcomes, idempotency claims and approvals. However, the workflow runner is in-process, claim_next only selects queued tasks, and no stale-running-task recovery or checkpoint-resume path was found. The hosted restart evidence proves completed-task persistence, not in-flight recovery. This remains a release blocker.

The V7.3.1 and V8 repositories share the exact same AGENT_CATALOG.json and 38 role paths; 37 role profile files are byte-identical. V8 changes sales-intel.md to include the industrial-maintenance sales workflow. Its skill_manifest.json marks industrial-maintenance-sales as active and automatic, and SkillRegistry auto-loads it when trigger terms match. The owner has stopped that business project. Preserve the profile and Skill files, but add a user-scoped dormant-project/Skill activation gate so it cannot run until explicit owner reactivation.

The V8 README previously excluded the Node AI Studio and Phone PWA. That prior design choice is superseded by the current preservation requirement. Keep the Node PWA and local data as clients of the unified API; do not replace them.

The Neon Free project is at its 10-branch limit, has one manual snapshot on main, no automatic snapshot schedule on main or v8-migration-test, and a 6-hour history window. The populated migration-test branch has no verified current rollback copy. Do not mutate it until a current backup/export and restore read-back path exists.

## Alternatives evaluated

| Alternative | Decision | Reason |
|---|---|---|
| [LangGraph JS](https://github.com/langchain-ai/langgraphjs) | Alternative only if the existing Python Coordinator fails a measured requirement | Strong low-level graph orchestration; do not run both as primary agent runtimes without a demonstrated need. |
| [Microsoft Agent Framework](https://github.com/microsoft/agent-framework) | Alternative | Mature multi-agent orchestration direction, but current project stack is Node/TypeScript; compare SDK maturity and migration cost first. |
| [Trigger.dev](https://github.com/triggerdotdev/trigger.dev) | Alternative only if the existing StateStore cannot meet the verified recovery contract | Durable long-running tasks and queues; avoid introducing a second competing workflow engine. Compare deployment and hosting cost against DBOS. |
| [Docker MCP Gateway](https://github.com/docker/mcp-gateway) | Optional MCP boundary | May add isolation and tool governance, but requires Docker runtime compatibility. The SDK + uneXpected policy layer is sufficient for the initial design. |
| AutoGen | Not selected | Verify maintenance status before any future consideration; Microsoft Agent Framework is the more relevant successor path. |

## Adoption gates

Before installing a package:
1. Verify upstream repository activity, latest stable release, supported Node and Python runtime versions.
2. Inspect root and transitive licenses, including dual-license or enterprise directories.
3. Run dependency and vulnerability checks.
4. Check peer dependencies, ESM/CJS behavior, package size and compatibility with Node 22.
5. Define a narrow adapter interface and deterministic mock test.
6. Add only the package(s) needed for the current phase.
7. Record cost, new services, secrets, data flows and operational burden.
8. Keep the existing implementation operational until the replacement adapter passes compatibility and rollback tests.

No candidate is automatically approved for paid hosting or external account creation by being listed here.
