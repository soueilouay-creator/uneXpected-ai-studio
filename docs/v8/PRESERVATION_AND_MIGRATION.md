# Preservation and migration protocol

## Scope

This protocol protects all existing uneXpected data and behavior while V8 is built additively. It applies to the Git repository, deployed service, browser PWA, local IndexedDB, files, projects, chats, memories, settings, backups, integrations, model history and external tool connections.

## Repository preservation

- Keep all existing branches and commit history.
- Work on `upgrade/v8-*` branches; never force-push.
- Do not delete, rename or overwrite existing files as a cleanup step.
- Before editing any existing file, inspect its exact current content and preserve a rollback point.
- Keep the existing `source.tar.gz.b64` and `mobile-assets.parts/` until a complete mapping, reproducible replacement build and rollback have been independently verified. Do not assume these are redundant.
- Preserve every current API and mobile route; use versioned/additive endpoints for new capabilities.

## Browser/local data

- Preserve current IndexedDB database name, version, object stores, keys and record formats.
- No `clear()`, database deletion, store deletion or destructive schema upgrade.
- Before a migration, export a backup and record counts/key ranges by store.
- Prefer adding a new store or optional versioned fields; keep old readers working.
- Test on a copied fixture with old-version records, then verify round-trip import/export and read-back equality.
- Do not upload local conversations or memories to external memory services by default. Require a documented purpose and explicit user consent for any new data flow.

## Server-side data

- Inventory existing storage and persistence before introducing PostgreSQL schemas.
- Use additive numbered migrations only. Avoid destructive DDL, data rewrites and in-place field semantic changes.
- Include migration checksum, pre/post row counts, sample read-back and rollback/restore plan.
- Ensure workflow step side effects are idempotent and checkpoint state is durable.
- A database being configured is not proof of backups, encryption, recovery or operational availability.

## Release procedure

1. Inspect current state and record source revision.
2. Create a backup or known-good branch/commit.
3. Apply additive changes on an upgrade branch.
4. Run existing and new tests, including old-data fixtures.
5. Verify UI, APIs, import/export, current provider routes and TAAFT allowlist.
6. Rehearse rollback in an isolated environment.
7. Produce a release candidate and release notes.
8. Deploy only after separate release authorization and verified preflight.

## Completion evidence

For every migration or data-affecting change, record backup artifact reference, test fixture, before/after counts, read-back results, migration ID, source commit and rollback evidence. If any of these are missing, mark the migration NOT VERIFIED and do not claim completion.
