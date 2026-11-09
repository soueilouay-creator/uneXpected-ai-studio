# V8 component decision register

**Decision state:** Provisional; validate exact package versions, licenses, APIs, compatibility and costs before installing.

| Capability | Candidate | Initial decision | Why / guardrail |
|---|---|---|---|
| TypeScript agent runtime | [Mastra](https://github.com/mastra-ai/mastra) | Preferred to prototype | Native TypeScript stack; supports agents, workflows, providers, MCP, memory and evals. Review license; avoid separately licensed `ee/` directories unless terms are explicitly approved. |
| Durable workflow execution | [DBOS Transact TS](https://github.com/dbos-inc/dbos-transact-ts) | Preferred to prototype | PostgreSQL-backed durable workflows, queues and recovery. Requires a compatible Postgres database and proof of restart/replay semantics. |
| Multi-provider gateway | [LiteLLM](https://github.com/BerriAI/litellm) | Optional, not first dependency | Broad provider compatibility, budgets and routing; adds a Python service. MIT applies outside `enterprise/`; pin and audit version. |
| MCP interoperability | [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) | Preferred tool protocol | Official TypeScript client/server SDK. Check current license transition and exact package API. Maintain uneXpected-owned allowlists and policy enforcement. |
| Application connectors | [Composio](https://github.com/ComposioHQ/composio) | Selective evaluation | Useful where a specific application connector is missing. Verify hosted-service costs, authentication model, data scopes and terms before use. |
| Long-term memory | [Mem0](https://github.com/mem0ai/mem0) | Optional adapter | Evaluate retrieval quality, privacy and retention. PostgreSQL/uneXpected records remain authoritative; never replace current PWA memory. |
| AI observability | [Langfuse](https://github.com/langfuse/langfuse) | Preferred evaluation candidate | Strong trace, cost, prompt and evaluation visibility. Review enterprise licensing and self-hosting requirements; keep sensitive payloads redacted. |
| Model/agent evaluation | [Promptfoo](https://github.com/promptfoo/promptfoo) | Preferred test candidate | Model comparison, regression and red-team testing. Use offline/mock tests first; real API tests require a verified free route or approved budget. |
| Coding worker | [OpenHands SDK](https://github.com/OpenHands/software-agent-sdk) | Optional isolated worker | Repository/terminal coding tasks in ephemeral workspaces. Never grant ambient production secrets or direct production writes. |

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
