export const EXAMPLES = {
  classic3: [[3,1,4],[2,5,2],[4,1,3]],
  classic: [[1,2,2,3,5],[3,2,3,4,4],[2,4,5,3,1],[6,7,1,4,5],[5,1,1,2,4]],
  plateau: [[3,3,3],[3,3,3],[3,3,3]],
  basin: [[5,5,5,5],[5,1,1,5],[5,1,1,5],[5,5,5,5]],
  single: [[7]],
};

export function validateHeights(heights) {
  if (!Array.isArray(heights) || heights.length < 1 || heights.length > 8 || !Array.isArray(heights[0]) || heights[0].length < 1 || heights[0].length > 8) throw new Error('Use a rectangular grid with 1–8 rows and 1–8 columns.');
  const n = heights[0].length;
  if (!heights.every(row => Array.isArray(row) && row.length === n && row.every(h => Number.isInteger(h) && h >= 0 && h <= 100))) throw new Error('Every row must have the same length. Heights must be integers from 0 to 100.');
  return heights;
}

export function oceanOutlets(row, col, m, n, onlyOcean=null) {
  const outlets=[];
  if(row===0)outlets.push({ocean:'pacific',side:'top',cell:[row,col]});
  if(col===0)outlets.push({ocean:'pacific',side:'left',cell:[row,col]});
  if(row===m-1)outlets.push({ocean:'atlantic',side:'bottom',cell:[row,col]});
  if(col===n-1)outlets.push({ocean:'atlantic',side:'right',cell:[row,col]});
  return onlyOcean?outlets.filter(outlet=>outlet.ocean===onlyOcean):outlets;
}

export function* flowSteps(input) {
  const heights = validateHeights(input).map(row => [...row]);
  const m = heights.length, n = heights[0].length;
  const pacific = Array.from({ length: m }, () => Array(n).fill(false));
  const atlantic = Array.from({ length: m }, () => Array(n).fill(false));
  const directions = [[0,1],[0,-1],[1,0],[-1,0]];
  const result = [];
  let origin = null;
  let edges = [];
  let oceanName = null, queue = [], head = 0, current = null, candidate = null, checks = 0, calls = 0;
  const snapshot = (type, reason = '', outlet = null) => ({ type, reason, outlet, edges, origin: origin && [...origin], ocean: oceanName, queue: queue.map(cell => [...cell]), head, current: current && [...current], candidate: candidate && [...candidate], checks, calls, pacific: pacific.map(row => [...row]), atlantic: atlantic.map(row => [...row]), result: result.map(cell => [...cell]) });
  function* bfs(i, j, ocean, name) {
    origin = [i,j]; oceanName = name; calls++; queue = []; head = 0; current = [i,j]; candidate = null;
    yield snapshot('call');
    ocean[i][j] = true;
    yield snapshot('seed');
    for(const outlet of oceanOutlets(i,j,m,n,name))yield snapshot('outlet','',outlet);
    queue.push([i,j]);
    yield snapshot('enqueue');
    while (queue.length > head) {
      current = queue[head++]; candidate = null;
      yield snapshot('dequeue');
      const [r,c] = current;
      for(const outlet of oceanOutlets(r,c,m,n,name))yield snapshot('outlet','',outlet);
      for (const [dr,dc] of directions) {
        const nr = r + dr, nc = c + dc;
        candidate = [nr,nc]; checks++;
        let reason = '';
        if (nr < 0 || nr >= m || nc < 0 || nc >= n) reason = 'outside';
        else if (ocean[nr][nc]) reason = 'visited';
        else if (heights[r][c] > heights[nr][nc]) reason = 'lower';
        yield snapshot('check', reason);
        if (!reason) {
          ocean[nr][nc] = true;
          edges = [...edges, {from:[nr,nc],to:[r,c],ocean:name}];
          yield snapshot('visit');
          queue.push([nr,nc]);
          yield snapshot('enqueue');
        } else yield snapshot('reject', reason);
      }
      candidate = null;
    }
    yield snapshot('return');
  }
  yield snapshot('start');
  for (let i = 0; i < m; i++) {
    yield* bfs(i, 0, pacific, 'pacific');
    yield* bfs(i, n - 1, atlantic, 'atlantic');
  }
  for (let j = 0; j < n; j++) {
    yield* bfs(0, j, pacific, 'pacific');
    yield* bfs(m - 1, j, atlantic, 'atlantic');
  }
  oceanName = null; queue = []; head = 0; candidate = null;
  for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) {
    current = [i,j];
    yield snapshot('scan');
    if (pacific[i][j] && atlantic[i][j]) { result.push([i,j]); yield snapshot('result'); }
  }
  current = null;
  yield snapshot('done');
}

