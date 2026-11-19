# Preserved source archive integrity and IndexedDB source audit

**Audit date:** 2026-11-19  
**Audited Studio feature head:** `3879795728f53f4b1658792d4c5b56afebc4f17a`  
**Scope:** static source inspection and deterministic CI only; no browser profile or user records were opened.

## Preserved source archive integrity

The existing `source.tar.gz.b64` remains in the repository. Its current encoded size is **14,852 bytes** and its SHA-256 is:

```
02d5451e5ad6c344450a7f16607b92a8967647a75ea8b8a8f56318fffb4d5ee5
```

The Docker build now verifies this digest before decoding or extracting the bundle. The mobile integration workflow verifies the same digest before its restore step. The existing chunked mobile asset archive retains its independent SHA-256 check. The source bundle was not regenerated, replaced or removed.

The archive-backed `mobile/db.js` was extracted by the existing GitHub Actions restore step and had SHA-256:

```
ca326fd8f4b37b4c69bb02acedcdb3468503631eb5d7fc6024d4b9f42a44db30
```

## Existing browser database contract observed

The archived database module declares:

- Database name: `unexpected-personal-workspace`
- IndexedDB version: `2`
- Object stores, each with `keyPath: 'id'`: `projects`, `conversations`, `memories`, `improvements`, `settings`
- Upgrade behavior: create a store only when it is absent. The inspected schema module contains no `deleteObjectStore` or `indexedDB.deleteDatabase` call.

The existing `LocalStore` provides read/list, put and per-record delete operations. Two existing methods have replacement semantics:

- `importAll(data)` opens a read/write transaction, clears all five stores, then writes the imported projects, conversations, memories, improvements and settings.
- `clearAll()` clears all five stores.

These methods are existing product behavior and were **not changed or invoked**. Their destructive semantics are a critical integration boundary: a future V8 sync, import or migration must not call them as a shortcut. Any future restore flow must first export the current data, show the replacement effect, require explicit user intent, and verify read-back. A future synchronization path should use a separate additive/merge adapter rather than reuse `importAll`.

## Existing local backup format

The archived core module declares:

- Schema: `unexpected-local-backup`
- Current version: `2`
- Parser accepts versions `1` and `2`.
- Payload fields: projects, conversations, memories, improvements and filtered/safe settings.
- The existing PWA regression test confirms the gateway bearer token remains in memory and is excluded from browser storage and backups.

This is source-level evidence about the format and code path, not proof that a real user's backup has been exported, imported or read back.

## Verification evidence

On exact feature head `3879795728f53f4b1658792d4c5b56afebc4f17a`:

- Push CI [44447209531](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/44447209531): **31 tests passed, 0 failed, 0 skipped**; source archive SHA verified, archive/mobile restoration succeeded, JavaScript checks passed, authenticated mobile/gateway regression tests passed, and the production Docker image built successfully.
- Pull-request CI [44447213411](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/44447213411): same **31/31** result and successful Docker build.
- The test also reported the database module digest and schema/backup source excerpts from the extracted archive. No package was added.

Earlier audit attempts failed because of malformed test-regex escaping. The issue was corrected; the two exact-head runs above are the successful final verification. The TAAFT suite was green on the preceding feature commit [44446887118](https://github.com/soueilouay-creator/uneXpected-ai-studio/actions/runs/44446887118) (3/3); the final source-archive changes do not touch TAAFT code or its workflow paths, so that result is not represented as an exact-head TAAFT run.

## Preservation boundary and remaining proof

Verified: the old archive is still present, byte-for-byte pinned, and successfully extracted by CI; all five IndexedDB store names and the backup format were inspected from the actual archived source. No user records, browser IndexedDB database, settings, chats, projects, memories, Neon data or production service were accessed or changed.

Still not verified: an actual browser IndexedDB export/import round-trip using a copied fixture, pre/post record counts and equality/read-back; the complete old-record compatibility behavior across an additive schema migration; and the shared Node/Python control-plane contract. Those remain release gates. No schema migration or user-data operation was performed in this increment.
