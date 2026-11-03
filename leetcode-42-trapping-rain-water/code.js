export const source=`/**
 * @param {number[]} height
 * @return {number}
 */
var trap = function(height) {
    let lMax = height[0]
    let rMax = height[height.length - 1]
    let l = 1, r = height.length - 2
    let res = 0

    while (l <= r) {
        if (lMax < rMax) {
            lMax = Math.max(lMax, height[l])
            res += lMax - height[l]
            l++
        } else {
            rMax = Math.max(rMax, height[r])
            res += rMax - height[r]
            r--
        }
    }

    return res
};`;
// Zero-based source line indices for each algorithm operation.
export const lines={start:5,compare:11,maximumLeft:12,fillLeft:13,moveLeft:14,maximumRight:16,fillRight:17,moveRight:18,done:22};
