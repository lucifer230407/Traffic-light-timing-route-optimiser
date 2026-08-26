const App = {
    graph: null,
    router: null,
    traffic: null,
    latestStates: {},

    init() {
        this.graph = new RoadGraph();
        this.graph.loadMockNetwork();

        this.router = new TimeDependentRouter(this.graph);
        this.traffic = new TrafficSimulator(this.graph);
        this.traffic.load();

        UI.init(this);
        UI.updateUserUI();

        const user = Auth.getSessionUser();
        if (user) {
            Auth._currentUser = user;
            UI.updateUserUI();
            this.switchToDashboard();
        }

        this.traffic.onTick((data) => {
            this.latestStates = {};
            for (const tl of data.trafficLights) {
                this.latestStates[tl.id] = tl;
            }

            UI.updateConnectionStatus('connected');
            MapManager.updateTrafficLightMarkers(data.trafficLights);
            MapManager.updateVehicleMarkers(data.vehicles);
            UI.renderTrafficLightsList(this.latestStates);
            Simulation.setTrafficLightStates(data.trafficLights);
            document.getElementById('metric-vehicles').textContent = data.vehicles.length;

            const greenCount = data.trafficLights.filter(t => t.state === 'green').length;
            const efficiency = Math.round((greenCount / data.trafficLights.length) * 100);
            document.getElementById('metric-efficiency').textContent = efficiency + '%';
        });
    },

    switchToDashboard() {
        if (!Auth.currentUser) {
            document.getElementById('auth-dialog').showModal();
            return;
        }
        document.getElementById('landing-page').classList.remove('active');
        document.getElementById('app-dashboard').classList.add('active');

        requestAnimationFrame(() => {
            setTimeout(() => {
                MapManager.init();
                MapManager.invalidateSize();
                UI.attachMapClickHandler();
                this.traffic.start();
            }, 200);
        });
    },

    switchToLanding() {
        document.getElementById('landing-page').classList.add('active');
        document.getElementById('app-dashboard').classList.remove('active');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
