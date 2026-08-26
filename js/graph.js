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
}
