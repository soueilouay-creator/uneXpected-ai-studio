import { spawn } from 'node:child_process';
import { buildGridCropFilters } from './storyboard.mjs';
import { parseSilenceIntervals } from './silence.mjs';

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
  const audioInputIndex = scenePaths.length;
  const subtitlePath = options.subtitlePath ? requiredPath(options.subtitlePath, 'Subtitle file path') : null;
  if (subtitlePath) args.push('-i', subtitlePath);
  const inputs = scenePaths.map((_, index) => '[v' + index + ']').join('');
  filters.push(inputs + 'concat=n=' + scenePaths.length + ':v=1:a=0[vout]');

  let audioOutput = audioInputIndex + ':a:0';
  if (options.audioSegments !== undefined) {
    const segments = options.audioSegments;
    if (!Array.isArray(segments) || !segments.length || segments.length > 256) {
      throw new RangeError('Trimmed narration must contain between 1 and 256 audio segments.');
    }
    let lastEnd = -1;
    const labels = [];
    segments.forEach((segment, index) => {
      if (!segment || !Number.isSafeInteger(segment.startMs) || !Number.isSafeInteger(segment.endMs) ||
          segment.startMs < 0 || segment.endMs <= segment.startMs || segment.startMs < lastEnd) {
        throw new RangeError('Trimmed audio segments must be ordered, non-overlapping, and have positive duration.');
      }
      lastEnd = segment.endMs;
      const label = '[atrim' + index + ']';
      filters.push('[' + audioInputIndex + ':a]atrim=start=' + (segment.startMs / 1000).toFixed(3) +
        ':end=' + (segment.endMs / 1000).toFixed(3) + ',asetpts=PTS-STARTPTS' + label);
      labels.push(label);
    });
    if (labels.length > 1) filters.push(labels.join('') + 'concat=n=' + labels.length + ':v=0:a=1[aout]');
    else filters.push(labels[0] + 'anull[aout]');
    audioOutput = '[aout]';
  }
  args.push('-filter_complex', filters.join(';'), '-map', '[vout]', '-map', audioOutput);
  if (subtitlePath) args.push('-map', (scenePaths.length + 1) + ':s:0', '-c:s', 'mov_text');
  args.push('-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-r', String(fps), '-c:a', 'aac', '-b:a', '128k', '-shortest', '-movflags', '+faststart', outputPath);
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
      finish(new Error('FFmpeg timed out after ' + timeoutMs + ' ms.'));
      child?.kill('SIGKILL');
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


export function probeImageDimensions(inputPath, { spawnImpl = spawn, binary = 'ffprobe', timeoutMs = 10000, maxOutputBytes = 4096 } = {}) {
  requiredPath(inputPath, 'Input image path');
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0) throw new RangeError('Probe timeout must be a positive integer.');
  if (!Number.isSafeInteger(maxOutputBytes) || maxOutputBytes <= 0) throw new RangeError('Probe output limit must be a positive integer.');
  return new Promise((resolve, reject) => {
    let child;
    let stdout = '';
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
      finish(new Error('FFprobe timed out after ' + timeoutMs + ' ms.'));
      child?.kill('SIGKILL');
    }, timeoutMs);
    try {
      child = spawnImpl(binary, [
        '-v', 'error',
        '-select_streams', 'v:0',
        '-show_entries', 'stream=width,height',
        '-of', 'json',
        inputPath
      ], { stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (error) {
      finish(new Error('FFprobe is unavailable: ' + error.message));
      return;
    }
    child.stdout?.on('data', chunk => {
      stdout += chunk.toString();
      if (Buffer.byteLength(stdout) > maxOutputBytes) {
        finish(new Error('FFprobe output exceeded its safety limit.'));
        child.kill('SIGKILL');
      }
    });
    child.stderr?.on('data', chunk => { stderr = (stderr + chunk.toString()).slice(-2000); });
    child.once('error', error => finish(new Error('FFprobe is unavailable: ' + error.message)));
    child.once('close', code => {
      if (settled) return;
      if (code !== 0) return finish(new Error('FFprobe exited with code ' + code + ': ' + stderr));
      try {
        const data = JSON.parse(stdout);
        const stream = data?.streams?.[0];
        const width = stream?.width;
        const height = stream?.height;
        if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width <= 0 || height <= 0 ||
            width > 8192 || height > 8192 || width * height > 40000000) {
          throw new Error('Storyboard dimensions are invalid or exceed the 40-megapixel limit.');
        }
        finish(null, { width, height });
      } catch (error) {
        finish(error instanceof SyntaxError ? new Error('FFprobe returned invalid image metadata.') : error);
      }
    });
  });
}


