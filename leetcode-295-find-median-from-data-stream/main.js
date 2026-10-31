import {EXAMPLES,validateNumbers,medianSteps} from './solver.js';
import {source,codeKey} from './code.js';
import {mountCode,createPlayback} from '/explorer-ui.js';
import {createScene} from '/explorer-scene.js';
const $=id=>document.getElementById(id),view=createScene(),highlight=mountCode(source);
let values=[...EXAMPLES.balance];
function chips(id,values,klass=()=> ''){$(id).replaceChildren(...values.map((v,i)=>{const e=document.createElement('span');e.className=`chip ${klass(i)}`;e.textContent=v;return e;}));}
function render(s){
 const items=[],links=[];
 for(const name of ['max','min']){s[name].forEach((node,i)=>{const depth=Math.floor(Math.log2(i+1)),offset=i-(2**depth-1);items.push({id:node.id,text:String(node.value),position:[(name==='max'?-2.8:2.8)+(offset-(2**depth-1)/2)*3/2**depth,1.5-depth*1.1,0],color:s.heap===name&&s.active.includes(i)?(s.type==='swap'?'#c4a1ed':'#e9c27f'):s.median!==null&&i===0?'#c0f2d5':name==='max'?'#a5e2c5':'#8dcced',active:s.heap===name&&s.active.includes(i)});if(i)links.push([s[name][Math.floor((i-1)/2)].id,node.id]);});
 $(''+name+'-count').textContent=`${s[name].length} VALUES`;
 $(name+'-array').replaceChildren(...s[name].map((node,i)=>{const cell=document.createElement('div');cell.className=`heap-cell ${i===0?'root':''} ${s.heap===name&&s.active.includes(i)?'active':''}`;const index=document.createElement('small');index.textContent=`[${i}]`;cell.append(index,document.createTextNode(node.value));return cell;}));
 }
 const moving=s.moving||(s.type==='incoming'?{id:s.index,value:s.num}:null);if(moving&&!items.some(n=>n.id===moving.id))items.push({id:moving.id,text:String(moving.value),position:[0,2.8,0],color:'#c4a1ed',active:true});view.update(items,links);
 chips('stream',values,i=>i>s.index?'pending':i===s.index?'incoming':'');chips('medians',s.medians);
 const sorted=[...s.seen].sort((a,b)=>a-b);chips('sorted',sorted,i=>i===Math.floor(sorted.length/2)||i===Math.floor((sorted.length-1)/2)?'middle':'');
 $('current').textContent=s.num??'—';$('median').textContent=s.median??'—';$('total').textContent=s.seen.length;$('progress-label').textContent=`${s.seen.length} / ${values.length}`;
 const ordered=!s.min.length||!s.max.length||s.max[0].value<=s.min[0].value,balanced=Math.abs(s.min.length-s.max.length)<=1;
 $('partition').textContent=`${ordered?'✓':'…'} max root ≤ min root${ordered?'':' · transferring'}`;$('partition').classList.toggle('pending',!ordered);$('balance').textContent=`${balanced?'✓':'…'} size difference = ${Math.abs(s.min.length-s.max.length)}${balanced?'':' · rebalancing'}`;$('balance').classList.toggle('pending',!balanced);
 const messages={start:'Ready. Every number enters min first.',incoming:`AddNum(${s.num}): insert into min.`,heapInsert:`Append to ${s.heap}; restore heap order.`,compare:`Compare parent and child in ${s.heap}.`,swap:`Swap to restore ${s.heap}-heap order.`,pop:`Remove the ${s.heap} root for transfer.`,replace:'Move the last entry to the root.',removed:'Root removed; ready to transfer.',transfer:`Transfer the value to ${s.heap}.`,orderCheck:'Check that lower values stay below upper values.',balanceCheck:'Check heap sizes; difference must be at most one.',medianCheck:'Read the root(s) for FindMedian().',median:`Median = ${s.median}`,done:`Complete. Final median = ${s.median}`};
 $('status').textContent=messages[s.type];$('operation').textContent=`${s.context} · ${s.type}`;$('call-stack').textContent=s.context==='FindMedian'?'FindMedian()':`AddNum(${s.num??'…'}) → ${s.context}`;highlight(codeKey(s));
}
const player=createPlayback(()=>{view.clear();return medianSteps(values);},render);
function fields(){$('numbers').value=values.join(', ');}fields();player.reset();
$('example').onchange=()=>{if($('example').value==='custom'){$('editor').open=true;return;}values=[...EXAMPLES[$('example').value]];fields();$('input-error').textContent='';player.reset();};
$('apply').onclick=()=>{try{const text=$('numbers').value.trim();if(!text||!/^[-+\d,\s]+$/.test(text))throw new Error('Enter comma-separated integers.');values=validateNumbers(text.split(/[\s,]+/).filter(Boolean).map(Number));$('example').value='custom';$('input-error').textContent='';player.reset();}catch(e){$('input-error').textContent=e.message;}};
