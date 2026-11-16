import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { cacheSteps, parseOperations } from './solver.js';

test('updates promote keys and eviction uses recency within the least frequent bucket', () => {
  const steps = [...cacheSteps(2, parseOperations(
    'put 1 10\nput 2 20\nput 1 11\nget 2\nput 3 30\nget 1\nget 2',
  ))];
  const evicted = steps.find(step => step.line === 'nodes.Remove(removed.Key)');
  assert.equal(evicted.key, 1);
  assert.deepEqual(steps.at(-1).nodes, [{key:2,value:20,freq:3}, {key:3,value:30,freq:1}]);
  assert.equal(steps.at(-1).min, 1);
  assert.ok(steps.some(step => step.line === 'return -1'));
  assert.deepEqual(steps.find(step => step.min === 2).buckets, [[1, []], [2, [1]]]);
  assert.throws(() => parseOperations('get 1 2'), /Line 1/);
});
