import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';

async function freePort() {
  const server = createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const port = server.address().port;
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  return port;
}

test('SRT inspection is authenticated, bounded and returns parsed cues', async t => {
  const port = await freePort();
  const token = 'media-studio-test-token-32-characters';
  const child = spawn(process.execPath, ['server.js'], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: String(port), NODE_ENV: 'test', UNEXPECTED_ACCESS_TOKEN: token },
    stdio: ['ignore', 'ignore', 'pipe']
  });
  let stderr = '';
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', chunk => { stderr += chunk; });
  t.after(() => { if (!child.killed) child.kill('SIGTERM'); });
  const base = 'http://127.0.0.1:' + port;
  let ready = false;
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try { ready = (await fetch(base + '/health')).ok; if (ready) break; } catch {}
    await delay(100);
  }
  assert.ok(ready, 'server did not start: ' + stderr);
  const endpoint = base + '/media-studio/inspect-srt';
  const payload = { srt: '1\n00:00:00,000 --> 00:00:01,500\nHello world' };
  const denied = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
  assert.equal(denied.status, 401);
  const invalid = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + token }, body: JSON.stringify({ srt: 'broken' }) });
  assert.equal(invalid.status, 400);
  const ok = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + token }, body: JSON.stringify(payload) });
  assert.equal(ok.status, 200);
  assert.deepEqual(await ok.json(), {
    ok: true,
    cueCount: 1,
    durationMs: 1500,
    cues: [{ index: 1, startMs: 0, endMs: 1500, text: 'Hello world' }]
  });
  const oversized = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + token }, body: JSON.stringify({ srt: 'x'.repeat(49 * 1024) }) });
  assert.equal(oversized.status, 413);
});