// Each source repeats a downhill BFS instead of sharing work across sources.
export function* downhillSteps(input) {
  const heights = validateHeights(input).map(row => [...row]);
  const m = heights.length, n = heights[0].length;
  const empty = () => Array.from({length:m},()=>Array(n).fill(false));
  const pacific = empty(), atlantic = empty(), result = [];
  let visited = empty(), queue = [], head = 0, origin = null, current = null, candidate = null;
  let edges = [];
  const allEdges = new Map();
  let calls = 0, checks = 0, reachesPacific = false, reachesAtlantic = false;
  const snapshot = (type, reason='', outlet=null) => ({type,reason,outlet,edges:type==='done'?[...allEdges.values()]:edges,ocean:null,origin:origin&&[...origin],current:current&&[...current],candidate:candidate&&[...candidate],queue:queue.map(cell=>[...cell]),head,calls,checks,reachesPacific,reachesAtlantic,visited:visited.map(row=>[...row]),pacific:pacific.map(row=>[...row]),atlantic:atlantic.map(row=>[...row]),result:result.map(cell=>[...cell])});
  yield snapshot('start');
  for(let i=0;i<m;i++) for(let j=0;j<n;j++) {
    origin=[i,j];current=[i,j];candidate=null;visited=empty();edges=[];queue=[];head=0;calls++;
    reachesPacific=false;reachesAtlantic=false;
    yield snapshot('call');
    visited[i][j]=true;yield snapshot('seed');
    queue.push([i,j]);yield snapshot('enqueue');
    while(head<queue.length) {
      current=queue[head++];candidate=null;
      const [r,c]=current;
      yield snapshot('dequeue');
      if(r===0||c===0)reachesPacific=true;
      if(r===m-1||c===n-1)reachesAtlantic=true;
      yield snapshot('coast');
      for(const outlet of oceanOutlets(r,c,m,n))yield snapshot('outlet','',outlet);
      for(const [dr,dc] of [[0,1],[0,-1],[1,0],[-1,0]]) {
        const nr=r+dr,nc=c+dc;candidate=[nr,nc];checks++;
        let reason='';
        if(nr<0||nr>=m||nc<0||nc>=n)reason='outside';
        else if(visited[nr][nc])reason='visited';
        else if(heights[nr][nc]>heights[r][c])reason='higher';
        yield snapshot('check',reason);
        if(!reason) {
          visited[nr][nc]=true;
          const edge={from:[r,c],to:[nr,nc],ocean:null};
          edges=[...edges,edge];allEdges.set(`${r},${c}>${nr},${nc}`,edge);
          yield snapshot('visit');
          queue.push([nr,nc]);yield snapshot('enqueue');
        } else yield snapshot('reject',reason);
      }
    }
    candidate=null;current=[i,j];
    pacific[i][j]=reachesPacific;atlantic[i][j]=reachesAtlantic;
    yield snapshot('classify');
    if(reachesPacific&&reachesAtlantic) { result.push([i,j]);yield snapshot('result'); }
    yield snapshot('return');
  }
  current=null;candidate=null;queue=[];head=0;yield snapshot('done');
}
