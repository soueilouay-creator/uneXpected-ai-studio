# Repository inventory and verified baseline

**Audit date:** 2026-11-10  
**Repository:** [soueilouay-creator/uneXpected-ai-studio](https://github.com/soueilouay-creator/uneXpected-ai-studio)  
**Default branch:** `main`  
**Upgrade branch:** `upgrade/v8-foundation`

## Git state observed

| Item | Evidence |
|---|---|
| Default branch tip | `main` at `6f5bc823e1ffd9284abae7dbbb6c1dae97ebf90b` |
| Upgrade branch tip before this documentation update | `a06cd916a6b02ca76b6b65adba1676c88b72efc0` |
| Branch comparison | 10 commits ahead, 0 behind main |
| Existing open PRs | PR #12 concerns the phone UI; no V8 upgrade PR was found |
| Existing V8 branch | Reused; no duplicate branch created |

The branch comparison showed the existing V8 foundation documents and additive CI trigger changes. No existing application source, archive, PWA, TAAFT source, test or deployment file was removed by this work.

## Tracked product surfaces

The current repository tree includes:

- Native Node.js service: `server.js`, `app.js`, `openrouter-ui.js`, `mobile-assets.mjs`.
- Deployment/build: `Dockerfile`, `render.yaml`, `source.tar.gz.b64`.
- Mobile PWA: `mobile/`, `mobile-release/`, `mobile-assets.parts/`.
- TAAFT connector: `taaft-integration.mjs`, `docs/TAAFT_MCP_INTEGRATION.md`.
- Tests: `test/`.
- CI: `.github/workflows/mobile-integration.yml`, `.github/workflows/taaft-integration.yml`.

No root `package.json` or npm lockfile appears in the tracked tree. The current service uses Node built-ins and local modules. The contents and any dependency metadata inside `source.tar.gz.b64` have not yet been independently enumerated.

## Existing HTTP and provider behavior

The inspected `server.js` exposes these existing paths:

- `GET /health`
- `GET /`, `GET /app.js`, `GET /styles.css`, `GET /openrouter-ui.js`
- `GET /mobile` and `GET /mobile/*`
- `POST /orchestrate`
- `POST /test-provider`
- `GET /favicon.ico`

The existing provider adapters use the OpenAI Responses API, Anthropic Messages API and OpenRouter chat-completions API. The current defaults are `gpt-4.1`, `claude-sonnet-4-5-20250929` and `openrouter/free`. These are existing configured defaults, not a new V8 capability registry and not proof that live provider credentials work.

Private provider routes require the server-side `UNEXPECTED_ACCESS_TOKEN`. The existing rate limiter stores buckets in a process-local `Map`; this is not durable or shared across multiple instances. No changes were made to authentication or rate limiting in this increment.

The TAAFT documentation describes a public, read-only catalog connector with an explicit allowlist of 28 search/detail operations. OpenRouter is intentionally not connected to TAAFT.

## Mobile/local data preservation boundary

The Phone PWA presents conversations, projects, memories, agents/profiles, skills, settings, improvements, voice controls and local backup import/export. The tracked `mobile-release/app.js` imports `db.js`, `core.js` and `voice.js`; the CI restore step materializes supporting mobile modules and registries from the chunked asset archive before overlaying the tracked release files.

The mobile integration tests verify, among other behaviors, that the gateway token is kept in memory rather than browser storage/backups, context sharing is opt-in, offline caching is restricted to same-origin mobile GET resources, and the existing workspace modules are present after restoration.

**Not yet verified:** the exact IndexedDB database name, schema version, object-store list, indexes and migration behavior. The database module is supplied by the archive-backed mobile asset set rather than a standalone tracked file in the visible tree. A source-level schema inventory and old-record round-trip test remain required before any data migration.

## Build and CI evidence

The Dockerfile:

1. Decodes and extracts `source.tar.gz.b64`.
2. Copies the bundled application into the image.
3. Overlays tracked server/UI modules.
4. Reconstructs the chunked mobile asset archive and checks its SHA-256.
5. Overlays `mobile-release/` into the mobile PWA.

The chunked mobile archive has nine ordered base64 parts and a SHA-256 check in both the Docker build and mobile CI restore step. The source bundle is retained, but the Dockerfile does not currently perform an equivalent explicit SHA-256 check on `source.tar.gz.b64`.

Verified GitHub Actions evidence:

- [Run 42619015320 — prior mobile baseline](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/42619015320), commit `756294118f6bd04f89c35b72abc3fbb9fa9fc742`: 30 mobile/gateway tests passed, syntax checks passed and Docker image build passed.
- [Run 42745182284 — V8 mobile integration](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/42745182284), commit `a06cd916a6b02ca76b6b65adba1676c88b72efc0`: 30 tests passed, 0 failed; asset restoration, syntax checks and production Docker image build passed.
- [Run 42745182217 — V8 TAAFT integration](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/42745182217), same commit: 3 tests passed, 0 failed; syntax checks passed.

The two workflows now provide **33 deterministic tests total (33 passed, 0 failed)** on the V8 branch. The TAAFT workflow was extended additively to `upgrade/v8-*`, `docs/v8/**` and manual dispatch; its original feature branch and pull-request triggers remain. These tests use mocks/local fixtures; they do not prove live provider credentials or non-billable API compatibility.

## Deployment and database observations

### Render

The checked-in Render blueprint specifies a free Docker web service in Frankfurt with automatic deploy enabled and provider-secret environment prompts. It does not declare a PostgreSQL resource or database connection variable.

The connected Render account lists one workspace, but the Render connector requires the user to select a workspace explicitly before inspecting services or databases. This non-interactive run did not select it. Render services, databases and actual deployment state therefore remain unverified.

### Existing Neon database

A connected Neon project named `unexpected-v8-unified` was found. Read-only metadata identifies it as PostgreSQL 17 in `aws-eu-central-1` on the `free_v3` plan. The official Free plan is $0/month within its published quotas: 100 CU-hours per project/month, 1 GB storage, 10 branches, one manual snapshot and a 6-hour restore-history window ([official limits](https://neon.com/faqs/free-plan-limits-and-quotas)).

The project is already at its **10/10 branch limit**. No branch was created, deleted or repurposed. Its public `neondb` schema contains 15 tables: `agent_memory`, `agent_versions`, `baselines`, `capabilities`, `consumed_approvals`, `events`, `idempotency`, `idempotency_claims`, `outcomes`, `proposals`, `schema_migrations`, `shared_knowledge`, `tasks`, `workspace_devices` and `workspace_records`. The two recorded migrations are `001_initial.sql` and `002_idempotency_claims.sql`.

Aggregate-only SQL reads (no payload/content rows) showed:

| Table | Neon `main` | `v8-migration-test` |
|---|---:|---:|
| `agent_versions` | 0 | 9 |
| `events` | 0 | 261 |
| `tasks` | 0 | 41 |
| `outcomes` | 0 | 5 |
| `idempotency` | 0 | 1 |
| `idempotency_claims` | 0 | 1 |
| `schema_migrations` | 2 | 2 |
| All other listed tables | 0 | 0 |

The `v8-migration-test` branch therefore contains existing operational data and must not be treated as an empty scratch database. The `cutover-restore-rehearsal-20261107` branch has fewer records (8 agent versions, 139 events, 24 tasks and 2 outcomes), so it is not a verified current copy of the migration-test branch. The corresponding `cutover-backup-20261107-v8-migration-test` branch has no compute endpoint available to the connector, so its contents could not be read back.

The project has one manual snapshot, `uneXpected-pre-cutover-main-2026-11-07`, on the main branch. No automatic snapshot schedule was returned for main or v8-migration-test. The project metadata reports 6-hour history retention. Main and v8-migration-test are not marked protected. Do not assume the older recovery branches or the single main snapshot protect the current migration-test data.

Endpoint metadata reports passwordless access enabled, an empty IP allowlist and public connections not blocked. This is a security-review item before any application connection; no endpoint or network setting was changed.

The canonical repository's inspected `server.js` does not connect to this Neon project, and no DBOS runtime/schema was found in the inspected public schema. The existing tables already represent uneXpected task, event, idempotency, approval, agent-version and workspace concepts. **DBOS is therefore on hold** until the source of migrations `001_initial.sql` and `002_idempotency_claims.sql`, current repository/task semantics, backup coverage and recovery behavior are audited. Prefer an adapter over the existing store if it already satisfies the requirements; do not create a second source of task truth.

## Preservation and cost result

- Existing main branch was not modified; all work remains on `upgrade/v8-foundation`.
- Existing V8 branch history, Neon branches, manual snapshot, archives, PWA, server routes, TAAFT integration and tests were retained.
- Read-only schema metadata, migration names and aggregate row counts were inspected on existing Neon branches. No task/event/agent/memory payloads or user content were read.
- No database write, migration, branch creation/deletion, snapshot creation, export, restore or data mutation occurred.
- No package was installed, no provider API test was sent, and no production deployment was triggered.
- Neon is confirmed on its Free plan; read-only SQL used existing free-tier compute allowance. The exact remaining monthly allowance and any account-level billing adjustments are not exposed. No paid plan or charge was initiated.
- GitHub-hosted CI runners executed the 30-test mobile/gateway suite, 3-test TAAFT suite and Docker build. Account-specific GitHub Actions billing impact is not visible from the repository connector.

## Next audit tasks

1. Integrate the discovered Python V8 core source from uneXxxx through a reviewed compatibility boundary; map task/event/idempotency recovery semantics before changing runtime code.
2. Establish a verified, zero-cost backup/export and read-back path for the populated `v8-migration-test` branch. Its existing restore-rehearsal branch is older, the matching backup branch has no endpoint, the project is at its branch cap, and no automatic snapshot schedule is configured.
3. Inspect Render resources only after the account workspace is explicitly selected; do not infer deployment or database state from `render.yaml`.
4. Obtain a trusted local archive-extraction environment and inspect the actual IndexedDB schema and role/skill registries before any migration.
5. Define uneXpected-owned agent, workflow, provider, tool, approval and memory interfaces against the verified existing runtime and database.
