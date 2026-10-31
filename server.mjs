import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { tasks } from './tasks.js';
import {publicFiles} from './public-files.js';

const files=new Set(publicFiles);
const folders=new Set(tasks.map(task=>`/${task.slug}`));
const types={html:'text/html',js:'text/javascript',css:'text/css'};
const server=createServer(async(req,res)=>{
  if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405,{Allow:'GET, HEAD'}).end();return;}
  let url;
  try{url=new URL(req.url,'http://localhost');}catch{res.writeHead(400).end('Bad request');return;}
  let path=url.pathname;
  if(folders.has(path)){res.writeHead(308,{Location:`${path}/${url.search}`}).end();return;}
  if(path==='/')path='/index.html';
  else if(folders.has(path.slice(0,-1))&&path.endsWith('/'))path+='index.html';
  if(!files.has(path)){res.writeHead(404).end('Not found');return;}
  try{
    const body=await readFile(new URL(`.${path}`,import.meta.url));
    res.writeHead(200,{'Content-Type':`${types[path.split('.').pop()]}; charset=utf-8`,'X-Content-Type-Options':'nosniff','Cache-Control':'no-cache'});
    res.end(req.method==='HEAD'?undefined:body);
  }catch(error){console.error(`Unable to serve ${path}: ${error.message}`);res.writeHead(500).end('Unable to load file');}
});
server.on('error',error=>{console.error(error.message);process.exitCode=1;});
server.listen(Number(process.env.PORT??5173),'127.0.0.1',()=>console.log(`Algorithm Lab: http://127.0.0.1:${server.address().port}/`));
