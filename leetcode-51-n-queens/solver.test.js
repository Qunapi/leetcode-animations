import test from 'node:test';
import assert from 'node:assert/strict';
import { solveSteps } from './solver.js';
test('matches known solution counts and preserves valid sets at every step', () => {
  for (const [n, count] of [[1,1],[2,0],[3,0],[4,2],[5,10],[6,4],[7,40],[8,92]]) {
    let final;
    for(const s of solveSteps(n)) {
      const positions=s.board.flatMap((c,r)=>c<0?[]:[[r,c]]);
      assert.equal(new Set(positions.map(([,c])=>c)).size,positions.length);
      for(const [key,values] of [['col',positions.map(([,c])=>c)],['d1',positions.map(([r,c])=>c-r)],['d2',positions.map(([r,c])=>c+r)]]) {
        assert.equal(new Set(values).size,positions.length);
        assert.deepEqual([...s[key]].sort((a,b)=>a-b),values.sort((a,b)=>a-b));
      }
      if(s.type==='solution') assert.equal(positions.length,n);
      if(s.type==='reject') assert.ok(s.conflicts.length);
      final=s;
    }
    assert.equal(final.solutions,count);assert.equal(final.type,'done');assert.ok(final.board.every(c=>c===-1));
  }
});
test('rejects invalid board sizes',()=>{for(const n of [0,9,2.5,NaN]) assert.throws(()=>solveSteps(n).next(),RangeError);});
