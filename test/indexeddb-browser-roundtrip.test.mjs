import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const arrayStores = ['projects', 'conversations', 'memories', 'improvements'];
const storeNames = [...arrayStores, 'settings'];

function makeServer() {
  const fixtureHtmlPath = join(root, 'test', 'indexeddb-browser-fixture.html');
  const allowedModules = new Map([
    ['/mobile/db.js', join(root, 'mobile', 'db.js')],
    ['/mobile/core.js', join(root, 'mobile', 'core.js')],
    ['/mobile/merge.js', join(root, 'mobile-release', 'merge.js')]
  ]);

  return createServer(async (request, response) => {
    const pathname = new URL(request.url || '/', 'http://127.0.0.1').pathname;
    if (pathname === '/fixture') {
      try {
        const body = await readFile(fixtureHtmlPath);
        response.writeHead(200, {
          'content-type': 'text/html; charset=utf-8',
          'content-length': body.length,
          'cache-control': 'no-store',
          'x-content-type-options': 'nosniff'
        });
        response.end(body);
      } catch {
        response.writeHead(404);
        response.end('fixture page not found');
      }
      return;
    }

    const file = allowedModules.get(pathname);
    if (!file) {
      response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      response.end('not found');
      return;
    }
    try {
      const body = await readFile(file);
      response.writeHead(200, {
        'content-type': 'text/javascript; charset=utf-8',
        'content-length': body.length,
        'cache-control': 'no-store',
        'x-content-type-options': 'nosniff'
      });
      response.end(body);
    } catch {
      response.writeHead(404);
      response.end('fixture module not found');
    }
  });
}

async function listen(server) {
  await new Promise((resolveListen, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolveListen);
  });
  return server.address().port;
}

function delay(ms) {
  return new Promise(resolveDelay => setTimeout(resolveDelay, ms));
}

async function waitForExit(processHandle, timeoutMs) {
  if (processHandle.exitCode !== null || processHandle.signalCode !== null) return true;
  const exited = new Promise(resolveExit => processHandle.once('exit', () => resolveExit(true)));
  if (processHandle.exitCode !== null || processHandle.signalCode !== null) return true;
  return await Promise.race([exited, delay(timeoutMs).then(() => false)]);
}

async function readDevToolsPort(profileDir, processHandle, startupError) {
  const activePortPath = join(profileDir, 'DevToolsActivePort');
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    if (startupError.error) throw startupError.error;
    if (processHandle.exitCode !== null) {
      throw new Error('Chrome exited before exposing DevTools (exit ' + processHandle.exitCode + ')');
    }
    try {
      const lines = (await readFile(activePortPath, 'utf8')).trim().split(/\r?\n/);
      const port = Number(lines[0]);
      if (Number.isInteger(port) && port > 0) return port;
    } catch {
      // Chrome has not written its ephemeral debugging port yet.
    }
    await delay(50);
  }
  throw new Error('Chrome did not expose DevTools within 15 seconds');
}

async function createPage(port, url) {
  const response = await fetch('http://127.0.0.1:' + port + '/json/new?' + encodeURIComponent(url), {
    method: 'PUT'
  });
  if (!response.ok) throw new Error('Chrome target creation failed: HTTP ' + response.status);
  return await response.json();
}

function connectCdp(webSocketUrl) {
  const socket = new WebSocket(webSocketUrl);
  const pending = new Map();
  let nextId = 0;

  const opened = new Promise((resolveOpen, rejectOpen) => {
    socket.addEventListener('open', resolveOpen, { once: true });
    socket.addEventListener('error', () => rejectOpen(new Error('Chrome DevTools WebSocket failed')), { once: true });
  });

  socket.addEventListener('message', event => {
    let message;
    try {
      message = JSON.parse(String(event.data));
    } catch {
      return;
    }
    if (!message.id || !pending.has(message.id)) return;
    const waiter = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) waiter.reject(new Error(message.error.message || 'Chrome DevTools command failed'));
    else waiter.resolve(message.result || {});
  });

  return {
    socket,
    opened,
    send(method, params = {}) {
      const id = ++nextId;
      return new Promise((resolveCommand, rejectCommand) => {
        pending.set(id, { resolve: resolveCommand, reject: rejectCommand });
        socket.send(JSON.stringify({ id, method, params }));
      });
    },
    close() {
      for (const waiter of pending.values()) waiter.reject(new Error('Chrome DevTools connection closed'));
      pending.clear();
      socket.close();
    }
  };
}

async function evaluate(cdp, expression) {
  const response = await cdp.send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
    userGesture: true
  });
  if (response.exceptionDetails) {
    const details = response.exceptionDetails;
    throw new Error(details.exception?.description || details.text || 'Browser fixture evaluation failed');
  }
  return response.result?.value;
}

async function waitForPageReady(cdp) {
  const deadline = Date.now() + 12000;
  while (Date.now() < deadline) {
    const state = await evaluate(cdp, '({ ready: typeof window.runSourceFixture === "function", error: window.__v8FixtureError || null })');
    if (state?.error) throw new Error(state.error);
    if (state?.ready) return;
    await delay(50);
  }
  throw new Error('Browser fixture modules did not become ready');
}

