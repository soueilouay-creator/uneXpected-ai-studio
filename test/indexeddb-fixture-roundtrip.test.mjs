import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function clone(value) {
  return value === undefined ? undefined : structuredClone(value);
}

// A deliberately small, isolated IndexedDB-compatible test double. Each factory
// owns its own database map, so the source and restore target cannot share state.
function createIndexedDBFactory() {
  const databases = new Map();

  return {
    open(name, version) {
      const request = {
        result: undefined,
        error: null,
        onupgradeneeded: null,
        onsuccess: null,
        onerror: null,
        onblocked: null
      };

      queueMicrotask(() => {
        try {
          let state = databases.get(name);
          const needsUpgrade = !state || state.version < version;
          if (!state) {
            state = { version, stores: new Map() };
            databases.set(name, state);
          }

          const database = {
            objectStoreNames: {
              contains(storeName) {
                return state.stores.has(storeName);
              }
            },
            createObjectStore(storeName, options = {}) {
              if (state.stores.has(storeName)) throw new Error('Object store already exists: ' + storeName);
              state.stores.set(storeName, {
                keyPath: options.keyPath || 'id',
                rows: new Map()
              });
              return { name: storeName };
            },
            transaction(storeNames, mode = 'readonly') {
              const allowed = new Set(Array.isArray(storeNames) ? storeNames : [storeNames]);
              let pending = 0;
              let completionQueued = false;
              let completed = false;

              const tx = {
                error: null,
                mode,
                oncomplete: null,
                onerror: null,
                onabort: null,
                objectStore(storeName) {
                  if (!allowed.has(storeName)) throw new Error('Store not in transaction: ' + storeName);
                  const store = state.stores.get(storeName);
                  if (!store) throw new Error('Unknown object store: ' + storeName);

                  const schedule = operation => {
                    const result = { result: undefined, error: null, onsuccess: null, onerror: null };
                    pending += 1;
                    queueMicrotask(() => {
                      try {
                        result.result = operation();
                        result.onsuccess?.({ target: result });
                      } catch (error) {
                        result.error = error;
                        tx.error = error;
                        result.onerror?.({ target: result });
                        tx.onerror?.({ target: tx });
                      } finally {
                        pending -= 1;
                        if (pending === 0 && !completionQueued && !completed) {
                          completionQueued = true;
                          queueMicrotask(() => {
                            completionQueued = false;
                            if (pending === 0 && !completed) {
                              completed = true;
                              tx.oncomplete?.({ target: tx });
                            }
                          });
                        }
                      }
                    });
                    return result;
                  };

                  return {
                    get(key) {
                      return schedule(() => clone(store.rows.get(key)));
                    },
                    getAll() {
                      return schedule(() => [...store.rows.values()].map(clone));
                    },
                    put(record) {
                      return schedule(() => {
                        if (!record || typeof record !== 'object' || !(store.keyPath in record)) {
                          throw new Error('Record requires keyPath ' + store.keyPath);
                        }
                        const key = record[store.keyPath];
                        store.rows.set(key, clone(record));
                        return key;
                      });
                    },
                    delete(key) {
                      return schedule(() => store.rows.delete(key));
                    },
                    clear() {
                      return schedule(() => store.rows.clear());
                    }
                  };
                }
              };

              return tx;
            },
            close() {}
          };

          request.result = database;
          if (needsUpgrade) request.onupgradeneeded?.({ target: request });
          request.onsuccess?.({ target: request });
        } catch (error) {
          request.error = error;
          request.onerror?.({ target: request });
        }
      });

      return request;
    }
  };
}

async function importModuleFromFile(path) {
  const source = await readFile(path, 'utf8');
  const encoded = Buffer.from(source, 'utf8').toString('base64');
  return import('data:text/javascript;base64,' + encoded);
}

function installIndexedDB(factory) {
  Object.defineProperty(globalThis, 'indexedDB', {
    configurable: true,
    enumerable: true,
    writable: true,
    value: factory
  });
}

