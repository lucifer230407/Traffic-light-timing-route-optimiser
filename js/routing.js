class TimeDependentRouter {
    constructor(graph) {
        this.graph = graph;
    }

    findShortestPath(startNode, endNode, currentTime = 0) {
        const distances = {};
        const previous = {};
        const visited = new Set();

        for (const id of Object.keys(this.graph.nodes)) {
            distances[id] = Infinity;
            previous[id] = null;
        }
        distances[startNode] = 0;

        const pq = [{ dist: 0, node: startNode, time: currentTime }];

        while (pq.length > 0) {
            pq.sort((a, b) => a.dist - b.dist);
            const { dist, node: current, time: timeAtNode } = pq.shift();

            if (visited.has(current)) continue;
            visited.add(current);

            if (current === endNode) {
                return { path: this._reconstructPath(previous, endNode), cost: dist };
            }

            for (const neighborData of this.graph.getNeighbors(current)) {
                const neighbor = neighborData.to;
                if (visited.has(neighbor)) continue;

                const edgeCost = this.graph.getEdgeCost(current, neighbor, timeAtNode);
                if (edgeCost === Infinity) continue;

                const newDist = dist + edgeCost;
                const timeAtNeighbor = timeAtNode + edgeCost;

                if (newDist < distances[neighbor]) {
                    distances[neighbor] = newDist;
                    previous[neighbor] = current;
                    pq.push({ dist: newDist, node: neighbor, time: timeAtNeighbor });
                }
            }
        }

        return { path: [], cost: Infinity };
    }

    _reconstructPath(previous, endNode) {
        const path = [];
        let current = endNode;
        while (current !== null) {
            path.push(current);
            current = previous[current];
        }
        path.reverse();
        return path;
    }

    _shortestPathAvoiding(startNode, endNode, currentTime, bannedNodes, bannedEdges) {
        if (bannedNodes.has(startNode) || bannedNodes.has(endNode)) {
            return { path: [], cost: Infinity };
        }

        const distances = {};
        const previous = {};
        const visited = new Set();

        for (const id of Object.keys(this.graph.nodes)) {
            distances[id] = Infinity;
            previous[id] = null;
        }
        distances[startNode] = 0;

        const pq = [{ dist: 0, node: startNode, time: currentTime }];

        while (pq.length > 0) {
            pq.sort((a, b) => a.dist - b.dist);
            const { dist, node: current, time: timeAtNode } = pq.shift();

            if (visited.has(current)) continue;
            visited.add(current);

            if (current === endNode) {
                return { path: this._reconstructPath(previous, endNode), cost: dist };
            }

            for (const neighborData of this.graph.getNeighbors(current)) {
                const neighbor = neighborData.to;
                if (visited.has(neighbor) || bannedNodes.has(neighbor)) continue;
                if (bannedEdges.has(`${current}->${neighbor}`)) continue;

                const edgeCost = this.graph.getEdgeCost(current, neighbor, timeAtNode);
                if (edgeCost === Infinity) continue;

                const newDist = dist + edgeCost;
                const timeAtNeighbor = timeAtNode + edgeCost;

                if (newDist < distances[neighbor]) {
                    distances[neighbor] = newDist;
                    previous[neighbor] = current;
                    pq.push({ dist: newDist, node: neighbor, time: timeAtNeighbor });
                }
            }
        }

        return { path: [], cost: Infinity };
    }

    _pathCost(path, currentTime) {
        let total = 0;
        let timeAtNode = currentTime;
        for (let i = 0; i < path.length - 1; i++) {
            const edgeCost = this.graph.getEdgeCost(path[i], path[i + 1], timeAtNode);
            if (edgeCost === Infinity) return Infinity;
            total += edgeCost;
            timeAtNode += edgeCost;
        }
        return total;
    }

    findKShortestPaths(startNode, endNode, currentTime = 0, k = 3) {
        const A = [];
        const B = [];

        const { path, cost } = this.findShortestPath(startNode, endNode, currentTime);
        if (!path.length) return [];
        A.push({ path, cost });

        for (let i = 1; i < k; i++) {
            const prevPath = A[A.length - 1].path;

            for (let j = 0; j < prevPath.length - 1; j++) {
                const spurNode = prevPath[j];
                const rootPath = prevPath.slice(0, j + 1);

                const bannedEdges = new Set();
                for (const existing of A) {
                    if (existing.path.length > j + 1) {
                        let match = true;
                        for (let x = 0; x <= j; x++) {
                            if (existing.path[x] !== rootPath[x]) { match = false; break; }
                        }
                        if (match) {
                            bannedEdges.add(`${existing.path[j]}->${existing.path[j + 1]}`);
                        }
                    }
                }

                const bannedNodes = new Set(rootPath.slice(0, -1));
                const rootTime = this._pathCost(rootPath, currentTime);
                if (rootTime === Infinity) continue;

                const { path: spurPath } = this._shortestPathAvoiding(
                    spurNode, endNode, currentTime + rootTime, bannedNodes, bannedEdges
                );

                if (spurPath.length) {
                    const totalPath = rootPath.slice(0, -1).concat(spurPath);
                    const knownPaths = new Set([
                        ...A.map(p => p.path.join(',')),
                        ...B.map(p => p.path.join(','))
                    ]);
                    const key = totalPath.join(',');
                    if (!knownPaths.has(key)) {
                        const totalCost = this._pathCost(totalPath, currentTime);
                        if (totalCost !== Infinity) {
                            B.push({ path: totalPath, cost: totalCost });
                        }
                    }
                }
            }

            if (!B.length) break;
            B.sort((a, b) => a.cost - b.cost);
            A.push(B.shift());
        }

        return A;
    }
}