export function probeAudioDuration(inputPath, { spawnImpl = spawn, binary = 'ffprobe', timeoutMs = 10000, maxOutputBytes = 4096 } = {}) {
  requiredPath(inputPath, 'Narration audio path');
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0) throw new RangeError('Probe timeout must be a positive integer.');
  if (!Number.isSafeInteger(maxOutputBytes) || maxOutputBytes <= 0) throw new RangeError('Probe output limit must be a positive integer.');
  return new Promise((resolve, reject) => {
    let child;
    let stdout = '';
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
      finish(new Error('FFprobe timed out after ' + timeoutMs + ' ms.'));
      child?.kill('SIGKILL');
    }, timeoutMs);
    try {
      child = spawnImpl(binary, [
        '-v', 'error',
        '-show_entries', 'format=duration',
        '-of', 'json',
        inputPath
      ], { stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (error) {
      finish(new Error('FFprobe is unavailable: ' + error.message));
      return;
    }
    child.stdout?.on('data', chunk => {
      stdout += chunk.toString();
      if (Buffer.byteLength(stdout) > maxOutputBytes) {
        finish(new Error('FFprobe output exceeded its safety limit.'));
        child.kill('SIGKILL');
      }
    });
    child.stderr?.on('data', chunk => { stderr = (stderr + chunk.toString()).slice(-2000); });
    child.once('error', error => finish(new Error('FFprobe is unavailable: ' + error.message)));
    child.once('close', code => {
      if (settled) return;
      if (code !== 0) return finish(new Error('FFprobe exited with code ' + code + ': ' + stderr));
      try {
        const durationSeconds = Number(JSON.parse(stdout)?.format?.duration);
        if (!Number.isFinite(durationSeconds) || durationSeconds <= 0 || durationSeconds > 3600) {
          throw new Error('Narration duration is invalid or exceeds the 60-minute probe limit.');
        }
        const durationMs = Math.round(durationSeconds * 1000);
        if (!Number.isSafeInteger(durationMs) || durationMs <= 0) throw new Error('Narration duration is invalid.');
        finish(null, durationMs);
      } catch (error) {
        finish(error instanceof SyntaxError ? new Error('FFprobe returned invalid audio metadata.') : error);
      }
    });
  });
}


export async function detectSilenceIntervals(inputPath, {
  spawnImpl = spawn,
  binary = 'ffmpeg',
  timeoutMs = 30000,
  minSilenceMs = 450,
  noiseDb = -42,
  durationMs
} = {}) {
  requiredPath(inputPath, 'Narration audio path');
  if (!Number.isSafeInteger(minSilenceMs) || minSilenceMs < 100 || minSilenceMs > 10000) {
    throw new RangeError('Minimum silence duration must be between 100 and 10000 milliseconds.');
  }
  if (!Number.isFinite(noiseDb) || noiseDb < -90 || noiseDb > 0) throw new RangeError('Silence detection threshold must be between -90 and 0 dB.');
  if (!Number.isSafeInteger(durationMs) || durationMs <= 0) throw new RangeError('Narration duration must be a positive integer.');
  const result = await runFfmpeg([
    '-hide_banner',
    '-nostats',
    '-i', inputPath,
    '-af', 'silencedetect=noise=' + noiseDb + 'dB:d=' + (minSilenceMs / 1000).toFixed(3),
    '-f', 'null',
    '-'
  ], { spawnImpl, binary, timeoutMs });
  return parseSilenceIntervals(result.stderr, durationMs);
}