test('real Chromium IndexedDB backup and restore preserves an isolated source origin', { timeout: 60000 }, async () => {
  const chromeBin = process.env.CHROME_BIN;
  assert.ok(chromeBin, 'CHROME_BIN must point to the preinstalled Chromium/Chrome binary');
  assert.equal(typeof WebSocket, 'function', 'Node 22 WebSocket is required for dependency-free CDP access');

  const sourceServer = makeServer();
  const targetServer = makeServer();
  let chrome;
  let sourceCdp;
  let targetCdp;
  let profileDir;
  const startupError = { error: null };

  try {
    const sourcePort = await listen(sourceServer);
    const targetPort = await listen(targetServer);
    const sourceUrl = 'http://127.0.0.1:' + sourcePort + '/fixture';
    const targetUrl = 'http://127.0.0.1:' + targetPort + '/fixture';

    profileDir = await mkdtemp(join(tmpdir(), 'unexpected-v8-chrome-idb-'));
    chrome = spawn(chromeBin, [
      '--headless=new',
      '--no-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--disable-background-networking',
      '--disable-component-update',
      '--disable-default-apps',
      '--no-first-run',
      '--no-default-browser-check',
      '--remote-allow-origins=*',
      '--remote-debugging-port=0',
      '--user-data-dir=' + profileDir,
      'about:blank'
    ], { stdio: 'ignore' });
    chrome.once('error', error => { startupError.error = error; });

    const devToolsPort = await readDevToolsPort(profileDir, chrome, startupError);
    const sourceTarget = await createPage(devToolsPort, sourceUrl);
    sourceCdp = connectCdp(sourceTarget.webSocketDebuggerUrl);
    await sourceCdp.opened;
    await sourceCdp.send('Runtime.enable');
    await waitForPageReady(sourceCdp);

    const sourceResult = await evaluate(sourceCdp, 'window.runSourceFixture()');
    assert.equal(sourceResult.backup.schema, 'unexpected-local-backup');
    assert.equal(sourceResult.backup.version, 2);
    assert.deepEqual(sourceResult.legacy, sourceResult.parsed, 'legacy version 1 backup remains readable');
    assert.equal(sourceResult.malformedRejected, true, 'malformed collection must be rejected');
    assert.equal(sourceResult.before.projects.length, 1);
    assert.equal(sourceResult.before.conversations.length, 1);
    assert.equal(sourceResult.before.memories.length, 1);
    assert.equal(sourceResult.before.improvements.length, 1);
    assert.equal(sourceResult.before.settings.id, 'main');

    const targetTarget = await createPage(devToolsPort, targetUrl);
    targetCdp = connectCdp(targetTarget.webSocketDebuggerUrl);
    await targetCdp.opened;
    await targetCdp.send('Runtime.enable');
    await waitForPageReady(targetCdp);

    const targetResult = await evaluate(
      targetCdp,
      'window.runTargetFixture(' + JSON.stringify(sourceResult.backup) + ')'
    );
    assert.equal(targetResult.mergeResults.length, 2, 'two concurrent merge attempts are exercised');
    assert.ok(targetResult.mergeResults.every(result => result.ok && result.committed), 'both merge attempts complete and verify');
    const inserted = targetResult.mergeResults.flatMap(result => result.inserted);
    const collisions = targetResult.mergeResults.flatMap(result => result.collisions);
    assert.deepEqual(
      targetResult.mergeResults.map(result => result.inserted.length).sort((a, b) => a - b),
      [0, 4],
      'overlapping readwrite transactions insert each missing record exactly once'
    );
    assert.equal(new Set(inserted.map(item => item.store + ':' + item.id)).size, 4);
    assert.equal(collisions.length, 6, 'the pre-existing collision and second import collisions are reported');
    assert.deepEqual(
      [...new Set(collisions.map(item => item.store + ':' + item.id))].sort(),
      [
        'conversations:browser-fixture-conversation-001',
        'improvements:browser-fixture-improvement-001',
        'memories:browser-fixture-memory-001',
        'projects:browser-fixture-project-001',
        'settings:main'
      ].sort(),
      'all primary-key collisions are reported'
    );
    assert.equal(
      targetResult.after.projects.find(row => row.id === 'browser-fixture-project-001').name,
      'Target-owned collision record',
      'existing target record must not be overwritten'
    );
    for (const storeName of arrayStores.slice(1)) {
      const fixtureId = sourceResult.parsed[storeName][0].id;
      assert.deepEqual(
        targetResult.after[storeName].filter(row => row.id === fixtureId),
        sourceResult.parsed[storeName],
        'new ' + storeName + ' records must be added'
      );
    }
    assert.deepEqual(
      targetResult.settings,
      { id: 'main', ...sourceResult.parsed.settings },
      'settings must be added only when the target key is absent'
    );
    assert.deepEqual(targetResult.reExported.settings, sourceResult.parsed.settings);
    assert.deepEqual(
      targetResult.sentinelIds,
      Object.fromEntries(storeNames.map(name => [name, true])),
      'all pre-existing target sentinel records must remain'
    );

    const sourceAfter = await evaluate(sourceCdp, 'window.readSourceFixture()');
    assert.deepEqual(sourceAfter, sourceResult.before, 'restoring into a separate origin must not mutate the source database');
    assert.equal(sourceResult.schema, 2);
    assert.equal(targetResult.schema, 2);
  } finally {
    sourceCdp?.close();
    targetCdp?.close();
    let chromeStopped = !chrome || !chrome.pid || chrome.exitCode !== null || chrome.signalCode !== null;
    if (!chromeStopped) {
      chrome.kill('SIGTERM');
      chromeStopped = await waitForExit(chrome, 3000);
      if (!chromeStopped) {
        chrome.kill('SIGKILL');
        chromeStopped = await waitForExit(chrome, 5000);
      }
    }
    if (sourceServer.listening) await new Promise(resolveClose => sourceServer.close(resolveClose));
    if (targetServer.listening) await new Promise(resolveClose => targetServer.close(resolveClose));
    if (profileDir && chromeStopped) {
      await delay(200);
      await rm(profileDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
    }
    if (!chromeStopped) throw new Error('Chrome did not exit; temporary profile was left untouched for runner cleanup.');
  }
});
