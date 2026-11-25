const ARRAY_STORES = Object.freeze(['projects', 'conversations', 'memories', 'improvements']);
const ALL_STORES = Object.freeze([...ARRAY_STORES, 'settings']);

function isPlainRecord(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function validateParsedBackup(data) {
  if (!isPlainRecord(data)) throw new TypeError('Parsed backup must be an object.');
  for (const storeName of ARRAY_STORES) {
    if (!Array.isArray(data[storeName])) throw new TypeError(storeName + ' must be an array.');
    const seen = new Set();
    for (const record of data[storeName]) {
      if (!isPlainRecord(record) || typeof record.id !== 'string' || !record.id.trim()) {
        throw new TypeError(storeName + ' records must be objects with a non-empty string ID.');
      }
      if (seen.has(record.id)) throw new TypeError('Backup contains duplicate ID in ' + storeName + ': ' + record.id);
      seen.add(record.id);
    }
  }
  if (!isPlainRecord(data.settings)) throw new TypeError('settings must be a validated settings object.');
}

function sameJsonValue(left, right) {
  if (Object.is(left, right)) return true;
  if (left === null || right === null || typeof left !== 'object' || typeof right !== 'object') return false;
  const leftArray = Array.isArray(left);
  if (leftArray !== Array.isArray(right)) return false;
  if (leftArray) {
    return left.length === right.length && left.every((value, index) => sameJsonValue(value, right[index]));
  }
  const leftKeys = Object.keys(left).sort();
  const rightKeys = Object.keys(right).sort();
  return leftKeys.length === rightKeys.length
    && leftKeys.every((key, index) => key === rightKeys[index] && sameJsonValue(left[key], right[key]));
}

function transactionFinished(transaction, label) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error || new Error(label + ' transaction aborted.'));
    transaction.onerror = () => {
      // Do not prevent the default abort behavior. onabort is the final failure signal.
    };
  });
}

function attachCommittedError(message, cause) {
  const error = new Error(message);
  error.cause = cause;
  error.committed = true;
  return error;
}

/**
 * Insert validated backup records without replacing or deleting target data.
 * The caller must first pass the raw backup through parseBackupPayload().
 * One readwrite transaction and IDBObjectStore.add() provide atomic,
 * collision-safe inserts across the existing five stores.
 */
export async function mergeBackupAdditively(database, parsedBackup) {
  validateParsedBackup(parsedBackup);
  if (!database || !database.objectStoreNames || typeof database.transaction !== 'function') {
    throw new TypeError('An open IndexedDB database is required.');
  }
  for (const storeName of ALL_STORES) {
    if (!database.objectStoreNames.contains(storeName)) {
      throw new Error('Required IndexedDB store is missing: ' + storeName);
    }
  }

  const incoming = [];
  for (const storeName of ARRAY_STORES) {
    for (const record of parsedBackup[storeName]) incoming.push({ store: storeName, id: record.id, record });
  }
  const settingsRecord = { ...parsedBackup.settings, id: 'main' };
  incoming.push({ store: 'settings', id: 'main', record: settingsRecord });

  const inserted = [];
  const collisions = [];
  const writeTransaction = database.transaction(ALL_STORES, 'readwrite');
  const writeFinished = transactionFinished(writeTransaction, 'Additive merge');

  try {
    for (const item of incoming) {
      const request = writeTransaction.objectStore(item.store).add(item.record);
      request.onsuccess = () => inserted.push({ store: item.store, id: item.id });
      request.onerror = event => {
        if (request.error && request.error.name === 'ConstraintError') {
          event.preventDefault();
          event.stopPropagation();
          collisions.push({ store: item.store, id: item.id });
        }
      };
    }
    await writeFinished;
  } catch (cause) {
    const error = new Error('Additive merge transaction failed; no records were committed.');
    error.cause = cause;
    error.committed = false;
    error.inserted = [];
    error.collisions = [];
    throw error;
  }

  const checks = [];
  const verificationTransaction = database.transaction(ALL_STORES, 'readonly');
  const verificationFinished = transactionFinished(verificationTransaction, 'Additive merge read-back');
  for (const item of [...inserted, ...collisions]) {
    const request = verificationTransaction.objectStore(item.store).get(item.id);
    request.onsuccess = () => checks.push({ ...item, value: request.result });
  }

  try {
    await verificationFinished;
  } catch (cause) {
    throw attachCommittedError('Additive merge committed, but read-back could not complete. Inspect before retrying.', cause);
  }

  const verificationFailures = [];
  const checked = new Map(checks.map(item => [item.store + '\u0000' + item.id, item.value]));
  const expected = new Map(incoming.map(item => [item.store + '\u0000' + item.id, item.record]));
  for (const item of inserted) {
    const key = item.store + '\u0000' + item.id;
    if (!checked.has(key) || !sameJsonValue(checked.get(key), expected.get(key))) {
      verificationFailures.push({ ...item, reason: 'inserted-record-read-back-mismatch' });
    }
  }
  for (const item of collisions) {
    const key = item.store + '\u0000' + item.id;
    if (!checked.has(key) || checked.get(key) === undefined) {
      verificationFailures.push({ ...item, reason: 'collision-record-not-found-after-commit' });
    }
  }

  return {
    ok: verificationFailures.length === 0,
    committed: true,
    inserted,
    collisions,
    verificationFailures
  };
}
