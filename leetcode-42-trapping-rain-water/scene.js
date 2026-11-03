import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';

export function createRainScene(host){
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(38,1,.1,300),root=new THREE.Group();scene.add(root);
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let renderer;
 try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});}catch{host.textContent='WebGL unavailable. The per-cell water table, boundary levels, and playback remain available.';return{update(){},resetCamera(){},setRain(){},frontView(){}};}
 renderer.setPixelRatio(Math.min(devicePixelRatio,2));host.append(renderer.domElement);
 const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.enablePan=false;controls.maxPolarAngle=Math.PI/2.03;
 scene.add(new THREE.HemisphereLight(0xd8f0ff,0x4e4635,2.7));
 const sun=new THREE.DirectionalLight(0xffe0a1,3.2);sun.position.set(-5,10,4);scene.add(sun);
 const fill=new THREE.DirectionalLight(0x8ac8e7,1.7);fill.position.set(4,6,-6);scene.add(fill);
 let signature='',cells=[],guides=[],rain=true,scale=1,width=1,rainLines=null;
 function label(text,color='#e7e3d8',size=1){
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=96;const ctx=canvas.getContext('2d');ctx.font='bold 38px monospace';ctx.textAlign='center';ctx.strokeStyle='#172735';ctx.lineWidth=6;ctx.strokeText(text,256,61);ctx.fillStyle=color;ctx.fillText(text,256,61);
  const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;
  const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map,depthTest:false}));sprite.scale.set(3.5*size,.66*size,1);return sprite;
 }
 function mesh(w,h,d,material,x,y,z=0){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);m.position.set(x,y,z);root.add(m);return m;}
 function dispose(){const geometry=new Set(),materials=new Set(),maps=new Set();root.traverse(o=>{if(o.geometry)geometry.add(o.geometry);for(const m of o.material?[o.material].flat():[]){materials.add(m);if(m.map)maps.add(m.map);}});geometry.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());maps.forEach(m=>m.dispose());root.clear();}
 function stoneTexture(){const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d');ctx.fillStyle='#ac9c83';ctx.fillRect(0,0,128,128);for(let y=0;y<128;y+=4){ctx.strokeStyle=y%12?'#a18e76':'#7c6e5d';ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(128,y+Math.sin(y)*4);ctx.stroke();}const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;return t;}
 function resetCamera(){const targetY=1.5,distance=Math.max(10,(width+5)/(2*Math.tan(THREE.MathUtils.degToRad(19))*camera.aspect)*1.1);camera.position.set(width*.06,targetY+distance*.38,distance);controls.target.set(0,targetY,0);controls.update();}
 function rebuild(s){dispose();width=Math.max(1,s.height.length);scale=4/Math.max(4,...s.height);cells=[];guides=[];
  const texture=stoneTexture(),rock=new THREE.MeshStandardMaterial({map:texture,roughness:1,color:0xb3a28a}),sand=new THREE.MeshStandardMaterial({color:0xc0a275,roughness:1});
  mesh(width+.65,.22,1.5,sand,0,-.13);
  s.height.forEach((h,i)=>{const x=i-(s.height.length-1)/2,rockMesh=mesh(.94,Math.max(.02,h*scale),.94,rock,x,h*scale/2);
   const water=mesh(.94,1,.94,new THREE.MeshPhysicalMaterial({color:0x389dce,transparent:true,opacity:.52,roughness:.18,metalness:.08,depthWrite:false}),x,h*scale);
   const surface=new THREE.Mesh(new THREE.PlaneGeometry(.94,.94,8,8),new THREE.MeshStandardMaterial({color:0x8be3f4,transparent:true,opacity:.7,side:THREE.DoubleSide,depthWrite:false}));surface.rotation.x=-Math.PI/2;surface.position.set(x,h*scale+.01,0);root.add(surface);
   const index=label(`[${i}] h=${h}`,'#e7e3d8',.48);index.position.set(x,-.48,.45);root.add(index);
   const count=label('','#bbf3ff',.48);root.add(count);
   const pointer=label('L / R','#f7d58f',.6);root.add(pointer);
   const outline=new THREE.BoxHelper(rockMesh,0xf7d58f);root.add(outline);
   cells.push({x,h,water,surface,count,outline,pointer,current:0,target:0});
  });
  for(const [name,color,z]of [['Left',0xa2e5cc,-.62],['Right',0xc3a6ef,.62],['Minimum',0xf7d58f,.02]]){
   const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-width/2-.25,0,z),new THREE.Vector3(width/2+.25,0,z)]),new THREE.LineDashedMaterial({color,dashSize:.18,gapSize:.10}));line.computeLineDistances();root.add(line);
   const tag=label(name,`#${color.toString(16)}`,.6);root.add(tag);guides.push({name,line,tag});
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(cells.length*12*6),3));rainLines=new THREE.LineSegments(geometry,new THREE.LineBasicMaterial({color:0xb5e9ff,transparent:true,opacity:.65,depthWrite:false}));rainLines.frustumCulled=false;root.add(rainLines);
  resetCamera();
 }
 function update(s){const key=s.height.join(',');if(signature!==key||!rainLines){signature=key;rebuild(s);}
  cells.forEach((c,i)=>{c.target=s.water[i]*scale;c.pointer.visible=s.l<=s.r&&(i===s.l||i===s.r);const pointerText=s.l===s.r?'L / R':i===s.l?'L ↓':'R ↓';if(c.pointer.userData.text!==pointerText){const tag=label(pointerText,i===s.l?'#a2e5cc':'#c3a6ef',.6);c.pointer.material.map.dispose();c.pointer.material.dispose();c.pointer.material=tag.material;c.pointer.userData.text=pointerText;}c.outline.visible=s.active===i;c.count.visible=!!s.water[i];const text=`+${s.water[i]}`;if(c.count.userData.text!==text){const replacement=label(text,'#c7f6ff',.48);c.count.material.map.dispose();c.count.material.dispose();c.count.material=replacement.material;c.count.userData.text=text;}});
  const levels=[s.lMax,s.rMax,s.height.length?Math.min(s.lMax,s.rMax):undefined];
  guides.forEach((g,i)=>{const level=levels[i];g.line.visible=g.tag.visible=level!==undefined;if(level===undefined)return;g.line.position.y=level*scale+.025;g.tag.position.set(i===1?width/2+.3:-width/2-.3,level*scale+.35,i===2?1.4:-1.1);const text=`${g.name}: ${level}`;if(g.tag.userData.text!==text){const tag=label(text,['#a2e5cc','#c3a6ef','#f7d58f'][i],.6);g.tag.material.map.dispose();g.tag.material.dispose();g.tag.material=tag.material;g.tag.userData.text=text;}});
 }
 let last=0;
 function frame(t){requestAnimationFrame(frame);const dt=Math.min(.1,(t-last)/1000);last=t;const time=reduced.matches?0:t/1000;
  cells.forEach(c=>{c.current=reduced.matches?c.target:THREE.MathUtils.damp(c.current,c.target,12,dt);c.water.visible=c.surface.visible=c.current>.001;c.water.scale.y=Math.max(.001,c.current);c.water.position.y=c.h*scale+c.current/2;c.surface.position.y=c.h*scale+c.current+.012;c.count.position.set(c.x,c.h*scale+c.current+.25,.15);c.pointer.position.set(c.x,c.h*scale+c.current+.8,0);
   const positions=c.surface.geometry.attributes.position;for(let i=0;i<positions.count;i++)positions.setZ(i,reduced.matches?0:Math.sin(positions.getX(i)*12+time*3)*Math.cos(positions.getY(i)*9-time*2)*.012);positions.needsUpdate=true;
  });
  if(rainLines){rainLines.visible=rain;const p=rainLines.geometry.attributes.position;cells.forEach((c,j)=>{for(let i=0;i<12;i++){const phase=(time*.8+i*.618+j*.13)%1,top=c.h*scale+c.current,y=top+.1+(1-phase)*(6-top);p.setXYZ((j*12+i)*2,c.x+Math.sin(i*127.1)*.4,y,Math.cos(i*71.7)*.4);p.setXYZ((j*12+i)*2+1,c.x+Math.sin(i*127.1)*.4+.02,y+.14,Math.cos(i*71.7)*.4);}});p.needsUpdate=true;}
  controls.update();renderer.render(scene,camera);
 }requestAnimationFrame(frame);
 new ResizeObserver(()=>{renderer.setSize(host.clientWidth,host.clientHeight);camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();resetCamera();}).observe(host);
 return{update,resetCamera,setRain(value){rain=value;},frontView(){camera.position.set(0,2,Math.max(10,(width+5)/(2*Math.tan(THREE.MathUtils.degToRad(19))*camera.aspect)*1.1));controls.target.set(0,2,0);controls.update();}};
}
