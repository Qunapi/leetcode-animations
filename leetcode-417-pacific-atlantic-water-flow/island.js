import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { oceanOutlets } from './solver.js';

export function createIsland(container) {
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(38,1,.1,100);
  const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
  let renderer;
  try { renderer=new THREE.WebGLRenderer({antialias:true,alpha:true}); }
  catch { container.append('WebGL is unavailable. Enable hardware acceleration for the island. Data panels still work.'); }
  const controls=renderer?new OrbitControls(camera,renderer.domElement):null;
  if(renderer) {
    renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor(0,0);container.prepend(renderer.domElement);
    controls.enableDamping=true;controls.enablePan=false;controls.minDistance=3;controls.maxDistance=35;controls.maxPolarAngle=Math.PI/2.15;
    new ResizeObserver(()=>{renderer.setSize(container.clientWidth,container.clientHeight);camera.aspect=container.clientWidth/container.clientHeight;camera.updateProjectionMatrix();}).observe(container);
  }
  scene.add(new THREE.HemisphereLight(0xd8f0ff,0x4e4635,2.7));
  const sun=new THREE.DirectionalLight(0xffe0a1,3.2);sun.position.set(-5,10,4);scene.add(sun);
  const fill=new THREE.DirectionalLight(0x8ac8e7,1.7);fill.position.set(4,6,-6);scene.add(fill);
  const group=new THREE.Group();scene.add(group);
  const time={value:0};
  let heights,waters=[],currentMarker,sourceMarker,candidateMarker;
  let rain=null,rainLines=null,splashes=[];
  let coastGroup=null,coastStreams=[],coastKey='',oceanLabels={pacific:[],atlantic:[]},activeOceans=new Set();
  let maxHeight=1,dimensions=[5,5];
  const colors={pacific:0x4cb7e8,atlantic:0x57cbb2,both:0xb49ae9,downhill:0x6ad4ed};
  const height=(r,c)=>.2+heights[r][c]/maxHeight*1.65;
  const position=(r,c)=>new THREE.Vector3(c-(dimensions[1]-1)/2,height(r,c)+.09,r-(dimensions[0]-1)/2);
  function texture(seed,stone=false) {
    const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
    const ctx=canvas.getContext('2d'),data=ctx.createImageData(128,128);
    let random=seed;
    for(let i=0;i<data.data.length;i+=4) {
      random=(Math.imul(random,1664525)+1013904223)>>>0;
      const grain=(random>>>24)/255,base=stone?156:210,range=stone?65:40;
      data.data[i]=base+grain*range;data.data[i+1]=base-8+grain*range;data.data[i+2]=base-22+grain*range;data.data[i+3]=255;
    }
    ctx.putImageData(data,0,0);
    if(stone) for(let y=9;y<128;y+=14){ctx.strokeStyle='rgba(53,45,36,.22)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,y);ctx.bezierCurveTo(40,y+9,80,y-7,128,y+3);ctx.stroke();}
    const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.wrapS=map.wrapT=THREE.RepeatWrapping;return map;
  }
  function label(text,x,y,z,color='#e7e3d8',scale=.25) {
    const canvas=document.createElement('canvas');canvas.width=192;canvas.height=96;const ctx=canvas.getContext('2d');
    ctx.font='bold 46px monospace';ctx.textAlign='center';ctx.lineWidth=6;ctx.strokeStyle='rgba(33,37,34,.8)';ctx.strokeText(text,96,64);ctx.fillStyle=color;ctx.fillText(text,96,64);
    const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(canvas)}));sprite.position.set(x,y,z);sprite.scale.set(scale*2,scale,1);group.add(sprite);
  }
  function waterMaterial(color,sea=false) {
    return new THREE.ShaderMaterial({
      transparent:true,depthWrite:false,side:THREE.DoubleSide,
      uniforms:{uTime:time,uColor:{value:new THREE.Color(color)},uSea:{value:sea?1:0},uSize:{value:new THREE.Vector2(dimensions[1],dimensions[0])},uPacific:{value:new THREE.Color(0x287fa6)},uAtlantic:{value:new THREE.Color(0x328f7b)}},
      vertexShader:`uniform float uTime;uniform float uSea;varying vec2 vUv;varying vec2 vWorld;
      void main(){vUv=uv;vec3 p=position;float wave=sin(p.x*7.0+uTime*2.4)*cos(p.y*6.0-uTime*1.8);p.z+=wave*mix(0.013,0.045,uSea);vec4 world=modelMatrix*vec4(p,1.0);vWorld=world.xz;gl_Position=projectionMatrix*viewMatrix*world;}`,
      fragmentShader:`uniform float uTime;uniform vec3 uColor;uniform float uSea;uniform vec2 uSize;uniform vec3 uPacific;uniform vec3 uAtlantic;varying vec2 vUv;varying vec2 vWorld;
      void main(){float radius=length(vUv-0.5);float rings=sin(radius*46.0-uTime*3.8);float crest=smoothstep(0.6,1.0,rings);float edge=1.0-smoothstep(0.36,0.49,max(abs(vUv.x-0.5),abs(vUv.y-0.5)));float atlantic=step(0.0,vWorld.x/uSize.x+vWorld.y/uSize.y);float pacificPhase=vWorld.x*7.0+sin(vWorld.y*1.8-uTime*0.6)*1.2+uTime*1.7;float atlanticPhase=vWorld.y*7.0+sin(vWorld.x*2.0+uTime*0.7)*1.2-uTime*1.5;float oceanWave=sin(mix(pacificPhase,atlanticPhase,atlantic));float foam=mix(crest,smoothstep(0.90,1.0,oceanWave)*0.35,uSea);vec3 baseColor=mix(uColor,mix(uPacific,uAtlantic,atlantic),uSea);vec3 color=mix(baseColor,vec3(0.83,0.97,1.0),foam*0.62);float seaEdge=1.0-smoothstep(0.35,0.5,max(abs(vUv.x-0.5),abs(vUv.y-0.5)));float alpha=mix(edge*(0.33+crest*0.35),0.88*seaEdge,uSea);gl_FragColor=vec4(color,alpha);
#include <colorspace_fragment>}`,
    });
  }
  function oceanLabel(text,x,z,rotation,color){
    const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=192;const ctx=canvas.getContext('2d');
    ctx.textAlign='center';ctx.font='600 105px sans-serif';ctx.lineWidth=5;ctx.strokeStyle='rgba(10,40,53,.55)';ctx.strokeText(text,512,133);ctx.fillStyle=color;ctx.fillText(text,512,133);
    const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;
    const plane=new THREE.Mesh(new THREE.PlaneGeometry(2.1,.40),new THREE.MeshBasicMaterial({map,transparent:true,depthWrite:false,side:THREE.DoubleSide}));plane.rotation.set(-Math.PI/2,0,rotation);plane.position.set(x,-.07,z);group.add(plane);oceanLabels[text.toLowerCase()].push(plane);
  }
  function rockShape(w,d) {
    const shape=new THREE.Shape();
    const bevel=.09;
    const points=[[-w/2+bevel,-d/2],[w/2-bevel,-d/2],[w/2,-d/2+bevel],[w/2,d/2-bevel],[w/2-bevel,d/2],[-w/2+bevel,d/2],[-w/2,d/2-bevel],[-w/2,-d/2+bevel]];
    points.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();return shape;
  }
  function slab(w,d,h,materials,x=0,z=0,y=0) {
    const geometry=new THREE.ExtrudeGeometry(rockShape(w,d),{depth:h,bevelEnabled:true,bevelThickness:.035,bevelSize:.035,bevelSegments:1,steps:1});geometry.rotateX(-Math.PI/2);
    const mesh=new THREE.Mesh(geometry,materials);mesh.position.set(x,y,z);group.add(mesh);return mesh;
  }
  function resetCamera(){const size=Math.max(...dimensions);camera.position.set(size*.85,size*1.75+2,size*1.15);controls?.target.set(0,.65,0);controls?.update();}
  function rebuild(grid) {
    const geometries=new Set(),materials=new Set(),maps=new Set();
    group.traverse(obj=>{if(obj.isInstancedMesh)obj.dispose();if(obj.geometry)geometries.add(obj.geometry);for(const material of obj.material?(Array.isArray(obj.material)?obj.material:[obj.material]):[]){materials.add(material);if(material.map)maps.add(material.map);if(material.bumpMap)maps.add(material.bumpMap);}});
    geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());maps.forEach(m=>m.dispose());group.clear();
    heights=grid;dimensions=[grid.length,grid[0].length];maxHeight=Math.max(1,...grid.flat());waters=[];splashes=[];coastStreams=[];coastKey='';coastGroup=null;oceanLabels={pacific:[],atlantic:[]};activeOceans=new Set();
    const [m,n]=dimensions,sand=texture(41),stone=texture(17,true);
    const sandMaterial=new THREE.MeshStandardMaterial({map:sand,bumpMap:sand,bumpScale:.025,color:0xd3b786,roughness:1});
    const sideMaterial=new THREE.MeshStandardMaterial({map:stone,bumpMap:stone,bumpScale:.07,color:0x8e7b63,roughness:1,flatShading:true});
    slab(n+.65,m+.65,.12,[sandMaterial,sideMaterial],0,0,-.14);
    const sea=new THREE.Mesh(new THREE.PlaneGeometry(n+4.5,m+4.5,40,40),waterMaterial(0x216d8b,true));sea.rotation.x=-Math.PI/2;sea.position.y=-.17;sea.renderOrder=-1;group.add(sea);
    oceanLabel('PACIFIC',0,-m/2-1.05,0,'#a7dff6');oceanLabel('PACIFIC',-n/2-1.10,0,Math.PI/2,'#a7dff6');
    oceanLabel('ATLANTIC',0,m/2+1.10,0,'#9dedcf');oceanLabel('ATLANTIC',n/2+1.10,0,Math.PI/2,'#9dedcf');
    for(const [points,color] of [
      [[[-n/2-.4,.01,m/2+.4],[-n/2-.4,.01,-m/2-.4],[n/2+.4,.01,-m/2-.4]],0x69c5f0],
      [[[n/2+.4,.01,-m/2-.4],[n/2+.4,.01,m/2+.4],[-n/2-.4,.01,m/2+.4]],0x62d4b0],
    ])group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(...p))),new THREE.LineBasicMaterial({color,transparent:true,opacity:.75})));
    const cellWaterGeometry=new THREE.PlaneGeometry(.87,.87,8,8),pebbleGeometry=new THREE.DodecahedronGeometry(.075,0);
    const pebbleMaterial=new THREE.MeshStandardMaterial({color:0x938777,roughness:1,flatShading:true});
    for(let r=0;r<m;r++){
      waters[r]=[];
      for(let c=0;c<n;c++){
        const p=position(r,c),h=height(r,c),high=grid[r][c]/maxHeight>.55;
        const top=high?new THREE.MeshStandardMaterial({map:stone,bumpMap:stone,bumpScale:.04,color:0xb3a28a,roughness:1}):sandMaterial;
        slab(.91,.91,h,[top,sideMaterial],p.x,p.z);
        for(let j=0;j<2;j++){
          const pebble=new THREE.Mesh(pebbleGeometry,pebbleMaterial);pebble.position.set(p.x+(j?-.29:.29),h+.055,p.z+((r+c+j)%2?.27:-.25));pebble.scale.set(1+(r%2)*.3,.65,1);pebble.rotation.set(r*.6,c*.9,j);group.add(pebble);
        }
        const water=new THREE.Mesh(cellWaterGeometry,waterMaterial(colors.downhill));water.rotation.x=-Math.PI/2;water.position.copy(p);water.position.y=h+.055;water.visible=false;waters[r][c]=water;group.add(water);
        label(String(grid[r][c]),p.x,h+.24,p.z);
      }
      label(String(r),-n/2-.6,.12,r-(m-1)/2,'#9cdef7',.22);
    }
    for(let c=0;c<n;c++)label(String(c),c-(n-1)/2,.12,m/2+.6,'#9dedcf',.22);
    currentMarker=new THREE.Mesh(new THREE.TorusGeometry(.32,.022,8,40),new THREE.MeshBasicMaterial({color:0xffffff}));currentMarker.rotation.x=-Math.PI/2;group.add(currentMarker);currentMarker.visible=false;
    sourceMarker=new THREE.Mesh(new THREE.TorusGeometry(.39,.025,8,40),new THREE.MeshBasicMaterial({color:0xf7d58f}));sourceMarker.rotation.x=-Math.PI/2;group.add(sourceMarker);sourceMarker.visible=false;
    candidateMarker=new THREE.Mesh(new THREE.TorusGeometry(.36,.022,8,40),new THREE.MeshBasicMaterial({color:0xf7d58f}));candidateMarker.rotation.x=-Math.PI/2;candidateMarker.visible=false;group.add(candidateMarker);
    rain=new THREE.Group();rain.visible=false;group.add(rain);
    const rainGeometry=new THREE.BufferGeometry();rainGeometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(48*6),3));
    rainLines=new THREE.LineSegments(rainGeometry,new THREE.LineBasicMaterial({color:0xb5e9ff,transparent:true,opacity:.8,depthWrite:false}));rainLines.frustumCulled=false;rain.add(rainLines);
    const splashGeometry=new THREE.TorusGeometry(1,.012,4,32);
    for(let i=0;i<5;i++){
      const splash=new THREE.Mesh(splashGeometry,new THREE.MeshBasicMaterial({color:0xd2f4ff,transparent:true,opacity:.65,depthWrite:false}));splash.rotation.x=-Math.PI/2;splash.position.y=.015+i*.002;rain.add(splash);splashes.push(splash);
    }
    resetCamera();
  }
  function updateOutlets(state,mode){
    const [m,n]=dimensions;
    const outlets=[];
    for(let r=0;r<m;r++)for(let c=0;c<n;c++){
      if(mode==='downhill'){
        const wet=state.type==='done'?state.pacific[r][c]||state.atlantic[r][c]:state.visited[r][c];
        if(wet)outlets.push(...oceanOutlets(r,c,m,n));
      } else for(const outlet of oceanOutlets(r,c,m,n))if(state[outlet.ocean][r][c])outlets.push(outlet);
    }
    activeOceans=new Set(outlets.map(outlet=>outlet.ocean));
    const key=outlets.map(outlet=>`${outlet.cell}-${outlet.side}`).join('|')+'#'+state.edges.map(edge=>`${edge.from}>${edge.to}:${edge.ocean}`).join('|');
    if(key===coastKey)return;
    coastKey=key;coastStreams=[];
    if(coastGroup){
      const geometries=new Set(),materials=new Set();
      coastGroup.traverse(obj=>{if(obj.isInstancedMesh)obj.dispose();if(obj.geometry)geometries.add(obj.geometry);if(obj.material)materials.add(obj.material);});
      geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());group.remove(coastGroup);
    }
    coastGroup=new THREE.Group();group.add(coastGroup);
    const dropletGeometry=new THREE.SphereGeometry(.04,8,6),rippleGeometry=new THREE.TorusGeometry(1,.018,4,40);
    for(const outlet of outlets){
      const [r,c]=outlet.cell,from=position(r,c),lip=from.clone(),landing=from.clone();
      const direction={top:[0,-1],left:[-1,0],bottom:[0,1],right:[1,0]}[outlet.side];
      lip.x+=direction[0]*.44;lip.z+=direction[1]*.44;lip.y-=.02;
      if(direction[0])landing.x=direction[0]*(n/2+.72);
      if(direction[1])landing.z=direction[1]*(m/2+.72);
      landing.y=-.095;
      const fall=landing.clone().lerp(lip,.3);fall.y=Math.max(.0,from.y*.2);
      const curve=new THREE.CatmullRomCurve3([from,lip,fall,landing]);
      const color=colors[outlet.ocean];
      coastGroup.add(new THREE.Mesh(new THREE.TubeGeometry(curve,24,.045,6,false),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.4,depthWrite:false})));
      const dropMaterial=new THREE.MeshBasicMaterial({color:outlet.ocean==='pacific'?0xa6e6ff:0xb9ffe3});
      const drops=new THREE.InstancedMesh(dropletGeometry,dropMaterial,12);drops.instanceMatrix.setUsage(THREE.DynamicDrawUsage);drops.frustumCulled=false;coastGroup.add(drops);
      const rings=[];
      for(let i=0;i<4;i++){const ring=new THREE.Mesh(rippleGeometry,new THREE.MeshBasicMaterial({color,transparent:true,opacity:.65,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.copy(landing);ring.position.y+=i*.004;rings.push(ring);coastGroup.add(ring);}
      coastStreams.push({curve,drops,rings});
    }
    for(const edge of state.edges){
      const from=position(...edge.from),to=position(...edge.to);
      const direction=new THREE.Vector3(to.x-from.x,0,to.z-from.z).normalize();
      const lip=from.clone().addScaledVector(direction,.46),entry=to.clone().addScaledVector(direction,-.46);
      const curve=new THREE.CurvePath();
      curve.add(new THREE.LineCurve3(from,lip));curve.add(new THREE.LineCurve3(lip,entry));curve.add(new THREE.LineCurve3(entry,to));
      const color=edge.ocean?colors[edge.ocean]:colors.downhill;
      coastGroup.add(new THREE.Mesh(new THREE.TubeGeometry(curve,16,.027,5,false),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.42,depthWrite:false})));
      const drops=new THREE.InstancedMesh(dropletGeometry,new THREE.MeshBasicMaterial({color:edge.ocean==='atlantic'?0xb9ffe3:0xa6e6ff}),7);drops.instanceMatrix.setUsage(THREE.DynamicDrawUsage);drops.frustumCulled=false;coastGroup.add(drops);
      coastStreams.push({curve,drops,rings:[]});
    }
    // An empty footprint attaches neither shared geometry.
    if(!outlets.length)rippleGeometry.dispose();
    if(!outlets.length&&!state.edges.length)dropletGeometry.dispose();
  }
  function update(state,mode){
    const [m,n]=dimensions;
    updateOutlets(state,mode);
    for(let r=0;r<m;r++)for(let c=0;c<n;c++){
      const key=state.pacific[r][c]?(state.atlantic[r][c]?'both':'pacific'):(state.atlantic[r][c]?'atlantic':null);
      const cell=waters[r][c];cell.visible=mode==='downhill'?(state.type==='done'||!!state.visited[r][c]):!!key;
      cell.material.uniforms.uColor.value.setHex(mode==='downhill'&&state.type!=='done'&&state.visited[r][c]?colors.downhill:colors[key]||colors.downhill);
    }
    currentMarker.visible=!!state.current;if(state.current)currentMarker.position.copy(position(...state.current));
    sourceMarker.visible=mode==='downhill'&&!!state.origin&&state.type!=='done';if(sourceMarker.visible)sourceMarker.position.copy(position(...state.origin).add(new THREE.Vector3(0,.035,0)));
    candidateMarker.visible=false;
    if(state.candidate){const [r,c]=state.candidate;if(r>=0&&r<m&&c>=0&&c<n){candidateMarker.visible=true;candidateMarker.position.copy(position(r,c));candidateMarker.material.color.setHex(state.reason?0xf08b95:0xf7d58f);}}
    rain.visible=!!state.origin&&state.type!=='done';
    if(rain.visible)rain.position.copy(position(...state.origin));

  }
  const dropPose=new THREE.Object3D();
  const dropUp=new THREE.Vector3(0,1,0);
  function render(timestamp){
    const seconds=reducedMotion.matches?0:timestamp/1000;time.value=seconds;
    for(const effect of coastStreams){
      for(let i=0;i<effect.drops.count;i++){
        const phase=reducedMotion.matches?i/effect.drops.count:(seconds*1.05+i/effect.drops.count)%1;
        dropPose.position.copy(effect.curve.getPoint(phase));dropPose.quaternion.setFromUnitVectors(dropUp,effect.curve.getTangent(phase));dropPose.scale.set(.8,1.5,.8);dropPose.updateMatrix();effect.drops.setMatrixAt(i,dropPose.matrix);
      }
      effect.drops.instanceMatrix.needsUpdate=true;
      effect.rings.forEach((ring,i)=>{const phase=(seconds*.95+i/4)%1;ring.scale.setScalar(.12+phase*.46);ring.material.opacity=(1-phase)*.75;});
    }
    for(const [ocean,labels] of Object.entries(oceanLabels))for(const oceanLabel of labels)oceanLabel.material.opacity=activeOceans.has(ocean)?.82+Math.sin(seconds*5)*.18:.65;
    if(rain?.visible){
      const positions=rainLines.geometry.attributes.position;
      for(let i=0;i<48;i++){
        const phase=(seconds*1.65+i*.6180339)%1;
        const x=Math.sin(i*127.1)*.32,z=Math.cos(i*71.7)*.32;
        const y=.09+(1-phase)*1.8;
        positions.setXYZ(i*2,x,y,z);positions.setXYZ(i*2+1,x+.018,y+.10,z+.012);
      }
      positions.needsUpdate=true;
      splashes.forEach((splash,i)=>{const phase=(seconds*1.35+i/5)%1;splash.scale.setScalar(.055+phase*.32);splash.material.opacity=(1-phase)*.6;});
    }
    controls?.update();renderer?.render(scene,camera);
  }
  return {rebuild,update,render,resetCamera,topView(){camera.position.set(0,Math.max(...dimensions)*1.75+2,.01);controls?.target.set(0,0,0);controls?.update();}};
}
