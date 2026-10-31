# uneXpected Local-First Android PWA Implementation Plan

> **For agentic workers:** Use the host's available task-by-task implementation workflow. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver an installable Android home-screen PWA for uneXpected with offline access to its app shell and locally persisted projects, conversations and personal notes, while routing model requests through the existing same-origin gateway.

**Architecture:** Extend the existing Node 22 HTTP service and its bundled `public/` frontend. Keep the current `/orchestrate`, `/test-provider`, `/health` routes and provider secrets on the server. Add a versioned IndexedDB repository in the browser, an explicit export/import backup format, and a service worker that caches only static app assets. Do not couple the PWA to the unresolved v7 executable runtime; agent profiles can be imported as read-only definitions after their provenance is recorded.

**Tech Stack:** Existing Node.js 22 HTTP server; browser-native JavaScript, IndexedDB, Web App Manifest and Service Worker; Node built-in `node:test`; Android Chrome installation over HTTPS.

## Global Constraints

- Work only on `feature/local-first-android-pwa`; never modify `main` or the current Render production deployment as part of implementation.
- Preserve v7.1 source packages, backups, hashes, runtime archives and rollback instructions unchanged.
- Do not add provider keys or the app bearer token to Git, the PWA bundle, service-worker caches, exported backups, analytics or logs.
- Keep all model calls on the existing same-origin authenticated gateway. Do not introduce direct browser-to-provider calls.
- Do not cache `/orchestrate`, `/test-provider`, `/health`, authorization headers, prompts, model responses or other private API traffic in the service worker.
- Make offline status explicit. Offline mode supports reading and editing locally saved data; it does not imply offline model inference.
- Preserve existing API request and response contracts. Add no new production dependencies unless a test or implementation need is demonstrated.
- Treat browser IndexedDB as device-local app data, not encrypted secret storage. The access token is held in memory for the active session and is not exported or silently persisted.
- Any later production release requires a separate reviewed PR, verified CI/build, explicit deployment approval and post-deploy smoke checks.

---

### Task 1: Add a safe installable PWA shell

**Files:**
- Modify: `server.js` — static routes, MIME types and CSP only.
- Modify: `public/index.html` — manifest link, theme metadata, install affordance and app navigation.
- Modify: `public/styles.css` — responsive phone-first layout and offline/connection status.
- Create: `public/manifest.webmanifest` — app identity, standalone display, start URL, theme and icon declarations.
- Create: `public/sw.js` — versioned static-shell cache and navigation fallback.
- Create: `public/icons/icon-192.png`, `public/icons/icon-512.png` — install icons.
- Test: `test/pwa-shell.test.mjs`.

**Interfaces:**
- `GET /app.webmanifest` serves the manifest with `application/manifest+json`.
- `GET /sw.js` serves the service worker from the root scope with `Service-Worker-Allowed: /`.
- Existing `GET /`, `GET /app.js`, `GET /styles.css` remain compatible.
- Service worker precache list contains only `/`, `/app.js`, `/styles.css`, manifest and icon assets.

- [ ] **Step 1: Add failing route and manifest tests.** Assert manifest JSON, correct MIME type, root-scoped worker header, and unchanged existing static routes.
- [ ] **Step 2: Verify red.** Run `node --test test/pwa-shell.test.mjs`; expected: the manifest and service-worker routes return 404 before implementation.
- [ ] **Step 3: Implement shell and static-only cache.** Add explicit routes and MIME types. On service-worker install, precache static assets; on activate, delete only obsolete caches with the app's own prefix; on fetch, use cache-first for same-origin static assets and network-first navigation fallback. Always bypass non-GET, cross-origin and API routes.
- [ ] **Step 4: Verify green.** Run `node --test test/pwa-shell.test.mjs`; expected: all route, header, manifest and cache-policy tests pass.
- [ ] **Step 5: Run existing regression tests.** Run `node --test test/*.test.mjs`; expected: existing TAAFT integration tests and PWA tests pass.
- [ ] **Step 6: Commit.** `git add server.js public test/pwa-shell.test.mjs && git commit -m "feat: add installable PWA shell"`.

### Task 2: Add local projects, conversations and personal memory

**Files:**
- Create: `public/local-store.js` — IndexedDB schema and repository operations.
- Modify: `public/index.html` — Projects, Chat history and Memory views.
- Modify: `public/app.js` — view routing, local-first rendering and chat history integration.
- Modify: `public/styles.css` — list, editor, empty, loading and error states.
- Create: `test/local-store.test.mjs` — deterministic IndexedDB contract tests using a test-only IndexedDB implementation.
- Create: `test/fixtures/local-data-v1.json` — representative valid export fixture.

**Interfaces:**
- Database: `unexpected-local`; object stores: `projects`, `conversations`, `memory`, `meta`.
- Repository API: `listProjects()`, `saveProject(project)`, `deleteProject(id)`; `listConversations()`, `saveConversation(conversation)`, `deleteConversation(id)`; `listMemory()`, `saveMemory(item)`, `deleteMemory(id)`.
- Every record has a stable ID and ISO timestamps. Writes resolve only after the IndexedDB transaction completes; failures surface to the UI without claiming a save.
- Store schema version in IndexedDB's native version number and use additive upgrade logic. Never clear user stores during an upgrade.

