import test from'node:test';import assert from'node:assert/strict';import{AutocompleteTrace,EXAMPLES,validateConfig}from'./solver.js';
const run=config=>[...new AutocompleteTrace(config).run()];
test('classic rankings, missing prefix, commit, and learned suggestions',()=>{
 const states=run(EXAMPLES.classic),out=states.at(-1).responses;
 assert.deepEqual(out[0].output,['i love you','island','i love leetcode']);assert.deepEqual(out[1].output,['i love you','i love leetcode']);assert.deepEqual(out[2].output,[]);assert.deepEqual(out[3].output,[]);assert.deepEqual(out[6].output,['i a']);
 const last=states.at(-1);assert.ok(last.frequency.some(([s,n])=>s==='i a'&&n===2));assert.deepEqual(last.nodes[0].top,['i love you','island','i a']);assert.deepEqual(states[0].nodes[0].children,[]);
});
test('frequency descending then ordinal lexical order, and duplicate seed counts use the final assignment',()=>{
 const out=run(EXAMPLES.ties).at(-1).responses;assert.deepEqual(out[0].output,['can','cab','car']);
 const state=run({sentences:['abc','abc','abd'],times:[2,3,4],keys:'a'}).at(-1);assert.deepEqual(state.output,['abd','abc']);assert.equal(new Map(state.frequency).get('abc'),3);
});
test('missing child sets a null cursor, commits the entire new buffer, then finds the learned sentence',()=>{
 const states=run(EXAMPLES.learn);const skipped=states.find(s=>s.type==='deadSkip');assert.equal(skipped.buffer,'azx');assert.equal(skipped.curr,null);assert.equal(skipped.dead,true);assert.deepEqual(states.at(-1).output,['az','azx']);
});
test('live inputs preserve learning, empty commit is harmless, and validation is bounded',()=>{
 const trace=new AutocompleteTrace({sentences:['ab'],times:[1],keys:''});[...trace.run()];[...trace.append('#')];[...trace.append('a')];[...trace.append('z')];[...trace.append('#')];[...trace.append('a')];assert.deepEqual(trace.output,['ab','az']);assert.throws(()=>[...trace.append('A')]);
 for(const config of [{sentences:[],times:[],keys:''},{sentences:['abc'],times:[],keys:''},{sentences:['ABC'],times:[1],keys:''},{sentences:['a'],times:[1],keys:'x'.repeat(17)}])assert.throws(()=>validateConfig(config));
});

test('Top updates add, sort, and visibly evict; queries only copy caches',()=>{
 const states=run(EXAMPLES.classic);
 assert.ok(states.some(s=>s.type==='topAdd'&&s.nodes.find(n=>n.prefix===s.active).top.length===4));
 assert.ok(states.some(s=>s.type==='topRemove'&&s.evicted));
 for(const s of states)for(const node of s.nodes)assert.ok(node.top.length<= (['topAdd','topSort'].includes(s.type)&&node.prefix===s.active?4:3));
 const input=states.filter(s=>s.phase==='input');assert.ok(input.some(s=>s.type==='cachedRead'));assert.ok(!input.some(s=>s.type==='topSort'));
 const first=states.find(s=>s.type==='ready');assert.equal(new Map(first.frequency).has('i a'),false);assert.ok(!first.nodes.some(n=>n.prefix==='i a'));
 const empty=run({sentences:['a'],times:[1],keys:'#'});assert.ok(!empty.some(s=>s.phase==='learn'));assert.equal(new Map(empty.at(-1).frequency).get('a'),1);
});
