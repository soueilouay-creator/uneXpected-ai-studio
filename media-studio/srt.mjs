const TIMESTAMP = /^(\d{2,}):(\d{2}):(\d{2})[,.](\d{3})$/;

function parseTimestamp(value) {
  const match = TIMESTAMP.exec(String(value).trim());
  if (!match) throw new Error('Invalid SRT timestamp: ' + value);
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3]);
  const milliseconds = Number(match[4]);
  if (minutes > 59 || seconds > 59) throw new Error('Invalid SRT timestamp: ' + value);
  return (((hours * 60 + minutes) * 60) + seconds) * 1000 + milliseconds;
}

export function parseSrt(source) {
  if (typeof source !== 'string') throw new TypeError('SRT source must be text.');
  const normalized = source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').trim();
  if (!normalized) return [];
  const blocks = normalized.split(/\n[ \t]*\n+/);
  const cues = [];
  for (const block of blocks) {
    const lines = block.split('\n');
    let timingLine = lines.findIndex(line => line.includes('-->'));
    if (timingLine < 0) throw new Error('SRT cue is missing its timing line.');
    const match = /^\s*(\d{2,}:\d{2}:\d{2}[,.]\d{3})\s*-->\s*(\d{2,}:\d{2}:\d{2}[,.]\d{3})(?:\s+.*)?$/.exec(lines[timingLine]);
    if (!match) throw new Error('Invalid SRT timestamp range: ' + lines[timingLine]);
    const startMs = parseTimestamp(match[1]);
    const endMs = parseTimestamp(match[2]);
    if (endMs <= startMs) throw new Error('Cue end must be after cue start.');
    const preceding = lines.slice(0, timingLine).join('').trim();
    const explicitIndex = preceding && /^\d+$/.test(preceding) ? Number(preceding) : cues.length + 1;
    const text = lines.slice(timingLine + 1).join('\n').trim();
    if (!text) throw new Error('SRT cue text cannot be empty.');
    cues.push({ index: explicitIndex, startMs, endMs, text });
  }
  return cues;
}

export function formatSrtTimestamp(milliseconds) {
  if (!Number.isSafeInteger(milliseconds) || milliseconds < 0) throw new RangeError('Timestamp must be a non-negative safe integer.');
  const hours = Math.floor(milliseconds / 3600000);
  const minutes = Math.floor((milliseconds % 3600000) / 60000);
  const seconds = Math.floor((milliseconds % 60000) / 1000);
  const millis = milliseconds % 1000;
  return [hours, minutes, seconds].map(value => String(value).padStart(2, '0')).join(':') + ',' + String(millis).padStart(3, '0');
}
