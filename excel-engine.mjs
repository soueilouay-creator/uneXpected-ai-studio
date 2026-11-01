import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';

export const MAX_EXCEL_UPLOAD_BYTES = 20 * 1024 * 1024;
export const MAX_EXCEL_JSON_BYTES = 1024 * 1024;
export const EXCEL_WORKER_TIMEOUT_MS = 30_000;
export const DEFAULT_EXCEL_WORKER_PATH = '/app/bin/ux-excel';

const coordinatorGuidance = readFile(
  new URL('./integrations/excel-engine/agent/EXCEL_COORDINATOR.md', import.meta.url),
  'utf8'
).catch(() => '');

const taskSkills = [
  {
    id: 'workbook-inspection',
    match: /inspect|inventory|audit|structure|sheet names|workbook summary|analy[sz]e.{0,30}(workbook|spreadsheet|xlsx)|read.{0,20}(workbook|spreadsheet)/i
  },
  {
    id: 'data-quality',
    match: /data quality|duplicate|missing values?|blank cells?|deduplicat|reconcil|validate.{0,30}(data|records|cells)|clean.{0,20}(data|spreadsheet)/i
  },
  {
    id: 'formula-engineering',
    match: /formula|calculation|vlookup|xlookup|sumif|countif|dynamic array|lookup|financial model/i
  },
  {
    id: 'report-generation',
    match: /generate|create|build|design|format|dashboard|report|template|tracker|chart|visuali[sz]e.{0,20}(data|spreadsheet|workbook)/i
  },
  {
    id: 'large-workbook-processing',
    match: /large|massive|many rows|big workbook|stream|memory|performance|hundreds of thousands|millions of rows/i
  },
  {
    id: 'vba-desktop-automation',
    match: /\bvba\b|macro|desktop excel|office automation|excel event|com automation|add-in/i
  },
  {
    id: 'output-verification',
    match: /verify|verification|read.?back|test the workbook|check the output|compare before|validate the generated/i
  }
];

export function isExcelTask(task) {
  return /\b(excel|excelize|spreadsheet|workbook|worksheet|xlsx|xlsm|vba|power query|pivot table|cell range|formula)\b/i.test(String(task || ''));
}

export function selectedExcelSkills(task) {
  const value = String(task || '');
  return taskSkills.filter(skill => skill.match.test(value)).map(skill => skill.id);
}

export async function withExcelCoordinatorInstructions(task, system) {
  if (!isExcelTask(task)) return system;
  const guidance = await coordinatorGuidance;
  const selected = selectedExcelSkills(task);
  const skillContents = await Promise.all(selected.map(async id => {
    try {
      return await readFile(new URL(`./specialists/excel/skills/${id}/SKILL.md`, import.meta.url), 'utf8');
    } catch {
      return '';
    }
  }));
  const fallback = [
    'EXCEL TASK ROUTING:',
    'Choose a macro-free, Excelize server-side, or desktop VBA approach based on the actual file format and execution platform.',
    'Never claim to have opened, inspected, generated, changed, or verified a workbook without a real tool result.',
    'Excelize does not execute VBA and is not a full Microsoft Excel formula calculation engine.'
  ].join('\n');
  const skillHeader = selected.length ? '## Selected Excel task skills\n' + selected.join(', ') : '';
  return [system, guidance || fallback, skillHeader, ...skillContents].filter(Boolean).join('\n\n');
}

export function excelWorkerPath() {
  return process.env.EXCEL_WORKER_PATH || DEFAULT_EXCEL_WORKER_PATH;
}

export function runExcelWorker(args, options = {}) {
  const timeout = options.timeoutMs ?? EXCEL_WORKER_TIMEOUT_MS;
  const workerPath = options.workerPath || excelWorkerPath();
  return new Promise((resolve, reject) => {
    execFile(workerPath, args, {
      encoding: 'utf8',
      timeout,
      maxBuffer: 2 * 1024 * 1024,
      windowsHide: true,
      shell: false,
      env: {
        PATH: process.env.PATH || '',
        HOME: process.env.HOME || '/tmp',
        TMPDIR: process.env.TMPDIR || '/tmp',
        LANG: process.env.LANG || 'C.UTF-8'
      }
    }, (error, stdout, stderr) => {
      if (error) {
        const failure = new Error(
          error.code === 'ENOENT'
            ? 'Excel worker is not installed in this service.'
            : error.killed || error.signal
              ? 'Excel worker exceeded its execution time limit.'
              : 'Excel worker rejected the workbook request.'
        );
        failure.status = error.code === 'ENOENT' ? 503 : error.killed || error.signal ? 504 : 400;
        failure.workerExitCode = typeof error.code === 'number' ? error.code : null;
        failure.workerDiagnostic = String(stderr || '').slice(0, 500);
        return reject(failure);
      }
      resolve(String(stdout || '').trim());
    });
  });
}
