import {mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import {publicFiles} from './public-files.js';

const base=process.env.BASE_PATH??'';
if(base!==''&&!/^\/[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*$/.test(base))throw new Error('BASE_PATH must be empty or a path like /leetcode-animations, without a trailing slash.');
await rm(new URL('./dist/',import.meta.url),{recursive:true,force:true});
for(const path of publicFiles){
 const output=new URL(`./dist${path}`,import.meta.url);
 await mkdir(new URL('.',output),{recursive:true});
 let text=await readFile(new URL(`.${path}`,import.meta.url),'utf8');
 // Preserve native modules; rewrite only root-relative URLs in our HTML/JS.
 if(base&&!path.startsWith('/node_modules/')&&/\.(html|js)$/.test(path))text=text.replace(/(["'`])\/(?!\/)/g,`$1${base}/`);
 await writeFile(output,text);
}
await writeFile(new URL('./dist/.nojekyll',import.meta.url),'');
console.log(`Static site ready in dist${base?` (base ${base})`:''}`);
