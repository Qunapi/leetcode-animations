import test from 'node:test';
import assert from 'node:assert/strict';
import {trapSteps,validateHeights,EXAMPLES} from './solver.js';
import {source,lines} from './code.js';
function oracle(a){return a.map((h,i)=>Math.min(Math.max(...a.slice(0,i+1)),Math.max(...a.slice(i)))-h);}
test('examples, endpoints, and degenerate inputs',()=>{
 for(const [a,total]of [[EXAMPLES.classic,6],[EXAMPLES.basin,9],[[],0],[[3],0],[[2,0],0],[[0,0,0],0],[[1,2,3],0],[[3,2,1],0]]){
  const steps=[...trapSteps(a)],last=steps.at(-1);assert.equal(last.res,total);assert.deepEqual(last.water,oracle(a));assert.equal(last.type,'done');
 }
});
test('all bounded small arrays match independent boundary oracle',()=>{
 for(let code=0;code<4096;code++){
  let k=code;const a=Array.from({length:6},()=>{const v=k%4;k=Math.floor(k/4);return v;});
  const steps=[...trapSteps(a)],last=steps.at(-1);assert.deepEqual(last.water,oracle(a));assert.equal(last.res,last.water.reduce((a,b)=>a+b,0));
  for(let j=0;j<steps.length;j++){const s=steps[j];assert.equal(s.res,s.water.reduce((a,b)=>a+b,0));assert.ok(s.water.every(v=>v>=0));if(s.type==='fill'){const prev=steps[j-1];assert.equal(prev.type,'maximum');assert.equal(s.active,prev.active);assert.equal(s.water[s.active],(s.side==='Left'?s.lMax:s.rMax)-a[s.active]);}}
 }
});
test('ties resolve right first and snapshots do not mutate during replay',()=>{
 const iterator=trapSteps([3,0,1,3]);const first=iterator.next().value,copy=structuredClone(first),rest=[...iterator];assert.equal(rest.find(s=>s.type==='fill').active,2);assert.deepEqual(first,copy);assert.notEqual(rest[0].water,rest[1].water);
});
test('input validation and defensive copy',()=>{
 for(const bad of [null,[-1],[1.5],[21],['2'],Array(33).fill(0)])assert.throws(()=>validateHeights(bad));
 const a=[1,0,1],b=validateHeights(a);b[0]=0;assert.equal(a[0],1);
});
test('displayed code remains executable and line markers point to operations',()=>{
 const trap=Function(`${source}; return trap;`)();assert.equal(trap(EXAMPLES.classic),6);
 const code=source.split('\n');assert.match(code[lines.compare],/if \(lMax < rMax\)/);assert.match(code[lines.fillLeft],/res \+=/);assert.match(code[lines.fillRight],/res \+=/);assert.match(code[lines.done],/return res/);
});
