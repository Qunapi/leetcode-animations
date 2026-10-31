# LeetCode 417 — Pacific Atlantic Water Flow

A local Three.js island animation with C# code and two methods:

1. **Follow the water:** a fresh downhill BFS from every cell, following equal/lower neighbors and independently checking both coasts. Worst-case O((m × n)²) work.
2. **Work backward:** the supplied solution's exact border BFS order, shared Pacific/Atlantic visited matrices, queue/head behavior, and row-major intersection scan. O(m × n) work. Repeated border/corner calls are preserved.

```sh
cd /Users/andreiyushkevich/leetcode-animations
npm install
npm start
```

Open http://127.0.0.1:5173/leetcode-417-pacific-atlantic-water-flow/, or choose this task from the main page. Use the shared root server; this task has no separate install or server. No bundler or build step.

**Controls:** Play/Pause, Back, Step, Restart, and Speed. Back restores snapshots. Switching methods or applying a new grid restarts playback. Drag to orbit, scroll to zoom, and use Top view or Reset view. Each tab shows its own C# solution and active line, queue/head, counters, and results.

**Island and water:** sand tops, layered rock sides, pebbles, ripples, moving droplets, and rain/splashes over the gold source marker. White foam marks the currently explored cell. A blocked neighbor has a red ring. Pacific water is blue on the top/left; Atlantic water is teal on the bottom/right, with different wave directions and labels directly on the sea. Purple means both oceans.

Coastal cells pour into their oceans with animated waterfalls, sea splashes, and pulsing labels. All discovered cell-to-cell streams and reached coastal outlets stay visible together, including when the active cell moves elsewhere. Interior streams run across cell tops and fall through the gaps rather than cutting through rocks. In reverse mode, the stored water links point downhill toward the ocean, opposite to the BFS discovery direction. In downhill mode, the water footprint and its internal paths reset for each rain source; completion shows the combined discovered paths. In reverse mode it accumulates with the shared visited matrices. Reverse-search ripples move uphill; coastal discharge still moves downhill into the sea. This is an algorithm illustration, not a fluid-physics model. Reduced-motion settings freeze water/rain movement and disable transitions.

**Examples:** Classic 5×5, Classic 3×3 (central peak with four downhill branches), Plateau 3×3, Basin 4×4, Single cell, or a custom JSON grid. The branching 3×3 is `[[3,1,4],[2,5,2],[4,1,3]]`. The central peak drains in all four directions, with low coastal pockets and different routes to the two oceans. Cells `[0,2]`, `[1,1]`, and `[2,0]` reach both oceans. Inputs are limited to 1–8 rows/columns and integer heights 0–100 for readable terrain and bounded playback history. Display heights are scaled; comparisons use the original numbers.

Run `npm test` from the project root for known results, agreement between both methods, traversal/queue invariants, snapshot independence, validation, ocean outlet/corner cases, the branching 3×3 peak, and server access restrictions. WebGL is required for 3D; data panels work without it. Source HTML needs the local server, not `file://`. The browser executes JavaScript generators; the C# is displayed for instruction.
