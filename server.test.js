import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {tasks} from './tasks.js';

test('shared server serves deep pages, isolates public files, and keeps the chooser import graph light', {timeout:10000},async()=>{
 const child=spawn(process.execPath,['server.mjs'],{cwd:new URL('.',import.meta.url),env:{...process.env,PORT:'0'}});
 try{
  const ready=await Promise.race([once(child.stdout,'data').then(([chunk])=>chunk.toString()),once(child,'exit').then(([code])=>{throw new Error(`Server exited: ${code}`);})]);
  const base=ready.match(/http:\/\/127\.0\.0\.1:\d+/)?.[0];assert.ok(base,ready);
  const root=await fetch(base);assert.equal(root.status,200);const html=await root.text();
  assert.ok(!/modulepreload|prefetch|three|iframe|\/leetcode-\d+[^"']*\.js/i.test([...html.matchAll(/<(?:script|link|iframe)\b[^>]*>/gi)].map(match=>match[0]).join('')),'Chooser must not eagerly load an explorer or Three.js');
  const scripts=[...html.matchAll(/<script\b[^>]*src="([^"]+)"/g)].map(match=>new URL(match[1],base+'/').pathname);
  const visited=new Set();
  async function inspectModule(path){
   if(visited.has(path))return;visited.add(path);
   const response=await fetch(base+path);assert.equal(response.status,200,path);assert.match(response.headers.get('content-type'),/text\/javascript/);
   const source=await response.text();
   for(const match of source.matchAll(/^import\s+.*?from\s*['"]([^'"]+)['"]/gm))await inspectModule(new URL(match[1],base+path).pathname);
  }
  for(const script of scripts)await inspectModule(script);
  assert.deepEqual([...visited].sort(),['/chooser.js','/tasks.js']);
  for(const task of tasks){
   const url=`${base}/${task.slug}`;
   const redirect=await fetch(url,{redirect:'manual'});assert.equal(redirect.status,308);assert.equal(redirect.headers.get('location'),`/${task.slug}/`);
   const page=await fetch(url+'/');assert.equal(page.status,200);const document=await page.text();assert.match(document,/href="\/"/);assert.match(document,/"three":"\/node_modules\/three\/build\/three.module.js"/);
   for(const file of task.files){const response=await fetch(`${url}/${file}`);assert.equal(response.status,200,`${task.slug}/${file}`);if(file.endsWith('.js'))assert.match(response.headers.get('content-type'),/text\/javascript/);}
  }
  for(const path of ['/node_modules/three/build/three.module.js','/node_modules/three/build/three.core.js','/node_modules/three/examples/jsm/controls/OrbitControls.js'])assert.equal((await fetch(base+path)).status,200);
  for(const path of ['/package.json','/server.mjs','/.git/config','/leetcode-51-n-queens/solver.test.js','/leetcode-127-word-ladder/README.md','/node_modules/three/package.json','/%2e%2e/package.json','/unknown-task/'])assert.equal((await fetch(base+path)).status,404,path);
  assert.equal((await fetch(base,{method:'POST'})).status,405);
  const head=await fetch(base,{method:'HEAD'});assert.equal(head.status,200);assert.equal(await head.text(),'');
 }finally{if(child.exitCode===null){const exited=once(child,'exit');child.kill();await exited;}}
});
