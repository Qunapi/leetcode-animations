# 642 · Design Search Autocomplete System

Run `npm start` from the repository root, then open `/leetcode-642-design-search-autocomplete-system/`.

The C# panel follows the supplied trie solution: counts at every prefix, descending frequency with ordinal lexical ties, dead state until #, and learning the entire committed buffer.

Play, step, back, restart, change speed, or skip initialization. Edit seed sentence/frequency pairs and input keys. After playback, enter individual keys to keep learning. Spaces are preserved and shown as ␠ in the trie.

To keep the visualization readable, inputs are limited to six seed sentences, 16 characters per sentence/prefix, 32 scripted keys, and 64 total keys before restart. Tests cover ranking, duplicate counts, dead cursors, commit, and learning.
