export const source=`using System;
using System.Collections.Generic;
using System.Linq;

public class TrieNode
{
    public Dictionary<char, TrieNode> Children = new();
    public Dictionary<string, int> Sentences = new();
}

public class AutocompleteSystem
{
    private bool isDead = false;
    private TrieNode root = new();
    private TrieNode curr;
    private string text = "";

    public AutocompleteSystem(string[] sentences, int[] times)
    {
        curr = root;
        for (int i = 0; i < sentences.Length; i++)
            AddSentence(sentences[i], times[i]);
    }

    private void AddSentence(string sentence, int count)
    {
        TrieNode node = root;
        foreach (char c in sentence)
        {
            if (!node.Children.TryGetValue(c, out var child))
            {
                child = new TrieNode();
                node.Children[c] = child;
            }
            node = child;
            node.Sentences.TryGetValue(sentence, out int frequency);
            node.Sentences[sentence] = frequency + count;
        }
    }

    public IList<string> Input(char c)
    {
        if (c == '#')
        {
            isDead = false;
            curr = root;
            AddSentence(text, 1);
            text = "";
            return Array.Empty<string>();
        }
        text += c;
        if (isDead) return Array.Empty<string>();
        if (!curr.Children.TryGetValue(c, out var next))
        {
            isDead = true;
            return Array.Empty<string>();
        }
        curr = next;
        var sorted = curr.Sentences.OrderByDescending(pair => pair.Value)
            .ThenBy(pair => pair.Key, StringComparer.Ordinal).ToList();
        var result = new List<string>();
        for (int i = 0; i < Math.Min(3, sorted.Count); i++)
            result.Add(sorted[i].Key);
        return result;
    }
}`;
export function codeKey(s){return{start:'private TrieNode root',insertStart:'TrieNode node = root',childCheck:'if (!node.Children',create:'child = new TrieNode',insertMove:'node = child',frequency:'node.Sentences[sentence] =',ready:'curr = root;',incoming:"if (c == '#')",resetCursor:'            isDead = false;',clear:'            text = "";',buffer:'text += c;',deadSkip:'if (isDead)',lookup:'if (!curr.Children',missing:'isDead = true;',traverse:'curr = next;',rank:'var sorted =',suggest:'result.Add',return:s.character==='#'?'            text = "";':s.dead?'if (isDead)':'return result;',done:'return result;'}[s.type];}
