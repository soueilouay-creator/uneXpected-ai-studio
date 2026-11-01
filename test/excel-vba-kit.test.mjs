import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const KIT = resolve(ROOT, 'integrations/excel-vba-kit');
const readKit = (path) => readFile(resolve(KIT, path), 'utf8');
const codeOnly = (source) => source
  .split(/\r?\n/)
  .filter((line) => !/^\s*'/u.test(line))
  .join('\n');

const manifest = JSON.parse(await readKit('manifest.json'));

test('manifest pins upstream provenance, MIT terms, compatibility, and every module', async () => {
  assert.equal(manifest.license, 'MIT');
  assert.equal(manifest.source.repository, 'https://github.com/aaronkeene/ExcelVBA');
  assert.match(manifest.source.treeSha, /^[a-f0-9]{40}$/u);
  assert.match(manifest.compatibility.excel, /2010/u);
  assert.equal(manifest.compatibility.platform, 'Windows desktop');
  assert.ok(Array.isArray(manifest.modules) && manifest.modules.length >= 5);
  for (const module of manifest.modules) {
    assert.ok(module.path.endsWith('.bas'), `${module.path} must be importable VBA source`);
    const source = await readKit(module.path);
    assert.match(source, /^Attribute VB_Name = ".+"/mu);
    assert.match(source, /^Option Explicit$/mu);
  }
});

test('workbook helpers require explicit workbook and worksheet objects', async () => {
  const source = codeOnly(await readKit('modules/modUxWorkbook.bas'));
  assert.match(source, /UxWorksheetExists\(ByVal wb As Workbook, ByVal worksheetName As String\)/u);
  assert.match(source, /UxLastUsedRow\(ByVal ws As Worksheet\)/u);
  assert.match(source, /UxLastUsedColumn\(ByVal ws As Worksheet\)/u);
  assert.doesNotMatch(source, /\bActiveWorkbook\b|\bActiveSheet\b|\bSelection\b/u);
});

test('file helpers inspect and enumerate files without modifying user data', async () => {
  const source = codeOnly(await readKit('modules/modUxFileSystem.bas'));
  assert.match(source, /Function UxFileExists/u);
  assert.match(source, /Function UxFolderExists/u);
  assert.match(source, /Function UxListFiles/u);
  assert.match(source, /msoFileDialogFolderPicker/u);
  assert.match(source, /CreateObject\("Scripting\.FileSystemObject"\)/u);
  assert.doesNotMatch(source, /\bKill\s|DeleteFile\s|\.Delete\s|\.MoveFile\s|\.CopyFile\s|\.CreateTextFile\s|Open\s+.+For\s+(Output|Write)/iu);
  assert.doesNotMatch(source, /\bActiveWorkbook\b|\bActiveSheet\b|\bSelection\b/u);
});

test('application performance helpers capture every setting they modify and restore state', async () => {
  const source = codeOnly(await readKit('modules/modUxApplicationState.bas'));
  for (const property of ['Calculation', 'ScreenUpdating', 'EnableEvents', 'DisplayAlerts', 'DisplayStatusBar', 'StatusBar', 'Cursor']) {
    assert.match(source, new RegExp(`state\\.${property}\\s*=\\s*Application\\.${property}`, 'u'), `${property} must be captured`);
    assert.match(source, new RegExp(`Application\\.${property}\\s*=\\s*state\\.${property}`, 'u'), `${property} must be restored`);
  }
  assert.match(source, /Function UxRestoreApplicationState/u);
  assert.doesNotMatch(source, /\.UpdateLinks\s*=|\.AskToUpdateLinks\s*=|\.EnableCancelKey\s*=|\.Interactive\s*=/u);
});

test('error logging appends sanitized text and requires an existing destination folder', async () => {
  const source = codeOnly(await readKit('modules/modUxDiagnostics.bas'));
  assert.match(source, /For Append/u);
  assert.match(source, /UxFolderExists/u);
  assert.match(source, /Replace\([^\n]*vbCr/u);
  assert.match(source, /Replace\([^\n]*vbLf/u);
  assert.doesNotMatch(source, /password|api[_ -]?key|access[_ -]?token/iu);
});

test('specialist profile states the runtime boundary and evidence requirements', async () => {
  const agent = await readFile(resolve(ROOT, 'specialists/excel-vba/AGENT.md'), 'utf8');
  const routing = await readFile(resolve(ROOT, 'specialists/excel-vba/ROUTING.md'), 'utf8');
  const safety = await readFile(resolve(ROOT, 'specialists/excel-vba/SAFETY.md'), 'utf8');
  assert.match(agent, /VBA/i);
  assert.match(agent, /source provenance/i);
  assert.match(agent, /never claim.*executed/i);
  assert.match(routing, /Excel/i);
  assert.match(safety, /explicit approval/i);
  assert.match(safety, /destructive/i);
});

test('README and license preserve the upstream attribution and disclose verification limits', async () => {
  const readme = await readKit('README.md');
  const license = await readKit('LICENSE');
  assert.match(readme, /aaronkeene\/ExcelVBA/u);
  assert.match(readme, /not executed in desktop Excel/i);
  assert.match(readme, /password-removal/i);
  assert.match(license, /Copyright \(c\) 2014 taxbender/u);
  assert.match(license, /THE SOFTWARE IS PROVIDED "AS IS"/u);
});
