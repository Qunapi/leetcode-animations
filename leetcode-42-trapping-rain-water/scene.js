import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';

export function createRainScene(host){
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(38,1,.1,300),root=new THREE.Group();scene.add(root);
 const waveTime={value:0};
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let renderer;
 try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});}catch{host.textContent='WebGL unavailable. The per-cell water table, boundary levels, and playback remain available.';return{update(){},resetCamera(){},setRain(){},frontView(){}};}
 renderer.setPixelRatio(Math.min(devicePixelRatio,2));host.append(renderer.domElement);
 const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.enablePan=false;controls.maxPolarAngle=Math.PI/2.03;
 scene.add(new THREE.HemisphereLight(0xd8f0ff,0x4e4635,2.7));
 const sun=new THREE.DirectionalLight(0xffe0a1,3.2);sun.position.set(-5,10,4);scene.add(sun);
 const fill=new THREE.DirectionalLight(0x8ac8e7,1.7);fill.position.set(4,6,-6);scene.add(fill);
 let signature='',cells=[],guides=[],rain=true,scale=1,width=1,rainLines=null,arrows=[],pointerState=null;
 function label(text,color='#e7e3d8',size=1){
  const lines=text.split('\n'),canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');ctx.font='bold 40px monospace';
  canvas.width=Math.max(48,...lines.map(line=>Math.ceil(ctx.measureText(line).width)+24));canvas.height=lines.length*50+16;
  ctx.font='bold 40px monospace';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillStyle='rgba(12,25,35,.84)';ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.strokeStyle='#12212d';ctx.lineWidth=4;ctx.fillStyle=color;
  lines.forEach((line,i)=>{ctx.strokeText(line,canvas.width/2,33+i*50);ctx.fillText(line,canvas.width/2,33+i*50);});
  const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;
  const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map,depthTest:false,sizeAttenuation:false}));
  sprite.userData.pixelHeight=(size/.48)*16*canvas.height/40;sprite.userData.aspect=canvas.width/canvas.height;
  return sprite;
 }
 function arrowMarker(letter,color){
  const marker=new THREE.Group(),material=new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:.45,roughness:.3});
  const shaft=new THREE.Mesh(new THREE.CylinderGeometry(.075,.075,.95,12),material);shaft.position.y=.95;marker.add(shaft);
  const tip=new THREE.Mesh(new THREE.ConeGeometry(.28,.55,16),material);tip.rotation.z=Math.PI;tip.position.y=.28;marker.add(tip);
  const tag=label(letter,`#${color.toString(16)}`,.85);tag.position.y=1.75;marker.add(tag);
  marker.visible=false;root.add(marker);return marker;
 }
 function mesh(w,h,d,material,x,y,z=0){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);m.position.set(x,y,z);root.add(m);return m;}
 function dispose(){const geometry=new Set(),materials=new Set(),maps=new Set();root.traverse(o=>{if(o.geometry)geometry.add(o.geometry);for(const m of o.material?[o.material].flat():[]){materials.add(m);if(m.map)maps.add(m.map);}});geometry.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());maps.forEach(m=>m.dispose());root.clear();}
 function stoneTexture(){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const ctx=canvas.getContext('2d');
  ctx.fillStyle='#7c858c';ctx.fillRect(0,0,256,256);let seed=83;
  function random(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
  // Irregular mineral patches and fine grain avoid the old horizontal wood-like bands.
  for(let i=0;i<8500;i++){
   const shade=70+Math.floor(random()*100);ctx.fillStyle=`rgba(${shade},${shade+5},${shade+10},${.15+random()*.5})`;
   ctx.beginPath();ctx.ellipse(random()*256,random()*256,.5+random()*5,.5+random()*3,random()*Math.PI,0,Math.PI*2);ctx.fill();
  }
  for(let i=0;i<9;i++){
   let x=random()*256,y=random()*256;ctx.strokeStyle='rgba(40,49,57,.35)';ctx.lineWidth=.5+random();ctx.beginPath();ctx.moveTo(x,y);
   for(let j=0;j<7;j++){x+=(random()-.5)*32;y+=8+random()*14;ctx.lineTo(x,y);}ctx.stroke();
  }
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
 }
 function waveMaterial(phase){return new THREE.ShaderMaterial({
  transparent:true,depthWrite:false,side:THREE.DoubleSide,
  uniforms:{uTime:waveTime,uPhase:{value:phase},uAmplitude:{value:0}},
  vertexShader:`uniform float uTime;uniform float uPhase;uniform float uAmplitude;varying vec2 vUv;
   void main(){vUv=uv;vec3 p=position;float edge=sin(uv.x*3.14159265)*sin(uv.y*3.14159265);p.z+=sin(uv.x*7.0+uTime*2.7+uPhase)*cos(uv.y*6.0-uTime*1.9)*uAmplitude*edge;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);}`,
  fragmentShader:`uniform float uTime;uniform float uPhase;varying vec2 vUv;
   void main(){float sweep=sin(vUv.x*18.0+vUv.y*8.0-uTime*3.2+uPhase);float ripple=sin(length(vUv-vec2(0.45,0.55))*48.0-uTime*4.0+uPhase);float foam=smoothstep(0.72,1.0,sweep)*0.52+smoothstep(0.86,1.0,ripple)*0.35;vec3 color=mix(vec3(0.10,0.49,0.68),vec3(0.78,0.97,1.0),min(foam,0.85));gl_FragColor=vec4(color,0.78);
   #include <colorspace_fragment>
   }`
 });}
 function stoneStand(){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d');
  ctx.fillStyle='#737b80';ctx.fillRect(0,0,128,128);let seed=17;
  for(let i=0;i<2400;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const x=seed%128,y=(seed>>>8)%128;ctx.fillStyle=['#5b646b','#899196','#a0a4a5','#444e55'][i%4];ctx.fillRect(x,y,1+i%3,1+i%2);}
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const material=new THREE.MeshStandardMaterial({map:texture,bumpMap:texture,bumpScale:.055,roughness:1,color:0xb9c2c8});
  const w=width+.65,d=1.5,b=.12,shape=new THREE.Shape();
  [[-w/2+b,-d/2],[w/2-b,-d/2],[w/2,-d/2+b],[w/2,d/2-b],[w/2-b,d/2],[-w/2+b,d/2],[-w/2,d/2-b],[-w/2,-d/2+b]].forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();
  const geometry=new THREE.ExtrudeGeometry(shape,{depth:.28,bevelEnabled:true,bevelThickness:.035,bevelSize:.035,bevelSegments:1,steps:1});geometry.rotateX(-Math.PI/2);
  const slab=new THREE.Mesh(geometry,material);slab.position.y=-.34;root.add(slab);
 }
 function resetCamera(){const targetY=1.5,distance=Math.max(10,(width+5)/(2*Math.tan(THREE.MathUtils.degToRad(19))*camera.aspect)*1.1);camera.position.set(width*.06,targetY+distance*.38,distance);controls.target.set(0,targetY,0);controls.update();}
 function rebuild(s){dispose();width=Math.max(1,s.height.length);scale=4/Math.max(4,...s.height);cells=[];guides=[];arrows=[];
  const texture=stoneTexture(),rock=new THREE.MeshStandardMaterial({map:texture,bumpMap:texture,bumpScale:.065,roughness:1,color:0xc4cbd0});
  stoneStand();
  s.height.forEach((h,i)=>{const x=i-(s.height.length-1)/2,rockMesh=mesh(.94,Math.max(.02,h*scale),.94,rock,x,h*scale/2);
   const water=mesh(.94,1,.94,new THREE.MeshPhysicalMaterial({color:0x389dce,transparent:true,opacity:.52,roughness:.18,metalness:.08,depthWrite:false}),x,h*scale);
   const surface=new THREE.Mesh(new THREE.PlaneGeometry(.94,.94,16,16),waveMaterial(i*.73));surface.rotation.x=-Math.PI/2;surface.position.set(x,h*scale+.01,0);root.add(surface);
   const index=label(`${i}\nh=${h}`,'#e7e3d8',.33);index.position.set(x,-.9,.6);root.add(index);
   const count=label('','#bbf3ff',.33);root.add(count);
   const outline=new THREE.BoxHelper(rockMesh,0xf7d58f);root.add(outline);
   cells.push({x,h,water,surface,count,outline,current:0,target:0});
  });
  arrows=[arrowMarker('L',0xa2e5cc),arrowMarker('R',0xc3a6ef)];
  for(const [name,color,z]of [['Left',0xa2e5cc,-.62],['Right',0xc3a6ef,.62],['Minimum',0xf7d58f,.02]]){
   const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-width/2-.25,0,z),new THREE.Vector3(width/2+.25,0,z)]),new THREE.LineDashedMaterial({color,dashSize:.18,gapSize:.10}));line.computeLineDistances();root.add(line);
   const tag=label(name,`#${color.toString(16)}`,.6);root.add(tag);guides.push({name,line,tag});
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(cells.length*12*6),3));rainLines=new THREE.LineSegments(geometry,new THREE.LineBasicMaterial({color:0xb5e9ff,transparent:true,opacity:.65,depthWrite:false}));rainLines.frustumCulled=false;root.add(rainLines);
  resetCamera();
 }
 function update(s){pointerState=s;const key=s.height.join(',');if(signature!==key||!rainLines){signature=key;rebuild(s);}
  cells.forEach((c,i)=>{c.target=s.water[i]*scale;c.outline.visible=s.active===i;c.count.visible=!!s.water[i];const text=`+${s.water[i]}`;if(c.count.userData.text!==text){const replacement=label(text,'#c7f6ff',.33);c.count.material.map.dispose();c.count.material.dispose();c.count.material=replacement.material;c.count.userData={...replacement.userData};c.count.userData.text=text;}});
  const levels=[s.lMax,s.rMax,s.height.length?Math.min(s.lMax,s.rMax):undefined];
  guides.forEach((g,i)=>{const level=levels[i];g.line.visible=g.tag.visible=level!==undefined;if(level===undefined)return;g.line.position.y=level*scale+.025;g.tag.position.set(i===1?width/2+.3:-width/2-.3,level*scale+.35,i===2?1.4:-1.1);const text=`${g.name}: ${level}`;if(g.tag.userData.text!==text){const tag=label(text,['#a2e5cc','#c3a6ef','#f7d58f'][i],.6);g.tag.material.map.dispose();g.tag.material.dispose();g.tag.material=tag.material;g.tag.userData={...tag.userData};g.tag.userData.text=text;}});
 }
 let last=0;
 function frame(t){requestAnimationFrame(frame);const dt=Math.min(.1,(t-last)/1000);last=t;const time=reduced.matches?0:t/1000;waveTime.value=time;
  cells.forEach(c=>{c.current=reduced.matches?c.target:THREE.MathUtils.damp(c.current,c.target,12,dt);c.water.visible=c.surface.visible=c.current>.001;c.water.scale.y=Math.max(.001,c.current);c.water.position.y=c.h*scale+c.current/2;c.surface.position.y=c.h*scale+c.current+.012;c.count.position.set(c.x,c.h*scale+c.current+.5,.15);
   c.surface.material.uniforms.uAmplitude.value=reduced.matches?0:Math.min(.28,c.current*.35,scale*.35);
  });
  if(rainLines){rainLines.visible=rain;const p=rainLines.geometry.attributes.position;cells.forEach((c,j)=>{for(let i=0;i<12;i++){const phase=(time*.8+i*.618+j*.13)%1,top=c.h*scale+c.current,y=top+.1+(1-phase)*(6-top);p.setXYZ((j*12+i)*2,c.x+Math.sin(i*127.1)*.4,y,Math.cos(i*71.7)*.4);p.setXYZ((j*12+i)*2+1,c.x+Math.sin(i*127.1)*.4+.02,y+.14,Math.cos(i*71.7)*.4);}});p.needsUpdate=true;}
  if(pointerState)arrows.forEach((arrow,i)=>{
   const s=pointerState,index=i===0?s.l:s.r,c=cells[index];arrow.visible=s.l<=s.r&&!!c;
   if(arrow.visible){const bob=reduced.matches?0:Math.sin(time*4+i*.6)*.22;arrow.position.set(c.x+(s.l===s.r?(i? .18:-.18):0),c.h*scale+c.current+.65+bob,i===0?-.6:.6);}
  });
  // Keep text readable in screen pixels as the user orbits or zooms.
  const pixelScale=2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))/Math.max(1,host.clientHeight);
  root.traverse(o=>{if(o.isSprite&&o.userData.pixelHeight){const h=o.userData.pixelHeight*pixelScale;o.scale.set(h*o.userData.aspect,h,1);}});
  controls.update();renderer.render(scene,camera);
 }requestAnimationFrame(frame);
 new ResizeObserver(()=>{renderer.setSize(host.clientWidth,host.clientHeight);camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();resetCamera();}).observe(host);
 return{update,resetCamera,setRain(value){rain=value;},frontView(){camera.position.set(0,2,Math.max(10,(width+5)/(2*Math.tan(THREE.MathUtils.degToRad(19))*camera.aspect)*1.1));controls.target.set(0,2,0);controls.update();}};
}
