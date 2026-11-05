const Simulation = {
    isRunning: false,
    currentStep: 0,
    timerId: null,
    speedMultiplier: 2,
    routePath: [],
    latestTrafficLights: {},

    setRoute(coordinates) {
        this.routePath = coordinates || [];
        this.reset();
    },

    setTrafficLightStates(states) {
        this.latestTrafficLights = {};
        for (const tl of states) {
            this.latestTrafficLights[tl.id] = tl;
        }
    },

    toggle() {
        if (this.isRunning) this.stop();
        else this.start();
    },

    start() {
        if (!this.routePath || this.routePath.length < 2) return;
        this.isRunning = true;
        this._updateButton('pause');
        this._step();
    },

    stop() {
        this.isRunning = false;
        if (this.timerId) { clearTimeout(this.timerId); this.timerId = null; }
        this._updateButton('resume');
    },

    reset() {
        this.stop();
        this.currentStep = 0;
        if (MapManager.simVehicleMarker && this.routePath.length > 0) {
            MapManager.simVehicleMarker.setLatLng(this.routePath[0]);
        }
        this._updateButton('start');
        document.getElementById('sim-status-text').textContent = 'Vehicle reset to start location.';
    },

    _step() {
        if (!this.isRunning) return;

        if (this.currentStep >= this.routePath.length - 1) {
            this.stop();
            document.getElementById('sim-status-text').textContent = 'Destination reached!';
            return;
        }

        const nextCoords = this.routePath[this.currentStep + 1];
        const isRed = this._checkSignalAtCoords(nextCoords);

        if (isRed) {
            document.getElementById('sim-status-text').innerHTML =
                '<span style="color:#ef4444;font-weight:bold;">Stopped at Red Light!</span> Waiting...';
            this.timerId = setTimeout(() => this._step(), 1000);
            return;
        }

        this.currentStep++;
        if (MapManager.simVehicleMarker) {
            MapManager.simVehicleMarker.setLatLng(nextCoords);
        }
        document.getElementById('sim-status-text').textContent =
            `Driving... Step ${this.currentStep} of ${this.routePath.length - 1}`;

        const interval = Math.max(200, 1000 / this.speedMultiplier);
        this.timerId = setTimeout(() => this._step(), interval);
    },

    _checkSignalAtCoords(coords) {
        const lat = coords[0];
        const lon = coords[1];
        for (const id in this.latestTrafficLights) {
            const tl = this.latestTrafficLights[id];
            const dist = Math.abs(tl.lat - lat) + Math.abs(tl.lon - lon);
            if (dist < 0.001 && tl.state === 'red') return true;
        }
        return false;
    },

    _updateButton(state) {
        const playBtn = document.getElementById('btn-sim-play');
        if (!playBtn) return;
        if (state === 'start') {
            playBtn.innerHTML = '<i class="ri-play-line"></i> Start Vehicle';
            playBtn.classList.remove('btn-warning');
            playBtn.classList.add('btn-accent');
        } else if (state === 'pause') {
            playBtn.innerHTML = '<i class="ri-pause-line"></i> Pause';
            playBtn.classList.remove('btn-accent');
            playBtn.classList.add('btn-warning');
        } else if (state === 'resume') {
            playBtn.innerHTML = '<i class="ri-play-line"></i> Resume';
            playBtn.classList.remove('btn-warning');
            playBtn.classList.add('btn-accent');
        }
    }
};
