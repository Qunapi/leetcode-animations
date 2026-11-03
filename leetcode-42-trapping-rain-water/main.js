import {createRainScene} from './scene.js?v=small-bottom-labels-7';
import {EXAMPLES,validateHeights,trapSteps} from './solver.js?v=small-bottom-labels-7';
import {source,lines} from './code.js?v=small-bottom-labels-7';
import {mountCode,createPlayback} from '/explorer-ui.js';
const $=id=>document.getElementById(id),highlight=mountCode(source);
let heights=[...EXAMPLES.classic];
const view=createRainScene($('scene'));
function render(s){
 view.update(s);
 $('minimum-level').textContent=s.height.length?Math.min(s.lMax,s.rMax):'—';
 $('level-formula').textContent=s.height.length?`min(${s.lMax}, ${s.rMax}) = ${Math.min(s.lMax,s.rMax)}`:'No boundaries for an empty array';
 $('total').textContent=s.res;$('left-max').textContent=s.lMax??'—';$('right-max').textContent=s.rMax??'—';
 $('pointers').textContent=`l = ${s.l} · r = ${s.r}`;$('status').textContent=s.message;
 $('call-stack').textContent=`trap(height) · ${s.type}`;
 const side=s.side;
 const key=s.type==='start'||s.type==='compare'||s.type==='done'?s.type:s.type==='move'?(s.message.includes('left')?'moveLeft':'moveRight'):`${s.type}${side}`;
 highlight(lines[key]);
 $('cells').replaceChildren(...s.height.map((h,i)=>{const e=document.createElement('div');e.className=`cell ${s.active===i?'selected':''}`;e.textContent=`[${i}] ${h} + ${s.resolved[i]?s.water[i]:'?'} water`;return e;}));
 $('scene').setAttribute('aria-label',`One row of 3D columns. ${s.message}`);
}
const player=createPlayback(()=>trapSteps(heights),render);
function reset(){ $('numbers').value=heights.join(', ');$('input-error').textContent='';player.reset(); }
$('example').onchange=()=>{if($('example').value==='custom'){$('editor').open=true;return;}heights=[...EXAMPLES[$('example').value]];reset();};
$('apply').onclick=()=>{try{const text=$('numbers').value.trim();const parsed=text.startsWith('[')?JSON.parse(text):text===''?[]:text.split(',').map(v=>{if(!/^\s*\d+\s*$/.test(v))throw new Error('Enter comma-separated nonnegative integers.');return Number(v);});heights=validateHeights(parsed);$('example').value='custom';reset();}catch(e){$('input-error').textContent=e.message;}};
$('rain-toggle').onchange=()=>view.setRain($('rain-toggle').checked);
$('camera').onclick=view.resetCamera;
$('front-view').onclick=view.frontView;
reset();
