function positiveInteger(value, name) {
  if (!Number.isSafeInteger(value) || value <= 0) throw new RangeError(name + ' must be a positive integer.');
}

function distribute(total, parts) {
  const base = Math.floor(total / parts);
  const remainder = total % parts;
  return Array.from({ length: parts }, (_, index) => base + (index < remainder ? 1 : 0));
}

export function buildGridCropFilters({ width, height, rows, columns }) {
  positiveInteger(width, 'Image dimensions');
  positiveInteger(height, 'Image dimensions');
  positiveInteger(rows, 'Grid rows');
  positiveInteger(columns, 'Grid columns');
  if (rows > height || columns > width) throw new RangeError('Grid must not create zero-sized cells.');
  const widths = distribute(width, columns);
  const heights = distribute(height, rows);
  const xOffsets = [];
  const yOffsets = [];
  widths.reduce((offset, size, index) => (xOffsets[index] = offset, offset + size), 0);
  heights.reduce((offset, size, index) => (yOffsets[index] = offset, offset + size), 0);
  const cells = [];
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      cells.push({
        index: row * columns + column,
        x: xOffsets[column],
        y: yOffsets[row],
        width: widths[column],
        height: heights[row]
      });
    }
  }
  return cells;
}
