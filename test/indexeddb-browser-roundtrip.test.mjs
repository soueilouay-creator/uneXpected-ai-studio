import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const storeNames = ['projects', 'conversations', 'memories', 'improvements', 'settings'];

function makeServer() {
  const fixtureHtmlPath = join(root, 'test', 'indexeddb-browser-fixture.html');
  const allowedModules = new Map([
    ['/mobile/db.js', join(root, 'mobile', 'db.js')],
    ['/mobile/core.js', join(root, 'mobile', 'core.js')]
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
    assert.equal(sourceResult.before.settings.length, 1);

    const targetTarget = await createPage(devToolsPort, targetUrl);
    targetCdp = connectCdp(targetTarget.webSocketDebuggerUrl);
    await targetCdp.opened;
    await targetCdp.send('Runtime.enable');
    await waitForPageReady(targetCdp);

    const targetResult = await evaluate(
      targetCdp,
      'window.runTargetFixture(' + JSON.stringify(sourceResult.backup) + ')'
    );
    assert.deepEqual(targetResult.after, sourceResult.before, 'real browser restore/read-back must match the copied backup');
    assert.deepEqual(targetResult.reExported, sourceResult.parsed, 're-exported browser records must match parsed backup data');
    assert.deepEqual(
      targetResult.sentinelIds,
      Object.fromEntries(storeNames.map(name => [name, false])),
      'replacement semantics are confined to the disposable target origin'
    );

    const sourceAfter = await evaluate(sourceCdp, 'window.readSourceFixture()');
    assert.deepEqual(sourceAfter, sourceResult.before, 'restoring into a separate origin must not mutate the source database');
    assert.equal(sourceResult.schema, 2);
    assert.equal(targetResult.schema, 2);
  } finally {
    sourceCdp?.close();
    targetCdp?.close();
    if (chrome && chrome.exitCode === null) {
      chrome.kill('SIGTERM');
      await Promise.race([
        new Promise(resolveExit => chrome.once('exit', resolveExit)),
        delay(3000)
      ]);
      if (chrome.exitCode === null) chrome.kill('SIGKILL');
    }
    if (sourceServer.listening) await new Promise(resolveClose => sourceServer.close(resolveClose));
    if (targetServer.listening) await new Promise(resolveClose => targetServer.close(resolveClose));
    if (profileDir) await rm(profileDir, { recursive: true, force: true });
  }
});
