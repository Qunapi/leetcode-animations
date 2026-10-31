import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {ladderSteps,validateInput,EXAMPLES} from './solver.js';
import {source,activeLine} from './code.js';
const $=id=>document.getElementById(id);
let input={...EXAMPLES.classic},iterator,state,history=[],cursor=0,playing=false,lastStep=0;
const container=$('scene'),scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(40,1,.1,100);
let renderer;
try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});}catch{container.textContent='WebGL is unavailable. Enable hardware acceleration for the graph. Queue, buckets, and code still work.';}
const controls=renderer?new OrbitControls(camera,renderer.domElement):null;
if(renderer){renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor(0,0);container.append(renderer.domElement);controls.enableDamping=true;controls.enablePan=false;controls.minDistance=5;controls.maxDistance=25;new ResizeObserver(()=>{renderer.setSize(container.clientWidth,container.clientHeight);camera.aspect=container.clientWidth/container.clientHeight;camera.updateProjectionMatrix();}).observe(container);}
scene.add(new THREE.HemisphereLight(0xe4e7ff,0x263349,2.6));const light=new THREE.DirectionalLight(0xb9cfff,3);light.position.set(-4,8,5);scene.add(light);
const graphGroup=new THREE.Group(),edgeGroup=new THREE.Group();scene.add(graphGroup,edgeGroup);
let nodes=new Map(),pulse=null,activeEdge=null,edgeSignature='';
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
function dispose(group){const geometries=new Set(),materials=new Set();group.traverse(obj=>{if(obj.geometry)geometries.add(obj.geometry);if(obj.material)materials.add(obj.material);});geometries.forEach(g=>g.dispose());materials.forEach(m=>{m.map?.dispose();m.dispose();});group.clear();}
function resetCamera(){const aspect=container.clientWidth/container.clientHeight;const distance=Math.max(11.5,5.6/(Math.tan(Math.PI/9)*aspect));camera.position.set(0,distance*.4,distance*.92);controls?.target.set(0,.3,0);controls?.update();}
function buildGraph(){
 dispose(graphGroup);dispose(edgeGroup);nodes=new Map();edgeSignature='';activeEdge=null;
 const words=[...new Set([input.beginWord,...input.wordList,input.endWord])],middle=words.filter(word=>word!==input.beginWord&&word!==input.endWord);
 const geometry=new THREE.SphereGeometry(.23,24,16);
 for(const word of words){
  let x,y,z;
  if(word===input.beginWord){x=-4.2;y=.2;z=0;}else if(word===input.endWord){x=4.2;y=.2;z=0;}else{const i=middle.indexOf(word),angle=i/Math.max(1,middle.length)*Math.PI*2+Math.PI/3;x=Math.cos(angle)*2.65;y=.4+Math.sin(angle*2)*.55;z=Math.sin(angle)*2.25;}
  const node=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:0x7186a9,roughness:.35,metalness:.25}));node.position.set(x,y,z);graphGroup.add(node);
  const canvas=document.createElement('canvas');canvas.width=384;canvas.height=128;const ctx=canvas.getContext('2d');ctx.font='600 62px monospace';ctx.textAlign='center';ctx.strokeStyle='#152234';ctx.lineWidth=8;ctx.strokeText(word,192,87);ctx.fillStyle='#e4ebfa';ctx.fillText(word,192,87);
  const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(canvas),depthTest:false}));sprite.position.set(x,y+.55,z);sprite.scale.set(1.9,.64,1);graphGroup.add(sprite);nodes.set(word,node);
 }
 pulse=new THREE.Mesh(new THREE.SphereGeometry(.085,12,8),new THREE.MeshBasicMaterial({color:0xa4e8ce}));pulse.visible=false;graphGroup.add(pulse);resetCamera();
 $('network-title').textContent=`${input.beginWord} → ${input.endWord}`;
}
function graphEdges(){
 const pairs=new Map();
 for(const bucket of Object.values(state.graph))for(let i=0;i<bucket.length;i++)for(let j=i+1;j<bucket.length;j++){const pair=[bucket[i],bucket[j]].sort();pairs.set(pair.join(','),pair);}
 if(state.queue.length&&nodes.has(input.beginWord))for(const word of input.wordList)if([...word].filter((ch,i)=>ch!==input.beginWord[i]).length===1){const pair=[input.beginWord,word].sort();pairs.set(pair.join(','),pair);}
 return [...pairs.values()];
}
function drawGraph(){
 const pairs=graphEdges(),signature=JSON.stringify([pairs,state.current,state.neighbor,state.path,state.type==='skip']);
 if(signature!==edgeSignature){dispose(edgeGroup);edgeSignature=signature;
  for(const [a,b] of pairs){
   const active=(a===state.current&&b===state.neighbor)||(b===state.current&&a===state.neighbor);
   const pathEdge=state.path.some((word,i)=>i>0&&((word===a&&state.path[i-1]===b)||(word===b&&state.path[i-1]===a)));
   const color=pathEdge?0x9fe5c9:active?(state.type==='skip'?0xd68198:0x83c8f4):0x526886;
   const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints([nodes.get(a).position,nodes.get(b).position]),new THREE.LineBasicMaterial({color,transparent:true,opacity:active||pathEdge?1:.45}));edgeGroup.add(line);
  }
 }
 activeEdge=state.current&&state.neighbor&&state.current!==state.neighbor?{from:nodes.get(state.current)?.position,to:nodes.get(state.neighbor)?.position}:null;
 pulse.visible=!!(activeEdge?.from&&activeEdge?.to);
 for(const [word,node] of nodes){let color=state.visited.includes(word)?0xb297e2:0x7186a9;if(word===input.endWord)color=0xcba468;if(word===state.current)color=0x81c8f5;if(word===state.neighbor&&state.type==='skip')color=0xd68198;if(state.path.includes(word))color=0x9fe5c9;node.material.color.setHex(color);node.scale.setScalar(word===state.current?1.25:1);}
}
const lines=source.split('\n');lines.forEach((text,i)=>{const line=document.createElement('div');line.className='code-line';const num=document.createElement('span');num.className='line-number';num.textContent=String(i+1).padStart(2,'0');line.append(num,document.createTextNode(text));$('code').append(line);});
function message(s){return {
 start:`Check whether the dictionary contains ${input.endWord}.`,missing:`${input.endWord} is absent from wordList. Return 0 without building the graph.`,buildPattern:`Build pattern ${s.pattern} for ${s.current}.`,bucket:`Add ${s.current} to bucket ${s.pattern}.`,seed:`Enqueue ${input.beginWord} and mark it visited. distance = 1.`,level:`Start a level of ${s.levelSize} words. A next neighbor would give distance ${s.distance}.`,dequeue:`Dequeue ${s.current}. ${s.remaining} words remain in this level.`,searchPattern:`Look up ${s.pattern} to find neighbors of ${s.current}.`,check:`Inspect ${s.neighbor} from bucket ${s.pattern}.`,skip:`Skip ${s.neighbor}: already visited.`,visit:`Mark ${s.neighbor} visited before enqueueing it.`,enqueue:`Enqueue ${s.neighbor} for the next BFS level.`,found:`Found ${input.endWord}! The shortest ladder contains ${s.result} words.`,exhausted:'Queue exhausted. No transformation reaches the end. Return 0.',done:s.result?`Complete. Shortest ladder length: ${s.result}.`:'Complete. No word ladder exists for these inputs.'
 }[s.type];}
