# uneXpected V8 upgrade program

**Status:** Active — foundation and baseline phase  
**Branch:** `upgrade/v8-foundation`  
**Baseline:** `main` at `6f5bc823e1ffd9284abae7dbbb6c1dae97ebf90b` (observed 2026-11-09)  
**Policy:** Preserve first; extend additively; verify before declaring complete.

## Mission

Evolve uneXpected into one reliable, model-agnostic operating system. uneXpected owns the product, control plane, specialist registry, policies, permissions, user data and workflow state. External open-source projects supply bounded capabilities through adapters; none replaces uneXpected.

## Non-negotiable preservation rules

- Do not delete existing files, features, branches, history, deployments, user records, PWA stores, memories, projects, settings, backups or integrations.
- Do not rewrite Git history, reset databases, clear IndexedDB, or perform destructive schema changes.
- Make schema and API changes additive and backwards compatible. Preserve a rollback point before modifying existing files.
- Preserve existing routes and response contracts; add versioned interfaces where needed.
- Never treat a provider key's presence as proof that the provider works.
- No paid plan, paid trial, chargeable model test, paid infrastructure or credit consumption without price-specific approval.
- Keep secrets server-side, restrict tool permissions and require approval for protected external actions.
- No production deployment from an upgrade branch. Use reviewable branches, tests and a release candidate.

## Current baseline observed

The repository currently contains a Node.js 22 service, Docker/Render configuration, existing browser and mobile PWA surfaces, OpenAI and Anthropic provider adapters, OpenRouter fallback, compare/synthesis behavior, a read-only TAAFT MCP integration, and an existing Node test suite. A separate owned repository, uneXxxx, already contains the Python V8.0.0-preview core with a Coordinator, 38 roles, PostgreSQL state, idempotency/approval ledgers, MCP, subagents and quality evaluation. The integration map preserves both codebases and assigns the Node PWA as a client of the shared control plane.

The repository's tracked root includes `source.tar.gz.b64`, `Dockerfile`, `server.js`, `app.js`, `mobile/`, `mobile-release/`, `mobile-assets.mjs`, `mobile-assets.parts/`, `taaft-integration.mjs`, `openrouter-ui.js`, `docs/` and `test/`. The Dockerfile reconstructs a source bundle and overlays tracked files. This build arrangement needs to be mapped and made reproducible, not destructively replaced.

Existing tests cover orchestration/fallback, provider-fetch stubs, TAAFT allowlist, mobile PWA, mobile workspace and route smoke tests. On commit `a06cd916a6b02ca76b6b65adba1676c88b72efc0`, GitHub Actions verified 30/30 mobile/gateway tests and 3/3 TAAFT tests, JavaScript syntax checks and the production Docker image build. These are deterministic mocked/local tests; no real provider API calls were made. The TAAFT workflow now runs on the V8 upgrade branch and V8 documentation changes.

## Target architecture

1. Existing uneXpected workspace and control plane, with the Python V8 Coordinator in uneXxxx as the existing core candidate.
2. One 38-role Python runtime and provider/MCP control plane; do not add Mastra as a second orchestrator.
3. Existing PostgreSQL StateStore and approval/idempotency ledgers; prove in-flight crash recovery before considering DBOS.
4. One capability-aware provider registry, currently OpenAI, Anthropic, OpenRouter and OpenOx; add other providers only after official API/model/pricing verification.
5. Existing MCP gateway and a read-only TAAFT adapter with scoped permissions, approvals and audit logs.
6. Preserve both server-side V8 memory and the existing PWA IndexedDB workspace; no migration without export and read-back.
7. Isolated engineering worker only if needed, evaluating OpenHands.
8. Reuse existing traces, quality evaluation and CI; add external observability/evaluation only for measured gaps.
9. A secure combined CI/release pipeline, rollback procedure and evidence-based completion gate.

See [ARCHITECTURE.md](./ARCHITECTURE.md), [COMPONENT_DECISIONS.md](./COMPONENT_DECISIONS.md), [REPO_INTEGRATION_MAP.md](./REPO_INTEGRATION_MAP.md), [THREAT_MODEL.md](./THREAT_MODEL.md), [PRESERVATION_AND_MIGRATION.md](./PRESERVATION_AND_MIGRATION.md) and [UPGRADE_STATUS.md](./UPGRADE_STATUS.md). See [REPOSITORY_INVENTORY.md](./REPOSITORY_INVENTORY.md) for the audited repository baseline and [RUN_LOG.md](./RUN_LOG.md) for chronological execution evidence.

## Execution order

- Phase 0 — Inventory current source, build composition, APIs, tests, workflows, data stores and deployment configuration.
- Phase 1 — Define stable interfaces, threat model, dependency/license decisions, migration plan and benchmark suite.
- Phase 2 — Integrate the existing Python V8 Coordinator and 38-role registry through a versioned API; do not add a second primary runtime.
- Phase 3 — Prove in-flight recovery using the existing PostgresStateStore; add DBOS only if a measured gap remains and backup/restore is safe.
- Phase 4 — Unify Node clients with the existing V8 ProviderRouter; add providers only after official API/model/pricing verification.
- Phase 5 — Reuse the existing V8 MCP gateway and adapt TAAFT as a read-only, allowlisted capability.
- Phase 6 — Add memory adapters while preserving existing IndexedDB.
- Phase 7 — Add tracing, evaluations, red-team and regression gates.
- Phase 8 — Add isolated engineering worker if useful and safe.
- Phase 9 — Full integration, migration rehearsal, rollback rehearsal and release candidate.
- Phase 10 — Independent completion audit.

## Acceptance discipline

Every increment must record exact changed paths, commit SHA, commands and exit codes, test counts, evidence, remaining blockers, cost implications and next increment. No claim of integration, provider health, test success or deployment without direct evidence. If a capability cannot be safely completed, implement a tested interface/adapter boundary and report the production dependency as blocked rather than simulating success.
