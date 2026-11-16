import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { permutationSteps, recursionTrace, validateInput } from './solver.js';

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

test('tree follows recursive calls and reveals missing permutations in reversible steps', () => {
  const correct = recursionTrace([1, 2, 3], false);
  const broken = recursionTrace([1, 2, 3], true);
  assert.equal(correct.nodes.filter(node => node.leaf).length, 6);
  assert.equal(broken.nodes.filter(node => node.leaf && !node.ghost).length, 4);
  assert.equal(broken.nodes.filter(node => node.skipped).length, 3);
  assert.deepEqual(broken.nodes.filter(node => node.ghost && node.leaf).map(node => node.array), [
    [2, 3, 1], [3, 1, 2],
  ]);
  assert.equal(broken.nodes.filter(node => node.children.length === 0).length, 6);
  assert.ok(broken.nodes.every(node => node.skipAt === undefined));
  assert.equal(broken.links.length, broken.nodes.length - 1);
  for (const step of broken.steps.filter(step => step.type === 'enter')) {
    const node = broken.nodes[step.active];
    assert.equal(step.seen, node.id + 1);
    assert.equal(node.text, `[${step.array.join(', ')}]`);
    assert.match(node.detail, new RegExp(`^start ${step.start}( |$)`));
    assert.ok(node.position.every(Number.isFinite));
  }
  const shared = broken.swaps.find(node => node.text === '[2, 1, 3]');
  assert.equal(broken.steps[shared.skipAt].type, 'undo');
  assert.equal(broken.steps[shared.skipAt].next, 2);
  assert.deepEqual(shared.children.map(node => node.detail), ['start 2 · i 1', 'start 1 · i 1']);
  assert.deepEqual(shared.children[1].children[0].array, [2, 3, 1]);
  assert.ok(broken.sceneLinks.some(([parent, child]) => parent === 0 && child === shared.id));
  assert.equal(correct.swaps.length, 0);
  const parents = new Map(broken.links.map(([parent, child]) => [child, parent]));
  for (const step of broken.steps) {
    assert.equal(step.stackIds.length, step.stack.length);
    assert.equal(step.stackIds.at(-1), step.active);
    step.stackIds.slice(1).forEach((child, index) => {
      assert.equal(parents.get(child), step.stackIds[index]);
    });
  }
  const reveals = broken.steps.filter(step => step.type === 'missing');
  assert.deepEqual(reveals.map(step => step.missing), [
    [[2, 3, 1]],
    [[2, 3, 1], [3, 1, 2]],
  ]);
  assert.equal(broken.steps.at(-1).type, 'done');
});
