export function* solveSteps(n) {
  if (!Number.isInteger(n) || n < 1 || n > 8) throw new RangeError('Board size must be 1–8');
  const board = Array(n).fill(-1);
  const col = new Set(), d1 = new Set(), d2 = new Set();
  let solutions = 0, attempts = 0;
  const snapshot = (type, row, column = -1, conflicts = []) => ({ type, row, column, conflicts, board: [...board], col: [...col], d1: [...d1], d2: [...d2], solutions, attempts });
  function* backtrack(row) {
    if (row === n) { solutions++; yield snapshot('solution', row); return; }
    for (let i = 0; i < n; i++) {
      attempts++;
      const conflicts = [];
      if (col.has(i)) conflicts.push('col');
      if (d1.has(i - row)) conflicts.push('d1');
      if (d2.has(i + row)) conflicts.push('d2');
      yield snapshot('try', row, i, conflicts);
      if (conflicts.length) { yield snapshot('reject', row, i, conflicts); continue; }
      board[row] = i; col.add(i); d1.add(i - row); d2.add(i + row);
      yield snapshot('place', row, i);
      yield* backtrack(row + 1);
      board[row] = -1; col.delete(i); d1.delete(i - row); d2.delete(i + row);
      yield snapshot('remove', row, i);
    }
  }
  yield snapshot('start', 0);
  yield* backtrack(0);
  yield snapshot('done', 0);
}
