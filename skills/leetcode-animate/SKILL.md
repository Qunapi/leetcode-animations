---
name: leetcode-animate
description: Add an interactive algorithm animation page to the shared LeetCode Animations project from an existing solution, with a task chooser, lazy page loading, live state, and synchronized code in the user's chosen language.
---

# LeetCode Animate

Add a task page to the user's existing Algorithm Lab. Follow the supplied algorithm's traversal order, state changes, validation, and early returns rather than silently replacing it with another solution.

## Collect missing inputs

Ask together for any missing information before implementation:

- The existing solution code to animate.
- The language to display in the code panel (which may differ from the source language).
- The LeetCode number and title or URL, if not identifiable from the conversation.

Suggested prompt: “Paste your solution, choose the language for the animated code panel, and include the problem number/title or link.” Reuse information already supplied. Wait for required answers rather than inventing a solution or choosing a language. If the algorithm is incorrect, explain the issue and ask whether to illustrate it as written or fix it first. Syntax changes required by translation are distinct from changing the algorithm.

## One project, separate task pages

The project root is `/Users/andreiyushkevich/leetcode-animations`.

Read the root README, `tasks.js`, `server.mjs`, and a relevant existing task before editing. Keep the shared structure:

- One root `package.json`, lockfile, dependency install, `node_modules`, server, and `npm test` command.
- A root task chooser at `/`, importing metadata only from `tasks.js`.
- Task-specific HTML, CSS, modules, solver tests, and README in `leetcode-{NUMBER}-{task-name}/`. Here `leetcode` is literal, the numeric ID has no leading zeros, and the title is lowercase hyphen-separated. Example: `leetcode-127-word-ladder/`.
- Each task has a direct page URL `/{slug}/`, and an “All tasks” link to `/` using `/navigation.css`.

Create the folder first for a new task; inspect and update an existing matching folder for a continuation. Do not overwrite other tasks. Do not create per-task packages, lockfiles, servers, dependency directories, or isolated repositories.

Register the new task once in root `tasks.js` with its number, slug, title, difficulty, category, display language, symbol, description, features, and the exact list of browser-public files. Keep tests, READMEs, package files, and server files out of that public list. The shared server derives its allowlist and page routes from this registry; do not add another router or server.

## Loading and runtime

The current project uses native multi-page HTML/CSS/JavaScript with a shared local Three.js dependency. Keep that approach unless a requested feature materially needs a different architecture.

- Real links navigate from the chooser to a task's HTML page. Full-page navigation loads only the selected task and lets the browser unload/freeze the previous scene. The homepage must not import a task solver, scene, stylesheet, or Three.js; do not add hidden task iframes or task prefetch/modulepreload links.
- `tasks.js` contains metadata and public file names, never task implementation imports. Render chooser cards from this registry. Do not load WebGL just to draw card thumbnails.
- Each task imports its own modules and styles. Its inline import map uses root-relative paths: `three` → `/node_modules/three/build/three.module.js`, `three/addons/` → `/node_modules/three/examples/jsm/`.
- Use a stylesheet link, not a JavaScript CSS import. Avoid dependencies for small features, CDNs, external fonts, bundlers, and transpilers by default. Do not load a sibling task as a runtime dependency.
- `npm start` from the root runs the shared loopback server, normally on port 5173 with a `PORT` override. Bare task URLs redirect to a trailing slash. Never promise source `file://` launch support.
- Restart the owned shared server when `tasks.js` or server routes change, because the server reads the registry at startup. Preserve unrelated processes if a port is occupied.

If the project later uses client-side routing, preserve per-route dynamic imports and explicitly stop animation frames, observers, listeners, and WebGL resources on unmount; do not eagerly import all scenes.

## Animation experience

Choose the representation that teaches this algorithm: boards, word/graph networks, terrain, arrays, pointers, or other relevant structures. Preserve the existing dark visual style and responsive layout while keeping task-specific graphics appropriate to the problem.

Provide:

- Play/pause, Back, forward Step, Restart, and Speed with its current value. Manual stepping pauses playback. Reset timeline and all state on input changes. For lengthy preprocessing, a “Skip build” checkbox should make restart/input changes begin after preprocessing, before the main search, as the initial Back state. Preserve the checkbox choice across resets within the page.
- Useful examples, including a small but nontrivial example and an edge case. Validate custom inputs and bound size to keep rendering and playback history practical. Do not assume every task needs the same limits.
- Live relevant structures: queues and head indices, sets, maps, buckets, stacks, distances, candidate comparisons, and results. Explain rejected operations with text as well as color.
- Synchronized code in the chosen language and a matching call-stack display. Translate faithfully; label abbreviations and do not imply undefined helpers form a complete compilable solution. Explain misleading source names, such as a function called dfs that actually performs BFS.
- Distinct colors for safe/unvisited, active, rejected, and solved states. Keep threat/constraint colors intact when an active overlay is displayed. Animate undo/removal visibly without leaving stale objects or overlays after the next step or reset.
- Orbit/zoom and reset view when using 3D, keyboard-accessible controls, readable code, text descriptions, reduced-motion handling, and a helpful WebGL-unavailable fallback.

Keep visual semantics explicit. A BFS discovery link is not every physically valid connection: visited neighbors may be skipped by the algorithm. Label the distinction rather than inventing traversal steps. Preserve previously discovered paths when the requested visualization needs them to remain visible, and restore them correctly on Back. Physical analogies such as rain/water illustrate algorithm behavior, not a fluid-physics engine.

## Simulation and verification

Keep solver events separate from rendering. Generate steps lazily and snapshot mutable structures for playback/Back. Use immutable shared prefixes when safe to avoid copying large histories. One event drives the active code line, structures, counters, and scene; playback speed must not alter results.

Before finishing:

1. Run task tests for representative results, edge cases, traversal/state invariants, input validation, and snapshot consistency. Check undo or persistent-path behavior when applicable.
2. Run the root `npm test`; preserve the shared server/deep-link/access checks and chooser import-graph test. For a new task, ensure every listed public file exists and is served with the correct MIME type. The root chooser must still load only chooser code and metadata.
3. Start the shared server and verify the chooser → task → chooser flow, direct deep-link launch, and the task's playback, Back/replay, restart, speed, examples, and validation in the browser when available. Verify actual graphics, not just solver results. State any browser verification limitation.
4. Update the task-local README with problem ID, language, controls, limits, and root install/start/test instructions. Keep shared architecture instructions in the root README.

Finish with the root chooser URL and the new task's direct URL, plus what was checked and any material limitation. Do not deploy unless requested.