- [ ] **Step 1: Add failing repository contract tests.** Cover create/read/update/delete, empty collections, duplicate IDs, transaction abort, and upgrade preserving existing records.
- [ ] **Step 2: Verify red.** Run `node --test test/local-store.test.mjs`; expected: tests fail because the repository module is absent.
- [ ] **Step 3: Implement repository and UI.** Persist project metadata, conversation messages and user-authored memory locally. Integrate successful chat results into conversation history only after the gateway returns. Failed/offline requests remain visible as failed or pending and never become fabricated assistant responses.
- [ ] **Step 4: Verify green.** Run `node --test test/local-store.test.mjs`; expected: CRUD, transaction and migration assertions pass.
- [ ] **Step 5: Run integration checks.** Run `node --test test/*.test.mjs`; use browser tests to verify reload persistence and offline read/edit behavior.
- [ ] **Step 6: Commit.** `git add public test && git commit -m "feat: persist local projects and conversations"`.

### Task 3: Add explicit backup, restore and gateway session handling

**Files:**
- Create: `public/backup.js` — versioned JSON export/import.
- Modify: `public/app.js` — backup controls, import preview, session-only bearer token and gateway error states.
- Modify: `public/index.html` — Settings, Backup/Restore and provider status surfaces.
- Modify: `server.js` — only if a same-origin static route is required; do not change model endpoint semantics.
- Create: `test/backup.test.mjs`.
- Create: `test/gateway-client.test.mjs`.

**Interfaces:**
- Export format: `{ format: "unexpected-local-backup", schemaVersion: 1, exportedAt, projects, conversations, memory }`.
- `exportBackup()` returns the JSON document without session tokens or server secrets.
- `previewBackup(file)` parses and validates the format/version and reports counts before any write.
- `restoreBackup(file, { strategy })` supports explicit `merge` or `replace`; replace requires a second confirmation in the UI. Invalid files are rejected without modifying the database.
- Gateway client sends `Authorization: Bearer <session token>` to same-origin routes only. Token remains in memory and is cleared on reload/sign-out.

- [ ] **Step 1: Add failing backup and gateway tests.** Cover schema/version rejection, token exclusion, malformed JSON, merge conflict behavior, replace confirmation seam, 401, 413, 429, 502, network failure and successful response.
- [ ] **Step 2: Verify red.** Run `node --test test/backup.test.mjs test/gateway-client.test.mjs`; expected: missing module/API assertions fail.
- [ ] **Step 3: Implement backup and gateway UX.** Preview imported data and counts; never silently overwrite. Explain that browser data is local to this browser profile and recommend regular exports. Display provider states as configured/unverified/verified/failed based on actual endpoint responses, not key presence alone.
- [ ] **Step 4: Verify green.** Run the focused tests; expected: export/restore and gateway status assertions pass.
- [ ] **Step 5: Run all tests.** Run `node --test test/*.test.mjs`; expected: all repository tests pass.
- [ ] **Step 6: Commit.** `git add public server.js test && git commit -m "feat: add local backup and secure gateway session"`.

### Task 4: Verify Android installation and release readiness

**Files:**
- Create: `test/browser/pwa.spec.mjs` — browser installability, IndexedDB and offline tests.
- Create: `docs/ANDROID_INSTALL.md` — HTTPS install and recovery instructions.
- Modify: `README.md` — local-first architecture, data boundaries and install instructions.
- Modify: `render.yaml` only if an explicit reviewed configuration change is required; keep existing service identity and secrets unchanged.

**Interfaces:**
- Release candidate is served over HTTPS from a non-production preview deployment or local HTTPS test host.
- Install flow: Android Chrome → menu → Install app / Add to Home screen.
- Acceptance: standalone launch, manifest/icons recognized, app shell loads offline after first visit, local records survive reload and browser restart, offline edits persist, reconnect restores gateway access, backup round-trip restores records, and existing provider endpoints preserve their authentication and response contracts.

- [ ] **Step 1: Add failing browser acceptance tests.** Cover manifest recognition, service-worker registration, standalone metadata, offline shell, persistence, backup/restore and API non-caching.
- [ ] **Step 2: Verify red.** Run the browser suite; expected: installability and offline assertions fail before the completed PWA.
- [ ] **Step 3: Complete compatibility fixes and documentation.** Keep API requests network-only and confirm the worker never caches bearer headers or private responses.
- [ ] **Step 4: Verify green.** Run `node --test test/*.test.mjs` and the browser suite; expected: all tests pass on desktop Chromium and a real Android Chrome device.
- [ ] **Step 5: Verify deployment candidate.** Build the Docker image and deploy only to an isolated preview service. Confirm `/health`, manifest, worker, static assets and existing API auth behavior. Do not deploy to the current production service in this task.
- [ ] **Step 6: Commit.** `git add README.md docs/ANDROID_INSTALL.md test/browser && git commit -m "test: verify Android PWA install and offline workflows"`.

---

## Unresolved release decisions

1. **Backup destination:** the first release uses user-initiated file export/import. Cloud sync is excluded until a separate encryption, account and conflict-resolution design is approved.
2. **Replace restore:** the UI must require explicit confirmation; merge is the safe default. Whether replace should be offered at all can be decided during usability review.
3. **Access-token convenience:** session-only entry is safest for the MVP. Persisting the gateway token in device storage requires a separate secure-storage decision and is not part of this plan.
4. **v7 agent execution:** profiles may be browsed as definitions in the MVP, but executing them requires canonical runtime recovery and verification. No imitation dispatcher will be substituted.
5. **Copilot comparison:** the shared Copilot transcript remains unavailable behind GitHub sign-in. Its actual instructions, architecture, agent definitions and decisions must be imported before claiming a complete cross-conversation comparison.
