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
    env: { ...process.env, PORT: String(port), NODE_ENV: 'test', UNEXPECTED_ACCESS_TOKEN: token, MEDIA_STUDIO_FFMPEG: '/missing-test-ffmpeg', MEDIA_STUDIO_FFPROBE: '/missing-test-ffprobe' },
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

  const statusDenied = await fetch(base + '/media-studio/status');
  assert.equal(statusDenied.status, 401);
  const engine = await fetch(base + '/media-studio/status', { headers: { authorization: 'Bearer ' + token } });
  assert.equal(engine.status, 200);
  const engineData = await engine.json();
  assert.equal(engineData.renderAvailable, false);
  assert.equal(engineData.ffmpegAvailable, false);
  assert.equal(engineData.ffprobeAvailable, false);
  assert.equal(JSON.stringify(engineData).includes('/missing-test'), false);

  const png = Buffer.alloc(24);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(png);
  png.writeUInt32BE(13, 8);
  png.write('IHDR', 12);
  png.writeUInt32BE(900, 16);
  png.writeUInt32BE(900, 20);
  const wav = Buffer.alloc(44);
  wav.write('RIFF', 0);
  wav.write('WAVE', 8);
  wav.write('fmt ', 12);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(44100, 24);
  wav.writeUInt32LE(88200, 28);
  wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write('data', 36);
  const renderEndpoint = base + '/media-studio/render';
  const renderPayload = {
    storyboard: { data: png.toString('base64'), mimeType: 'image/png' },
    narration: { data: wav.toString('base64'), mimeType: 'audio/wav' },
    srt: '1\n00:00:00,000 --> 00:00:02,000\nHello world'
  };
  const renderDenied = await fetch(renderEndpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(renderPayload)
  });
  assert.equal(renderDenied.status, 401);
  const badUpload = await fetch(renderEndpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: 'Bearer ' + token },
    body: JSON.stringify({ ...renderPayload, storyboard: { ...renderPayload.storyboard, mimeType: 'image/jpeg' } })
  });
  assert.equal(badUpload.status, 400);
  const unavailable = await fetch(renderEndpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: 'Bearer ' + token },
    body: JSON.stringify(renderPayload)
  });
  assert.equal(unavailable.status, 503);
  const unavailableData = await unavailable.json();
  assert.equal(unavailableData.renderAvailable, false);
  assert.match(unavailableData.error, /FFmpeg and FFprobe/i);
});
