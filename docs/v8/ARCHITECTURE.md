# uneXpected V8 target architecture

## Architectural principle

uneXpected is the product and control plane. Model providers, agent frameworks, workflow engines and integration repositories are replaceable implementation modules behind stable uneXpected-owned interfaces. Avoid framework lock-in and overlapping runtimes.

## Logical layers

### 1. Workspace and compatibility facade

Preserve the existing Node.js HTTP service, desktop/mobile PWA, current chat routes, provider selection, local projects, conversations, memories, settings, backup/import/export and existing TAAFT behavior. The current UI remains the front door. New capabilities are exposed through additive, versioned APIs.

### 2. uneXpected control plane

Owns:
- User/session authentication and authorization.
- Project, task, run and artifact identities.
- Specialist and skill registry.
- Policy classification and tool permission scopes.
- Human approval requests and decisions.
- Idempotency keys for external side effects.
- Audit events and execution provenance.
- Budget, provider and concurrency policies.

Agents may propose actions. Only the policy-enforced executor can authorize and execute them.

### 3. Durable execution

A connected Neon project named `unexpected-v8-unified` already exists on the Free plan with PostgreSQL 17. Its public schema contains 15 tables, including `tasks`, `events`, `idempotency`, `idempotency_claims`, `consumed_approvals`, `agent_versions` and `agent_memory`. The canonical repository's inspected `server.js` does not currently connect to this project.

The populated `v8-migration-test` branch contains 41 tasks, 261 events, 9 agent-version records, 5 outcomes and idempotency records. These are existing records, not disposable test fixtures. The project is at its 10-branch Free-plan limit; only one manual snapshot exists (on main), no automatic snapshot schedule was returned for main or v8-migration-test, and history retention is 6 hours.

DBOS Transact remains a candidate, not a selected dependency. First locate and audit the existing migration source and the current task/event/idempotency semantics. Prefer a narrow uneXpected-owned adapter over the existing schema if it already provides the required durability. Add DBOS only if a deterministic comparison proves a material recovery benefit without creating a second source of task truth.

Do not write to any Neon branch or alter endpoint/network settings until a current backup/export and restore read-back path is verified. The current test/recovery branches do not yet establish that guarantee. Keep the deterministic local workflow adapter as the safe development path meanwhile.

### 4. Agent runtime and specialist registry

Mastra is the leading TypeScript candidate. uneXpected owns the canonical role records and maps them to runtime agents, tools, policies and model capabilities.

Initial specialist types:
- Planner / decomposer.
- Researcher / evidence curator.
- Software engineer / repository worker.
- Reviewer / security auditor.
- Tester / benchmark runner.
- Data and document analyst.
- Operations / integration specialist.
- Verifier / completion auditor.

Specialists are configurations and bounded workers inside one shared runtime, not independent systems with unrestricted access. Keep the role catalog separate from model identity so models can be replaced without changing role definitions.

### 5. Model capability registry and router

Use a provider-neutral interface with adapters for currently supported APIs. Track:
- Provider and exact model ID.
- Context and modality capabilities.
- Tool/function calling and structured-output support.
- Task-category benchmark results.
- Current input/output pricing and rate limits.
- Latency and recent health.
- Data handling / retention constraints.
- Allowed data sensitivity.
- Budget ceiling and fallback eligibility.

The router selects the least expensive eligible model that meets the quality and capability threshold. Escalate to a stronger model when complexity, uncertainty or verification failure warrants it. Use a second model for independent review only on material/high-risk work, not for every request.

Mastra provider adapters are the first option. LiteLLM may be added as a separate gateway only if comparative tests show a concrete gain in compatibility, load balancing or governance that justifies its additional Python service and operational cost.

### 6. Tool and integration plane

Use the official MCP TypeScript SDK for MCP client/server interoperability. Maintain an uneXpected-owned catalog describing each tool's schema, owner, data scope, sensitivity, read/write class, approval requirement, rate limit and audit behavior.

Tool execution path:

`agent proposal → schema validation → identity/scope check → policy decision → approval if required → idempotency check → executor → result validation → audit event`

Preserve the current TAAFT integration as a public, read-only catalog connector with its explicit search/detail allowlist. Treat all returned catalog/repository text as untrusted data.

Composio is optional for concrete application connectors where no existing native integration exists. Docker MCP Gateway is optional infrastructure, not a prerequisite for a secure MCP client.

### 7. Data, memory and knowledge

PostgreSQL is the authoritative operational store for task runs, approvals, audit events and durable workflow state. Keep business/domain records normalized and versioned.

Preserve browser IndexedDB database names, versions, stores and existing record shapes. Add versioned adapters and additive stores only after export/backup and read-back tests. Never silently migrate or delete local records.

Memory must retain source, timestamp, owner/scope, sensitivity and confidence. Mem0 may be evaluated behind a memory adapter. It must not become a second source of truth or rewrite existing memories.

### 8. Engineering sandbox

OpenHands Software Agent SDK is a candidate for repository/code tasks. Run it in ephemeral workspaces with scoped repository access, non-production credentials, restricted filesystem and network, CPU/memory/time limits, and a branch-based workflow. Agent-generated changes require tests and code review before merge.

### 9. Evaluation, observability and security

Instrument each run with trace/run ID, task class, role, provider, requested and actual model, tool calls, approvals, latency, token usage/cost, retries, errors and final verification outcome. Avoid storing secrets or unnecessary user data.

Evaluate Langfuse/OpenTelemetry for tracing and dashboards, and Promptfoo for offline model comparisons, regression evaluation and red-team suites. Use self-hosted/free modes only after infrastructure and license review. Deterministic tests—not an LLM judge—are the acceptance authority for critical behavior.

## End-to-end execution flow

1. Receive request and resolve user/project context.
2. Create a durable task/run record and assign a trace ID.
3. Classify intent, risk, sensitivity, capabilities and budget.
4. Select a specialist profile and eligible model.
5. Build a plan and identify required tools.
6. Validate tool schemas, scopes, approval policy and idempotency.
7. Execute bounded steps with durable checkpoints.
8. Validate each result and persist provenance.
9. Verify the final outcome through deterministic tests/read-back or independent review.
10. Deliver the result with Completed, Verified, Blocked and Next clearly separated.
11. Record evaluation metrics for later improvement.

## Failure handling

- Retry only transient and idempotent operations, with bounded attempts.
- Inspect destination state before retrying uncertain writes.
- Resume from the last completed checkpoint after restart.
- Fall back to another eligible provider only under a documented route policy.
- Never present fallback content as the primary model or as a synthesis unless it actually is one.
- Fail closed for protected actions if auth, approval, cost, or audit state is unavailable.
- Keep the previous stable UI/runtime available if a new adapter fails.

## Deployment topology

Initially keep the current Render web service as the compatibility facade. Add modules within the same service only where practical. Separate services (LiteLLM, Langfuse, engineering workers or other infrastructure) require evidence that they are needed and a cost/operations review. Reuse existing infrastructure and secrets; do not create a new paid service by default.
