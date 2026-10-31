# Queens Lab

Interactive Three.js visualization of the N-Queens backtracking algorithm.

```sh
cd /Users/andreiyushkevich/leetcode-animations
npm install
npm start
```

Open http://127.0.0.1:5173/leetcode-51-n-queens/, or choose this task from the main page. The project uses one root dependency install and server. No bundler or build step.

Use Play/Pause, Back, Step, Restart, and the speed slider (1–20×). Board sizes 4–8 are supported. Drag the board to rotate; scroll or pinch to zoom. The Threats toggle shows squares blocked by current queens. The arrays show occupied column and diagonal keys, with conflicts in red. Indices start at zero. The progress strip shows the fraction of rows currently occupied, not total search completion.

The code panel is abbreviated C# pseudocode for the generator in `solver.js`, which follows the supplied solver's search order. The search runs lazily and continues through every solution. No backend or accounts. Opening `index.html` directly through `file://` is not supported; use `npm start`.

`npm test` from the project root verifies solution counts for n=1–8, set/board invariants for every emitted step, and server routes and access restrictions.

The threat overlay includes occupied rows as well as columns and diagonals. Blue marks safe candidate squares; attacked candidates stay red. Backtracking lifts, turns, and shrinks a removed queen; the effect shortens at higher playback speeds and clears on the next step. The solver still tracks only column and diagonal sets because it places one queen per row.
