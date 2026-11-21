# Real-browser IndexedDB backup/restore verification

**Date:** 2026-11-21  
**Feature branch:** `upgrade/v8-foundation`  
**Rollback before cleanup fix:** `backup/v8-foundation-pre-chrome-cleanup-fix-20261121` at `c182b0eb40de233bbb6ebffa049cc46a2680e86b`  
**Pre-documentation rollback:** `backup/v8-foundation-pre-browser-final-docs-20261121` at `a8159cd9760a5c6be086acde8f161c0c3e605c66`

## Purpose

Run the existing archived mobile database and backup modules inside a real headless Chromium browser. This complements, but does not replace, the isolated Node IndexedDB-compatible test double.

## Implementation

- `test/indexeddb-browser-fixture.html` imports the restored `/mobile/db.js` and `/mobile/core.js` modules in the browser.
- `test/indexeddb-browser-roundtrip.test.mjs` launches the runner's preinstalled Chrome with a newly created temporary profile and a random DevTools port.
- Two local HTTP servers bind different ephemeral ports. The source and restore target therefore have different browser origins and separate IndexedDB namespaces.
- The Node test uses Chrome DevTools Protocol through Node 22's built-in WebSocket; no browser automation package or npm dependency is installed.
- The test server exposes only the fixture page and the two required module paths. It binds to loopback and rejects all other paths.
- Chrome background networking and component updates are disabled. The test only loads local fixture files.

## Assertions

- The actual database opens as `unexpected-personal-workspace`, schema version 2.
- Synthetic project, conversation, memory, improvement and settings records are written to the source origin.
- The real backup creator emits `unexpected-local-backup` version 2; the parser accepts both v2 and legacy v1 and rejects malformed collection types.
- The backup is copied through JSON serialization and restored only into the second disposable origin.
- Projects, conversations, memories and improvements are read back and compared with the source fixture.
- Settings are compared against the backup's existing safe-settings allowlist; non-allowlisted fields are not assumed to survive export/import.
- The restored target is re-exported and compared with the parsed backup.
- Disposable sentinel rows are absent from the target after replacement restore.
- The source origin is re-read and remains byte-for-value equivalent at the record-object level.

## CI evidence

On final additive-merge test head `1f78f17d9a5242b846779a0acec29ef8c292559b`:

- Mobile push [44859674020](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/44859674020): **32/32 existing tests passed**, **1/1 real Chromium browser test passed**, syntax checks and Docker image build passed.
- Mobile pull request [44859678339](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/44859678339): **32/32 existing tests passed**, **1/1 real Chromium browser test passed**, syntax checks and Docker image build passed.
- TAAFT pull request [44859678349](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/44859678349): **3/3 passed**.
- The push-run browser log reports Google Chrome **157.0.8103.50** and the browser test completed with exit code 0.

Initial browser attempts exposed two incorrect test assumptions: settings export is a single object, and backup restore applies the existing safe-settings allowlist. A later documentation-head run exposed a cleanup race: the test removed Chrome's temporary profile before the browser process had fully exited (`ENOTEMPTY`). The runner now waits for SIGTERM, escalates to SIGKILL only after a bounded timeout, waits for process exit, then retries temporary-profile cleanup. These test-harness defects were corrected without changing application code or user data. Earlier failed runs remain visible in CI: [44858440755](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/44858440755), [44858565520](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/44858565520), [44858683456](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/44858683456), [44858987373](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/44858987373), and [44858990032](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/44858990032). A later additive-merge refactor briefly failed because an async settings read was placed inside a synchronous array-map callback; the final fixture now reads sentinels in an explicit async loop. The failure is retained in [44859586407](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/44859586407), and the final exact-head push and pull-request runs are green.

## Preservation boundary

- No existing browser profile was opened.
- No live IndexedDB database, user backup, project, conversation, memory or setting was read or modified.
- The temporary Chrome profile and both origins contain synthetic fixture data only and are removed at test completion.
- The final fixture uses only read-only key checks and insert-only puts. It reports a same-ID collision without overwriting it, retains unrelated sentinel rows in every store and verifies source read-back. No `LocalStore.importAll`, `clearAll` or object-store `clear` is invoked. The existing production `LocalStore.importAll` remains destructive and is not an approved live-sync path.
- This is a browser-engine fixture test, not a rehearsal against the owner's real backup or production PWA profile.

## Cost and limitations

- No package, service or infrastructure was added.
- The test uses Chrome already installed on the GitHub-hosted Ubuntu runner; no browser download was added.
- GitHub Actions runner usage occurred; account-level billing/quota is not exposed.
- A user-directed backup export and independent read-back is still required before any live data migration.
