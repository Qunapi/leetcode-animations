export const source=`using System;
using System.Collections.Generic;

public class MedianFinder
{
    private PriorityQueue<int, int> min = new();
    private PriorityQueue<int, long> max = new();

    public void AddNum(int num)
    {
        min.Enqueue(num, num);
        if (max.Count > 0 && min.Peek() < max.Peek())
        {
            int value = min.Dequeue();
            max.Enqueue(value, -(long)value);
        }
        if (max.Count - min.Count > 1)
        {
            int value = max.Dequeue();
            min.Enqueue(value, value);
        }
        if (min.Count - max.Count > 1)
        {
            int value = min.Dequeue();
            max.Enqueue(value, -(long)value);
        }
    }

    public double FindMedian()
    {
        if (min.Count > max.Count) return min.Peek();
        if (min.Count < max.Count) return max.Peek();
        return ((double)min.Peek() + max.Peek()) / 2;
    }
}`;
export function codeKey(s){
 const lines=source.split('\n');let key='min.Enqueue(num',last=false;
 if(s.type==='start')key='private PriorityQueue';
 else if(s.context==='FindMedian')key=s.min.length>s.max.length?'if (min.Count > max.Count)':s.max.length>s.min.length?'if (min.Count < max.Count)':'return ((double)';
 else if(s.context==='orderCheck')key='if (max.Count > 0';
 else if(s.context==='orderTransfer')key=s.heap==='min'?'int value = min.Dequeue':'max.Enqueue(value';
 else if(s.context==='maxBalance')key=s.type==='balanceCheck'?'if (max.Count - min.Count':s.heap==='max'?'int value = max.Dequeue':'min.Enqueue(value';
 else if(s.context==='minBalance'){key=s.type==='balanceCheck'?'if (min.Count - max.Count':s.heap==='min'?'int value = min.Dequeue':'max.Enqueue(value';last=true;}
 return last?lines.findLastIndex(line=>line.includes(key)):lines.findIndex(line=>line.includes(key));
}
