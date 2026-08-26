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
}
