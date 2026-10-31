// Metadata and public file names only: never import task implementations here.
export const tasks = [
  {
    number:51,slug:'leetcode-51-n-queens',title:'N-Queens',difficulty:'Hard',category:'Backtracking',language:'C#',symbol:'♛',
    description:'Place, explore, and undo. Watch the board and constraint sets change with each recursive step.',
    features:['3D chessboard','Constraint sets','Backtracking'],
    files:['index.html','main.js','style.css','solver.js'],
  },
  {
    number:127,slug:'leetcode-127-word-ladder',title:'Word Ladder',difficulty:'Hard',category:'Breadth-first search',language:'C#',symbol:'Aa',
    description:'Change one letter at a time. Build wildcard buckets, explore BFS levels, and find the shortest word ladder.',
    features:['3D word graph','Pattern buckets','BFS levels'],
    files:['index.html','main.js','style.css','solver.js','code.js'],
  },
  {
    number:417,slug:'leetcode-417-pacific-atlantic-water-flow',title:'Pacific Atlantic Water Flow',difficulty:'Medium',category:'Breadth-first search',language:'C#',symbol:'≋',
    description:'Rain on a rocky island. Compare per-cell downhill searches with reverse BFS from two oceans.',
    features:['Rocky island','Animated water','Two methods'],
    files:['index.html','main.js','style.css','solver.js','island.js','code.js'],
  },
];