test('copied IndexedDB fixture exports, parses and restores with record equality', async () => {
  const mobileRoot = resolve(root, 'mobile');
  const [{ openDatabase, LocalStore }, { createBackupPayload, parseBackupPayload }] = await Promise.all([
    importModuleFromFile(resolve(mobileRoot, 'db.js')),
    importModuleFromFile(resolve(mobileRoot, 'core.js'))
  ]);

  const originalDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'indexedDB');
  let sourceDatabase;
  let targetDatabase;

  try {
    installIndexedDB(createIndexedDBFactory());
    sourceDatabase = await openDatabase();
    const sourceStore = new LocalStore(sourceDatabase);

    await sourceStore.put('projects', {
      id: 'fixture-project-001',
      name: 'Synthetic V8 preservation fixture',
      status: 'active',
      createdAt: '2026-11-20T00:00:00.000Z'
    });
    await sourceStore.put('conversations', {
      id: 'fixture-conversation-001',
      projectId: 'fixture-project-001',
      messages: [{ id: 'message-001', role: 'user', content: 'synthetic fixture only' }]
    });
    await sourceStore.put('memories', {
      id: 'fixture-memory-001',
      content: 'synthetic memory fixture',
      provenance: 'test-only'
    });
    await sourceStore.put('improvements', {
      id: 'fixture-improvement-001',
      status: 'proposed',
      source: 'test-only'
    });
    await sourceStore.put('settings', {
      id: 'main',
      gatewayUrl: '',
      theme: 'dark',
      locale: 'en'
    });

    const sourceBefore = await sourceStore.exportAll();
    const payload = createBackupPayload(sourceBefore, '2026-11-20T03:00:00.000Z');
    const serializedCopy = JSON.parse(JSON.stringify(payload));
    const parsed = parseBackupPayload(serializedCopy);

    assert.equal(payload.schema, 'unexpected-local-backup');
    assert.equal(payload.version, 2);
    assert.deepEqual(parseBackupPayload({ ...serializedCopy, version: 1 }), parsed, 'legacy v1 backups remain readable');
    assert.throws(
      () => parseBackupPayload({ ...serializedCopy, data: { ...serializedCopy.data, projects: {} } }),
      /projects must be an array/
    );

    // Restore only into a second, isolated in-memory database. The sentinel rows
    // demonstrate replacement semantics on a disposable fixture, never user data.
    installIndexedDB(createIndexedDBFactory());
    targetDatabase = await openDatabase();
    const targetStore = new LocalStore(targetDatabase);
    for (const storeName of ['projects', 'conversations', 'memories', 'improvements', 'settings']) {
      await targetStore.put(storeName, { id: 'fixture-sentinel-' + storeName, marker: 'disposable-target-only' });
    }

    await targetStore.importAll(parsed);
    const targetAfter = await targetStore.exportAll();
    const targetBackup = createBackupPayload(targetAfter, '2026-11-20T03:00:00.000Z');

    assert.deepEqual(targetBackup.data, parsed, 'restored fixture is equal after export/read-back');
    assert.ok(!targetAfter.projects.some(row => row.id === 'fixture-sentinel-projects'));
    assert.ok(!targetAfter.conversations.some(row => row.id === 'fixture-sentinel-conversations'));
    assert.ok(!targetAfter.memories.some(row => row.id === 'fixture-sentinel-memories'));
    assert.ok(!targetAfter.improvements.some(row => row.id === 'fixture-sentinel-improvements'));

    const sourceAfter = await sourceStore.exportAll();
    assert.deepEqual(sourceAfter, sourceBefore, 'restoring the copy does not mutate the source fixture');
    assert.equal(sourceAfter.projects.length, 1);
    assert.equal(sourceAfter.conversations.length, 1);
    assert.equal(sourceAfter.memories.length, 1);
    assert.equal(sourceAfter.improvements.length, 1);
  } finally {
    sourceDatabase?.close();
    targetDatabase?.close();
    if (originalDescriptor) Object.defineProperty(globalThis, 'indexedDB', originalDescriptor);
    else delete globalThis.indexedDB;
  }
});
