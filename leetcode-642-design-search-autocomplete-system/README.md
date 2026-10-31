# 642 · Design Search Autocomplete System

Run `npm start` from the repository root, then open `/leetcode-642-design-search-autocomplete-system/`.

The C# panel follows the supplied trie solution: one global frequency dictionary, cached Top lists at every node including root, ordinal lexical ties, current = null on a missing child, and learning a nonempty committed buffer. UpdateTop animates candidate insertion, sorting, and fourth-place eviction. Input copies the cached list without sorting. Duplicate seed frequencies use the last assignment, matching the supplied constructor.

Play, step, back, restart, change speed, or skip initialization. Edit seed sentence/frequency pairs and input keys. After playback, enter individual keys to keep learning. Spaces are preserved and shown as ␠ in the trie.

To keep the visualization readable, inputs are limited to six seed sentences, 16 characters per sentence/prefix, 32 scripted keys, and 64 total keys before restart. Tests cover ranking, duplicate counts, dead cursors, commit, and learning.