function renderState(){
 const s=state;$('status').textContent=message(s);$('step-count').textContent=`STEP ${cursor}`;$('back').disabled=!cursor;$('step').disabled=s.type==='done';$('play').disabled=s.type==='done';
 $('distance').textContent=s.distance;$('visited-count').textContent=s.visited.length;$('checks').textContent=s.checks;
 $('queue-meta').textContent=`head = ${s.head} · q.Count = ${s.queue.length}`;
 $('queue').innerHTML='';if(!s.queue.length){const empty=document.createElement('span');empty.className='empty';empty.textContent='Queue starts after pattern buckets are built.';$('queue').append(empty);}
 s.queue.forEach((word,i)=>{const item=document.createElement('span');item.className=`queue-item${i<s.head?' processed':''}${i===s.head?' next':''}`;const label=document.createElement('small');label.textContent=`q[${i}]${i===s.head?' ← head':''}`;item.append(label,document.createTextNode(word));$('queue').append(item);});
 $('level-note').textContent=s.type==='seed'?'Graph ready. The begin word is queued; the next step starts the first BFS level.':`Current level: ${s.levelSize} words · remaining in level: ${s.remaining}. Faded entries are processed; distance counts words in the next candidate ladder.`;
 $('visited').innerHTML='';for(const word of s.visited){const chip=document.createElement('span');chip.className='chip';chip.textContent=word;$('visited').append(chip);}
 if(!s.visited.length)$('visited').textContent='No words visited yet.';
 $('pattern').textContent=s.pattern?`${s.current} → ${s.pattern}`:'No active pattern';$('bucket-count').textContent=`${Object.keys(s.graph).length} PATTERNS`;
 $('buckets').innerHTML='';for(const [key,words] of Object.entries(s.graph)){const row=document.createElement('div');row.className=`bucket${key===s.pattern?' active':''}`;const name=document.createElement('b');name.textContent=key;row.append(name,document.createTextNode(words.join(' · ')));$('buckets').append(row);}
 const activeBucket=$('buckets').querySelector('.active');if(activeBucket)$('buckets').scrollTop=Math.max(0,activeBucket.offsetTop-$('buckets').offsetTop-60);
 $('answer').textContent=s.result===null?'NOT FOUND YET':`${s.result} WORDS`;$('path').innerHTML='';
 if(!s.path.length){const empty=document.createElement('span');empty.className='empty';empty.textContent=s.result===0?'No route through this dictionary.':'The path appears when BFS finds the end.';$('path').append(empty);}
 s.path.forEach((word,i)=>{if(i)$('path').append(document.createTextNode(' → '));const step=document.createElement('span');step.className='path-word';step.textContent=word;$('path').append(step);});
 const lineIndex=activeLine(s);[...$('code').children].forEach((line,i)=>line.classList.toggle('selected',i===lineIndex));if($('follow-code').checked&&lineIndex>=0)$('code').scrollTop=Math.max(0,$('code').children[lineIndex].offsetTop-$('code').clientHeight/2);
 $('call-stack').textContent=['start','missing','buildPattern','bucket'].includes(s.type)?'LadderLength(…)':'LadderLength → Bfs()';
 container.setAttribute('aria-label',`Word network from ${input.beginWord} to ${input.endWord}. ${message(s)} Visited ${s.visited.length} words.`);drawGraph();
}
function pause(){playing=false;$('play').textContent='▶ Play';}
function reset(){pause();iterator=ladderSteps(input);state=iterator.next().value;if($('skip-build').checked)while(!['seed','done'].includes(state.type))state=iterator.next().value;history=[state];cursor=0;buildGraph();renderState();}
function advance(){if(cursor+1===history.length){const next=iterator.next();if(next.done)return;history.push(next.value);}state=history[++cursor];renderState();if(state.type==='done')pause();}
function fillInputs(){$('begin').value=input.beginWord;$('end').value=input.endWord;$('dictionary').value=input.wordList.join(', ');}
$('play').onclick=()=>{playing=!playing;$('play').textContent=playing?'Ⅱ Pause':'▶ Play';lastStep=performance.now();};
$('step').onclick=()=>{pause();advance();};$('back').onclick=()=>{if(cursor){pause();state=history[--cursor];renderState();}};$('restart').onclick=reset;$('camera').onclick=resetCamera;
$('skip-build').onchange=reset;
$('speed').oninput=()=>{$('speed-value').textContent=`${$('speed').value}×`;};
$('example').onchange=()=>{if($('example').value==='custom'){$('editor').open=true;$('begin').focus();return;}input=validateInput(EXAMPLES[$('example').value]);fillInputs();$('input-error').textContent='';reset();};
$('apply').onclick=()=>{try{input=validateInput({beginWord:$('begin').value.trim(),endWord:$('end').value.trim(),wordList:$('dictionary').value.trim()?$('dictionary').value.trim().split(/[,\s]+/):[]});$('input-error').textContent='';$('example').value='custom';reset();}catch(error){$('input-error').textContent=error.message;}};
fillInputs();reset();
function animate(time){requestAnimationFrame(animate);if(playing&&time-lastStep>=1500/Number($('speed').value)){advance();lastStep=time;}if(pulse?.visible){const t=reducedMotion.matches?.5:(time/650)%1;pulse.position.lerpVectors(activeEdge.from,activeEdge.to,t);}controls?.update();renderer?.render(scene,camera);}
requestAnimationFrame(animate);
