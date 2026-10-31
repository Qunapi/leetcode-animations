export const EXAMPLES={
 classic:{sentences:['i love you','island','iroman','i love leetcode'],times:[5,3,2,2],keys:'i a#i a#i '},
 ties:{sentences:['car','cat','cab','can'],times:[2,2,2,3],keys:'ca#ca'},
 learn:{sentences:['ab','ac'],times:[2,1],keys:'azx#az#az'},
};
export function validateConfig({sentences,times,keys}){
 if(!Array.isArray(sentences)||!sentences.length||sentences.length>6||!sentences.every(s=>typeof s==='string'&&s.length>=1&&s.length<=16&&/^[a-z ]+$/.test(s)))throw new Error('Use 1–6 sentences, each 1–16 lowercase letters/spaces.');
 if(!Array.isArray(times)||times.length!==sentences.length||!times.every(t=>Number.isInteger(t)&&t>=1&&t<=1000))throw new Error('Supply one positive frequency (1–1000) for each sentence.');
 if(typeof keys!=='string'||keys.length>32||!/^[a-z #]*$/.test(keys)||keys.split('#').some(part=>part.length>16))throw new Error('Use up to 32 input characters (lowercase, spaces, #), with at most 16 characters before each #.');
 return{sentences:[...sentences],times:[...times],keys};
}
export class AutocompleteTrace{
 constructor(config){this.config=validateConfig(config);this.nodes=new Map([['',{prefix:'',parent:null,key:'root',children:new Map(),sentences:new Map()}]]);this.curr='';this.buffer='';this.dead=false;this.active='';this.character=null;this.sentence=null;this.count=0;this.rank=[];this.output=[];this.responses=[];this.phase='initialize';this.keyIndex=-1;}
 snapshot(type){return{type,phase:this.phase,curr:this.curr,buffer:this.buffer,dead:this.dead,active:this.active,character:this.character,sentence:this.sentence,count:this.count,rank:this.rank.map(pair=>[...pair]),output:[...this.output],responses:this.responses.map(r=>({character:r.character,output:[...r.output]})),keyIndex:this.keyIndex,nodes:[...this.nodes.values()].map(node=>({prefix:node.prefix,parent:node.parent,key:node.key,children:[...node.children.keys()],sentences:[...node.sentences].map(pair=>[...pair])}))};}
 *add(sentence,count){
  this.sentence=sentence;this.count=count;let prefix='';this.active='';yield this.snapshot('insertStart');
  for(const c of sentence){
   const parent=this.nodes.get(prefix);this.active=prefix;yield this.snapshot('childCheck');
   const next=prefix+c;
   if(!parent.children.has(c)){parent.children.set(c,next);this.nodes.set(next,{prefix:next,parent:prefix,key:c,children:new Map(),sentences:new Map()});this.active=next;yield this.snapshot('create');}
   prefix=next;this.active=prefix;yield this.snapshot('insertMove');
   const node=this.nodes.get(prefix);node.sentences.set(sentence,(node.sentences.get(sentence)||0)+count);yield this.snapshot('frequency');
  }
 }
 *initialize(){
  yield this.snapshot('start');
  for(let i=0;i<this.config.sentences.length;i++)yield* this.add(this.config.sentences[i],this.config.times[i]);
  this.phase='input';this.sentence=null;this.active='';yield this.snapshot('ready');
 }
 validateCharacter(c){
  if(typeof c!=='string'||c.length!==1||!/^[a-z #]$/.test(c))throw new Error('Enter one lowercase letter, a space, or #.');
  if(this.keyIndex>=63)throw new Error('Live demo limit: 64 input characters. Restart to begin again.');
  if(c!=='#'&&this.buffer.length>=16)throw new Error('Prefix limit: 16 characters. Enter # to commit/reset.');
 }
 *input(c){
  this.validateCharacter(c);this.character=c;this.keyIndex++;this.rank=[];this.output=[];this.active=this.curr;this.phase='input';yield this.snapshot('incoming');
  if(c==='#'){
   const sentence=this.buffer;this.dead=false;this.curr='';this.active='';this.phase='learn';yield this.snapshot('resetCursor');
   yield* this.add(sentence,1);
   this.buffer='';this.sentence=null;this.active='';this.phase='input';yield this.snapshot('clear');
   this.responses.push({character:c,output:[]});yield this.snapshot('return');return;
  }
  this.buffer+=c;yield this.snapshot('buffer');
  if(this.dead){yield this.snapshot('deadSkip');this.responses.push({character:c,output:[]});yield this.snapshot('return');return;}
  yield this.snapshot('lookup');
  if(!this.nodes.get(this.curr).children.has(c)){this.dead=true;yield this.snapshot('missing');this.responses.push({character:c,output:[]});yield this.snapshot('return');return;}
  this.curr=this.nodes.get(this.curr).children.get(c);this.active=this.curr;yield this.snapshot('traverse');
  this.rank=[...this.nodes.get(this.curr).sentences].sort((a,b)=>b[1]-a[1]||(a[0]<b[0]?-1:a[0]>b[0]?1:0));yield this.snapshot('rank');
  for(let i=0;i<Math.min(3,this.rank.length);i++){this.output.push(this.rank[i][0]);yield this.snapshot('suggest');}
  this.responses.push({character:c,output:[...this.output]});yield this.snapshot('return');
 }
 *run(){yield* this.initialize();for(const c of this.config.keys)yield* this.input(c);yield this.snapshot('done');}
 *append(c){yield* this.input(c);yield this.snapshot('done');}
}
