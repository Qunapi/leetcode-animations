export const reverseSource=`using System.Collections.Generic;

public class Solution
{
    public IList<IList<int>> PacificAtlantic(int[][] heights)
    {
        int m = heights.Length, n = heights[0].Length;
        var pacific = new bool[m, n];
        var atlantic = new bool[m, n];
        int[][] directions = { new[] { 0, 1 }, new[] { 0, -1 },
                               new[] { 1, 0 }, new[] { -1, 0 } };

        void Bfs(int i, int j, bool[,] ocean)
        {
            ocean[i, j] = true;
            var q = new List<int[]>();
            int head = 0;
            q.Add(new[] { i, j });

            while (q.Count > head)
            {
                int[] cell = q[head++];
                int r = cell[0], c = cell[1];
                foreach (int[] dir in directions)
                {
                    int nr = r + dir[0], nc = c + dir[1];
                    if (nr >= 0 && nr < m && nc >= 0 && nc < n &&
                        !ocean[nr, nc] && heights[r][c] <= heights[nr][nc])
                    {
                        ocean[nr, nc] = true;
                        q.Add(new[] { nr, nc });
                    }
                }
            }
        }

        for (int i = 0; i < m; i++)
        {
            Bfs(i, 0, pacific);
            Bfs(i, n - 1, atlantic);
        }
        for (int j = 0; j < n; j++)
        {
            Bfs(0, j, pacific);
            Bfs(m - 1, j, atlantic);
        }

        var res = new List<IList<int>>();
        for (int i = 0; i < m; i++)
            for (int j = 0; j < n; j++)
                if (pacific[i, j] && atlantic[i, j])
                    res.Add(new[] { i, j });
        return res;
    }
}`;

export const downhillSource=`using System.Collections.Generic;

public class Solution
{
    public IList<IList<int>> PacificAtlantic(int[][] heights)
    {
        int m = heights.Length, n = heights[0].Length;
        int[][] directions = { new[] { 0, 1 }, new[] { 0, -1 },
                               new[] { 1, 0 }, new[] { -1, 0 } };
        var res = new List<IList<int>>();

        for (int i = 0; i < m; i++)
        for (int j = 0; j < n; j++)
        {
            var visited = new bool[m, n];
            bool reachesPacific = false, reachesAtlantic = false;
            visited[i, j] = true;
            var q = new List<int[]>();
            int head = 0;
            q.Add(new[] { i, j });

            while (head < q.Count)
            {
                int[] cell = q[head++];
                int r = cell[0], c = cell[1];
                if (r == 0 || c == 0) reachesPacific = true;
                if (r == m - 1 || c == n - 1) reachesAtlantic = true;
                foreach (int[] dir in directions)
                {
                    int nr = r + dir[0], nc = c + dir[1];
                    if (nr >= 0 && nr < m && nc >= 0 && nc < n &&
                        !visited[nr, nc] && heights[nr][nc] <= heights[r][c])
                    {
                        visited[nr, nc] = true;
                        q.Add(new[] { nr, nc });
                    }
                }
            }
            if (reachesPacific && reachesAtlantic)
                res.Add(new[] { i, j });
        }
        return res;
    }
}`;
