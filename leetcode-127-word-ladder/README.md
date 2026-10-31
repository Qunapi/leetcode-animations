# LeetCode 127 — Word Ladder

An interactive 3D word graph and faithful C# translation of the supplied JavaScript solution. Its helper is renamed from `dfs` to `Bfs` because it uses a list queue and processes complete BFS levels. The execution order, wildcard buckets, visited checks, distance increments, and early return are preserved. The path is reconstructed only for display; the solution returns the length.

From `/Users/andreiyushkevich/leetcode-animations`, run `npm install` and `npm start`. Open http://127.0.0.1:5173/leetcode-127-word-ladder/ or select Word Ladder on the main page. One shared server and dependency install; no bundler.

Play/Pause, Back, Step, Restart, and Speed control the timeline. The Skip graph build checkbox makes Restart and input changes begin at the seeded BFS state, with buckets already built, distance 1, and the begin word queued. That is step 0 for Back. Unchecking it restores the full build animation. Drag the graph to orbit, scroll to zoom, or reset the view. Buckets and graph edges appear during construction. Visited nodes are purple; the current word is blue, skipped neighbors red, and the final ladder green. The queue retains processed entries because the original advances `head` instead of shifting. `distance` increments before processing each level and represents the length of a ladder extended to a neighbor.

Examples: classic hit→cog (5 words), direct hit→hot (2), no connecting route (0), and an end word missing from the dictionary (0 before graph construction). Custom input accepts up to 16 dictionary words with equal lengths, 2–6 lowercase letters, and distinct begin/end words. Limits keep the word network and trace readable. The end need not be in the dictionary; its absence demonstrates the early return.

`npm test` from the root checks all tasks. These solver tests verify shortest lengths, BFS order, wildcard construction, list/head behavior, early return, deduplication, validation, and snapshot independence. The browser executes JavaScript; the C# code is instructional. WebGL is required for the 3D network, but data panels remain usable without it.
