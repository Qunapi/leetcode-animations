import { flowSteps, downhillSteps, EXAMPLES, validateHeights } from './solver.js';
import { createIsland } from './island.js';
import { reverseSource, downhillSource } from './code.js';
const $ = id => document.getElementById(id);
let mode='downhill';
let heights=EXAMPLES.classic.map(row=>[...row]), iterator, history=[], cursor=0, state, playing=false, lastStep=0;
const container=$('scene'),island=createIsland(container);
function buildTerrain(){
 island.rebuild(heights);
 const m=heights.length,n=heights[0].length;
 $('terrain-title').textContent=`${m} × ${n} island`;
 for(const ocean of ['pacific','atlantic','visited']){
  const matrix=$(`${ocean}-matrix`);matrix.innerHTML='';matrix.style.gridTemplateColumns=`repeat(${n},minmax(0,1fr))`;matrix.style.maxWidth=`${n*31}px`;
  for(let r=0;r<m;r++)for(let c=0;c<n;c++){const cell=document.createElement('span');cell.className='cell';cell.dataset.row=r;cell.dataset.col=c;matrix.append(cell);}
 }
}
let sourceLines=[];
function buildCode(){
 sourceLines=(mode==='downhill'?downhillSource:reverseSource).split('\n');$('code').innerHTML='';
 sourceLines.forEach((text,i)=>{const div=document.createElement('div');div.className='code-line';const num=document.createElement('span');num.className='line-number';num.textContent=String(i+1).padStart(2,'0');div.append(num,document.createTextNode(text));$('code').append(div);});
}
function codeLine(s){
 const keys=mode==='downhill'
  ?{start:'int m =',call:'var visited =',seed:'visited[i, j] =',enqueue:s.candidate?'q.Add(new[] { nr':'q.Add(new[] { i',dequeue:'q[head++]',coast:'if (r == 0',outlet:s.outlet?.ocean==='atlantic'?'if (r == m - 1':'if (r == 0',check:'if (nr >=',reject:'!visited[nr, nc]',visit:'visited[nr, nc] =',classify:'if (reachesPacific',return:'if (reachesPacific',result:'res.Add(',done:'return res;'}
  :{start:'int m =',call:'void Bfs(',seed:'ocean[i, j] =',enqueue:s.candidate?'q.Add(new[] { nr':'q.Add(new[] { i',dequeue:'q[head++]',outlet:'ocean[i, j] =',check:'if (nr >=',reject:'!ocean[nr, nc]',visit:'ocean[nr, nc] =',return:'while (q.Count',scan:'if (pacific[i, j]',result:'res.Add(',done:'return res;'};
 return sourceLines.findIndex(line=>line.includes(keys[s.type]));
}
const coords=cell=>cell?`[${cell.join(', ')}]`:'—';
const inside=cell=>cell&&cell[0]>=0&&cell[0]<heights.length&&cell[1]>=0&&cell[1]<heights[0].length;
const same=(a,b)=>a&&b&&a[0]===b[0]&&a[1]===b[1];
function statusText(s){
 if(s.type==='outlet')return `Water from ${coords(s.outlet.cell)} flows over the ${s.outlet.side} edge into the ${s.outlet.ocean==='pacific'?'Pacific':'Atlantic'} Ocean.`;
 if(mode==='downhill'){
  const messages={start:'Ready. Pour water at each cell and follow every downhill path.',call:`New source ${coords(s.origin)}. Start a fresh downhill search.`,seed:`Water lands at ${coords(s.current)}. Mark this source visited.`,enqueue:`Water can reach ${coords(s.candidate||s.current)}. Enqueue this cell.`,dequeue:`Follow the water at ${coords(s.current)}. Head is now ${s.head}.`,coast:`Source ${coords(s.origin)}: Pacific ${s.reachesPacific?'reached':'not reached yet'} · Atlantic ${s.reachesAtlantic?'reached':'not reached yet'}.`,check:`Can water flow from ${coords(s.current)} to ${coords(s.candidate)}?`,visit:`Downhill or level: water flows to ${coords(s.candidate)}.`,classify:`Source ${coords(s.origin)} finishes: Pacific ${s.reachesPacific?'yes':'no'}, Atlantic ${s.reachesAtlantic?'yes':'no'}.`,result:`Both coasts reached! Save source ${coords(s.origin)}.`,return:'Drain this search. Repeat the work from the next cell.',done:`Complete. ${s.result.length} source cells reach both oceans.`};
  if(s.type==='reject')return s.reason==='outside'?`Ocean boundary ${coords(s.candidate)}: already counted, not a grid cell to enqueue.`:s.reason==='visited'?`${coords(s.candidate)} already got water in this search. Skip the cycle.`:`Blocked: ${coords(s.candidate)} is uphill. Real water cannot climb.`;
  return messages[s.type];
 }
 const ocean=s.ocean==='pacific'?'Pacific':'Atlantic';
 const messages={start:'Ready. Start reverse BFS from the ocean borders.',call:`${ocean}: start a fresh Bfs(${s.origin?.join(', ')}).`,seed:`Mark border cell ${coords(s.current)} as reachable from the ${ocean}.`,enqueue:`Enqueue ${coords(s.candidate||s.current)}. Queue length is now ${s.queue.length}.`,dequeue:`Dequeue ${coords(s.current)} and advance head to ${s.head}.`,check:`Check neighbor ${coords(s.candidate)} from ${coords(s.current)}.`,visit:`Uphill or level: mark ${coords(s.candidate)} reachable from the ${ocean}.`,return:'This BFS queue is exhausted. Continue to the next border start.',scan:`Scan ${coords(s.current)}: does it reach both oceans?`,result:`Yes! Add ${coords(s.current)} to the result.`,done:`Complete. ${s.result.length} ${s.result.length===1?'cell can':'cells can'} flow to both oceans.`};
 if(s.type==='reject')return s.reason==='outside'?`Skip ${coords(s.candidate)}: outside the grid.`:s.reason==='visited'?`Skip ${coords(s.candidate)}: already visited by the ${ocean} search.`:`Skip ${coords(s.candidate)}: lower terrain cannot be reached in reverse flow.`;
 return messages[s.type];
}
function renderState(follow=true){
 const s=state,m=heights.length,n=heights[0].length;
 $('status').textContent=statusText(s);$('status-dot').style.color=s.type==='reject'?'#efa2a5':'#7bc8ed';$('step-count').textContent=`STEP ${cursor}`;
 $('back').disabled=cursor===0;$('step').disabled=s.type==='done';$('play').disabled=s.type==='done';
 $('calls').innerHTML=`${s.calls}<span>/ ${mode==='downhill'?m*n:2*(m+n)}</span>`;$('checks').textContent=s.checks;$('found').textContent=s.result.length;
 $('ocean-badge').textContent=mode==='downhill'?(s.type==='done'?'COMPLETE':`SOURCE ${coords(s.origin)}`):s.type==='start'?'NOT STARTED':s.ocean?s.ocean.toUpperCase():'FINAL INTERSECTION';$('ocean-badge').style.color=s.ocean==='pacific'?'#7bc8ed':s.ocean==='atlantic'?'#69ceb7':'#b9a0ed';
 $('call-label').textContent=mode==='downhill'?(s.origin?`WaterFrom(${s.origin.join(', ')})`:'Waiting for source') :s.ocean?`Bfs(${s.origin.join(', ')}, ${s.ocean})`:'PacificAtlantic(heights)';
 $('direction-label').textContent=`Neighbor order: right → left → down → up · ${s.edges.length} persistent water links`;
 $('queue-meta').textContent=`head = ${s.head} · q.Count = ${s.queue.length} · pending = ${s.queue.length-s.head}`;
 const queue=$('queue');queue.innerHTML='';
 if(!s.queue.length){const empty=document.createElement('span');empty.className='empty';empty.textContent=s.type==='start'?'Start playback to enqueue the first border cell.':'Queue empty.';queue.append(empty);}
 s.queue.forEach((cell,i)=>{const div=document.createElement('div');div.className=`queue-item${i<s.head?' processed':''}${i===s.head?' next':''}${s.type==='enqueue'&&i===s.queue.length-1?' added':''}`;const index=document.createElement('small');index.textContent=i===s.head?`q[${i}] ← head`:`q[${i}]`;if(i===s.head)index.className='head-marker';div.append(index,document.createTextNode(coords(cell)));queue.append(div);});
 if(s.type==='enqueue')queue.scrollLeft=queue.scrollWidth;
 else if(s.type==='dequeue'&&queue.children[s.head])queue.scrollLeft=Math.max(0,queue.children[s.head].offsetLeft-queue.offsetLeft-10);
 for(const ocean of ['pacific','atlantic']){
  $(`${ocean}-count`).textContent=`${s[ocean].flat().filter(Boolean).length}/${m*n}`;
  [...$(`${ocean}-matrix`).children].forEach(cell=>{const r=Number(cell.dataset.row),c=Number(cell.dataset.col),active=s[ocean][r][c];cell.textContent=active?'1':'0';cell.classList.toggle('active',active);cell.classList.toggle('focus',same(s.current,[r,c]));cell.classList.toggle('neighbor',(mode==='downhill'||s.ocean===ocean)&&same(s.candidate,[r,c]));cell.setAttribute('aria-label',`${ocean} row ${r}, column ${c}: ${active?'reachable':mode==='downhill'?'not confirmed':'not visited'}`);});
 }
 let comparison=s.current?`Current ${coords(s.current)} · height ${heights[s.current[0]][s.current[1]]}`:'Waiting for the first border call.';
 if(s.candidate)comparison+=inside(s.candidate)?` → neighbor ${coords(s.candidate)} · height ${heights[s.candidate[0]][s.candidate[1]]}\n${heights[s.current[0]][s.current[1]]} ${mode==='downhill'?'≥':'≤'} ${heights[s.candidate[0]][s.candidate[1]]} : ${(mode==='downhill'?heights[s.current[0]][s.current[1]]>=heights[s.candidate[0]][s.candidate[1]]:heights[s.current[0]][s.current[1]]<=heights[s.candidate[0]][s.candidate[1]])?'true':'false'}${s.reason==='visited'?' · already visited':''}`:` → ${coords(s.candidate)} is out of bounds`;
 if(s.type==='outlet')comparison=`Coastal cell ${coords(s.outlet.cell)} → ${s.outlet.ocean.toUpperCase()} OCEAN\nWater pours over the ${s.outlet.side} edge. Watch the sea splash and label pulse.`;
 if(s.type==='done')comparison=mode==='downhill'?'Every source tested. All downhill searches are complete.':'Both searches complete. The result is their intersection.';
 $('comparison').textContent=comparison;$('comparison').classList.toggle('rejected',s.type==='reject');
 $('results').innerHTML='';
 if(!s.result.length){const empty=document.createElement('span');empty.className='empty';empty.textContent=mode==='downhill'?'A source is saved when its own search reaches both coasts.':'Collected in row order after both searches finish.';$('results').append(empty);}
 for(const cell of s.result){const tag=document.createElement('span');tag.className='result-cell';tag.textContent=coords(cell);$('results').append(tag);}
 $('result-count').textContent=`${s.result.length} ${s.result.length===1?'CELL':'CELLS'} SAVED`;
 const active=codeLine(s);[...$('code').children].forEach((line,i)=>line.classList.toggle('selected',i===active));
 if(follow&&$('follow-code').checked&&active>=0){const line=$('code').children[active];$('code').scrollTop=Math.max(0,line.offsetTop-$('code').clientHeight/2);}
 $('stack').textContent=mode==='downhill'?`PacificAtlantic → source ${coords(s.origin)}`:s.ocean?`PacificAtlantic → Bfs(${s.origin.join(', ')}, ${s.ocean})`:'PacificAtlantic(heights)';
 if(mode==='downhill'){
  $('source-summary').textContent=`Rain source ${coords(s.origin)} · Pacific: ${s.reachesPacific?'yes':'not yet'} · Atlantic: ${s.reachesAtlantic?'yes':'not yet'}\nVisited below = water footprint for this source only.`;
  [...$('visited-matrix').children].forEach(cell=>{const r=Number(cell.dataset.row),c=Number(cell.dataset.col),active=s.visited[r][c];cell.textContent=active?'1':'0';cell.classList.toggle('active',active);cell.classList.toggle('focus',same(s.current,[r,c]));cell.classList.toggle('neighbor',same(s.candidate,[r,c]));cell.setAttribute('aria-label',`Current source visited row ${r}, column ${c}: ${active}`);});
 }
 island.update(s,mode);
 container.setAttribute('aria-label',`${m} by ${n} terrain. ${statusText(s)} Pacific: ${s.pacific.flat().filter(Boolean).length} visited. Atlantic: ${s.atlantic.flat().filter(Boolean).length} visited. Results: ${s.result.length}.`);
}
function pause(){playing=false;$('play').textContent='▶ Play';}
function reset(){pause();iterator=(mode==='downhill'?downhillSteps:flowSteps)(heights);state=iterator.next().value;history=[state];cursor=0;buildCode();buildTerrain();renderState();}
function advance(){if(cursor+1===history.length){const next=iterator.next();if(next.done)return;history.push(next.value);}state=history[++cursor];renderState();if(state.type==='done')pause();}
$('play').onclick=()=>{playing=!playing;$('play').textContent=playing?'Ⅱ Pause':'▶ Play';lastStep=performance.now();};
$('step').onclick=()=>{pause();advance();};
$('back').onclick=()=>{if(!cursor)return;pause();state=history[--cursor];renderState();};
$('restart').onclick=reset;$('camera').onclick=island.resetCamera;
$('top-view').onclick=island.topView;
$('speed').oninput=()=>{$('speed-value').textContent=`${$('speed').value}×`;};
$('example').onchange=()=>{const key=$('example').value;if(key==='custom'){$('custom-editor').open=true;$('grid-input').focus();return;}heights=EXAMPLES[key].map(row=>[...row]);$('grid-input').value=JSON.stringify(heights);$('input-error').textContent='';reset();};
$('apply').onclick=()=>{try{const value=validateHeights(JSON.parse($('grid-input').value));heights=value.map(row=>[...row]);$('input-error').textContent='';$('example').value='custom';reset();}catch(error){$('input-error').textContent=error instanceof SyntaxError?'Enter a valid JSON array of rows.':error.message;}};
function configureMode(){
 const naive=mode==='downhill';
 $('animation-panel').setAttribute('aria-labelledby',`tab-${mode}`);
 document.querySelectorAll('[role=tab]').forEach(tab=>{const selected=tab.dataset.mode===mode;tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;});
 $('flow-label').textContent=naive?'DOWNHILL WATER FLOW':'REVERSE SEARCH · UPHILL';
 $('method-note').textContent=naive?'Pour water at every cell. Follow lower or equal neighbors. Reset visited and repeat for the next source.':'Start at each ocean border. Follow higher or equal neighbors and reuse each ocean’s visited matrix.';
 $('calls-label').textContent=naive?'SOURCE SEARCHES':'BFS CALLS';
 $('source-state').hidden=!naive;
 $('matrix-hint').textContent=naive?'These matrices classify completed sources. The water footprint above resets for each new source.':'Filled cell = can flow to that ocean. The visited matrices are shared across border calls.';
 $('result-hint').textContent=naive?'Test each source independently. Save it if its downhill paths reach both coasts.':'Purple water is the intersection. Results are saved during the final row-order scan.';
 $('explanation-title').textContent=naive?'WHY IS THIS INEFFICIENT?':'WHY TRAVEL UPHILL?';
 $('explanation-body').textContent=naive?'A drop can move only to an equal or lower neighboring cell. Test whether its paths reach the top/left Pacific and bottom/right Atlantic. This repeats many of the same paths for every source.':'If a taller cell reaches a lower cell, and that lower cell reaches an ocean, the taller cell reaches it too. Reverse BFS discovers this by searching uphill from the coasts.';
 $('explanation-hint').textContent=naive?'Worst case: O((m × n)²) work. White foam shows the current cell; gold and falling rain mark the source. Ripples and droplets illustrate algorithm paths, not a fluid-physics simulation.':'Your exact border-start BFS order is preserved. Ripples and droplets move uphill to illustrate the reverse search, rather than physical downhill flow.';
 $('code-caption').textContent=naive?'C# brute-force downhill search · a fresh visited matrix per source':'Faithful C# translation of your solution · shared visited matrices';
}
for(const tab of document.querySelectorAll('[role=tab]')){
 tab.onclick=()=>{if(mode===tab.dataset.mode)return;mode=tab.dataset.mode;configureMode();reset();};
 tab.onkeydown=event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const next=event.key==='Home'?'downhill':event.key==='End'?'reverse':mode==='downhill'?'reverse':'downhill';$(`tab-${next}`).click();$(`tab-${next}`).focus();};
}
$('grid-input').value=JSON.stringify(heights);configureMode();reset();
function animate(time){requestAnimationFrame(animate);if(playing&&time-lastStep>=1500/Number($('speed').value)){advance();lastStep=time;}island.render(time);}
requestAnimationFrame(animate);
