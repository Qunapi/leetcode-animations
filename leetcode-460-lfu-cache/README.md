# 460 · LFU Cache

The supplied C# implementation uses a key dictionary, sentinel-based doubly
linked lists for each frequency, and a minimum frequency counter. Playback
shows list order from MRU to LRU and highlights the corresponding C# operation.

Choose an example or apply a capacity of 1–8 and up to 60 operations, one per
line. Use `put KEY VALUE` or `get KEY`. Play, step, rewind, or restart with the
buttons or the shared Left Arrow, Right Arrow, and R shortcuts.

From the repository root, run `npm install`, then `npm start`, and open
http://127.0.0.1:5173/leetcode-460-lfu-cache/. Run `npm test` from the root.
