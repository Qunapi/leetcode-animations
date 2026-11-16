export const source = `using System.Collections.Generic;

public class LFUCache {
    public class Node {
        public Node Prev, Next;
        public int Key, Value, Freq;

        public Node(int key, int value) {
            Key = key;
            Value = value;
            Freq = 1;
        }
    }

    public class DoublyLinkedList {
        public int Count;
        public Node tail, head;

        public DoublyLinkedList() {
            Count = 0;
            tail = new Node(0, 0);
            head = new Node(0, 0);
            head.Next = tail;
            tail.Prev = head;
        }

        public void Remove(Node node) {
            node.Prev.Next = node.Next;
            node.Next.Prev = node.Prev;
            Count--;
        }

        public Node RemoveLast() {
            var lru = tail.Prev;
            Remove(lru);
            return lru;
        }

        public void AddFirst(Node node) {
            node.Next = head.Next;
            node.Prev = head;
            head.Next.Prev = node;
            head.Next = node;
            Count++;
        }
    }

    Dictionary<int, Node> nodes;
    Dictionary<int, DoublyLinkedList> freqsMap;
    int minFrequency;
    int capacity;

    public LFUCache(int capacity) {
        minFrequency = 0;
        this.capacity = capacity;
        nodes = new Dictionary<int, Node>();
        freqsMap = new Dictionary<int, DoublyLinkedList>();
    }

    public int Get(int key) {
        if (!nodes.TryGetValue(key, out var node))
            return -1;

        IncreaseFrequency(node);
        return node.Value;
    }

    public void Put(int key, int value) {
        if (nodes.TryGetValue(key, out var node)) {
            node.Value = value;
            IncreaseFrequency(node);
            return;
        }

        node = new Node(key, value);
        if (nodes.Count == capacity) {
            var oldList = freqsMap[minFrequency];
            var removed = oldList.RemoveLast();
            nodes.Remove(removed.Key);
        }

        nodes[key] = node;
        if (!freqsMap.ContainsKey(1))
            freqsMap[1] = new DoublyLinkedList();
        freqsMap[1].AddFirst(node);
        minFrequency = 1;
    }

    void IncreaseFrequency(Node node) {
        var oldFreq = node.Freq;
        var oldList = freqsMap[oldFreq];
        oldList.Remove(node);

        if (oldList.Count == 0 && oldFreq == minFrequency)
            minFrequency++;

        node.Freq++;
        if (!freqsMap.ContainsKey(node.Freq))
            freqsMap[node.Freq] = new DoublyLinkedList();

        freqsMap[node.Freq].AddFirst(node);
    }
}`;
