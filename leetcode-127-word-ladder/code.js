export const source=`using System.Collections.Generic;

public class Solution
{
    public int LadderLength(string beginWord, string endWord,
                            IList<string> wordList)
    {
        var graph = new Dictionary<string, List<string>>();
        var words = new HashSet<string>(wordList);
        if (!words.Contains(endWord)) return 0;
        int n = beginWord.Length;

        foreach (string word in words)
        for (int i = 0; i < n; i++)
        {
            string key = word.Substring(0, i) + "*" + word.Substring(i + 1);
            if (!graph.ContainsKey(key)) graph[key] = new List<string>();
            graph[key].Add(word);
        }
        int distance = 1;
        var visited = new HashSet<string>();

        int Bfs()
        {
            var q = new List<string>();
            int head = 0;
            q.Add(beginWord);
            visited.Add(beginWord);
            while (q.Count > head)
            {
                int size = q.Count - head;
                distance++;
                for (int j = 0; j < size; j++)
                {
                    string word = q[head++];
                    for (int i = 0; i < n; i++)
                    {
                        string key = word.Substring(0, i) + "*" + word.Substring(i + 1);
                        if (!graph.TryGetValue(key, out var bucket)) continue;
                        foreach (string nei in bucket)
                        {
                            if (visited.Contains(nei)) continue;
                            if (nei == endWord) return distance;
                            visited.Add(nei);
                            q.Add(nei);
                        }
                    }
                }
            }
            return 0;
        }
        return Bfs();
    }
}`;
export function activeLine(s){
 const key={start:'var words =',missing:'if (!words.Contains',buildPattern:'string key =',bucket:'graph[key].Add',seed:'visited.Add(beginWord)',level:'distance++;',dequeue:'q[head++]',searchPattern:'string key =',check:'foreach (string nei',skip:'if (visited.Contains',visit:'visited.Add(nei)',enqueue:'q.Add(nei)',found:'if (nei == endWord)',exhausted:'return 0;',done:s.result?'if (nei == endWord)':'return 0;'}[s.type];
 const lines=source.split('\n');if((s.type==='exhausted'||s.type==='done')&&s.result===0&&s.wordIndex>=0)return lines.findLastIndex(line=>line.trim()==='return 0;');return s.type==='searchPattern'?lines.findLastIndex(line=>line.includes(key)):lines.findIndex(line=>line.includes(key));
}
