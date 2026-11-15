import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSrt, formatSrtTimestamp } from '../media-studio/srt.mjs';
import { buildGridCropFilters } from '../media-studio/storyboard.mjs';

test('parses LF and CRLF SRT cues with multiline text and comma timestamps', () => {
  const cues = parseSrt('1\r\n00:00:01,250 --> 00:00:03,500\r\nFirst line\r\nSecond line\r\n\r\n2\n00:00:04.000 --> 00:00:05.125\nNext cue');
  assert.deepEqual(cues, [
    { index: 1, startMs: 1250, endMs: 3500, text: 'First line\nSecond line' },
    { index: 2, startMs: 4000, endMs: 5125, text: 'Next cue' }
  ]);
});

test('returns an empty list for empty subtitle input', () => {
  assert.deepEqual(parseSrt('  \n\r\n'), []);
});

test('rejects malformed timestamps and non-positive cue durations', () => {
  assert.throws(() => parseSrt('1\nnot-a-time --> 00:00:02,000\nBad'), /timestamp/i);
  assert.throws(() => parseSrt('1\n00:00:02,000 --> 00:00:02,000\nZero'), /after|duration/i);
});

test('formats timestamps with millisecond precision', () => {
  assert.equal(formatSrtTimestamp(3723123), '01:02:03,123');
  assert.throws(() => formatSrtTimestamp(-1), /non-negative/i);
});

test('creates a complete 3x3 grid and assigns remainder pixels without gaps', () => {
  assert.deepEqual(buildGridCropFilters({ width: 1001, height: 1000, rows: 3, columns: 3 }), [
    { index: 0, x: 0, y: 0, width: 334, height: 334 },
    { index: 1, x: 334, y: 0, width: 334, height: 334 },
    { index: 2, x: 668, y: 0, width: 333, height: 334 },
    { index: 3, x: 0, y: 334, width: 334, height: 333 },
    { index: 4, x: 334, y: 334, width: 334, height: 333 },
    { index: 5, x: 668, y: 334, width: 333, height: 333 },
    { index: 6, x: 0, y: 667, width: 334, height: 333 },
    { index: 7, x: 334, y: 667, width: 334, height: 333 },
    { index: 8, x: 668, y: 667, width: 333, height: 333 }
  ]);
});

test('rejects invalid storyboard dimensions and grid sizes', () => {
  assert.throws(() => buildGridCropFilters({ width: 0, height: 900, rows: 3, columns: 3 }), /dimensions/i);
  assert.throws(() => buildGridCropFilters({ width: 100, height: 100, rows: 0, columns: 3 }), /grid/i);
});
