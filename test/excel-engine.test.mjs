import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { isExcelTask, withExcelCoordinatorInstructions } from '../excel-engine.mjs';

process.env.UNEXPECTED_ACCESS_TOKEN = 'excel-engine-test-token';
process.env.PORT = '0';

const { server } = await import('../server.js');
await new Promise((resolve, reject) => {
  if (server.listening) return resolve();
  server.once('listening', resolve);
  server.once('error', reject);
});

const baseUrl = `http://127.0.0.1:${server.address().port}`;
const token = process.env.UNEXPECTED_ACCESS_TOKEN;
const xlsxMime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

after(async () => {
  if (!server.listening) return;
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

test('Excel API rejects requests without the configured bearer token', async () => {
  const response = await fetch(`${baseUrl}/excel/inspect`, {
    method: 'POST',
    headers: { 'content-type': xlsxMime },
    body: Buffer.from('not-a-workbook')
  });
  assert.equal(response.status, 401);
});

test('Excel inspect rejects content that is not an XLSX ZIP package', async () => {
  const response = await fetch(`${baseUrl}/excel/inspect`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': xlsxMime
    },
    body: Buffer.from('not-a-workbook')
  });
  assert.equal(response.status, 400);
  const data = await response.json();
  assert.equal(data.ok, false);
});

test('Excel generate returns a workbook that the inspect endpoint can read', async () => {
  const spec = {
    sheets: [{
      name: 'Overview',
      headers: ['Record ID', 'Title', 'Status'],
      rows: [
        ['R-001', 'First item', 'Open'],
        ['R-002', 'Second item', 'Closed']
      ]
    }]
  };

  const generated = await fetch(`${baseUrl}/excel/generate`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify(spec)
  });
  assert.equal(generated.status, 200);
  assert.match(generated.headers.get('content-type') || '', /application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet/u);
  const bytes = Buffer.from(await generated.arrayBuffer());
  assert.deepEqual(bytes.subarray(0, 4), Buffer.from([0x50, 0x4b, 0x03, 0x04]));

  const inspected = await fetch(`${baseUrl}/excel/inspect`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': xlsxMime
    },
    body: bytes
  });
  assert.equal(inspected.status, 200);
  const result = await inspected.json();
  assert.equal(result.ok, true);
  assert.equal(result.sheetCount, 1);
  assert.equal(result.sheets[0].name, 'Overview');
  assert.equal(result.sheets[0].rows, 3);
  assert.equal(result.sheets[0].columns, 3);
  assert.equal(result.sheets[0].preview[1][1], 'First item');
});

test('Excel generate rejects malformed workbook specifications', async () => {
  const response = await fetch(`${baseUrl}/excel/generate`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({ sheets: [] })
  });
  assert.equal(response.status, 400);
});

test('coordinator instructions are injected only for Excel-related provider requests', async () => {
  assert.equal(isExcelTask('Create a project timeline'), false);
  assert.equal(isExcelTask('Inspect this XLSX workbook'), true);
  const ordinary = await withExcelCoordinatorInstructions('Create a project timeline', 'base system');
  assert.equal(ordinary, 'base system');
  const excel = await withExcelCoordinatorInstructions('Inspect this XLSX workbook', 'base system');
  assert.match(excel, /Excel Engineering Coordinator/u);
  assert.match(excel, /Excelize/u);
  assert.match(excel, /VBA/u);
  assert.match(excel, /Never claim to have called an endpoint/u);
});
