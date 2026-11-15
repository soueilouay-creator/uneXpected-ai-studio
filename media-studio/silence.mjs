function asMilliseconds(value, name) {
  if (!Number.isSafeInteger(value) || value < 0) throw new RangeError(name + ' must be a non-negative integer in milliseconds.');
  return value;
}

function mergeIntervals(intervals, durationMs) {
  const bounded = intervals.map(interval => {
    if (!interval || typeof interval !== 'object') throw new TypeError('Silence intervals must be objects.');
    const startMs = asMilliseconds(interval.startMs, 'Silence start');
    const endMs = asMilliseconds(interval.endMs, 'Silence end');
    if (endMs <= startMs) throw new RangeError('Silence interval end must be after its start.');
    const start = Math.min(durationMs, startMs);
    const end = Math.min(durationMs, endMs);
    return { startMs: start, endMs: end };
  }).filter(interval => interval.endMs > interval.startMs)
    .sort((a, b) => a.startMs - b.startMs || a.endMs - b.endMs);
  const merged = [];
  for (const interval of bounded) {
    const previous = merged.at(-1);
    if (previous && interval.startMs <= previous.endMs) previous.endMs = Math.max(previous.endMs, interval.endMs);
    else merged.push({ ...interval });
  }
  return merged;
}

export function parseSilenceIntervals(stderr, durationMs) {
  if (typeof stderr !== 'string') throw new TypeError('Silence detection output must be text.');
  asMilliseconds(durationMs, 'Audio duration');
  if (durationMs <= 0) throw new RangeError('Audio duration must be positive.');
  const intervals = [];
  let openStart = null;
  for (const line of stderr.split(/\r?\n/)) {
    const startMatch = /silence_start:\s*(-?\d+(?:\.\d+)?)/i.exec(line);
    const endMatch = /silence_end:\s*(-?\d+(?:\.\d+)?)/i.exec(line);
    if (startMatch) {
      const parsed = Math.round(Number(startMatch[1]) * 1000);
      if (!Number.isFinite(parsed)) throw new RangeError('FFmpeg returned an invalid silence start.');
      openStart = Math.max(0, Math.min(durationMs, parsed));
    }
    if (endMatch && openStart !== null) {
      const parsed = Math.round(Number(endMatch[1]) * 1000);
      if (!Number.isFinite(parsed)) throw new RangeError('FFmpeg returned an invalid silence end.');
      const endMs = Math.max(openStart, Math.min(durationMs, parsed));
      if (endMs > openStart) intervals.push({ startMs: openStart, endMs });
      openStart = null;
    }
  }
  if (openStart !== null && durationMs > openStart) intervals.push({ startMs: openStart, endMs: durationMs });
  return mergeIntervals(intervals, durationMs);
}

function removedBefore(timeMs, removals) {
  return removals.reduce((total, interval) => {
    if (timeMs <= interval.startMs) return total;
    return total + Math.max(0, Math.min(timeMs, interval.endMs) - interval.startMs);
  }, 0);
}

function overlapDuration(cue, removals) {
  return removals.reduce((total, interval) => {
    return total + Math.max(0, Math.min(cue.endMs, interval.endMs) - Math.max(cue.startMs, interval.startMs));
  }, 0);
}

export function buildSilenceTrimPlan(cues, totalDurationMs, intervals, options = {}) {
  asMilliseconds(totalDurationMs, 'Audio duration');
  if (totalDurationMs <= 0) throw new RangeError('Audio duration must be positive.');
  if (!Array.isArray(cues) || !cues.length) throw new TypeError('At least one subtitle cue is required.');
  if (!Array.isArray(intervals)) throw new TypeError('Silence intervals must be an array.');
  const minSilenceMs = options.minSilenceMs ?? 450;
  const keepMs = options.keepMs ?? 100;
  const minimumCueDurationMs = options.minimumCueDurationMs ?? 250;
  for (const [value, name] of [[minSilenceMs, 'Minimum silence'], [minimumCueDurationMs, 'Minimum cue duration']]) {
    if (!Number.isSafeInteger(value) || value <= 0) throw new RangeError(name + ' must be a positive integer.');
  }
  if (!Number.isSafeInteger(keepMs) || keepMs < 0) throw new RangeError('Silence edge retention must be a non-negative integer.');

  let previousEnd = 0;
  for (const [index, cue] of cues.entries()) {
    if (!cue || typeof cue !== 'object') throw new TypeError('Subtitle cues must be objects.');
    asMilliseconds(cue.startMs, 'Cue start');
    asMilliseconds(cue.endMs, 'Cue end');
    if (cue.startMs !== previousEnd || cue.endMs <= cue.startMs) {
      throw new RangeError(index === 0 && cue.startMs !== 0 ? 'Subtitle cues must start at zero.' : 'Subtitle cues must be continuous and have positive duration.');
    }
    if (cue.endMs > totalDurationMs) throw new RangeError('Subtitle cues cannot exceed narration duration.');
    previousEnd = cue.endMs;
  }
  if (previousEnd !== totalDurationMs) throw new RangeError('Subtitle cues must cover the full narration timeline.');

  const detected = mergeIntervals(intervals, totalDurationMs)
    .filter(interval => interval.endMs - interval.startMs >= minSilenceMs);
  const candidates = detected.map(interval => ({
    startMs: interval.startMs === 0 ? interval.startMs : Math.min(interval.endMs, interval.startMs + keepMs),
    endMs: interval.endMs === totalDurationMs ? interval.endMs : Math.max(interval.startMs, interval.endMs - keepMs)
  })).filter(interval => interval.endMs > interval.startMs);

  const removals = [];
  for (const candidate of candidates) {
    const proposed = mergeIntervals([...removals, candidate], totalDurationMs);
    const preservesCues = cues.every(cue => cue.endMs - cue.startMs - overlapDuration(cue, proposed) >= minimumCueDurationMs);
    if (preservesCues) removals.splice(0, removals.length, ...proposed);
  }

  const audioSegments = [];
  let cursor = 0;
  for (const removal of removals) {
    if (removal.startMs > cursor) audioSegments.push({ startMs: cursor, endMs: removal.startMs });
    cursor = Math.max(cursor, removal.endMs);
  }
  if (cursor < totalDurationMs) audioSegments.push({ startMs: cursor, endMs: totalDurationMs });
  if (!audioSegments.length) audioSegments.push({ startMs: 0, endMs: totalDurationMs });

  const removedMs = removals.reduce((total, interval) => total + interval.endMs - interval.startMs, 0);
  const trimmedCues = cues.map(cue => ({
    ...cue,
    startMs: cue.startMs - removedBefore(cue.startMs, removals),
    endMs: cue.endMs - removedBefore(cue.endMs, removals)
  }));
  return {
    audioSegments,
    cues: trimmedCues,
    removedMs,
    durationMs: totalDurationMs - removedMs
  };
}
