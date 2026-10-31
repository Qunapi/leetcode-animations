import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { solveSteps } from './solver.js';

const $ = id => document.getElementById(id);
let history = [];
let n = 4, iterator, state, playing = false, steps = 0, lastStep = 0, showThreats = true;
const container = $('scene');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(38, 1, .1, 100);
let renderer;
try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); }
catch { container.textContent = 'WebGL is unavailable. Enable hardware acceleration to view the 3D board. Playback and live sets still work.'; }
const controls = renderer ? new OrbitControls(camera, renderer.domElement) : null;
if (renderer) {
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);
  controls.enableDamping = true; controls.enablePan = false;
  controls.minDistance = 5; controls.maxDistance = 24; controls.maxPolarAngle = Math.PI / 2.15;
  new ResizeObserver(() => {
    renderer.setSize(container.clientWidth, container.clientHeight);
    camera.aspect = container.clientWidth / container.clientHeight; camera.updateProjectionMatrix();
  }).observe(container);
}
scene.add(new THREE.HemisphereLight(0xd4f1fa, 0x26322c, 2.4));
const light = new THREE.DirectionalLight(0xffedce, 3.5);
light.position.set(-3, 10, 4); light.castShadow = true;
light.shadow.mapSize.set(2048, 2048);
Object.assign(light.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8 });
scene.add(light);
const rim = new THREE.DirectionalLight(0x84cbb9, 2); rim.position.set(4, 3, -5); scene.add(rim);
const boardGroup = new THREE.Group(); scene.add(boardGroup);
let tiles = [], queens = [];
const removals = new Set();
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const gold = new THREE.MeshStandardMaterial({ color: 0xe6b961, metalness: .65, roughness: .27 });
const queenGeometry = new THREE.LatheGeometry([
  [0,0],[.27,0],[.30,.035],[.30,.09],[.23,.13],[.24,.18],[.17,.22],[.105,.45],[.11,.54],[.18,.58],[.18,.63],[.13,.67],[.21,.84],[.20,.89],[0,.89]
].map(([x,y]) => new THREE.Vector2(x,y)), 40);
const ballGeometry = new THREE.SphereGeometry(.045, 12, 8);
function mesh(geometry, material, x=0, y=0, z=0) {
  const object = new THREE.Mesh(geometry, material); object.position.set(x,y,z); object.castShadow = true; object.receiveShadow = true; return object;
}
function label(text, x, z) {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 96;
  const ctx = canvas.getContext('2d'); ctx.fillStyle = '#8ba3ac'; ctx.font = '38px monospace'; ctx.textAlign = 'center'; ctx.fillText(text,48,61);
  const map = new THREE.CanvasTexture(canvas);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map, transparent: true })); sprite.position.set(x,.06,z); sprite.scale.set(.35,.35,.35); boardGroup.add(sprite);
}
function resetCamera() { camera.position.set(n * 1.05, n * 1.3, n * 1.5); controls?.target.set(0,0,0); controls?.update(); }
function buildBoard() {
  removals.clear();
  const geometries = new Set(), materials = new Set();
  boardGroup.traverse(obj => { if (obj.geometry && obj.geometry !== queenGeometry && obj.geometry !== ballGeometry) geometries.add(obj.geometry); if (obj.material && obj.material !== gold) materials.add(obj.material); });
  geometries.forEach(g => g.dispose()); materials.forEach(m => { m.map?.dispose(); m.dispose(); }); boardGroup.clear(); tiles=[]; queens=[];
  const base = mesh(new THREE.BoxGeometry(n + .35,.25,n + .35), new THREE.MeshStandardMaterial({ color:0x101d22, roughness:.5, metalness:.35 }),0,-.18,0); boardGroup.add(base);
  const tileGeometry = new THREE.BoxGeometry(.97,.12,.97);
  for(let r=0;r<n;r++) {
    tiles[r]=[];
    for(let c=0;c<n;c++) {
      const tile = mesh(tileGeometry, new THREE.MeshStandardMaterial({ color: (r+c)%2 ? 0x30434c : 0x82999b, roughness:.7 }),c-(n-1)/2,0,r-(n-1)/2);
      tiles[r][c]=tile; boardGroup.add(tile);
    }
    const queen = new THREE.Group(); queen.add(mesh(queenGeometry,gold));
    for(let j=0;j<7;j++) { const angle=j/7*Math.PI*2; queen.add(mesh(ballGeometry,gold,Math.cos(angle)*.19,.90,Math.sin(angle)*.19)); }
    queen.add(mesh(new THREE.SphereGeometry(.07,16,12),gold,0,.96,0));
    queen.visible=false; boardGroup.add(queen); queens.push(queen);
    label(String(r),-(n/2+.4),r-(n-1)/2); label(String(r),r-(n-1)/2,n/2+.4);
  }
  resetCamera();
}
const code = [
 'void Backtrack(int row) {',
 '  if (row == n) { Save(board); return; }',
 '  for (int i = 0; i < n; i++) {',
 '    int d1 = i - row, d2 = i + row;',
 '    if (IsAttacked(i, d1, d2)) continue;',
 "    board[row, i] = 'Q'; AddToSets();",
 '    Backtrack(row + 1);',
 "    board[row, i] = '.'; RemoveFromSets();",
 '  }',
 '}'
];
code.forEach((text,i) => { const line=document.createElement('div'); line.className='code-line'; const num=document.createElement('span');num.className='line-number';num.textContent=String(i+1).padStart(2,'0');line.append(num,document.createTextNode(text));$('code').append(line); });
function drawState() {
  const s=state;
  container.setAttribute('aria-label', `3D ${n} by ${n} board. Queens: ${s.board.flatMap((c,r)=>c<0?[]:[`row ${r}, column ${c}`]).join('; ') || 'none'}. ${s.type}. Drag to rotate, scroll to zoom.`);
  $('queens').innerHTML=`${s.col.length}<span>/ ${n}</span>`;
  $('solutions').textContent=s.solutions; $('attempts').textContent=s.attempts;
  $('step-count').textContent=`STEP ${steps}`;
  const messages={ start:'Ready to explore. Place your first queen.', try:`Check row ${s.row}, column ${s.column}. Is this square safe?`, reject:`Conflict in ${s.conflicts.join(', ')}. Skip this square.`, place:`Place queen at [${s.row}, ${s.column}] and explore the next row.`, remove:`Backtrack: remove queen at [${s.row}, ${s.column}] and free its lines.`, solution:`Solution ${s.solutions} found! Every queen is safe.`, done:`Search complete. Found ${s.solutions} solutions in ${s.attempts} checks.` };
  $('status').textContent=messages[s.type]; $('status-dot').style.color=s.type==='reject'?'#ef8b91':'#9de9cf';
  $('candidate').textContent=s.column<0 ? (s.type==='solution'?'All rows filled — save a copy of the board.':'Select Play or Step to explore the search.') : `[row, col] = [${s.row}, ${s.column}]  ·  d1 = ${s.column-s.row}  ·  d2 = ${s.column+s.row}`;
  document.querySelectorAll('.chip').forEach(chip => { const key=chip.parentElement.parentElement.dataset.key; const value=Number(chip.textContent); chip.classList.toggle('active',s[key].includes(value)); chip.setAttribute('aria-label', `${key} ${value}: ${s[key].includes(value)?'unavailable':'available'}`); const candidate=key==='col'?s.column:key==='d1'?s.column-s.row:s.column+s.row; chip.classList.toggle('conflict', s.conflicts.includes(key) && value===candidate); });
  const active={start:0,try:3,reject:4,place:5,remove:7,solution:1,done:9}[s.type];
  [...$('code').children].forEach((line,i)=>line.classList.toggle('selected',i===active));
  const depth=s.type==='done'?0:Math.min(s.row,n);
  $('stack').textContent=Array.from({length:depth+1},(_,i)=>`Backtrack(${i})`).join(' → ');
  $('back').disabled=steps===0; $('step').disabled=s.type==='done'; $('play').disabled=s.type==='done';
  $('progress').style.width=`${s.type==='done'?100:s.col.length/n*100}%`;
  for(let r=0;r<n;r++) {
    const q=queens[r]; const column=s.board[r];
    if(column>=0) { if(!q.visible) q.position.y=reducedMotion.matches?.10:.65; q.visible=true; q.position.x=column-(n-1)/2; q.position.z=r-(n-1)/2; }
    else if(q.visible) {
      if(!reducedMotion.matches) {
        const departing = q.clone();
        departing.userData.removedAt = performance.now();
        departing.userData.removalY = q.position.y;
        departing.userData.duration = playing ? Math.min(450, 1700 / Number($('speed').value)) : 450;
        boardGroup.add(departing); removals.add(departing);
      }
      q.visible=false;
    }
    for(let c=0;c<n;c++) {
      const tile=tiles[r][c]; const attacked=s.board[r]>=0||s.col.includes(c)||s.d1.includes(c-r)||s.d2.includes(c+r);
      const candidate=r===s.row&&c===s.column&&['try','reject','remove'].includes(s.type);
      const color=candidate?(attacked?0xd97983:0x80baf5):showThreats&&attacked&&s.board[r]!==c?((r+c)%2?0x633e4a:0x936a70):(r+c)%2?0x30434c:0x82999b;
      tile.material.color.setHex(color); tile.material.emissive.setHex(candidate?color:0x000000); tile.material.emissiveIntensity=.14;
    }
  }
}
function buildSets() {
  $('sets').innerHTML='';
  for(const [key,title,formula,from,to] of [['col','│ Columns','i',0,n-1],['d1','╲ Descending diagonals','i − row',1-n,n-1],['d2','╱ Ascending diagonals','i + row',0,2*n-2]]) {
    const div=document.createElement('div');div.className='set';div.dataset.key=key;
    div.innerHTML=`<div class="set-label"><span>${title}</span><code>${key} = ${formula}</code></div><div class="chips">${Array.from({length:to-from+1},(_,i)=>`<span class="chip">${i+from}</span>`).join('')}</div>`;
    $('sets').append(div);
  }
}
function reset() { playing=false; $('play').textContent='▶ Play'; steps=0; iterator=solveSteps(n); state=iterator.next().value; history=[state]; buildBoard();buildSets();drawState(); }
function advance() {
  for(const queen of removals) boardGroup.remove(queen);
  removals.clear();
  if(steps + 1 === history.length) {
    const next=iterator.next(); if(next.done) return; history.push(next.value);
  }
  state=history[++steps]; drawState();
  if(state.type==='done'){playing=false;$('play').textContent='▶ Play';}
}
$('back').onclick=()=>{
  if(steps===0) return;
  playing=false; $('play').textContent='▶ Play';
  for(const queen of removals) boardGroup.remove(queen);
  removals.clear();
  state=history[--steps]; drawState();
};
$('play').onclick=()=>{playing=!playing;$('play').textContent=playing?'Ⅱ Pause':'▶ Play';lastStep=performance.now();};
$('step').onclick=()=>{playing=false;$('play').textContent='▶ Play';advance();};
$('restart').onclick=reset;
$('size').onchange=()=>{n=Number($('size').value);$('board-title').textContent=`${n} × ${n} board`;reset();};
$('speed').oninput=()=>{$('speed-value').textContent=`${$('speed').value}×`;};
$('camera').onclick=resetCamera;
$('threats').onclick=()=>{showThreats=!showThreats;$('threats').setAttribute('aria-pressed',String(showThreats));drawState();};
reset();
let previousFrame = 0;
function animate(time) {
  requestAnimationFrame(animate);
  if(playing && time-lastStep>=2000/Number($('speed').value)*(state.type==='solution'?3:1)){advance();lastStep=time;}
  const delta = Math.max(0, Math.min(.1, (time - previousFrame) / 1000));
  previousFrame = time;
  for(const queen of queens) if(queen.visible) queen.position.y+=(.10-queen.position.y)*(1-Math.exp(-9*delta));
  for(const queen of removals) {
    const t = Math.max(0, Math.min(1, (time - queen.userData.removedAt) / queen.userData.duration));
    queen.position.y = queen.userData.removalY + t * 1.3;
    queen.rotation.y = t * Math.PI / 2;
    queen.scale.setScalar(1 - t * t);
    if(t === 1) { boardGroup.remove(queen); removals.delete(queen); }
  }
  controls?.update();renderer?.render(scene,camera);
}
requestAnimationFrame(animate);
