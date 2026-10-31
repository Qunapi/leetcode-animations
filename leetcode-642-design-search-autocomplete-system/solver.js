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
export class AutocompleteTrace {
 constructor(config){this.config=validateConfig(config);this.nodes=new Map([['',this.node('',null,'root')]]);this.frequency=new Map();this.curr='';this.buffer='';this.active='';this.character=null;this.sentence=null;this.output=[];this.responses=[];this.phase='initialize';this.keyIndex=-1;this.evicted=null;}
 node(prefix,parent,key){return{prefix,parent,key,children:new Map(),top:[]};}
 snapshot(type){return{type,phase:this.phase,curr:this.curr,buffer:this.buffer,dead:this.curr===null,active:this.active,character:this.character,sentence:this.sentence,evicted:this.evicted,frequency:[...this.frequency],output:[...this.output],responses:this.responses.map(r=>({character:r.character,output:[...r.output]})),keyIndex:this.keyIndex,nodes:[...this.nodes.values()].map(n=>({prefix:n.prefix,parent:n.parent,key:n.key,children:[...n.children.keys()],top:[...n.top]}))};}
 *updateTop(node){
  this.active=node.prefix;this.evicted=null;yield this.snapshot('topCheck');
  if(!node.top.includes(this.sentence)){node.top.push(this.sentence);yield this.snapshot('topAdd');}
  node.top.sort((a,b)=>this.frequency.get(b)-this.frequency.get(a)||(a<b?-1:a>b?1:0));yield this.snapshot('topSort');
  if(node.top.length>3){this.evicted=node.top.splice(3,1)[0];yield this.snapshot('topRemove');}
 }
 *add(sentence){
  this.sentence=sentence;let prefix='';this.active='';yield this.snapshot('insertStart');yield* this.updateTop(this.nodes.get(''));
  for(const c of sentence){const parent=this.nodes.get(prefix);this.active=prefix;yield this.snapshot('childCheck');const next=prefix+c;
   if(!parent.children.has(c)){parent.children.set(c,next);this.nodes.set(next,this.node(next,prefix,c));this.active=next;yield this.snapshot('create');}
   prefix=next;this.active=prefix;yield this.snapshot('insertMove');yield* this.updateTop(this.nodes.get(prefix));
  }
 }
 *initialize(){yield this.snapshot('start');for(let i=0;i<this.config.sentences.length;i++){this.sentence=this.config.sentences[i];this.frequency.set(this.sentence,this.config.times[i]);yield this.snapshot('seedFrequency');}for(const sentence of this.config.sentences)yield* this.add(sentence);this.phase='input';this.sentence=null;this.active='';yield this.snapshot('ready');}
 validateCharacter(c){if(typeof c!=='string'||c.length!==1||!/^[a-z #]$/.test(c))throw new Error('Enter one lowercase letter, a space, or #.');if(this.keyIndex>=63)throw new Error('Live demo limit: 64 input characters. Restart to begin again.');if(c!=='#'&&this.buffer.length>=16)throw new Error('Prefix limit: 16 characters. Enter # to commit/reset.');}
 *input(c){
  this.validateCharacter(c);this.character=c;this.keyIndex++;this.output=[];this.active=this.curr??this.active;this.phase='input';this.evicted=null;yield this.snapshot('incoming');
  if(c==='#'){this.sentence=this.buffer;yield this.snapshot('commit');if(this.sentence.length){this.frequency.set(this.sentence,(this.frequency.get(this.sentence)||0)+1);this.phase='learn';yield this.snapshot('frequency');yield* this.add(this.sentence);}this.buffer='';yield this.snapshot('clear');this.curr='';this.active='';this.phase='input';this.sentence=null;yield this.snapshot('resetCursor');this.responses.push({character:c,output:[]});yield this.snapshot('return');return;}
  this.buffer+=c;yield this.snapshot('buffer');if(this.curr===null){yield this.snapshot('deadSkip');this.responses.push({character:c,output:[]});yield this.snapshot('return');return;}
  yield this.snapshot('lookup');if(!this.nodes.get(this.curr).children.has(c)){this.curr=null;yield this.snapshot('missing');this.responses.push({character:c,output:[]});yield this.snapshot('return');return;}
  this.curr=this.nodes.get(this.curr).children.get(c);this.active=this.curr;yield this.snapshot('traverse');this.output=[...this.nodes.get(this.curr).top];yield this.snapshot('cachedRead');this.responses.push({character:c,output:[...this.output]});yield this.snapshot('return');
 }
 *run(){yield* this.initialize();for(const c of this.config.keys)yield* this.input(c);yield this.snapshot('done');}
 *append(c){yield* this.input(c);yield this.snapshot('done');}
}
