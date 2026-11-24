# Node-to-runtime integration contract audit

**Audit date:** 2026-11-24  
**Scope:** read-only inspection of the existing Node Studio/PWA and the Python V8 runtime; one additive status-only adapter.

## Verified existing boundaries

### Node Studio and Phone PWA

The preserved Studio service is a Node.js 22 HTTP server. Its existing public surfaces include the homepage, static assets, the Phone PWA under /mobile/, and /health. Its existing authenticated provider routes are POST /orchestrate and POST /test-provider. Both use the Studio bearer-token check and the existing rate limiter.

The Node server currently calls OpenAI Responses, Anthropic Messages and OpenRouter directly. The TAAFT integration remains a separate public, read-only catalog adapter with its existing explicit tool allowlist. This increment does not change those routes, provider calls, PWA assets, IndexedDB stores or TAAFT behavior.

### Existing Python V8 runtime

The separate uneXxxx repository exposes a Python HTTP API. Its public /health endpoint reports service/storage readiness. Its /v1/* API routes require a bearer token of at least 32 ASCII characters. GET /v1/status returns a bounded operational snapshot including runtime version, health, registered-agent count, provider, mode, storage health and governance state.

The two services use different server-side credential names: UNEXPECTED_ACCESS_TOKEN for the Node Studio and UNEXPECTED_RUNTIME_API_TOKEN for the Python runtime. They are not interchangeable. The runtime API token must never be sent to the browser or returned by the Studio.

## Additive status-only adapter

The Studio now adds an authenticated GET /v1/runtime/status route. It proxies only the fixed GET /v1/status path from a server-configured runtime origin.

Configuration is opt-in and requires all three server-side variables:

- UNEXPECTED_RUNTIME_BASE_URL — HTTPS origin only.
- UNEXPECTED_RUNTIME_API_TOKEN — at least 32 printable ASCII characters.
- UNEXPECTED_RUNTIME_ALLOWED_HOSTS — comma-separated exact hostnames; wildcard entries do not match.

The adapter rejects non-HTTPS URLs, IP literals, credentials, paths, queries, fragments, non-default ports and hostnames absent from the exact allowlist. It never accepts a URL from the browser, follows redirects, retries a request, logs the token or forwards an upstream response body. It uses a five-second default timeout, a 16 KiB response limit and a strict field projection. Only status metadata is returned.

When endpoint or token configuration is absent, the route returns not_configured without making a network request. Misconfiguration, upstream authentication failure, malformed output, timeout and degraded health remain distinct statuses.

This route is intentionally read-only. It does not proxy /v1/invoke, /v1/lifecycle, /v1/approval-intents, MCP, provider tests, Creator Studio writes or any other state-changing endpoint. The route is not yet wired into the Phone PWA UI.

## Architecture and integration blockers

The Python runtime README still describes the previous Node Studio/PWA as excluded, while the Studio V8 repository integration map and current owner requirement explicitly preserve those clients. The latter is the governing integration direction: one uneXpected-owned control plane with preserved client surfaces, not a replacement product.

The current mission also names Mastra and DBOS Transact TypeScript as preferred candidates for the Node/TypeScript ecosystem. The existing Python runtime is a substantial owned implementation, but its existence does not by itself satisfy the requested TypeScript architecture. This status adapter deliberately does not choose between those architectures or install another coordinator. Before any write-path integration, create a reviewed architecture decision comparing:
- retaining the existing Python Coordinator and its proven SQLite/PostgreSQL state adapters;
- a staged TypeScript runtime using Mastra and one durable workflow engine such as DBOS;
- compatibility, role/Skill preservation, state ownership, migration/rollback, deployment and zero-cost operation.

Do not run two coordinators for the same task or create competing task, approval, memory or audit stores. Select at most one primary agent runtime and one durable workflow engine.

## Verification boundary

The new client tests use injected fake HTTP responses. The route smoke test starts the local Node server with runtime configuration explicitly empty and proves that no remote request is attempted, the new route requires the existing Studio bearer token, and the legacy /orchestrate authorization boundary remains unchanged.

No hosted runtime endpoint, transport, DNS target or credential was verified in this increment. Do not set production environment variables, connect the services, invoke tasks or enable write routes until the endpoint and authentication have been independently verified.

No provider API, Neon write, Render setting, production service, user record, browser IndexedDB store, deployment or DNS was touched.
