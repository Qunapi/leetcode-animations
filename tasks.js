// Metadata and public file names only: never import task implementations here.
export const tasks = [
  {
    number:42,slug:'leetcode-42-trapping-rain-water',title:'Trapping Rain Water',difficulty:'Hard',category:'Two pointers',language:'JavaScript',symbol:'☂',
    description:'Rain over every column. Follow inward pointers and fill trapped water to its exact boundary level.',
    features:['Animated rainfall','Per-cell water levels','Two pointers'],
    files:['index.html','main.js','style.css','solver.js','code.js'],
  },
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
  {
    number:295,slug:'leetcode-295-find-median-from-data-stream',title:'Find Median from Data Stream',difficulty:'Hard',category:'Two heaps',language:'C#',symbol:'½',
    description:'Insert numbers, restore heap order, balance two halves, and read the median from their roots.',
    features:['Animated heaps','Transfers & swaps','Live medians'],
    files:['index.html','main.js','style.css','solver.js','code.js'],
  },
  {
    number:642,slug:'leetcode-642-design-search-autocomplete-system',title:'Design Search Autocomplete System',difficulty:'Hard',category:'Trie',language:'C#',symbol:'⌘',
    description:'Walk a prefix trie, rank sentence counts, and learn new sentences when you commit with #.',
    features:['Prefix trie','Top three ranking','Learn new sentences'],
    files:['index.html','main.js','style.css','solver.js','code.js'],
  },
];
