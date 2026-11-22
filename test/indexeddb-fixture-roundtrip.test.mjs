import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const arrayStores = ['projects', 'conversations', 'memories', 'improvements'];
const allStores = [...arrayStores, 'settings'];

function clone(value) {
  return value === undefined ? undefined : structuredClone(value);
}

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
                        const event = {
                          target: result,
                          defaultPrevented: false,
                          propagationStopped: false,
                          preventDefault() { this.defaultPrevented = true; },
                          stopPropagation() { this.propagationStopped = true; }
                        };
                        result.onerror?.(event);
                        if (!event.defaultPrevented) {
                          tx.error = error;
                          if (!event.propagationStopped) tx.onerror?.({ target: tx });
                        }
                      } finally {
                        pending -= 1;
                        if (pending === 0 && !completionQueued && !completed) {
                          completionQueued = true;
                          queueMicrotask(() => {
                            completionQueued = false;
                            if (pending === 0 && !completed) {
                              completed = true;
                              if (tx.error) tx.onabort?.({ target: tx });
                              else tx.oncomplete?.({ target: tx });
                            }
                          });
                        }
                      }
                    });
                    return result;
                  };

                  return {
                    keyPath: store.keyPath,
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
                    add(record) {
                      return schedule(() => {
                        if (!record || typeof record !== 'object' || !(store.keyPath in record)) {
                          throw new Error('Record requires keyPath ' + store.keyPath);
                        }
                        const key = record[store.keyPath];
                        if (store.rows.has(key)) {
                          const error = new Error('A record with this key already exists.');
                          error.name = 'ConstraintError';
                          throw error;
                        }
                        store.rows.set(key, clone(record));
                        return key;
                      });
                    },
                    delete(key) {
                      return schedule(() => store.rows.delete(key));
                    },
                    clear() {
                      throw new Error('Store clearing is prohibited in the additive fixture');
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

function requestValue(request) {
  return new Promise((resolveRequest, rejectRequest) => {
    request.onsuccess = () => resolveRequest(request.result);
    request.onerror = () => rejectRequest(request.error || new Error('IndexedDB request failed'));
  });
}

async function readStoreRecord(database, storeName, id) {
  const transaction = database.transaction(storeName, 'readonly');
  return await requestValue(transaction.objectStore(storeName).get(id));
}

test('copied IndexedDB backup merges additively without clearing or overwriting collisions', async () => {
  const mobileRoot = resolve(root, 'mobile');
  const [{ openDatabase, LocalStore }, { createBackupPayload, parseBackupPayload }, { mergeBackupAdditively }] = await Promise.all([
    importModuleFromFile(resolve(mobileRoot, 'db.js')),
    importModuleFromFile(resolve(mobileRoot, 'core.js')),
    importModuleFromFile(resolve(root, 'mobile-release/merge.js'))
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

    installIndexedDB(createIndexedDBFactory());
    targetDatabase = await openDatabase();
    const targetStore = new LocalStore(targetDatabase);

    await targetStore.put('projects', {
      id: 'fixture-project-001',
      name: 'Target-owned collision record',
      marker: 'must-not-be-overwritten'
    });
    await targetStore.put('projects', { id: 'fixture-sentinel-projects', marker: 'preserve-target-row' });
    await targetStore.put('conversations', { id: 'fixture-sentinel-conversations', marker: 'preserve-target-row' });
    await targetStore.put('memories', { id: 'fixture-sentinel-memories', marker: 'preserve-target-row' });
    await targetStore.put('improvements', { id: 'fixture-sentinel-improvements', marker: 'preserve-target-row' });
    await targetStore.put('settings', { id: 'fixture-sentinel-settings', marker: 'preserve-target-row' });

    await assert.rejects(
      mergeBackupAdditively(targetDatabase, { ...parsed, projects: [...parsed.projects, structuredClone(parsed.projects[0])] }),
      /duplicate ID in projects/
    );
    const mergeResult = await mergeBackupAdditively(targetDatabase, parsed);
    const targetAfter = await targetStore.exportAll();
    const targetBackup = createBackupPayload(targetAfter, '2026-11-20T03:00:00.000Z');

    assert.equal(mergeResult.ok, true, 'inserted records pass read-back verification');
    assert.equal(mergeResult.committed, true);
    assert.deepEqual(mergeResult.collisions, [{ store: 'projects', id: 'fixture-project-001' }], 'ID collisions are reported and skipped');
    assert.deepEqual(mergeResult.verificationFailures, []);
    assert.deepEqual(
      mergeResult.inserted.map(item => item.store + ':' + item.id).sort(),
      ['conversations:fixture-conversation-001', 'improvements:fixture-improvement-001', 'memories:fixture-memory-001', 'settings:main'].sort()
    );
    assert.equal(
      targetAfter.projects.find(row => row.id === 'fixture-project-001').name,
      'Target-owned collision record',
      'existing colliding target row must not be overwritten'
    );
    for (const storeName of allStores) {
      if (storeName === 'settings') {
        const sentinel = await readStoreRecord(targetDatabase, 'settings', 'fixture-sentinel-settings');
        assert.equal(sentinel.marker, 'preserve-target-row');
      } else {
        assert.ok(
          targetAfter[storeName].some(row => row.id === 'fixture-sentinel-' + storeName),
          'existing ' + storeName + ' sentinel must remain'
        );
      }
    }
    assert.deepEqual(targetAfter.conversations.filter(row => row.id === 'fixture-conversation-001'), parsed.conversations);
    assert.deepEqual(targetAfter.memories.filter(row => row.id === 'fixture-memory-001'), parsed.memories);
    assert.deepEqual(targetAfter.improvements.filter(row => row.id === 'fixture-improvement-001'), parsed.improvements);
    assert.deepEqual(targetBackup.data.settings, parsed.settings, 'settings are restored only when the target key is absent');

    const sourceAfter = await sourceStore.exportAll();
    assert.deepEqual(sourceAfter, sourceBefore, 'additive restore never mutates the source fixture');
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
