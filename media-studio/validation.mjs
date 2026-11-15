import { parseSrt } from './srt.mjs';

const IMAGE_LIMIT = 8 * 1024 * 1024;
const AUDIO_LIMIT = 12 * 1024 * 1024;
const SRT_LIMIT = 48 * 1024;
const TIMELINE_LIMIT_MS = 120_000;

function fail(message, Type = Error) {
  throw new Type(message);
}

function detectImage(bytes) {
  if (bytes.length >= 24 &&
      bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) &&
      bytes.subarray(12, 16).toString('ascii') === 'IHDR') return { mimeType: 'image/png', extension: 'png' };
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { mimeType: 'image/jpeg', extension: 'jpg' };
  return null;
}

function detectAudio(bytes) {
  if (bytes.length >= 12 && bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WAVE') {
    return { mimeType: 'audio/wav', extension: 'wav' };
  }
  if (bytes.length >= 3 && bytes.subarray(0, 3).toString('ascii') === 'ID3') return { mimeType: 'audio/mpeg', extension: 'mp3' };
  if (bytes.length >= 2 && bytes[0] === 0xff && (bytes[1] & 0xf6) === 0xf0) return { mimeType: 'audio/aac', extension: 'aac' };
  if (bytes.length >= 2 && bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0) return { mimeType: 'audio/mpeg', extension: 'mp3' };
  if (bytes.length >= 12 && bytes.subarray(4, 8).toString('ascii') === 'ftyp') return { mimeType: 'audio/mp4', extension: 'm4a' };
  if (bytes.length >= 4 && bytes.subarray(0, 4).toString('ascii') === 'OggS') return { mimeType: 'audio/ogg', extension: 'ogg' };
  if (bytes.length >= 4 && bytes.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))) return { mimeType: 'audio/webm', extension: 'webm' };
  return null;
}

export function decodeMediaPayload({ data, mimeType, kind, maxBytes } = {}) {
  if (!['image', 'audio'].includes(kind)) fail('Upload kind must be image or audio.', TypeError);
  if (typeof data !== 'string' || !data.length || data.length % 4 !== 0) {
    fail('Upload must contain valid standard base64 data.', TypeError);
  }
  const limit = maxBytes ?? (kind === 'image' ? IMAGE_LIMIT : AUDIO_LIMIT);
  if (!Number.isSafeInteger(limit) || limit <= 0) fail('Upload byte limit must be a positive integer.', RangeError);
  const estimatedBytes = Math.floor(data.length * 3 / 4) - (data.endsWith('==') ? 2 : data.endsWith('=') ? 1 : 0);
  if (estimatedBytes > limit) fail('Upload exceeds the ' + limit + ' byte limit.', RangeError);
  const bytes = Buffer.from(data, 'base64');
  if (!bytes.length || bytes.toString('base64') !== data) fail('Upload must contain canonical base64 data.', TypeError);
  const detected = kind === 'image' ? detectImage(bytes) : detectAudio(bytes);
  if (!detected) fail('Unsupported ' + kind + ' file signature.', TypeError);
  const rawMime = String(mimeType || '').split(';')[0].trim().toLowerCase();
  const declaredMime = ({ 'image/jpg': 'image/jpeg', 'audio/mp3': 'audio/mpeg', 'audio/x-wav': 'audio/wav', 'audio/wave': 'audio/wav', 'audio/x-m4a': 'audio/mp4' })[rawMime] || rawMime;
  const acceptable = kind === 'image'
    ? new Set(['image/png', 'image/jpeg'])
    : new Set(['audio/wav', 'audio/mpeg', 'audio/mp4', 'audio/aac', 'audio/ogg', 'audio/webm']);
  if (!acceptable.has(declaredMime) || declaredMime !== detected.mimeType) {
    fail('Declared MIME type does not match the uploaded ' + kind + ' file signature.', TypeError);
  }
  return { bytes, mimeType: detected.mimeType, extension: detected.extension, size: bytes.length };
}

export function validateRenderManifest(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) fail('Render manifest must be an object.', TypeError);
  const storyboardInput = input.storyboard || {};
  const narrationInput = input.narration || {};
  const storyboard = decodeMediaPayload({
    data: storyboardInput.data,
    mimeType: storyboardInput.mimeType,
    kind: 'image',
    maxBytes: IMAGE_LIMIT
  });
  const narration = decodeMediaPayload({
    data: narrationInput.data,
    mimeType: narrationInput.mimeType,
    kind: 'audio',
    maxBytes: AUDIO_LIMIT
  });
  if (typeof input.srt !== 'string' || Buffer.byteLength(input.srt, 'utf8') > SRT_LIMIT) {
    fail('SRT text is required and must not exceed 48 KB.', RangeError);
  }
  const cues = parseSrt(input.srt);
  if (cues.length < 1 || cues.length > 9) fail('A 3×3 storyboard supports between 1 and 9 subtitle scenes.', RangeError);
  if (cues[0].startMs !== 0) fail('The first subtitle cue must start at zero.', RangeError);
  if (cues.at(-1).endMs > TIMELINE_LIMIT_MS) fail('Video timeline must not exceed 120 seconds.', RangeError);
  for (let index = 1; index < cues.length; index += 1) {
    if (cues[index].startMs !== cues[index - 1].endMs) fail('Subtitle cues must form one continuous timeline with no gaps or overlaps.', RangeError);
  }
  return {
    storyboard,
    narration,
    srt: input.srt,
    cues,
    durationMs: cues.at(-1).endMs
  };
}
