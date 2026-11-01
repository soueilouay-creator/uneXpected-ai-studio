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
  const { port } = server.address();
  await new Promise((done, reject) => server.close(error => error ? reject(error) : done()));
  return port;
}

async function startStudio(t, scenario, openrouterKey = 'test-openrouter-secret') {
  const port = await freePort();
  const token = 'test-only-studio-access-token';
  const child = spawn(process.execPath, [
    '--import', resolve(root, 'test/provider-fetch-stub.mjs'),
    'server.js'
  ], {
    cwd: root,
    env: {
      ...process.env,
      NODE_ENV: 'test',
      PORT: String(port),
      PROVIDER_TEST_SCENARIO: scenario,
      UNEXPECTED_ACCESS_TOKEN: token,
      OPENAI_API_KEY: 'test-openai-secret',
      ANTHROPIC_API_KEY: 'test-anthropic-secret',
      OPENROUTER_API_KEY: openrouterKey,
      OPENROUTER_MODEL: 'openrouter/free'
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  let stdout = '';
  let stderr = '';
  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');
  child.stdout.on('data', chunk => stdout += chunk);
  child.stderr.on('data', chunk => stderr += chunk);
  t.after(() => { if (!child.killed) child.kill('SIGTERM'); });

  const base = 'http://127.0.0.1:' + port;
  let health;
  for (let n = 0; n < 50; n++) {
    try {
      health = await fetch(base + '/health');
      if (health.ok) break;
    } catch {}
    await delay(100);
  }
  assert.ok(health?.ok, 'Studio did not start. stderr: ' + stderr);

  return {
    base,
    token,
    child,
    getStdout: () => stdout,
    request: async (task, mode = 'both', excelFiles = []) => {
      const response = await fetch(base + '/orchestrate', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: 'Bearer ' + token
        },
        body: JSON.stringify({ task, mode, excelFiles })
      });
      return { status: response.status, data: await response.json() };
    },
    health: async () => (await (await fetch(base + '/health')).json())
  };
}

test('reports OpenRouter as a separately attributed fallback result after primary providers fail', async t => {
  const studio = await startStudio(t, 'fallback-success');
  const { status, data } = await studio.request('Prepare a short project plan.');

  assert.equal(status, 200);
  assert.equal(data.ok, true);
  assert.equal(data.results.openrouter.provider, 'openrouter');
  assert.equal(data.results.openrouter.label, 'OpenRouter fallback');
  assert.equal(data.results.openrouter.status, 'LIVE · fallback response');
  assert.equal(data.results.openrouter.model, 'nvidia/nemotron-3.5-lightning:free');
  assert.equal(data.results.openrouter.requestedModel, 'openrouter/free');
  assert.equal(data.results.openrouter.text, 'OpenRouter fallback answer.');
  assert.equal(data.results.synthesis, undefined, 'the OpenRouter result must not be mislabeled as synthesis');
  assert.deepEqual(data.fallback, {
    attempted: true,
    provider: 'openrouter',
    status: 'succeeded',
    requestedModel: 'openrouter/free',
    model: 'nvidia/nemotron-3.5-lightning:free',
    reason: 'All requested primary providers failed.'
  });

  const health = await studio.health();
  assert.equal(health.providers.openrouter.verified, true);
  assert.match(studio.getStdout(), /PROVIDER_MOCK_CALL:openrouter/);
});

test('reports a failed OpenRouter fallback without presenting an answer as successful', async t => {
  const studio = await startStudio(t, 'fallback-failure');
  const { status, data } = await studio.request('Summarize the project risks.');

  assert.equal(status, 502);
  assert.equal(data.ok, false);
  assert.equal(data.results.openrouter.provider, 'openrouter');
  assert.equal(data.results.openrouter.status, 'FAILED');
  assert.match(data.results.openrouter.error, /Mock OpenRouter rate limit/);
  assert.equal(data.fallback.attempted, true);
  assert.equal(data.fallback.status, 'failed');
  assert.equal(data.fallback.provider, 'openrouter');
  assert.equal(data.fallback.requestedModel, 'openrouter/free');
});

test('does not call OpenRouter when a requested primary provider succeeds', async t => {
  const studio = await startStudio(t, 'primary-success');
  const { status, data } = await studio.request('Give me three title ideas.', 'openai');

  assert.equal(status, 200);
  assert.equal(data.results.openai.provider, 'openai');
  assert.equal(data.results.openai.text, 'Primary OpenAI answer.');
  assert.equal(data.fallback.attempted, false);
  assert.equal(data.fallback.status, 'not_attempted');
  assert.equal(data.results.openrouter, undefined);
  assert.doesNotMatch(studio.getStdout(), /PROVIDER_MOCK_CALL:openrouter/);
});

test('reports OpenRouter as not configured when primary providers fail and no key exists', async t => {
  const studio = await startStudio(t, 'fallback-success', '');
  const { status, data } = await studio.request('Write a maintenance checklist.');

  assert.equal(status, 502);
  assert.equal(data.ok, false);
  assert.equal(data.results.openrouter.provider, 'openrouter');
  assert.equal(data.results.openrouter.status, 'NOT CONFIGURED');
  assert.equal(data.fallback.attempted, false);
  assert.equal(data.fallback.status, 'not_configured');
  assert.equal(data.fallback.requestedModel, 'openrouter/free');
  assert.doesNotMatch(JSON.stringify(data), /test-openrouter-secret|test-openai-secret|test-anthropic-secret/);
});

test('serves a task UI that displays OpenRouter results and their actual model', async t => {
  const studio = await startStudio(t, 'primary-success');
  const response = await fetch(studio.base + '/app.js');
  assert.equal(response.status, 200);
  const script = await response.text();

  assert.match(script, /'openai','anthropic','openrouter','synthesis'/);
  assert.match(script, /x\.model/);
  assert.match(script, /x\.requestedModel/);
  assert.match(script, /FALLBACK/);
});


test('supports a direct OpenRouter conversation route without invoking a second fallback request', async t => {
  const studio = await startStudio(t, 'fallback-success');
  const { status, data } = await studio.request('Reply with a short greeting.', 'openrouter');

  assert.equal(status, 200);
  assert.equal(data.ok, true);
  assert.equal(data.mode, 'openrouter');
  assert.equal(data.results.openrouter.provider, 'openrouter');
  assert.equal(data.results.openrouter.label, 'OpenRouter');
  assert.equal(data.results.openrouter.status, 'LIVE · direct response');
  assert.equal(data.results.openrouter.model, 'nvidia/nemotron-3.5-lightning:free');
  assert.equal(data.results.openrouter.text, 'OpenRouter fallback answer.');
  assert.equal(data.results.openai, undefined);
  assert.equal(data.results.anthropic, undefined);
  assert.equal(data.results.synthesis, undefined);
  assert.equal(data.fallback.attempted, false);
  assert.equal(data.fallback.status, 'not_attempted');
  assert.match(studio.getStdout(), /PROVIDER_MOCK_CALL:openrouter/);
  assert.equal((studio.getStdout().match(/PROVIDER_MOCK_CALL:openrouter/g) || []).length, 1);
});



async function uploadTestWorkbook(studio) {
  const generated = await fetch(studio.base + '/excel/generate', {
    method: 'POST',
    headers: { authorization: 'Bearer ' + studio.token, 'content-type': 'application/json' },
    body: JSON.stringify({
      sheets: [{
        name: 'Upload test',
        headers: ['Code', 'Value'],
        rows: [['A-1', 'round trip']]
      }]
    })
  });
  assert.equal(generated.status, 200);
  const workbookBytes = Buffer.from(await generated.arrayBuffer());
  const uploaded = await fetch(studio.base + '/excel/upload', {
    method: 'POST',
    headers: {
      authorization: 'Bearer ' + studio.token,
      'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'x-file-name': 'source.xlsx'
    },
    body: workbookBytes
  });
  assert.equal(uploaded.status, 201);
  return (await uploaded.json()).file;
}

test('OpenAI can inspect an uploaded XLSX through a native function tool round trip', async t => {
  const studio = await startStudio(t, 'excel-inspect-openai');
  const file = await uploadTestWorkbook(studio);
  const { status, data } = await studio.request('Inspect this workbook and describe its sheets.', 'openai', [file.id]);

  assert.equal(status, 200);
  assert.equal(data.ok, true);
  assert.match(data.results.openai.text, /inspected the uploaded workbook/i);
  assert.deepEqual(data.excelArtifacts, []);
  assert.match(studio.getStdout(), /MOCK_EXCEL_TOOLS:excel_inspect,excel_generate/);
  assert.match(studio.getStdout(), /MOCK_EXCEL_TOOL_RESULT:ok:data/);
});

test('Claude can inspect an uploaded XLSX through its native tool-use round trip', async t => {
  const studio = await startStudio(t, 'excel-inspect-claude');
  const file = await uploadTestWorkbook(studio);
  const { status, data } = await studio.request('Inspect this workbook and describe its sheets.', 'claude', [file.id]);

  assert.equal(status, 200);
  assert.equal(data.ok, true);
  assert.match(data.results.anthropic.text, /inspected the uploaded workbook/i);
  assert.deepEqual(data.excelArtifacts, []);
  assert.match(studio.getStdout(), /MOCK_EXCEL_TOOLS:.*excel_inspect/);
  assert.match(studio.getStdout(), /MOCK_EXCEL_TOOL_RESULT:ok:data/);
});

test('OpenAI can generate an XLSX artifact that is downloaded and read back', async t => {
  const studio = await startStudio(t, 'excel-generate-openai');
  const { status, data } = await studio.request('Create an Excel workbook report for these values.', 'openai');

  assert.equal(status, 200);
  assert.equal(data.ok, true);
  assert.match(data.results.openai.text, /workbook is ready/i);
  assert.equal(data.excelArtifacts.length, 1);
  assert.match(studio.getStdout(), /MOCK_EXCEL_TOOL_RESULT:ok/);
  const artifact = data.excelArtifacts[0];
  assert.equal(artifact.fileName, 'uneXpected-workbook.xlsx');
  assert.equal(artifact.sizeBytes > 0, true);

  const unauthorized = await fetch(studio.base + artifact.downloadPath);
  assert.equal(unauthorized.status, 401);
  const downloaded = await fetch(studio.base + artifact.downloadPath, {
    headers: { authorization: 'Bearer ' + studio.token }
  });
  assert.equal(downloaded.status, 200);
  assert.match(downloaded.headers.get('content-type') || '', /spreadsheetml/);
  const bytes = Buffer.from(await downloaded.arrayBuffer());
  assert.equal(bytes.subarray(0, 2).toString(), 'PK');

  const inspected = await fetch(studio.base + '/excel/inspect', {
    method: 'POST',
    headers: {
      authorization: 'Bearer ' + studio.token,
      'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    },
    body: bytes
  });
  assert.equal(inspected.status, 200);
  const workbook = await inspected.json();
  assert.equal(workbook.sheets[0].name, 'Report');
  assert.equal(workbook.sheets[0].preview[1][0], 'A-1');
});


test('root browser app exposes the authenticated Excel attachment and artifact flow', async t => {
  const studio = await startStudio(t, 'primary-success');
  const response = await fetch(studio.base + '/app.js');
  assert.equal(response.status, 200);
  const script = await response.text();
  assert.match(script, /excelAttachmentControls/);
  assert.match(script, /excel\/upload/);
  assert.match(script, /excel\/download/);
  assert.match(script, /excelFiles:\s*files\.map/);
  assert.ok(script.includes('Bounded sheet previews are sent to the selected AI provider'));
});
