import { spawn } from 'node:child_process';
import { buildGridCropFilters } from './storyboard.mjs';

function requiredPath(value, name) {
  if (typeof value !== 'string' || !value.trim()) throw new TypeError(name + ' is required.');
  if (value.includes('\0')) throw new TypeError(name + ' contains an invalid null byte.');
  return value;
}

function seconds(ms) {
  if (!Number.isSafeInteger(ms) || ms <= 0) throw new RangeError('Duration must be a positive integer in milliseconds.');
  return (ms / 1000).toFixed(3);
}

export function buildSplitArgs({ inputPath, outputPattern, width, height, rows = 3, columns = 3 }) {
  requiredPath(inputPath, 'Input image path');
  requiredPath(outputPattern, 'Output pattern');
  if (!outputPattern.includes('%d')) throw new TypeError('Output pattern must contain %d.');
  const cells = buildGridCropFilters({ width, height, rows, columns });
  const splitLabels = cells.map(cell => '[s' + cell.index + ']');
  const graph = '[0:v]split=' + cells.length + splitLabels.join('') + ';' +
    cells.map(cell => '[s' + cell.index + ']crop=' + cell.width + ':' + cell.height + ':' + cell.x + ':' + cell.y + '[c' + cell.index + ']').join(';');
  const args = ['-hide_banner', '-y', '-i', inputPath, '-filter_complex', graph];
  for (const cell of cells) {
    args.push('-map', '[c' + cell.index + ']', '-frames:v', '1', outputPattern.replace('%d', String(cell.index + 1).padStart(2, '0')));
  }
  return args;
}

export function buildRenderArgs({ audioPath, scenePaths, cues, outputPath, options = {} }) {
  requiredPath(audioPath, 'Narration audio path');
  requiredPath(outputPath, 'Output video path');
  if (!Array.isArray(scenePaths) || !scenePaths.length) throw new TypeError('At least one scene image is required.');
  if (!Array.isArray(cues) || cues.length !== scenePaths.length) throw new RangeError('Each scene image must have exactly one subtitle cue.');
  const width = options.width ?? 1080;
  const height = options.height ?? 1920;
  const fps = options.fps ?? 30;
  if (![width, height, fps].every(Number.isSafeInteger) || width <= 0 || height <= 0 || fps <= 0) throw new RangeError('Render dimensions and frame rate must be positive integers.');
  const args = ['-hide_banner', '-y'];
  const filters = [];
  scenePaths.forEach((path, index) => {
    requiredPath(path, 'Scene image path');
    const cue = cues[index];
    if (!cue || !Number.isSafeInteger(cue.startMs) || !Number.isSafeInteger(cue.endMs) || cue.endMs <= cue.startMs) throw new RangeError('Every scene requires a valid positive subtitle cue.');
    args.push('-loop', '1', '-t', seconds(cue.endMs - cue.startMs), '-i', path);
    filters.push('[' + index + ':v]scale=' + width + ':' + height + ':force_original_aspect_ratio=decrease,pad=' + width + ':' + height + ':(ow-iw)/2:(oh-ih)/2,setsar=1,fps=' + fps + '[v' + index + ']');
  });
  args.push('-i', audioPath);
  const inputs = scenePaths.map((_, index) => '[v' + index + ']').join('');
  filters.push(inputs + 'concat=n=' + scenePaths.length + ':v=1:a=0[vout]');
  args.push('-filter_complex', filters.join(';'), '-map', '[vout]', '-map', scenePaths.length + ':a:0', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-r', String(fps), '-c:a', 'aac', '-b:a', '128k', '-shortest', '-movflags', '+faststart', outputPath);
  return args;
}

export function runFfmpeg(args, { spawnImpl = spawn, timeoutMs = 120000, binary = 'ffmpeg' } = {}) {
  if (!Array.isArray(args) || args.some(arg => typeof arg !== 'string')) return Promise.reject(new TypeError('FFmpeg arguments must be an array of strings.'));
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0) return Promise.reject(new RangeError('FFmpeg timeout must be a positive integer.'));
  return new Promise((resolve, reject) => {
    let child;
    let stderr = '';
    let settled = false;
    const finish = (error, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (error) reject(error);
      else resolve(value);
    };
    const timer = setTimeout(() => {
      child?.kill('SIGKILL');
      finish(new Error('FFmpeg timed out after ' + timeoutMs + ' ms.'));
    }, timeoutMs);
    try {
      child = spawnImpl(binary, args, { stdio: ['ignore', 'ignore', 'pipe'] });
    } catch (error) {
      finish(new Error('Could not start FFmpeg: ' + error.message));
      return;
    }
    child.stderr?.on('data', chunk => { stderr = (stderr + chunk.toString()).slice(-12000); });
    child.once('error', error => finish(new Error('FFmpeg is unavailable: ' + error.message)));
    child.once('close', code => {
      if (code !== 0) finish(new Error('FFmpeg exited with code ' + code + ': ' + stderr.slice(-2000)));
      else finish(null, { code, stderr });
    });
  });
}
