import test from 'node:test';
import assert from 'node:assert/strict';
import { flowSteps, EXAMPLES, validateHeights } from './solver.js';
const run = grid => [...flowSteps(grid)].at(-1);
test('classic example and meaningful edge cases', () => {
  assert.deepEqual(run(EXAMPLES.classic).result, [[0,4],[1,3],[1,4],[2,2],[3,0],[3,1],[4,0]]);
  assert.equal(run(EXAMPLES.plateau).result.length, 9);
  assert.deepEqual(run(EXAMPLES.single).result, [[0,0]]);
  assert.deepEqual(run([[1,2,3]]).result, [[0,0],[0,1],[0,2]]);
  assert.equal(run(EXAMPLES.basin).result.length, 12);
});
test('preserves repeated border calls, queue head, direction order, and independent snapshots', () => {
  const steps = [...flowSteps(EXAMPLES.classic)];
  const calls = steps.filter(s => s.type === 'call');
  assert.equal(calls.length, 20);
  assert.deepEqual(calls.slice(0,4).map(s => [s.ocean,s.current]), [['pacific',[0,0]],['atlantic',[0,4]],['pacific',[1,0]],['atlantic',[1,4]]]);
  const firstDequeue = steps.findIndex(s => s.type === 'dequeue');
  assert.equal(steps[firstDequeue].head, 1);
  assert.deepEqual(steps.slice(firstDequeue+1).find(s=>s.type==='check').candidate, [0,1]);
  assert.ok(steps[0].pacific.every(row => row.every(v => !v)));
  assert.equal(calls.at(-1).calls, 20);
  for (const s of steps) {
    assert.ok(s.head <= s.queue.length);
    if (s.type === 'visit') {
      const [r,c] = s.current, [nr,nc] = s.candidate;
      assert.ok(EXAMPLES.classic[r][c] <= EXAMPLES.classic[nr][nc]);
      assert.equal(s[s.ocean][nr][nc], true);
    }
  }
});
test('rejects invalid input', () => {
  for(const grid of [[],[[]],[[1],[1,2]],[[NaN]],[[101]],[[1.5]],[["2"]],Array.from({length:9},()=>[1])]) assert.throws(() => validateHeights(grid));
});

test('downhill per-cell search agrees with reverse BFS and only travels downhill', async () => {
  const { downhillSteps } = await import('./solver.js');
  const grids=[...Object.values(EXAMPLES),[[1,2,1],[3,0,4]],[[0,0],[0,0]]];
  for(const grid of grids) {
    let final;
    for(const step of downhillSteps(grid)) {
      if(step.type==='visit')assert.ok(grid[step.current[0]][step.current[1]]>=grid[step.candidate[0]][step.candidate[1]]);
      if(step.type==='call')assert.ok(step.visited.flat().every(v=>!v));
      assert.ok(step.head<=step.queue.length);final=step;
    }
    assert.deepEqual(final.result,run(grid).result);
    assert.equal(final.calls,grid.length*grid[0].length);
  }
  const plateau=[...downhillSteps(EXAMPLES.plateau)].at(-1);
  assert.ok(plateau.checks>run(EXAMPLES.plateau).checks);
});


test('coastal discharge includes both oceans and every edge of a single cell', async () => {
  const { oceanOutlets, downhillSteps } = await import('./solver.js');
  assert.deepEqual(oceanOutlets(1,1,3,3),[]);
  assert.deepEqual(oceanOutlets(0,2,3,3).map(o=>[o.ocean,o.side]),[['pacific','top'],['atlantic','right']]);
  assert.equal(oceanOutlets(0,0,1,1).length,4);
  for(const run of [downhillSteps,flowSteps]){
    const steps=[...run([[7]])];
    assert.deepEqual(new Set(steps.filter(s=>s.type==='outlet').map(s=>s.outlet.ocean)),new Set(['pacific','atlantic']));
    assert.deepEqual(steps.at(-1).result,[[0,0]]);
  }
});


test('branching 3 by 3 peak drains toward both oceans through different paths', () => {
  assert.deepEqual(run(EXAMPLES.classic3).result,[[0,2],[1,1],[2,0]]);
});


test('persistent interior links survive later steps and connect reverse-visited cells to coasts', async () => {
  const { downhillSteps, oceanOutlets } = await import('./solver.js');
  const grid=EXAMPLES.classic3;
  const steps=[...downhillSteps(grid)];
  const branching=steps.find(s=>s.origin?.[0]===1&&s.origin?.[1]===1&&s.edges.length===4&&s.type==='dequeue');
  assert.ok(branching);
  assert.deepEqual(new Set(branching.edges.map(e=>e.to.join(','))),new Set(['1,2','1,0','2,1','0,1']));
  assert.ok(branching.edges.every(e=>e.from.join(',')==='1,1'));
  assert.equal(steps[0].edges.length,0);
  assert.ok(steps.filter(s=>s.type==='call').every(s=>s.edges.length===0));
  for(const run of [downhillSteps,flowSteps])for(const s of run(grid))for(const edge of s.edges) {
    assert.ok(grid[edge.from[0]][edge.from[1]]>=grid[edge.to[0]][edge.to[1]],'Rendered water must always move downhill or level');
  }
  const final=run(grid);
  for(const ocean of ['pacific','atlantic'])for(let r=0;r<3;r++)for(let c=0;c<3;c++)if(final[ocean][r][c]) {
    let cell=[r,c],length=0;
    while(!oceanOutlets(...cell,3,3,ocean).length){
      const edge=final.edges.find(e=>e.ocean===ocean&&e.from.join(',')===cell.join(','));
      assert.ok(edge,`Missing visible path from ${cell} to ${ocean}`);cell=edge.to;assert.ok(++length<=9);
    }
  }
});
