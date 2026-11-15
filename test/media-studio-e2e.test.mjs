import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { once } from 'node:events';
import { mkdtemp, mkdir, writeFile, chmod, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

async function freePort() {
  const server = createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const port = server.address().port;
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  return port;
}

function sampleFiles() {
  const image = Buffer.alloc(24);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(image);
  image.writeUInt32BE(13, 8);
  image.write('IHDR', 12);
  image.writeUInt32BE(900, 16);
  image.writeUInt32BE(900, 20);
  const audio = Buffer.alloc(44);
  audio.write('RIFF', 0);
  audio.write('WAVE', 8);
  audio.write('fmt ', 12);
  audio.writeUInt32LE(16, 16);
  audio.writeUInt16LE(1, 20);
  audio.writeUInt16LE(1, 22);
  audio.writeUInt32LE(44100, 24);
  audio.writeUInt32LE(88200, 28);
  audio.writeUInt16LE(2, 32);
  audio.writeUInt16LE(16, 34);
  audio.write('data', 36);
  return { image, audio };
}

test('authenticated render route splits, assembles, returns MP4 and cleans temporary media', async t => {
  const root = await mkdtemp(join(tmpdir(), 'ue-media-e2e-'));
  const runtimeTmp = join(root, 'runtime-tmp');
  await mkdir(runtimeTmp);
  const ffmpeg = join(root, 'fake-ffmpeg');
  const ffprobe = join(root, 'fake-ffprobe');
  const ffmpegSource = `#!/usr/bin/env node
const fs = require('node:fs');
const args = process.argv.slice(2);
if (args.includes('-version')) process.exit(0);
const outputs = [];
for (let i = 0; i < args.length; i += 1) if (args[i] === '-frames:v') outputs.push(args[i + 2]);
if (outputs.length) {
  for (const output of outputs) fs.writeFileSync(output, Buffer.from([137,80,78,71,13,10,26,10,0,0,0,13,73,72,68,82,0,0,3,132,0,0,3,132]));
  process.exit(0);
}
const output = args[args.length - 1];
const mp4 = Buffer.alloc(16);
mp4.writeUInt32BE(16, 0);
mp4.write('ftyp', 4);
mp4.write('isom', 8);
fs.writeFileSync(output, mp4);
`;
  const ffprobeSource = `#!/usr/bin/env node
const args = process.argv.slice(2);
if (args.includes('-version')) process.exit(0);
if (args.includes('format=duration')) process.stdout.write(JSON.stringify({ format: { duration: '4.0' } }));
else process.stdout.write(JSON.stringify({ streams: [{ width: 900, height: 900 }] }));
`;
  await writeFile(ffmpeg, ffmpegSource, { mode: 0o700 });
  await writeFile(ffprobe, ffprobeSource, { mode: 0o700 });
  await chmod(ffmpeg, 0o700);
  await chmod(ffprobe, 0o700);

  const port = await freePort();
  const token = 'media-studio-e2e-token-32-characters';
  const child = spawn(process.execPath, ['server.js'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(port),
      NODE_ENV: 'test',
      UNEXPECTED_ACCESS_TOKEN: token,
      MEDIA_STUDIO_FFMPEG: ffmpeg,
      MEDIA_STUDIO_FFPROBE: ffprobe,
      TMPDIR: runtimeTmp
    },
    stdio: ['ignore', 'ignore', 'pipe']
  });
  let stderr = '';
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', chunk => { stderr += chunk; });
  t.after(async () => {
    if (!child.killed) child.kill('SIGTERM');
    await rm(root, { recursive: true, force: true });
  });

  const base = 'http://127.0.0.1:' + port;
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try { ready = (await fetch(base + '/health')).ok; if (ready) break; } catch {}
    await delay(100);
  }
  assert.ok(ready, 'gateway did not start: ' + stderr);

  const headers = { authorization: 'Bearer ' + token };
  const engine = await fetch(base + '/media-studio/status', { headers });
  assert.equal(engine.status, 200);
  assert.equal((await engine.json()).renderAvailable, true);

  const { image, audio } = sampleFiles();
  const response = await fetch(base + '/media-studio/render', {
    method: 'POST',
    headers: { ...headers, 'content-type': 'application/json' },
    body: JSON.stringify({
      storyboard: { data: image.toString('base64'), mimeType: 'image/png' },
      narration: { data: audio.toString('base64'), mimeType: 'audio/wav' },
      srt: '1\n00:00:00,000 --> 00:00:02,000\nScene one'
    })
  });
  assert.equal(response.status, 200, response.ok ? '' : await response.text());
  assert.equal(response.headers.get('content-type'), 'video/mp4');
  assert.match(response.headers.get('content-disposition'), /uneXpected-video\.mp4/);
  const video = Buffer.from(await response.arrayBuffer());
  assert.equal(video.subarray(4, 8).toString('ascii'), 'ftyp');
  assert.equal((await readdir(runtimeTmp)).length, 0, 'temporary media directory should be removed after download');
});
