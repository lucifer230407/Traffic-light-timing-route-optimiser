const SAVE_KEY = 'traffiq_traffic_lights';

class TrafficSimulator {
    constructor(graph) {
        this.graph = graph;
        this.tickInterval = null;
        this.listeners = [];
        this.vehicles = [];
    }

    start() {
        if (this.tickInterval) return;
        this.tickInterval = setInterval(() => this.tick(), 1000);
        this.tick();
    }

    stop() {
        if (this.tickInterval) {
            clearInterval(this.tickInterval);
            this.tickInterval = null;
        }
    }

    onTick(fn) {
        this.listeners.push(fn);
    }

    tick() {
        const simTime = Date.now() / 1000;
        const trafficLights = [];
        for (const [id, tl] of Object.entries(this.graph.trafficLights)) {
            const node = this.graph.getNode(id);
            if (!node) continue;
            const { state, timeRemaining } = this.graph.getCurrentState(tl, simTime);
            trafficLights.push({
                id,
                lat: node.lat,
                lon: node.lon,
                name: node.name,
                state,
                timeRemaining,
                isManual: tl.isManual,
                greenTime: tl.cycle[0],
                yellowTime: tl.cycle[1],
                redTime: tl.cycle[2]
            });
        }

        this.vehicles = this._generateMockVehicles();

        const data = {
            trafficLights,
            vehicles: this.vehicles,
            timestamp: Math.round(simTime * 1000) / 1000
        };

        for (const fn of this.listeners) fn(data);
    }
}
