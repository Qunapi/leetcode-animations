import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
export function createScene({fitContent=false,nodeRadius=.15,labelSize=54}={}){
 const host=document.getElementById('scene'),scene=new THREE.Scene();scene.background=new THREE.Color('#182b35');
 const camera=new THREE.PerspectiveCamera(40,1,.1,100);camera.position.set(0,1,14);
 let renderer;try{renderer=new THREE.WebGLRenderer({antialias:true});}catch{host.textContent='WebGL unavailable. Use the synchronized state panels below.';return{update(){},clear(){}};}
 renderer.setPixelRatio(Math.min(devicePixelRatio,2));host.append(renderer.domElement);
 const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.target.set(0,0,0);document.getElementById('camera').onclick=()=>{if(fitContent)fit();else{camera.position.set(0,1,14);controls.target.set(0,0,0);controls.update();}};
 scene.add(new THREE.HemisphereLight(0xffffff,0x263246,2));const light=new THREE.DirectionalLight(0xffffff,3);light.position.set(-3,6,8);scene.add(light);
 const nodes=new Map(),edges=new THREE.LineSegments(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({color:0x6a94a9,transparent:true,opacity:.45}));scene.add(edges);let links=[],bounds=null,visibleCount=0;
 function fit(){if(!bounds)return;const center=bounds.getCenter(new THREE.Vector3()),size=bounds.getSize(new THREE.Vector3());const distance=Math.max((size.y+1.1)/2,(size.x+1.6)/(2*camera.aspect))/Math.tan(THREE.MathUtils.degToRad(camera.fov/2));controls.target.copy(center);camera.position.set(center.x,center.y,center.z+Math.max(3,distance*1.08));controls.update();}
 function clear(){for(const item of nodes.values()){scene.remove(item.mesh);item.mesh.geometry.dispose();item.mesh.material.dispose();item.label.material.map.dispose();item.label.material.dispose();}nodes.clear();links=[];visibleCount=0;bounds=null;}
 function update(items,nextLinks){
  links=nextLinks;const visible=new Set(items.map(n=>n.id));for(const [id,n]of nodes)n.mesh.visible=visible.has(id);
  for(const item of items){let n=nodes.get(item.id);if(!n){const mesh=new THREE.Mesh(new THREE.SphereGeometry(nodeRadius,20,16),new THREE.MeshStandardMaterial({color:item.color,roughness:.35}));const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const ctx=canvas.getContext('2d');ctx.font=`bold ${labelSize}px monospace`;ctx.textAlign='center';ctx.fillStyle='#f0f5fa';ctx.fillText(item.text,256,78);const label=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(canvas),depthTest:false}));label.scale.set(1.8,.45,1);label.position.y=nodeRadius+.2;mesh.add(label);scene.add(mesh);n={mesh,label,target:new THREE.Vector3(...item.position)};mesh.position.copy(n.target);nodes.set(item.id,n);}n.mesh.visible=true;n.target.set(...item.position);n.mesh.material.color.set(item.color);n.mesh.scale.setScalar(item.active?1.3:1);}
  if(fitContent&&items.length){bounds=new THREE.Box3().setFromPoints(items.map(item=>new THREE.Vector3(...item.position)));if(items.length!==visibleCount)fit();visibleCount=items.length;}
 }
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 function frame(){requestAnimationFrame(frame);for(const n of nodes.values())n.mesh.position.lerp(n.target,reduced?1:.16);const points=[];for(const[a,b]of links){const na=nodes.get(a),nb=nodes.get(b);if(na?.mesh.visible&&nb?.mesh.visible)points.push(...na.mesh.position.toArray(),...nb.mesh.position.toArray());}edges.geometry.setAttribute('position',new THREE.Float32BufferAttribute(points,3));edges.geometry.computeBoundingSphere();controls.update();renderer.render(scene,camera);}requestAnimationFrame(frame);
 new ResizeObserver(()=>{const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();if(fitContent)fit();else camera.position.z=Math.max(14,10/camera.aspect);}).observe(host);
 return{update,clear};
}
