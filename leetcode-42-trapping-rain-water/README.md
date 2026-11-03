# 42 · Trapping Rain Water

Animates the supplied JavaScript two-pointer solution without changing its traversal order. Ties process the right pointer. Three.js rain falls over every column in a single row of textured 3D rocks, while water rises above the rock to the resolved boundary level. Index, solid height, water count, maxima, pointers, total, and active source line stay synchronized. Rain is illustrative, not fluid physics.

From the repository root: `npm ci`, `npm start`, `npm test`. Open the task through the chooser or `/leetcode-42-trapping-rain-water/`. WebGL renders the 3D scene; data panels and playback remain available if it is unavailable. Drag to orbit, scroll to zoom, or use Reset view / Front view. Green and purple guides show the left/right boundary maxima; a gold guide and numeric panel show min(lMax, rMax), the limiting boundary level. The scene stays one cell deep.

Play/Pause, Back, Step, Restart, and Speed control the timeline. Back restores previous water levels. Examples include classic, deep basin, flat, single, and empty inputs. Custom comma-separated heights or JSON arrays accept 0–32 integers in [0,20]. Changing input resets playback. Rain can be toggled, and reduced-motion preferences disable falling/filling animation. The camera fits the row on narrow screens.

Solver events are generated lazily and copied for playback. The source algorithm uses O(n) time and O(1) extra space; the visualization stores per-cell levels and historical snapshots.

Wet cells have animated wave crests and expanding ripple patterns, with small surface displacement bounded by water depth. Back/Restart hide waves as cells drain; reduced motion freezes the patterns. A beveled, grey granite-textured stone slab supports the one-dimensional row.
