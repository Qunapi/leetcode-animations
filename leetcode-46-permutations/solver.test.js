import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { permutationSteps, validateInput } from './solver.js';

test('advancing from i skips branches after swapping a later candidate into start', () => {
  const input = [1, 2, 3];
  const steps = [...permutationSteps(input)];
  assert.deepEqual(steps.at(-1).results, [
    [1, 2, 3], [1, 3, 2], [2, 1, 3], [2, 3, 1], [3, 2, 1], [3, 1, 2],
  ]);
  const broken = [...permutationSteps(input, true)];
  assert.deepEqual(broken.at(-1).results, [[1, 2, 3], [1, 3, 2], [2, 1, 3], [3, 2, 1]]);
  const jump = broken.find(step => step.type === 'recurse' && step.start === 0 && step.i === 2);
  assert.equal(jump.next, 3);
  assert.deepEqual(broken[broken.indexOf(jump) + 1].stack, [0, 3]);
  assert.deepEqual(jump.array, [3, 2, 1]);
  assert.deepEqual(jump.results, [[1, 2, 3], [1, 3, 2], [2, 1, 3]]);
  assert.deepEqual(broken.at(-1).array, [1, 2, 3]);
  assert.deepEqual(steps.at(-1).array, [1, 2, 3]);
  assert.deepEqual(input, [1, 2, 3]);
});

test('validates input and both modes handle one value', () => {
  assert.deepEqual(validateInput(' -10, 0, 10 '), [-10, 0, 10]);
  for (const input of ['', '1,', '1, 1', '1.5', '11', '1,2,3,4,5']) {
    assert.throws(() => validateInput(input), /distinct integers/);
  }
  for (const mode of [false, true]) {
    assert.deepEqual([...permutationSteps([0], mode)].at(-1).results, [[0]]);
  }
});
