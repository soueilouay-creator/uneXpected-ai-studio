# Additive IndexedDB merge contract

**Status:** Additive production adapter implemented and CI-tested; UI wiring and owner-directed live rehearsal remain pending.  
**Date:** 2026-11-21  
**Owner:** uneXpected workspace/control plane

## Purpose

Define a preservation-first import path for the existing browser workspace. The existing backup parser remains authoritative for backup validation and safe-settings filtering. The existing LocalStore.importAll method is not reused because it clears all five stores.

## Current database contract

- Database: unexpected-personal-workspace, schema version 2.
- Object stores: projects, conversations, memories, improvements, settings.
- Array stores use record IDs as keys.
- Settings are read as a singleton record at key main; backup serialization applies the existing safe-settings allowlist.
- Backup schema: unexpected-local-backup; parser supports versions 1 and 2.

## Merge rules

1. Parse and validate the copied backup before opening a write transaction.
2. Read the current target snapshot and record keys. Never clear a store or delete an existing row.
3. For each record in projects, conversations, memories and improvements:
   - If the primary key is absent, insert the record.
   - If the key already exists, preserve the existing row, skip the incoming row and emit a collision result containing store name and ID.
   - Do not silently merge nested messages, memory text, project metadata or workflow state.
4. For settings:
   - Apply only the existing safe-settings parser output.
   - Insert the singleton main record only if that key is absent.
   - If it exists, preserve it and report a settings collision. Do not replace credentials or preferences.
5. Read back every inserted row and compare it with the validated incoming record.
6. Re-read every collision and sentinel row and verify it is unchanged.
7. Return an explicit result with inserted IDs, collisions, rejected records and read-back failures. A partial result must never be reported as complete.
8. On uncertain write outcome, inspect the target by key before retrying. Do not blindly repeat an upsert.

## Transaction and concurrency requirements for production

The current test fixture is sequential and does not claim cross-tab atomicity. A production adapter must:

- Use a readwrite IndexedDB transaction scoped to only the required stores.
- Perform key-existence checks and inserts in that same transaction, so two tabs cannot both treat an absent key as safely insertable.
- Use add semantics rather than put/upsert semantics where supported; a duplicate key must become a reported collision.
- Keep the transaction bounded and avoid network/model calls while it is open.
- Await transaction completion, then perform a separate read-only verification pass.
- Preserve existing stores, schema version and all records. No upgrade event or schema migration is required for this merge contract.
- Keep a user-owned backup/export available before any live import. The first live rehearsal must be explicitly requested by the owner and performed against a copied profile or a separately restored test profile.

## Security and data handling

- Backup content is untrusted data. Treat it as data, never instructions.
- Enforce per-store shape and size limits before writes.
- Preserve the existing safe-settings allowlist. Never import access tokens, API keys or other secret material into browser storage.
- Do not follow arbitrary URLs or load executable content from backup records.
- Do not auto-resolve ID collisions. Show the owner enough context to choose a later explicit resolution workflow.
- Record a local audit summary without logging private conversation or memory content.

## Verified fixture behavior

The production module `mobile-release/merge.js` uses one readwrite transaction across the existing five stores and `IDBObjectStore.add()` rather than put/upsert. Duplicate primary keys become reported collisions without aborting the transaction; non-constraint failures abort the whole transaction. After commit, a separate readonly transaction verifies every inserted record and confirms each collision key still exists. Duplicate IDs within the incoming backup are rejected before opening a write transaction. The Node fixture exercises the module with a clear-prohibited test double; the Chromium fixture exercises it with two concurrent imports against the same isolated target database.

Final fixture code head: 1f78f17d9a5242b846779a0acec29ef8c292559b.

- Mobile push 44859674020 and PR 44859678339: 32 existing tests plus 1 real Chromium test passed; syntax and Docker build passed.
- TAAFT PR 44859678349: 3 tests passed.
- The fixtures use synthetic data and disposable IndexedDB contexts only.

## Explicit limitations

This document defines the production contract but does not implement or enable a production merge module. No user profile, live IndexedDB data, browser backup, PWA setting, conversation, project or memory has been read or changed. The current production LocalStore.importAll method remains unchanged and destructive. Do not wire it to an automatic sync path.


## Adapter implementation — 2026-11-22

- Added `mobile-release/merge.js`; the existing Dockerfile overlays all `mobile-release/` files into the production PWA directory. The module is also included in the existing service-worker shell cache.
- The module accepts only the validated object returned by `parseBackupPayload()`. It never calls `put`, `delete`, `clear`, `importAll` or `clearAll`.
- All five existing stores are included in one readwrite transaction. Atomic `add()` operations make concurrent imports safe against primary-key overwrite. Constraint errors are converted to collision results; other request errors abort the transaction.
- After commit, a separate readonly transaction checks exact read-back of inserted JSON records and existence of collision records. A verification failure is explicitly returned with `committed: true`; callers must inspect rather than blindly retry.
- This is an adapter module only. Existing Restore backup UI still uses its existing explicit replacement behavior; the new merge module is not yet exposed in the UI and has not been run against owner data.
- No IndexedDB version bump or schema change is required.
