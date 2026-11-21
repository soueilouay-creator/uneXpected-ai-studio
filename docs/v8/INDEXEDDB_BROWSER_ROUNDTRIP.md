# Real-browser IndexedDB backup/restore verification

**Date:** 2026-11-21  
**Feature branch:** \`upgrade/v8-foundation\`  
**Pre-test rollback point:** \`backup/v8-foundation-pre-browser-idb-docs-20261121\` at \`1fcc3afd77d3fded37c5175a7980f650bb8a1436\`

## Purpose

Run the existing archived mobile database and backup modules inside a real headless Chromium browser. This complements, but does not replace, the isolated Node IndexedDB-compatible test double.

## Implementation

- \`test/indexeddb-browser-fixture.html\` imports the restored \`/mobile/db.js\` and \`/mobile/core.js\` modules in the browser.
- \`test/indexeddb-browser-roundtrip.test.mjs\` launches the runner's preinstalled Chrome with a newly created temporary profile and a random DevTools port.
- Two local HTTP servers bind different ephemeral ports. The source and restore target therefore have different browser origins and separate IndexedDB namespaces.
- The Node test uses Chrome DevTools Protocol through Node 22's built-in WebSocket; no browser automation package or npm dependency is installed.
- The test server exposes only the fixture page and the two required module paths. It binds to loopback and rejects all other paths.
- Chrome background networking and component updates are disabled. The test only loads local fixture files.

## Assertions

- The actual database opens as \`unexpected-personal-workspace\`, schema version 2.
- Synthetic project, conversation, memory, improvement and settings records are written to the source origin.
- The real backup creator emits \`unexpected-local-backup\` version 2; the parser accepts both v2 and legacy v1 and rejects malformed collection types.
- The backup is copied through JSON serialization and restored only into the second disposable origin.
- Projects, conversations, memories and improvements are read back and compared with the source fixture.
- Settings are compared against the backup's existing safe-settings allowlist; non-allowlisted fields are not assumed to survive export/import.
- The restored target is re-exported and compared with the parsed backup.
- Disposable sentinel rows are absent from the target after replacement restore.
- The source origin is re-read and remains byte-for-value equivalent at the record-object level.

## CI evidence

On tested code head \`1fcc3afd77d3fded37c5175a7980f650bb8a1436\`:

- Mobile push [44858792009](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/44858792009): **32/32 existing tests passed**, **1/1 real Chromium browser test passed**, syntax checks and Docker image build passed.
- Mobile pull request [44858797372](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/44858797372): **32/32 existing tests passed**, **1/1 real Chromium browser test passed**, syntax checks and Docker image build passed.
- TAAFT pull request [44858797299](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/44858797299): **3/3 passed**.
- The push-run browser log reports Google Chrome **157.0.8103.78** and the browser test completed with exit code 0.

The first two browser test attempts failed because the test initially treated the settings export as an array and then compared raw settings against the backup's sanitized allowlist. Those assumptions were corrected after inspecting the actual module behavior. The final exact-head push and pull-request runs are green. The failures are retained in the CI history.

## Preservation boundary

- No existing browser profile was opened.
- No live IndexedDB database, user backup, project, conversation, memory or setting was read or modified.
- The temporary Chrome profile and both origins contain synthetic fixture data only and are removed at test completion.
- The existing \`LocalStore.importAll\` replacement semantics are exercised only in the disposable target origin. Do not use it for automatic synchronization or a live migration.
- This is a browser-engine fixture test, not a rehearsal against the owner's real backup or production PWA profile.

## Cost and limitations

- No package, service or infrastructure was added.
- The test uses Chrome already installed on the GitHub-hosted Ubuntu runner; no browser download was added.
- GitHub Actions runner usage occurred; account-level billing/quota is not exposed.
- A user-directed backup export and independent read-back is still required before any live data migration.
