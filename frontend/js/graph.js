const DEFAULT_CYCLE = [30, 5, 25, 5];

class RoadGraph {
    constructor() {
        this.nodes = {};
        this.edges = {};
        this.trafficLights = {};
    }

    loadMockNetwork() {
        const latStart = 30.7490;
        const latStep = -0.004;
        const lonStart = 76.7700;
        const lonStep = 0.004;
        const rows = 8;
        const cols = 5;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const id = `s${r * cols + c + 1}`;
                this.nodes[id] = {
                    lat: latStart + r * latStep,
                    lon: lonStart + c * lonStep,
                    name: `Sector ${r * cols + c + 1}`
                };
                this.edges[id] = [];
                this.trafficLights[id] = {
                    cycle: [...DEFAULT_CYCLE],
                    phaseOffset: 0,
                    isManual: false,
                    manualState: null
                };
            }
        }

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const id = `s${r * cols + c + 1}`;
                if (c < cols - 1) {
                    const right = `s${r * cols + c + 2}`;
                    this.edges[id].push({ to: right, weight: 4, length: 350 });
                    this.edges[right].push({ to: id, weight: 4, length: 350 });
                }
                if (r < rows - 1) {
                    const below = `s${(r + 1) * cols + c + 1}`;
                    this.edges[id].push({ to: below, weight: 4, length: 350 });
                    this.edges[below].push({ to: id, weight: 4, length: 350 });
                }
            }
        }
    }

    getNode(id) {
        return this.nodes[id] || null;
    }

    getNeighbors(id) {
        return this.edges[id] || [];
    }

    findNearestNode(lat, lon) {
        let minDist = Infinity;
        let nearest = null;
        for (const [id, node] of Object.entries(this.nodes)) {
            const dist = Utils.haversine(lat, lon, node.lat, node.lon);
            if (dist < minDist) {
                minDist = dist;
                nearest = id;
            }
        }
        return nearest;
    }

    getEdgeCost(from, to, arrivalTime) {
        const neighbors = this.getNeighbors(from);
        let baseCost = Infinity;
        for (const edge of neighbors) {
            if (edge.to === to) {
                baseCost = edge.weight;
                break;
            }
        }
        if (baseCost === Infinity) return Infinity;

        const tl = this.trafficLights[to];
        if (tl) {
            const waitTime = this.calculateRedWait(arrivalTime, tl);
            return baseCost + waitTime;
        }
        return baseCost;
    }

    calculateRedWait(arrivalTime, trafficLight) {
        if (trafficLight.isManual && trafficLight.manualState) {
            if (trafficLight.manualState === 'green') return 0;
            if (trafficLight.manualState === 'yellow') return trafficLight.cycle[1];
            return Infinity;
        }

        const cycle = trafficLight.cycle;
        const totalCycle = cycle.reduce((a, b) => a + b, 0);
        const timeInCycle = (arrivalTime + (trafficLight.phaseOffset || 0)) % totalCycle;
        let cumulative = 0;

        for (let i = 0; i < cycle.length; i++) {
            if (timeInCycle < cumulative + cycle[i]) {
                if (i === 0) return 0;
                return cumulative + cycle[i] - timeInCycle;
            }
            cumulative += cycle[i];
        }
        return 0;
    }

    getCurrentState(trafficLight, simTime) {
        if (trafficLight.isManual && trafficLight.manualState) {
            return { state: trafficLight.manualState, timeRemaining: 999 };
        }
        const cycle = trafficLight.cycle;
        const totalCycle = cycle.reduce((a, b) => a + b, 0);
        const timeInCycle = (simTime + (trafficLight.phaseOffset || 0)) % totalCycle;
        let cumulative = 0;

        for (let i = 0; i < cycle.length; i++) {
            if (timeInCycle < cumulative + cycle[i]) {
                let state;
                if (i === 0) state = 'green';
                else if (i % 2 === 1) state = 'yellow';
                else state = 'red';
                return { state, timeRemaining: Math.round((cumulative + cycle[i] - timeInCycle) * 10) / 10 };
            }
            cumulative += cycle[i];
        }
        return { state: 'green', timeRemaining: 0 };
    }
}
