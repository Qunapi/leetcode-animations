export const source=`using System;
using System.Collections.Generic;
using System.Text;

public class AutocompleteSystem {
    private class TrieNode {
        public Dictionary<char, TrieNode> Children = new Dictionary<char, TrieNode>();
        public List<string> Top = new List<string>();
    }
    private TrieNode root = new TrieNode();
    private TrieNode current;
    private Dictionary<string, int> frequency = new Dictionary<string, int>();
    private StringBuilder input = new StringBuilder();

    public AutocompleteSystem(string[] sentences, int[] times) {
        current = root;
        for (var i = 0; i < sentences.Length; i++)
            frequency[sentences[i]] = times[i];
        foreach (var sentence in sentences)
            AddSentence(sentence);
    }

    public IList<string> Input(char c) {
        if (c == '#') {
            var sentence = input.ToString();
            if (sentence.Length > 0) {
                frequency.TryGetValue(sentence, out int count);
                frequency[sentence] = count + 1;
                AddSentence(sentence);
            }
            input.Clear();
            current = root;
            return new List<string>();
        }
        input.Append(c);
        if (current == null)
            return new List<string>();
        if (!current.Children.TryGetValue(c, out TrieNode next)) {
            current = null;
            return new List<string>();
        }
        current = next;
        return new List<string>(current.Top);
    }

    void AddSentence(string sentence) {
        TrieNode node = root;
        UpdateTop(node, sentence);
        foreach (var c in sentence) {
            if (!node.Children.TryGetValue(c, out TrieNode next)) {
                next = new TrieNode();
                node.Children[c] = next;
            }
            node = next;
            UpdateTop(node, sentence);
        }
    }

    void UpdateTop(TrieNode node, string sentence) {
        if (!node.Top.Contains(sentence))
            node.Top.Add(sentence);
        node.Top.Sort((a, b) => {
            var comparison = frequency[b].CompareTo(frequency[a]);
            if (comparison != 0)
                return comparison;
            return string.CompareOrdinal(a, b);
        });
        if (node.Top.Count > 3)
            node.Top.RemoveAt(3);
    }
}`;
export function codeKey(s){const key={start:'private TrieNode root',seedFrequency:'frequency[sentences[i]] =',insertStart:'TrieNode node = root',childCheck:'if (!node.Children',create:'next = new TrieNode',insertMove:'node = next',topCheck:'if (!node.Top.Contains',topAdd:'node.Top.Add',topSort:'node.Top.Sort',topRemove:'node.Top.RemoveAt',ready:'        current = root;',incoming:"if (c == '#')",commit:'var sentence = input.ToString',frequency:'frequency[sentence] = count + 1',clear:'input.Clear()',resetCursor:'            current = root;',buffer:'input.Append(c)',deadSkip:'if (current == null)',lookup:'if (!current.Children',missing:'current = null;',traverse:'current = next;',cachedRead:'return new List<string>(current.Top)',return:s.character==='#'?'            return new List<string>();':s.dead?'if (current == null)':'return new List<string>(current.Top)',done:s.character==='#'?'            return new List<string>();':s.dead?'if (current == null)':'return new List<string>(current.Top)'}[s.type];return key;}
