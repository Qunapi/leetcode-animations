export function mountCode(source){
 const container=document.getElementById('code'),lines=source.split('\n');
 lines.forEach((text,i)=>{const line=document.createElement('div');line.className='code-line';const number=document.createElement('span');number.className='line-number';number.textContent=String(i+1).padStart(2,'0');line.append(number,document.createTextNode(text));container.append(line);});
 return key=>{const index=Number.isInteger(key)?key:lines.findIndex(line=>line.includes(key));[...container.children].forEach((line,i)=>line.classList.toggle('selected',i===index));if(document.getElementById('follow-code').checked&&index>=0)container.scrollTop=Math.max(0,container.children[index].offsetTop-container.clientHeight/2);};
}

export function createPlayback(makeIterator,render,ready=null){
 const $=id=>document.getElementById(id);
 let iterator,state,history=[],cursor=0,playing=false,last=0;
 function pause(){playing=false;$('play').textContent='▶ Play';}
 function draw(){
  $('back').disabled=cursor===0;$('step').disabled=state.type==='done';$('play').disabled=state.type==='done';$('step-count').textContent=`STEP ${cursor}`;render(state);
 }
 function advance(){
  if(cursor+1===history.length){const next=iterator.next();if(next.done){pause();return;}history.push(next.value);}
  state=history[++cursor];draw();if(state.type==='done')pause();
 }
 function reset(){
  pause();iterator=makeIterator();state=iterator.next().value;
  if(ready&&$('skip-build')?.checked)while(!ready(state)&&state.type!=='done'){const next=iterator.next();if(next.done)break;state=next.value;}
  history=[state];cursor=0;draw();
 }
 $('play').onclick=()=>{playing=!playing;$('play').textContent=playing?'Ⅱ Pause':'▶ Play';last=performance.now();};
 $('step').onclick=()=>{pause();advance();};$('back').onclick=()=>{if(cursor){pause();state=history[--cursor];draw();}};$('restart').onclick=reset;
 $('speed').oninput=()=>{$('speed-value').textContent=`${$('speed').value}×`;};
 if($('skip-build'))$('skip-build').onchange=reset;
 function tick(time){requestAnimationFrame(tick);if(playing&&time-last>=1500/Number($('speed').value)){advance();last=time;}}
 requestAnimationFrame(tick);
 return{reset,get state(){return state;},get atEnd(){return cursor===history.length-1&&state.type==='done';},append(nextIterator){if(cursor!==history.length-1||state.type!=='done')return false;iterator=nextIterator;advance();playing=state.type!=='done';$('play').textContent=playing?'Ⅱ Pause':'▶ Play';last=performance.now();return true;}};
}
