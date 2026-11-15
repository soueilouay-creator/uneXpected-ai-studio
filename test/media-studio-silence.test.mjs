import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSilenceIntervals, buildSilenceTrimPlan } from '../media-studio/silence.mjs';

test('parses paired and trailing FFmpeg silence-detection events', () => {
  const log = [
    '[silencedetect] silence_start: 0.500',
    '[silencedetect] silence_end: 1.000 | silence_duration: 0.500',
    '[silencedetect] silence_start: 3.000'
  ].join('\n');
  assert.deepEqual(parseSilenceIntervals(log, 4000), [
    { startMs: 500, endMs: 1000 },
    { startMs: 3000, endMs: 4000 }
  ]);
});

test('removes long pauses while preserving cue synchronization and 100ms speech edges', () => {
  const cues = [
    { index: 1, startMs: 0, endMs: 2000, text: 'First line' },
    { index: 2, startMs: 2000, endMs: 4000, text: 'Second line' }
  ];
  const plan = buildSilenceTrimPlan(cues, 4000, [{ startMs: 1000, endMs: 2500 }]);
  assert.equal(plan.removedMs, 1300);
  assert.equal(plan.durationMs, 2700);
  assert.deepEqual(plan.audioSegments, [
    { startMs: 0, endMs: 1100 },
    { startMs: 2400, endMs: 4000 }
  ]);
  assert.deepEqual(plan.cues, [
    { index: 1, startMs: 0, endMs: 1100, text: 'First line' },
    { index: 2, startMs: 1100, endMs: 2700, text: 'Second line' }
  ]);
});

test('ignores short pauses and does not collapse a subtitle cue to zero duration', () => {
  const cues = [{ index: 1, startMs: 0, endMs: 500, text: 'Brief cue' }];
  const shortPause = buildSilenceTrimPlan(cues, 500, [{ startMs: 100, endMs: 400 }]);
  assert.equal(shortPause.removedMs, 0);
  const allSilence = buildSilenceTrimPlan(cues, 500, [{ startMs: 0, endMs: 450 }]);
  assert.equal(allSilence.removedMs, 0);
  assert.deepEqual(allSilence.cues, cues);
});

test('merges overlapping silence detections and rejects invalid or non-contiguous cues', () => {
  const cues = [{ index: 1, startMs: 0, endMs: 3000, text: 'One scene' }];
  const plan = buildSilenceTrimPlan(cues, 3000, [
    { startMs: 500, endMs: 1500 },
    { startMs: 1200, endMs: 2200 }
  ]);
  assert.equal(plan.removedMs, 1500);
  assert.deepEqual(plan.audioSegments, [
    { startMs: 0, endMs: 600 },
    { startMs: 2100, endMs: 3000 }
  ]);
  assert.throws(() => buildSilenceTrimPlan([
    { index: 1, startMs: 100, endMs: 3000, text: 'Not zero-based' }
  ], 3000, []), /start at zero/i);
});
