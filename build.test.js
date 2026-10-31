import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile,readdir} from 'node:fs/promises';
import {tasks} from './tasks.js';
import {publicFiles} from './public-files.js';

test('Pages package rewrites deep links and imports without shipping private files',async()=>{
 execFileSync(process.execPath,['build.mjs'],{env:{...process.env,BASE_PATH:'/leetcode-animations'}});
 for(const file of publicFiles)assert.ok((await readFile(new URL(`./dist${file}`,import.meta.url))).length,file);
 const home=await readFile(new URL('./dist/chooser.js',import.meta.url),'utf8');assert.ok(home.includes('`/leetcode-animations/${task.slug}/`'));
 for(const task of tasks){
  const html=await readFile(new URL(`./dist/${task.slug}/index.html`,import.meta.url),'utf8');
  assert.ok(html.includes('href="/leetcode-animations/"'));assert.ok(html.includes('"three":"/leetcode-animations/node_modules/three/build/three.module.js"'));
  for(const file of task.files.filter(f=>/\.(js|html)$/.test(f))){const source=await readFile(new URL(`./dist/${task.slug}/${file}`,import.meta.url),'utf8');assert.ok(!/(?:from\s*|href=|src=)["']\/(?!leetcode-animations\/)/.test(source),`${task.slug}/${file}`);}
 }
 const files=await readdir(new URL('./dist/',import.meta.url),{recursive:true});
 assert.ok(!files.some(file=>/\.test\.js$|README|server\.mjs|package\.json|\.git\//.test(file)));
 const three=await readFile(new URL('./dist/node_modules/three/build/three.module.js',import.meta.url),'utf8');assert.ok(three.includes('./three.core.js'));
 assert.throws(()=>execFileSync(process.execPath,['build.mjs'],{env:{...process.env,BASE_PATH:'../bad'},stdio:'pipe'}));
});
