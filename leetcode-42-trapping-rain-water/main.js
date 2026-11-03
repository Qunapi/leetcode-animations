import {EXAMPLES,validateHeights,trapSteps} from './solver.js';
import {source,lines} from './code.js';
import {mountCode,createPlayback} from '/explorer-ui.js';
const $=id=>document.getElementById(id),highlight=mountCode(source);
let heights=[...EXAMPLES.classic],previous=null;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const NS='http://www.w3.org/2000/svg';
function element(tag,attrs,text){const e=document.createElementNS(NS,tag);for(const [k,v]of Object.entries(attrs))e.setAttribute(k,v);if(text!==undefined)e.textContent=text;return e;}
function render(s){
 const svg=$('terrain'),n=s.height.length,max=Math.max(4,...s.height)+2,unit=280/max,base=330,w=48,offset=50;
 svg.setAttribute('viewBox',`0 0 ${Math.max(420,n*w+80)} 400`);
 svg.replaceChildren();
 for(let level=0;level<=max;level++){
  const y=base-level*unit;
  svg.append(element('line',{x1:35,y1:y,x2:Math.max(400,n*w+50),y2:y,stroke:'#304256','stroke-dasharray':'3 6'}),element('text',{x:24,y:y+4,'text-anchor':'end',class:'axis'},level));
 }
 s.height.forEach((h,i)=>{
  const x=offset+i*w,top=base-(h+s.water[i])*unit,group=element('g',{'aria-label':`Cell ${i}, height ${h}, water ${s.water[i]}${s.resolved[i]?', resolved':', unresolved'}`});
  for(let d=0;d<3;d++)group.append(element('line',{x1:x+8+d*13,x2:x+6+d*13,y1:8,y2:19,class:'rain',style:`--fall:${Math.max(0,top-20)}px;animation-delay:-${(i*0.19+d*0.31)%1.4}s`}));
  group.append(element('rect',{x:x+2,y:base-h*unit,width:w-4,height:h*unit,rx:2,class:'rock'}));
  const water=element('rect',{x:x+2,y:top,width:w-4,height:s.water[i]*unit,class:'water'});group.append(water);
  if(s.water[i])group.append(element('line',{x1:x+2,x2:x+w-2,y1:top,y2:top,class:'surface'}));
  if(s.active===i)group.append(element('rect',{x:x+1,y:top-3,width:w-2,height:(h+s.water[i])*unit+6,rx:3,class:'active-cell'}));
  group.append(element('text',{x:x+w/2,y:base+19,'text-anchor':'middle',class:'axis'},i),element('text',{x:x+w/2,y:base+37,'text-anchor':'middle',class:'height-label'},`h=${h}`));
  if(s.water[i])group.append(element('text',{x:x+w/2,y:top+Math.min(16,s.water[i]*unit/2+4),'text-anchor':'middle',class:'water-label'},`+${s.water[i]}`));
  if(s.l<=s.r&&(i===s.l||i===s.r))group.append(element('text',{x:x+w/2,y:Math.max(30,top-14),'text-anchor':'middle',class:i===s.l?'left-pointer':'right-pointer'},s.l===s.r?'L / R':i===s.l?'L ↓':'R ↓'));
  svg.append(group);
  const before=previous&&previous.height.join(',')===s.height.join(',')?previous.water[i]:0;
  if(!reduced.matches&&before!==s.water[i])water.animate([
   {y:`${base-(h+before)*unit}px`,height:`${before*unit}px`},
   {y:`${top}px`,height:`${s.water[i]*unit}px`}
  ],{duration:450,easing:'ease-out'});
 });
 $('total').textContent=s.res;$('left-max').textContent=s.lMax??'—';$('right-max').textContent=s.rMax??'—';
 $('pointers').textContent=`l = ${s.l} · r = ${s.r}`;$('status').textContent=s.message;
 $('call-stack').textContent=`trap(height) · ${s.type}`;
 const side=s.side;
 const key=s.type==='start'||s.type==='compare'||s.type==='done'?s.type:s.type==='move'?(s.message.includes('left')?'moveLeft':'moveRight'):`${s.type}${side}`;
 highlight(lines[key]);
 $('cells').replaceChildren(...s.height.map((h,i)=>{const e=document.createElement('div');e.className=`cell ${s.active===i?'selected':''}`;e.textContent=`[${i}] ${h} + ${s.resolved[i]?s.water[i]:'?'} water`;return e;}));
 $('terrain').setAttribute('aria-label',`Elevation chart. ${s.message}`);
 previous=s;
}
const player=createPlayback(()=>trapSteps(heights),render);
function reset(){ $('numbers').value=heights.join(', ');$('input-error').textContent='';player.reset(); }
$('example').onchange=()=>{if($('example').value==='custom'){$('editor').open=true;return;}heights=[...EXAMPLES[$('example').value]];reset();};
$('apply').onclick=()=>{try{const text=$('numbers').value.trim();const parsed=text.startsWith('[')?JSON.parse(text):text===''?[]:text.split(',').map(v=>{if(!/^\s*\d+\s*$/.test(v))throw new Error('Enter comma-separated nonnegative integers.');return Number(v);});heights=validateHeights(parsed);$('example').value='custom';reset();}catch(e){$('input-error').textContent=e.message;}};
$('rain-toggle').onchange=()=>{$('terrain').classList.toggle('dry',!$('rain-toggle').checked);};
reset();
