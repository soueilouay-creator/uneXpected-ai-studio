import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

async function freePort() {
  const server = createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const port = server.address().port;
  await new Promise((done, reject) => server.close(error => error ? reject(error) : done()));
  return port;
}

test('runtime status route is authenticated and disabled by default without changing legacy authorization', async t => {
  const port = await freePort();
  const token = 'test-only-studio-runtime-access-token-000000';
  const child = spawn(process.execPath, ['server.js'], {
    cwd: root,
    env: {
      ...process.env,
      NODE_ENV: 'test',
      PORT: String(port),
      UNEXPECTED_ACCESS_TOKEN: token,
      UNEXPECTED_RUNTIME_BASE_URL: '',
      UNEXPECTED_RUNTIME_API_TOKEN: '',
      UNEXPECTED_RUNTIME_ALLOWED_HOSTS: ''
    },
    stdio: ['ignore', 'ignore', 'pipe']
  });

  let stderr = '';
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', chunk => stderr += chunk);
  t.after(() => { if (!child.killed) child.kill('SIGTERM'); });

  const base = 'http://127.0.0.1:' + port;
  let health;
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      health = await fetch(base + '/health');
      if (health.ok) break;
    } catch {}
    await delay(100);
  }
  assert.ok(health?.ok, 'Studio did not start. stderr: ' + stderr);

  const missing = await fetch(base + '/v1/runtime/status');
  assert.equal(missing.status, 401);

  const wrong = await fetch(base + '/v1/runtime/status', {
    headers: { authorization: 'Bearer wrong-token' }
  });
  assert.equal(wrong.status, 401);

  const authorized = await fetch(base + '/v1/runtime/status', {
    headers: { authorization: 'Bearer ' + token }
  });
  assert.equal(authorized.status, 200);
  const result = await authorized.json();
  assert.equal(result.configured, false);
  assert.equal(result.status, 'not_configured');
  assert.equal(JSON.stringify(result).includes(token), false);

  const legacyUnauthorized = await fetch(base + '/orchestrate', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ task: 'must not be executed', mode: 'openai' })
  });
  assert.equal(legacyUnauthorized.status, 401);
});
