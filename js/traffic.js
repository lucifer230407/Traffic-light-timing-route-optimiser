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

    _generateMockVehicles() {
        const vehicles = [];
        for (let i = 0; i < 10; i++) {
            vehicles.push({
                id: `veh_${i}`,
                lat: 30.7350 + (Math.random() - 0.5) * 0.02,
                lon: 76.7780 + (Math.random() - 0.5) * 0.02,
                speed: Math.round(Math.random() * 50 * 10) / 10
            });
        }
        return vehicles;
    }

    updateSignal(id, updates) {
        const tl = this.graph.trafficLights[id];
        if (!tl) return false;

        if (updates.state) {
            tl.manualState = updates.state;
            tl.isManual = true;
        }
        if (updates.green_time != null) tl.cycle[0] = updates.green_time;
        if (updates.yellow_time != null) tl.cycle[1] = updates.yellow_time;
        if (updates.red_time != null) tl.cycle[2] = updates.red_time;

        this.save();
        this.tick();
        return true;
    }

    moveSignal(id, lat, lon) {
        if (!this.graph.nodes[id]) return false;
        this.graph.nodes[id].lat = lat;
        this.graph.nodes[id].lon = lon;
        this.save();
        this.tick();
        return true;
    }

    resetSignal(id) {
        const tl = this.graph.trafficLights[id];
        if (!tl) return false;
        tl.isManual = false;
        tl.manualState = null;
        tl.cycle = [...DEFAULT_CYCLE];
        this.save();
        this.tick();
        return true;
    }

    save() {
        const data = {};
        for (const [id, tl] of Object.entries(this.graph.trafficLights)) {
            const node = this.graph.getNode(id);
            if (!node) continue;
            data[id] = {
                lat: node.lat,
                lon: node.lon,
                cycle: [...tl.cycle],
                isManual: tl.isManual,
                manualState: tl.manualState
            };
        }
        localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    }

    load() {
        try {
            const raw = localStorage.getItem(SAVE_KEY);
            if (!raw) return false;
            const data = JSON.parse(raw);
            for (const [id, saved] of Object.entries(data)) {
                if (this.graph.nodes[id]) {
                    this.graph.nodes[id].lat = saved.lat;
                    this.graph.nodes[id].lon = saved.lon;
                }
                if (this.graph.trafficLights[id]) {
                    this.graph.trafficLights[id].cycle = saved.cycle;
                    this.graph.trafficLights[id].isManual = saved.isManual || false;
                    this.graph.trafficLights[id].manualState = saved.manualState || null;
                }
            }
            return true;
        } catch {
            return false;
        }
    }

    randomize() {
        for (const [, tl] of Object.entries(this.graph.trafficLights)) {
            tl.isManual = false;
            tl.manualState = null;
            tl.cycle = [...DEFAULT_CYCLE];
            tl.phaseOffset = Math.random() * DEFAULT_CYCLE.reduce((a, b) => a + b, 0);
        }
        this.save();
        this.tick();
    }

    resetAll() {
        const latStart = 30.7490;
        const latStep = -0.004;
        const lonStart = 76.7700;
        const lonStep = 0.004;
        let idx = 0;

        for (const [id, tl] of Object.entries(this.graph.trafficLights)) {
            const row = Math.floor(idx / 5);
            const col = idx % 5;
            this.graph.nodes[id].lat = latStart + row * latStep;
            this.graph.nodes[id].lon = lonStart + col * lonStep;
            tl.isManual = false;
            tl.manualState = null;
            tl.cycle = [...DEFAULT_CYCLE];
            tl.phaseOffset = 0;
            idx++;
        }

        localStorage.removeItem(SAVE_KEY);
        this.tick();
    }
}
