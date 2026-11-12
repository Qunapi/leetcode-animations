# 46 · Permutations

Swap-based backtracking with synchronized JavaScript, a live working array,
a 3D recursion tree, a call stack, and reversible playback. Tree nodes show the
call’s `start` and the parent loop’s `i`. The working array shows the current
values of both indices. Drag the tree to orbit and scroll to zoom. Choose `start + 1` or `i + 1` to compare
the recursion. The default input `1, 2, 3` yields six permutations with
`start + 1` and four with `i + 1`. After the latter search, playback reveals the missing
permutations one at a time.

Use Play/Pause, Back, Step, Restart, and Speed to inspect swaps and undo steps.
Choose an example or apply 1–4 distinct integers from −10 to 10.

From the repository root run `npm install`, then `npm start`, and open
http://127.0.0.1:5173/leetcode-46-permutations/. Run `npm test` from the root.
