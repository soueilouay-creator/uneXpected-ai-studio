# Repository inventory and verified baseline

**Audit date:** 2026-11-10  
**Repository:** [soueilouay-creator/uneXpected-ai-studio](https://github.com/soueilouay-creator/uneXpected-ai-studio)  
**Default branch:** `main`  
**Upgrade branch:** `upgrade/v8-foundation`

## Git state observed

| Item | Evidence |
|---|---|
| Default branch tip | `main` at `6f5bc823e1ffd9284abae7dbbb6c1dae97ebf90b` |
| Upgrade branch tip before this increment | `756294118f6bd04f89c35b72abc3fbb9fa9fc742` |
| Branch comparison | 9 commits ahead, 0 behind main |
| Existing open PRs | PR #12 concerns the phone UI; no V8 upgrade PR was found |
| Existing V8 branch | Reused; no duplicate branch created |

The branch comparison showed the six existing `docs/v8/` foundation documents and the additive mobile CI trigger change. No existing application source, archive, PWA, TAAFT source, test or deployment file was removed by that foundation work.

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

Verified GitHub Actions evidence before this increment:

- Workflow: [run 42619015320](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/42619015320)
- Commit: `756294118f6bd04f89c35b72abc3fbb9fa9fc742`
- Conclusion: `success`
- Mobile/gateway node:test suite: **30 passed, 0 failed**
- JavaScript syntax-check step: passed
- Production Docker image build step: passed

That mobile/gateway run did **not** include `test/taaft-integration.test.mjs`. Before this increment, the separate TAAFT workflow's push trigger covered only `feature/taaft-readonly-mcp`, so the V8 upgrade branch did not receive that test suite on push. This increment extends that workflow to `upgrade/v8-*`, V8 documentation changes and manual dispatch without removing its existing trigger.

## Deployment and database observations

The checked-in Render blueprint specifies a free Docker web service in Frankfurt with automatic deploy enabled and provider-secret environment prompts. It does not declare a PostgreSQL database resource or database connection variable.

This does **not** prove that no external Render, Neon or other PostgreSQL resource exists. No connected infrastructure dashboard or database credentials were available for this audit. Production DB availability, plan limits, backups and cost therefore remain **unverified**. Do not install DBOS or run a production migration until that prerequisite is checked.

## Preservation and cost result

- Existing main branch was not modified.
- Existing V8 branch and history were retained.
- `source.tar.gz.b64`, `mobile-assets.parts/`, `mobile-release/`, server routes, TAAFT files and tests remain tracked.
- No user data was read, exported, migrated, rewritten or deleted.
- No package was installed and no provider API test was sent.
- No infrastructure, subscription, paid trial or production deployment was created.
- GitHub-hosted CI runner usage occurred; account-specific billing impact is not visible from the repository connector.

## Next audit tasks

1. Obtain a safe local copy of the public repository or an equivalent trusted extraction environment; enumerate the archive contents and inspect the actual IndexedDB module and profile registries.
2. Verify whether a suitable existing PostgreSQL resource is available and what its incremental cost/limits are.
3. Define uneXpected-owned agent, workflow, provider, tool, approval and memory interfaces against the actual existing runtime—not against assumptions.
4. Run the newly enabled TAAFT workflow on the V8 branch and retain its exact test output.
