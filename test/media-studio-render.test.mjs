import test from 'node:test';
import assert from 'node:assert/strict';
import { decodeMediaPayload, validateRenderManifest } from '../media-studio/validation.mjs';

function pngHeader(width = 900, height = 900) {
  const bytes = Buffer.alloc(24);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(bytes, 0);
  bytes.writeUInt32BE(13, 8);
  bytes.write('IHDR', 12);
  bytes.writeUInt32BE(width, 16);
  bytes.writeUInt32BE(height, 20);
  return bytes;
}

function wavHeader() {
  const bytes = Buffer.alloc(44);
  bytes.write('RIFF', 0);
  bytes.write('WAVE', 8);
  bytes.write('fmt ', 12);
  bytes.writeUInt32LE(16, 16);
  bytes.writeUInt16LE(1, 20);
  bytes.writeUInt16LE(1, 22);
  bytes.writeUInt32LE(44100, 24);
  bytes.writeUInt32LE(88200, 28);
  bytes.writeUInt16LE(2, 32);
  bytes.writeUInt16LE(16, 34);
  bytes.write('data', 36);
  return bytes;
}

const validSrt = '1\n00:00:00,000 --> 00:00:02,000\nFirst scene\n\n2\n00:00:02,000 --> 00:00:04,000\nSecond scene';

test('decodes image and narration uploads only when MIME types match file signatures', () => {
  const image = decodeMediaPayload({
    data: pngHeader().toString('base64'),
    mimeType: 'image/png',
    kind: 'image'
  });
  const audio = decodeMediaPayload({
    data: wavHeader().toString('base64'),
    mimeType: 'audio/wav',
    kind: 'audio'
  });
  assert.equal(image.extension, 'png');
  assert.equal(image.bytes.readUInt32BE(16), 900);
  assert.equal(audio.extension, 'wav');
  assert.equal(audio.bytes.subarray(0, 4).toString(), 'RIFF');
});

test('rejects malformed base64, MIME spoofing and oversized uploads', () => {
  assert.throws(() => decodeMediaPayload({ data: 'not base64!', mimeType: 'image/png', kind: 'image' }), /base64/i);
  assert.throws(() => decodeMediaPayload({ data: pngHeader().toString('base64'), mimeType: 'image/jpeg', kind: 'image' }), /does not match/i);
  assert.throws(() => decodeMediaPayload({ data: pngHeader().toString('base64'), mimeType: 'image/png', kind: 'image', maxBytes: 8 }), /exceeds/i);
});

test('validates a continuous zero-based SRT timeline and bounded storyboard manifest', () => {
  const manifest = validateRenderManifest({
    storyboard: { data: pngHeader().toString('base64'), mimeType: 'image/png' },
    narration: { data: wavHeader().toString('base64'), mimeType: 'audio/wav' },
    srt: validSrt
  });
  assert.equal(manifest.storyboard.extension, 'png');
  assert.equal(manifest.narration.extension, 'wav');
  assert.equal(manifest.cues.length, 2);
  assert.equal(manifest.durationMs, 4000);
});

test('rejects subtitle gaps, overlaps, non-zero starts, and more than nine scenes', () => {
  const base = {
    storyboard: { data: pngHeader().toString('base64'), mimeType: 'image/png' },
    narration: { data: wavHeader().toString('base64'), mimeType: 'audio/wav' }
  };
  assert.throws(() => validateRenderManifest({ ...base, srt: validSrt.replace('00:00:02,000 --> 00:00:04,000', '00:00:03,000 --> 00:00:04,000') }), /continuous/i);
  assert.throws(() => validateRenderManifest({ ...base, srt: validSrt.replace('00:00:00,000', '00:00:01,000') }), /start at zero/i);
  const nine = Array.from({ length: 10 }, (_, index) => `${index + 1}\n${String(Math.floor(index / 60)).padStart(2, '0')}:00:${String(index % 60).padStart(2, '0')},000 --> ${String(Math.floor(index / 60)).padStart(2, '0')}:00:${String(index % 60 + 1).padStart(2, '0')},000\nScene ${index + 1}`).join('\n\n');
  assert.throws(() => validateRenderManifest({ ...base, srt: nine }), /nine|9 scenes/i);
});
