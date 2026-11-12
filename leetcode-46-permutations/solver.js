export function validateInput(text) {
  const tokens = text.split(',').map(token => token.trim());
  const values = tokens.map(Number);
  if (tokens.length > 4 || tokens.some(token => !/^-?\d+$/.test(token)) ||
      values.some(value => value < -10 || value > 10) || new Set(values).size !== values.length) {
    throw new Error('Enter 1–4 distinct integers from −10 to 10, separated by commas.');
  }
  return values;
}

export function* permutationSteps(values, useCandidate = false) {
  const array = [...values];
  const stack = [];
  const results = [];
  const swap = (a, b) => { [array[a], array[b]] = [array[b], array[a]]; };
  const snapshot = (type, start, i = start) => ({
    type, start, i, next: (useCandidate ? i : start) + 1,
    array: [...array], stack: [...stack], results: [...results],
  });

  function* backtrack(start) {
    stack.push(start);
    yield snapshot('enter', start);
    if (start === array.length) {
      results.push([...array]);
      yield snapshot('save', start);
    } else {
      for (let i = start; i < array.length; i++) {
        swap(start, i);
        yield snapshot('swap', start, i);
        yield snapshot('recurse', start, i);
        yield* backtrack((useCandidate ? i : start) + 1);
        swap(start, i);
        yield snapshot('undo', start, i);
      }
    }
    stack.pop();
  }

  yield* backtrack(0);
  yield snapshot('done', 0);
}
