export const EXAMPLES={
  classic:{beginWord:'hit',endWord:'cog',wordList:['hot','dot','dog','lot','log','cog']},
  direct:{beginWord:'hit',endWord:'hot',wordList:['hot']},
  unreachable:{beginWord:'hit',endWord:'cog',wordList:['hot','dot','tod','cog']},
  missing:{beginWord:'hit',endWord:'cog',wordList:['hot','dot','dog']},
};
export function validateInput({beginWord,endWord,wordList}){
  if(typeof beginWord!=='string'||typeof endWord!=='string'||! /^[a-z]{2,6}$/.test(beginWord)||endWord.length!==beginWord.length||! /^[a-z]+$/.test(endWord))throw new Error('Begin and end must be lowercase words of the same length (2–6 letters).');
  if(beginWord===endWord)throw new Error('Begin and end must differ, as in the LeetCode problem.');
  if(!Array.isArray(wordList)||wordList.length>16||!wordList.every(word=>typeof word==='string'&&word.length===beginWord.length&&/^[a-z]+$/.test(word)))throw new Error('Use up to 16 lowercase dictionary words, each the same length as begin.');
  return {beginWord,endWord,wordList:[...wordList]};
}
export function* ladderSteps(input){
  const {beginWord,endWord,wordList}=validateInput(input);
  const words=new Set(wordList),graph={},visited=new Set(),parents=new Map(),queue=[];
  let head=0,distance=1,levelSize=0,remaining=0,current=null,pattern=null,neighbor=null,result=null,checks=0,path=[],wordIndex=-1;
  const snapshot=(type)=>({type,head,distance,levelSize,remaining,current,pattern,neighbor,result,checks,path:[...path],wordIndex,queue:[...queue],visited:[...visited],graph:Object.fromEntries(Object.entries(graph).map(([key,bucket])=>[key,[...bucket]]))});
  yield snapshot('start');
  if(!words.has(endWord)){result=0;yield snapshot('missing');yield snapshot('done');return;}
  for(const word of words){
    current=word;wordIndex++;
    for(let i=0;i<beginWord.length;i++){
      pattern=word.slice(0,i)+'*'+word.slice(i+1);yield snapshot('buildPattern');
      if(!graph[pattern])graph[pattern]=[];
      graph[pattern].push(word);yield snapshot('bucket');
    }
  }
  current=beginWord;pattern=null;queue.push(beginWord);visited.add(beginWord);yield snapshot('seed');
  while(queue.length>head){
    const size=queue.length-head;levelSize=size;remaining=size;distance++;current=null;pattern=null;neighbor=null;yield snapshot('level');
    for(let j=0;j<size;j++){
      const word=queue[head++];current=word;remaining=size-j-1;neighbor=null;pattern=null;yield snapshot('dequeue');
      for(let i=0;i<beginWord.length;i++){
        pattern=word.slice(0,i)+'*'+word.slice(i+1);neighbor=null;yield snapshot('searchPattern');
        for(const nei of graph[pattern]||[]){
          neighbor=nei;checks++;yield snapshot('check');
          if(visited.has(nei)){yield snapshot('skip');continue;}
          if(nei===endWord){
            result=distance;path=[nei,word];let parent=parents.get(word);
            while(parent){path.push(parent);parent=parents.get(parent);}
            path.reverse();yield snapshot('found');yield snapshot('done');return;
          }
          visited.add(nei);parents.set(nei,word);yield snapshot('visit');
          queue.push(nei);yield snapshot('enqueue');
        }
      }
    }
  }
  result=0;current=null;pattern=null;neighbor=null;yield snapshot('exhausted');yield snapshot('done');
}
