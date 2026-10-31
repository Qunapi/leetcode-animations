import test from 'node:test';import assert from 'node:assert/strict';import{medianSteps,EXAMPLES,validateNumbers}from'./solver.js';
test('matches a sorting oracle after every insertion and preserves heap invariants',()=>{
 for(const values of [...Object.values(EXAMPLES),[0],[2,2,2,2],[-2147483648,2147483647,0]]){
  const states=[...medianSteps(values)];assert.deepEqual(states[0].min,[]);
  const outputs=states.filter(s=>s.type==='median');assert.equal(outputs.length,values.length);
  outputs.forEach((s,index)=>{const sorted=values.slice(0,index+1).sort((a,b)=>a-b),middle=Math.floor(sorted.length/2);assert.equal(s.median,sorted.length%2?sorted[middle]:(sorted[middle-1]+sorted[middle])/2);assert.ok(Math.abs(s.min.length-s.max.length)<=1);assert.deepEqual([...s.min,...s.max].map(e=>e.value).sort((a,b)=>a-b),sorted);
   for(const name of ['min','max'])for(let i=1;i<s[name].length;i++){const p=s[name][Math.floor((i-1)/2)].value;assert.ok(name==='min'?p<=s[name][i].value:p>=s[name][i].value);}
   if(s.min.length&&s.max.length)assert.ok(s.max[0].value<=s.min[0].value);
  });
 }
});
test('uses min-first insertion and the supplied order-transfer branch',()=>{
 const states=[...medianSteps([5,2,1])];assert.ok(states.filter(s=>s.type==='incoming').every(s=>s.heap==='min'));
 const transfer=states.find(s=>s.type==='transfer'&&s.context==='orderTransfer');assert.ok(transfer);assert.equal(transfer.heap,'max');assert.equal(transfer.moving.value,1);
 assert.deepEqual(states.at(-1).medians,[5,3.5,2]);
});
test('validates bounded integer input',()=>{for(const value of [[],[NaN],[1.5],['2'],Array(17).fill(1),[2147483648]])assert.throws(()=>validateNumbers(value));});
