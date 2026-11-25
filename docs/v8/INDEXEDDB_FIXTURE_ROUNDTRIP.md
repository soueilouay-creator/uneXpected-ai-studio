# Isolated IndexedDB backup/restore fixture harness

**Date:** 2026-11-20  
**Feature branch at start:** `upgrade/v8-foundation`  
**Starting head:** `00bab6c39fe5bd61964166448fa34d2a033d63a1`  
**Rollback branch:** `backup/v8-foundation-pre-idb-fixture-20261120`

## Purpose

Exercise the actual archive-restored `mobile/db.js` and `mobile/core.js` modules using synthetic records and two isolated in-memory IndexedDB-compatible factories. This is a CI compatibility harness, not a browser-profile test and not a migration of live user data.

## Covered behavior

- Opens the existing database contract and exercises all five existing stores.
- Seeds synthetic project, conversation, memory, improvement and settings records.
- Runs the real `createBackupPayload` and `parseBackupPayload` functions from the restored source modules.
- Serializes and parses a copied version-2 backup; verifies legacy version-1 parsing and rejects malformed collection types.
- Copies records into a second disposable target database using insert-only `LocalStore.put` calls after read-only primary-key checks.
- Reports and skips an ID collision; verifies that the existing target-owned row is not overwritten.
- Verifies that unrelated target sentinel rows remain in every store, including the non-singleton settings record.
- Verifies the source fixture remains equivalent at the record-object level after the target restore.

## Safety boundary

The test replaces the global `indexedDB` reference only inside the Node test process with an in-memory adapter. Source and target factories own separate maps. All records are synthetic and prefixed with `fixture-`; no browser profile, live IndexedDB database, user backup, Neon branch or production service is accessed.

The target is seeded with synthetic sentinel records and one same-ID collision. The fixture checks the primary key with read-only requests, inserts only absent records, reports the collision and leaves all pre-existing target rows unchanged. The test double throws if any code attempts a store clear. Neither LocalStore.importAll, clearAll nor an object-store clear operation is invoked. The existing production importAll implementation remains unchanged and destructive across all five stores; it is not an approved sync/merge path.

## Test-double limitation

The adapter implements only the IndexedDB surface used by the existing `openDatabase` and `LocalStore` methods. It is not a complete browser IndexedDB implementation and does not prove browser-engine transaction scheduling, quota behavior, multi-tab blocking, or crash recovery. A real browser-engine test and a user-directed backup rehearsal remain separate release gates.

## Verification

The test is wired into the existing Node 22 mobile integration workflow after the original mobile-assets archive is restored. It imports the actual restored source files through data URLs, so no package type or runtime module behavior is changed.

Local syntax check: `node --check test/indexeddb-fixture-roundtrip.test.mjs` — exit 0.  
Local harness mechanics check against a temporary contract replica: `node --test` — 1/1 passed. This is preliminary harness validation only; the CI run against the real restored modules is the acceptance evidence.

No dependency, schema migration, application runtime code, UI, API contract or production setting is changed in this increment.


## Current additive-merge verification

On the current fixture implementation, source and target remain separate IndexedDB factories. The target keeps an existing project with the same ID as the backup; the merge reports that collision and does not overwrite it. Existing sentinel rows in projects, conversations, memories, improvements and settings remain. Missing backup records are inserted and read back. The source database remains unchanged.

- The test double's clear operation throws, making any accidental store clearing a test failure.
- The current fixture does not call importAll or clearAll.
- This is a tested contract fixture, not a production merge implementation or UI feature.
