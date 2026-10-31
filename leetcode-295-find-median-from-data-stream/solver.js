export const EXAMPLES={classic:[1,2,3],balance:[5,2,9,1,7,3,8,0],negative:[-5,-1,-3,-3,0,2],descending:[9,8,7,6,5,4,3,2]};
export function validateNumbers(values){if(!Array.isArray(values)||!values.length||values.length>16||!values.every(v=>Number.isInteger(v)&&v>=-2147483648&&v<=2147483647))throw new Error('Enter 1–16 integers in the C# int range.');return [...values];}
export function* medianSteps(input){
 const values=validateNumbers(input),min=[],max=[],seen=[],medians=[];
 let index=-1,num=null,heap=null,active=[],moving=null,context='AddNum',median=null;
 const snapshot=(type)=>({type,index,num,heap,active:[...active],moving:moving&&{...moving},context,median,seen:[...seen],medians:[...medians],min:min.map(e=>({...e})),max:max.map(e=>({...e}))});
 const higher=(a,b,name)=>name==='min'?a.value<b.value:a.value>b.value;
 function* push(name,node){
  heap=name;const data=name==='min'?min:max;data.push(node);active=[data.length-1];yield snapshot('heapInsert');
  let i=data.length-1;
  while(i>0){const p=Math.floor((i-1)/2);active=[p,i];yield snapshot('compare');if(!higher(data[i],data[p],name))break;[data[p],data[i]]=[data[i],data[p]];yield snapshot('swap');i=p;}
  active=[];
 }
 function* pop(name){
  heap=name;const data=name==='min'?min:max,node=data[0];moving=node;active=[0];yield snapshot('pop');
  const last=data.pop();
  if(data.length){data[0]=last;active=[0];yield snapshot('replace');let i=0;
   while(true){let best=i;const left=i*2+1,right=left+1;if(left<data.length&&higher(data[left],data[best],name))best=left;if(right<data.length&&higher(data[right],data[best],name))best=right;if(best===i)break;active=[i,best];yield snapshot('compare');[data[i],data[best]]=[data[best],data[i]];yield snapshot('swap');i=best;}
  }
  active=[];yield snapshot('removed');return node;
 }
 yield snapshot('start');
 for(let i=0;i<values.length;i++){
  index=i;num=values[i];median=null;moving=null;context='min.Enqueue';heap='min';active=[];yield snapshot('incoming');
  yield* push('min',{id:i,value:num});
  context='orderCheck';heap=null;active=[];yield snapshot('orderCheck');
  if(max.length&&min[0].value<max[0].value){context='orderTransfer';const node=yield* pop('min');heap='max';moving=node;yield snapshot('transfer');yield* push('max',node);moving=null;}
  context='maxBalance';heap=null;yield snapshot('balanceCheck');
  if(max.length-min.length>1){const node=yield* pop('max');heap='min';moving=node;yield snapshot('transfer');yield* push('min',node);moving=null;}
  context='minBalance';heap=null;yield snapshot('balanceCheck');
  if(min.length-max.length>1){const node=yield* pop('min');heap='max';moving=node;yield snapshot('transfer');yield* push('max',node);moving=null;}
  seen.push(num);context='FindMedian';heap=null;active=[];yield snapshot('medianCheck');
  median=min.length>max.length?min[0].value:max.length>min.length?max[0].value:(min[0].value+max[0].value)/2;
  medians.push(median);yield snapshot('median');
 }
 yield snapshot('done');
}
