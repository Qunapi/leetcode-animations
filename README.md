# Algorithm Lab

One local project for interactive LeetCode animations, with a task chooser and a separate page for each problem.

```sh
npm install
npm start
```

Open http://127.0.0.1:5173/. Use `PORT=5174 npm start` if needed. Run these commands from `/Users/andreiyushkevich/leetcode-animations`, not from a task directory. Stop with Ctrl+C. No bundler, framework, CDN, or build step.

## Tasks

- [51 — N-Queens](http://127.0.0.1:5173/leetcode-51-n-queens/): recursion, row/column/diagonal threats, constraint sets, and animated placement/removal.
- [127 — Word Ladder](http://127.0.0.1:5173/leetcode-127-word-ladder/): wildcard buckets, word graph, BFS levels, list queue/head, and shortest ladder.
- [417 — Pacific Atlantic Water Flow](http://127.0.0.1:5173/leetcode-417-pacific-atlantic-water-flow/): downhill brute force and the supplied reverse BFS, with rain, waves, persistent BFS discovery streams, and two labeled oceans.

Each explorer has C# code, active-line highlighting, live algorithm state, input examples, play/pause, Back, Step, Restart, and Speed. Use “All tasks” to return to the chooser. Task READMEs describe their controls and limits.

## Loading and structure

`tasks.js` is a metadata-only registry. The chooser imports only that registry; it loads no Three.js, solver, task stylesheet, or animation module. Ordinary links navigate to a task's own HTML page. Only that page imports Three.js and its own modules. Leaving the page unloads its scene; there are no hidden iframes, eager task imports, or client-side router to keep scenes running.

There is one root `package.json`, lockfile, `node_modules`, server, and test command. Task-specific files remain in `leetcode-{NUMBER}-{task-name}/`. Every task HTML uses root-relative Three.js import-map paths and links back to `/`. Deep links work directly, and missing trailing slashes redirect correctly.

The server allows only root UI files, registered task public files, and the required Three.js modules. To add a task, create its folder and register its metadata and public files in `tasks.js`; restart the server so the new allowlist is loaded. Do not add another package or server per task. The `leetcode-animate` skill follows this layout; its repository copy is in `skills/leetcode-animate/`. The installed personal copy lives in `~/.codex/skills/leetcode-animate/`.

## Verification

`npm test` runs all task solver tests plus shared server tests for page/module routes, deep links, access restrictions, and the chooser's lightweight import graph. The browser executes instrumented JavaScript generators; C# is displayed for instruction. WebGL is needed for 3D. Source HTML must be opened through the server rather than `file://`.

Additional pages:
- [295 · Find Median from Data Stream](http://127.0.0.1:5173/leetcode-295-find-median-from-data-stream/) — two heaps, transfers, balancing, and median queries, with C# code.
- [642 · Design Search Autocomplete System](http://127.0.0.1:5173/leetcode-642-design-search-autocomplete-system/) — prefix trie, ranked suggestions, dead prefixes, and sentence learning, with C# code.

These pages load the shared `explorer-ui.js`, `explorer-scene.js`, and `explorer.css` only after navigation. The chooser remains metadata-only.
