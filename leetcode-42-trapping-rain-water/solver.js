export const EXAMPLES={classic:[0,1,0,2,1,0,1,3,2,1,2,1],basin:[4,2,0,3,2,5],flat:[2,2,2],single:[3],empty:[]};
export function validateHeights(value){
 if(!Array.isArray(value)||value.length>32||value.some(n=>!Number.isInteger(n)||n<0||n>20))throw new Error('Use 0–32 integer heights between 0 and 20.');
 return [...value];
}
export function* trapSteps(input){
 const height=validateHeights(input),water=height.map(()=>0),resolved=height.map((_,i)=>i===0||i===height.length-1);
 let lMax=height[0],rMax=height[height.length-1],l=1,r=height.length-2,res=0,side=null;
 const snap=(type,line,message,active=null)=>({type,line,message,active,side,height:[...height],water:[...water],resolved:[...resolved],lMax,rMax,l,r,res});
 yield snap('start',5,'Initialize the two boundary maxima and inward pointers.');
 while(l<=r){
  yield snap('compare',10,`Compare lMax (${lMax}) < rMax (${rMax}): ${lMax<rMax}.`);
  if(lMax<rMax){
   side='Left';
   lMax=Math.max(lMax,height[l]);
   yield snap('maximum',11,`Left maximum becomes ${lMax}. The right boundary is high enough.`,l);
   water[l]=lMax-height[l];res+=water[l];resolved[l]=true;
   yield snap('fill',12,`Cell ${l}: ${lMax} − ${height[l]} = ${water[l]} water. Total ${res}.`,l);
   l++;yield snap('move',13,'Move the left pointer inward.');
  }else{
   side='Right';
   rMax=Math.max(rMax,height[r]);
   yield snap('maximum',15,`Right maximum becomes ${rMax}. The left boundary is high enough.`,r);
   water[r]=rMax-height[r];res+=water[r];resolved[r]=true;
   yield snap('fill',16,`Cell ${r}: ${rMax} − ${height[r]} = ${water[r]} water. Total ${res}.`,r);
   r--;yield snap('move',17,'Move the right pointer inward.');
  }
 }
 yield snap('done',21,`Complete. ${res} units of trapped rain water. O(n) time, O(1) algorithm space.`);
}
