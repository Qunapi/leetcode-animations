# 42 · Trapping Rain Water

Animates the supplied JavaScript two-pointer solution without changing its traversal order. Ties process the right pointer. SVG rain falls over every column, while water rises above the rock to the resolved boundary level. Index, solid height, water count, maxima, pointers, total, and active source line stay synchronized. Rain is illustrative, not fluid physics.

From the repository root: `npm ci`, `npm start`, `npm test`. Open the task through the chooser or `/leetcode-42-trapping-rain-water/`. No WebGL is required for this page.

Play/Pause, Back, Step, Restart, and Speed control the timeline. Back restores previous water levels. Examples include classic, deep basin, flat, single, and empty inputs. Custom comma-separated heights or JSON arrays accept 0–32 integers in [0,20]. Changing input resets playback. Rain can be toggled, and reduced-motion preferences disable falling/filling animation. Narrow screens can scroll the chart horizontally.

Solver events are generated lazily and copied for playback. The source algorithm uses O(n) time and O(1) extra space; the visualization stores per-cell levels and historical snapshots.
