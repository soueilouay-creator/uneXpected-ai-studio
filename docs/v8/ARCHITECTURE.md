# uneXpected V8 target architecture

## Architectural principle

uneXpected is the product and control plane. Model providers, agent frameworks, workflow engines and integration repositories are replaceable implementation modules behind stable uneXpected-owned interfaces. Avoid framework lock-in and overlapping runtimes.

See [REPO_INTEGRATION_MAP.md](./REPO_INTEGRATION_MAP.md) for the audited owned-repository map. The existing Python V8 runtime is the current core candidate; the Node Studio/PWA remains a preserved client and compatibility facade.

## Logical layers

### 1. Workspace and compatibility facade

Preserve the existing Node.js HTTP service, Studio UI, Phone PWA, current chat routes, provider selection, local projects, conversations, memories, settings, backup/import/export and read-only TAAFT behavior. The existing Python V8 desktop command center and the Node Studio/PWA are separate client surfaces over one uneXpected-owned control plane. New capabilities are exposed through additive, versioned APIs. Keep legacy routes operational until compatibility tests and rollback pass.

### 2. uneXpected control plane

The existing Python V8 implementation in the uneXxxx repository already provides a Coordinator, role/skill registry, permission policy, approval verifier, capability registry and MCP gateway. Integrate and harden these existing interfaces rather than creating a second coordinator.

The control plane owns:
- User/session authentication and authorization.
- Project, task, run and artifact identities.
- Specialist and skill registry with user-scoped activation state.
- Policy classification and tool permission scopes.
- Human approval requests and decisions.
- Idempotency keys for external side effects.
- Audit events and execution provenance.
- Budget, provider and concurrency policies.

Agents may propose actions. Only the policy-enforced executor can authorize and execute them. Dormant projects and skills must be blocked before automatic trigger matching.

### 3. Durable execution

The existing V8 Python core has StateStore and PostgresStateStore adapters for tasks, events, agent memory, outcomes, idempotency claims and one-use approvals. The checked-in migrations in uneXxxx match the existing Neon schema. The populated v8-migration-test branch contains existing records and must not be treated as a scratch database.

Current evidence proves persistence of completed tasks/events and retrieval after a service restart. It does not prove in-flight recovery: WorkflowRunner.run holds stage state in memory, claim_next selects only tasks still marked queued, and no stale-running-task recovery or checkpoint-resume API was found. The hosted restart test restarts after a synthetic task completes, not during a running stage.

Add a deterministic crash-during-stage test and a recovery mechanism to the existing StateStore first. DBOS remains an alternative only if it closes a measured gap without creating a second task/event source of truth. No database write is safe until a current backup/export and restore read-back path is verified.

### 4. Agent runtime and specialist registry

Use the existing Python V8 Coordinator and its 38-role registry as the single primary runtime candidate. It already implements a governed lifecycle, bounded subagents, policy checks and a self-improvement governor. Do not add Mastra as a second primary runtime.

Keep role definitions independent of model identity. Preserve the V7.3.1 role catalog as provenance; the V7 and V8 AGENT_CATALOG.json files are byte-identical, while versioned manifests and the changed sales-intel profile must remain distinct. The industrial-maintenance-sales Skill is currently marked active/automatic in V8, but the owner has stopped that project. Preserve the Skill files and add a user-scoped dormant-project gate before integration; do not invoke it until explicit reactivation.

### 5. Model capability registry and router

Use the existing V8 ProviderRouter as the authoritative route registry. It currently includes OpenAI, Anthropic, OpenRouter and OpenOx adapters. The Node Studio has overlapping OpenAI/Anthropic/OpenRouter code; preserve its routes but move new orchestration to the V8 router after compatibility tests. Google Gemini, DeepSeek and xAI are not yet verified as integrated routes.

