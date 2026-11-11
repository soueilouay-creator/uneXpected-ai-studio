# V8 security threat model

## Assets to protect

- Provider keys, app access tokens, OAuth tokens and database credentials.
- User conversations, projects, local PWA records, memories, settings and backups.
- Repository source, build artifacts, branches, workflow state and audit records.
- External application accounts and any data reachable through their tools.
- Financial limits, approval decisions and actions that affect external systems.

## Trust boundaries

1. User/PWA ↔ uneXpected HTTP service.
2. uneXpected control plane ↔ model provider APIs.
3. Model output ↔ tool executor.
4. MCP/connector server ↔ external services.
5. Agent sandbox ↔ Git repository and host runtime.
6. Workflow service ↔ PostgreSQL.
7. New V8 modules ↔ legacy application and local IndexedDB.

Never treat model output, repository files, issue descriptions, web pages, MCP results or tool output as trusted instructions.

## Main threats and required controls

| Threat | Required controls |
|---|---|
| Prompt injection from web/repository/tool content | Separate trusted system policy from untrusted data; quote/label retrieved content; do not allow retrieved instructions to widen permissions. |
| Credential leakage | Server-side secret storage; redact logs/traces/errors; no tokens in browser persistence, backups, prompts or Git. |
| Unauthorized tool execution | Per-tool schemas and scopes, identity checks, risk classification, explicit approval for protected writes, server-side policy enforcement. |
| Duplicate external side effects after retry | Idempotency keys, durable action ledger, inspect destination state before retrying uncertain writes. |
| SSRF / malicious URLs | URL allowlists, DNS/IP validation, block private/link-local/metadata ranges, redirects revalidated, bounded response sizes/timeouts. |
| Path traversal / arbitrary code execution | Ephemeral sandbox, path normalization, restricted file roots, allowlisted commands, no host mounts or privileged container. |
| Cross-user/project context leakage | Tenant/project scoping in every query and memory lookup; authorization checks before retrieval. |
| Memory poisoning or stale facts | Record provenance/time/confidence; distinguish user-confirmed facts from inferred/tool-derived observations; support correction and audit. |
| Provider outage or bad fallback | Health state based on real test outcomes, bounded fallback, provider/model provenance, budget ceilings, no simulated outputs. |
| Supply-chain/dependency compromise | Pinned versions, lockfiles, license/SBOM review, vulnerability scan, build provenance and rollback. |
| Data loss during migration | Read-only inventory, export/backup, additive migrations, dual-read compatibility and post-migration row-count/read-back checks. |

## Action classification

- Read-only: may run within granted user/project scope and safe rate limits.
- Reversible write: may prepare a draft, branch or isolated artifact; record the change and rollback path.
- Protected write: publish, send, spend, delete, change permissions, deploy production or alter customer data. Require explicit human approval at runtime, even when a broad project mandate exists.

No broad agent role should inherit global access simply because another role needs one capability.

## Audit fields

At minimum: run ID, user/project scope, actor role, tool name, target, sanitized argument summary, permission decision, approval reference, idempotency key, start/end time, status, result reference and error category. Never store secrets or raw sensitive payloads without a documented need.

## Security acceptance tests

- Tool calls outside an agent's scope are rejected.
- Untrusted text cannot change system policy or enable a tool.
- Secret markers never appear in logs, traces, browser storage, backups or error responses.
- Protected operations fail closed without a valid approval.
- Duplicate retry requests do not duplicate external actions.
- SSRF targets and path traversal inputs are blocked.
- Sandbox code cannot access host secrets or arbitrary host files.
- Data migration preserves all existing records and remains rollback-capable.
