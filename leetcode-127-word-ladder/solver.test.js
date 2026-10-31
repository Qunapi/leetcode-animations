import test from 'node:test';
import assert from 'node:assert/strict';
import {ladderSteps,EXAMPLES,validateInput} from './solver.js';
const run=input=>[...ladderSteps(input)].at(-1);
test('known shortest lengths and no-route cases',()=>{
 assert.equal(run(EXAMPLES.classic).result,5);assert.equal(run(EXAMPLES.direct).result,2);assert.equal(run(EXAMPLES.unreachable).result,0);assert.equal(run(EXAMPLES.missing).result,0);
 assert.deepEqual(run(EXAMPLES.classic).path,['hit','hot','dot','dog','cog']);
});
test('keeps wildcard order, list queue, level increments, and source snapshots',()=>{
 const states=[...ladderSteps(EXAMPLES.classic)];
 assert.deepEqual(states.filter(s=>s.type==='level').map(s=>s.distance),[2,3,4,5]);
 assert.equal(states.find(s=>s.type==='buildPattern').pattern,'*ot');
 assert.deepEqual(states.filter(s=>s.type==='dequeue').map(s=>s.current),['hit','hot','dot','lot','dog']);
 assert.deepEqual(states[0].graph,{});assert.deepEqual(states[0].queue,[]);
 for(const s of states){assert.ok(s.head<=s.queue.length);assert.equal(new Set(s.visited).size,s.visited.length);if(s.type==='skip')assert.ok(s.visited.includes(s.neighbor));}
 const final=states.at(-1);assert.ok(!final.visited.includes('cog'),'Original returns before marking the end visited');
 for(let i=1;i<final.path.length;i++)assert.equal([...final.path[i]].filter((ch,j)=>ch!==final.path[i-1][j]).length,1);
});
test('missing end exits before building patterns, and duplicate dictionary words are deduplicated',()=>{
 assert.ok([...ladderSteps(EXAMPLES.missing)].every(s=>Object.keys(s.graph).length===0));
 assert.equal(run({...EXAMPLES.classic,wordList:[...EXAMPLES.classic.wordList,'hot']}).result,5);
});
test('validates user input',()=>{
 for(const value of [{beginWord:'HIT',endWord:'cog',wordList:[]},{beginWord:'hit',endWord:'hit',wordList:[]},{beginWord:'a',endWord:'b',wordList:[]},{beginWord:'hit',endWord:'cog',wordList:['tooLong']},{beginWord:'hit',endWord:'cog',wordList:Array(17).fill('hot')}])assert.throws(()=>validateInput(value));
});