Track:
- Provider and exact model ID.
- Context and modality capabilities.
- Tool/function calling and structured-output support.
- Task-category benchmark results.
- Current input/output pricing and rate limits.
- Latency and recent health.
- Data handling / retention constraints.
- Allowed data sensitivity.
- Budget ceiling and fallback eligibility.

Select the least expensive eligible model that meets the quality and capability threshold. Verify exact model IDs and current official pricing before any live route. No provider API calls without a verified zero-cost route or approved test budget.

### 6. Tool and integration plane

Reuse the existing Python V8 MCPToolGateway and remote MCP server, which already apply capability records, role permissions, bounded schemas and audit metadata. Adapt the Node TAAFT connector as a narrowly scoped read-only capability; preserve its existing allowlist. Add the official MCP TypeScript SDK only if a concrete Node-side MCP need remains after integration.

Maintain an uneXpected-owned catalog describing each tool's schema, owner, data scope, sensitivity, read/write class, approval requirement, rate limit and audit behavior.

Tool execution path:

agent proposal → schema validation → identity/scope check → policy decision → approval if required → idempotency check → executor → result validation → audit event

Treat all returned catalog/repository text as untrusted data. Composio and Docker MCP Gateway remain optional, not prerequisites.

### 7. Data, memory and knowledge

The existing V8 PostgreSQL schema is the operational store for tasks, events, idempotency, approvals, agent versions and memory. Keep it authoritative once backup and recovery are verified. The Node Phone PWA's IndexedDB remains authoritative for its local chats, projects, memories, skills and settings until a versioned export/backup/read-back migration is proven.

The exact IndexedDB database name, version, object stores and migration behavior are still uninspected because supporting modules are archive-backed. Do not silently sync, merge or migrate browser records. Mem0 remains optional only if a measured retrieval gap exists; it must not replace either existing store.

Memory must retain source, timestamp, owner/scope, sensitivity and confidence.

### 8. Engineering sandbox

OpenHands Software Agent SDK is a candidate for repository/code tasks. Run it in ephemeral workspaces with scoped repository access, non-production credentials, restricted filesystem and network, CPU/memory/time limits, and a branch-based workflow. Agent-generated changes require tests and code review before merge.

### 9. Evaluation, observability and security

The existing V8 core already has task/event traces, provider provenance, quality-evaluation records and a CI suite that passed 268 tests with 1 skipped on its current main commit. The Node/PWA suite adds 30 tests and the TAAFT suite adds 3. Reuse these deterministic tests as the acceptance baseline.

Identify remaining gaps in token/cost metrics, cross-service trace correlation and model evaluation before adding Langfuse, OpenTelemetry or Promptfoo. Keep deterministic tests—not an LLM judge—as the acceptance authority for critical behavior. Redact secrets and unnecessary user data.

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
- Resume from the last completed checkpoint after restart. This is a target requirement; current V8 evidence does not yet prove recovery from a crash during a running stage.
- Fall back to another eligible provider only under a documented route policy.
- Never present fallback content as the primary model or as a synthesis unless it actually is one.
- Fail closed for protected actions if auth, approval, cost, or audit state is unavailable.
- Keep the previous stable UI/runtime available if a new adapter fails.

## Deployment topology

Treat the existing Python V8 Render service as the current core candidate and the existing Node Studio/PWA service as a preserved client/compatibility surface. The last hosted V8 verification on 2026-11-07 checked health, bearer authentication, 38 roles, MCP tools and retrieval of a completed task after a Render restart; this is historical evidence, not a current health check. That workflow performs a live Render restart, so do not re-run it without specific approval.

Keep both existing services and all old routes untouched until client/API integration, preview, backup and rollback gates pass. Do not create new paid services by default. Render resource inventory remains unverified until the account workspace is explicitly selected.



Initially keep the current Render web service as the compatibility facade. Add modules within the same service only where practical. Separate services (LiteLLM, Langfuse, engineering workers or other infrastructure) require evidence that they are needed and a cost/operations review. Reuse existing infrastructure and secrets; do not create a new paid service by default.
