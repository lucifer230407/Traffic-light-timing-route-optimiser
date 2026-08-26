const UI = {
    startPoint: null,
    endPoint: null,
    selectedTrafficLight: null,
    routePathCoordinates: [],
    routeSignalNodes: [],

    LOCATION_PRESETS: {
        'sec17-sec43': {
            start: { lat: 30.7390, lon: 76.7820, label: 'Sector 17 Plaza' },
            end: { lat: 30.7250, lon: 76.7700, label: 'Sector 43 ISBT' }
        },
        'pgi-airport': {
            start: { lat: 30.7490, lon: 76.7700, label: 'PGI Hospital' },
            end: { lat: 30.7210, lon: 76.7860, label: 'Airport Road Junction' }
        },
        'sec35-sec22': {
            start: { lat: 30.7290, lon: 76.7740, label: 'Sector 35 Market' },
            end: { lat: 30.7370, lon: 76.7780, label: 'Sector 22 Market' }
        },
        'sec1-sec36': {
            start: { lat: 30.7490, lon: 76.7860, label: 'Sector 1 Secretariat' },
            end: { lat: 30.7250, lon: 76.7740, label: 'Sector 36' }
        }
    },

    init(app) {
        this.app = app;
        this._setupLandingEvents();
        this._setupDashboardEvents();
        this._setupAuthEvents();
    },

    _setupLandingEvents() {
        document.getElementById('btn-open-login').addEventListener('click', () => this._showAuthTab('login'));
        document.getElementById('btn-open-signup').addEventListener('click', () => this._showAuthTab('signup'));
        document.getElementById('btn-hero-login').addEventListener('click', () => this._showAuthTab('login'));
        document.getElementById('btn-hero-signup').addEventListener('click', () => this._showAuthTab('signup'));
        document.getElementById('btn-hero-dashboard').addEventListener('click', () => this.app.switchToDashboard());
        document.getElementById('btn-landing-dashboard').addEventListener('click', () => this.app.switchToDashboard());
        document.getElementById('btn-close-auth').addEventListener('click', () => document.getElementById('auth-dialog').close());

        const greenInput = document.getElementById('landing-sim-green');
        const redInput = document.getElementById('landing-sim-red');
        if (greenInput && redInput) {
            const updateSim = () => {
                const green = parseInt(greenInput.value);
                const red = parseInt(redInput.value);
                document.getElementById('landing-sim-green-val').textContent = green;
                document.getElementById('landing-sim-red-val').textContent = red;
                const totalCycle = green + red + 6;
                const throughput = Math.round((3600 / totalCycle) * (green * 0.45));
                const avgWait = (Math.round(((red * red) / (2 * totalCycle)) * 10) / 10).toFixed(1);
                document.getElementById('landing-sim-throughput').textContent = throughput;
                document.getElementById('landing-sim-wait').textContent = `${avgWait}s`;
            };
            greenInput.addEventListener('input', updateSim);
            redInput.addEventListener('input', updateSim);
        }

        document.querySelectorAll('.faq-item').forEach(item => {
            item.addEventListener('click', () => {
                const isOpen = item.classList.contains('active');
                document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
                if (!isOpen) item.classList.add('active');
            });
        });
    },

    _setupAuthEvents() {
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
                document.getElementById(`form-${e.target.getAttribute('data-tab')}`).classList.add('active');
            });
        });

        document.getElementById('form-login').addEventListener('submit', async (e) => {
            e.preventDefault();
            const errEl = document.getElementById('login-error');
            errEl.textContent = '';
            const email = document.getElementById('login-email').value.trim().toLowerCase();
            const password = document.getElementById('login-password').value;
            const result = await Auth.login(email, password);
            if (result.error) { errEl.textContent = result.error; return; }
            this.updateUserUI();
            e.target.reset();
            document.getElementById('auth-dialog').close();
            this.app.switchToDashboard();
        });

        document.getElementById('form-signup').addEventListener('submit', async (e) => {
            e.preventDefault();
            const errEl = document.getElementById('signup-error');
            errEl.textContent = '';
            const name = document.getElementById('signup-name').value.trim();
            const email = document.getElementById('signup-email').value.trim().toLowerCase();
            const password = document.getElementById('signup-password').value;
            if (name.length < 2) { errEl.textContent = 'Please enter your full name.'; return; }
            const result = await Auth.signup(name, email, password);
            if (result.error) { errEl.textContent = result.error; return; }
            this.updateUserUI();
            e.target.reset();
            document.getElementById('auth-dialog').close();
            this.app.switchToDashboard();
        });

        const handleLogout = () => { Auth.clearSession(); this.updateUserUI(); this.app.switchToLanding(); };
        document.getElementById('btn-logout').addEventListener('click', handleLogout);
        document.getElementById('btn-landing-logout').addEventListener('click', handleLogout);
    },

    _setupDashboardEvents() {
        document.getElementById('btn-home').addEventListener('click', () => this.app.switchToLanding());

        const sidebar = document.getElementById('sidebar');
        const sidebarToggle = document.getElementById('sidebar-toggle');
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            const icon = sidebarToggle.querySelector('i');
            icon.className = sidebar.classList.contains('collapsed') ? 'ri-arrow-left-s-line' : 'ri-arrow-right-s-line';
        });

        document.querySelectorAll('.sidebar-tabs .tab-btn').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.sidebar-tabs .tab-btn').forEach(t => t.classList.remove('active'));
                const btn = e.target.closest('.tab-btn');
                btn.classList.add('active');
                document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
                document.getElementById(`tab-${btn.getAttribute('data-tab')}`).classList.add('active');
            });
        });

        document.getElementById('location-preset').addEventListener('change', (e) => {
            const preset = this.LOCATION_PRESETS[e.target.value];
            if (preset) {
                this.setStartLocation(preset.start.lat, preset.start.lon, preset.start.label);
                this.setEndLocation(preset.end.lat, preset.end.lon, preset.end.label);
                this.findRoute();
            }
        });

        document.getElementById('find-route-btn').addEventListener('click', () => this.findRoute());
        document.getElementById('clear-btn').addEventListener('click', () => this.clearSelection());

        document.getElementById('btn-sim-play').addEventListener('click', () => Simulation.toggle());
        document.getElementById('btn-sim-reset').addEventListener('click', () => Simulation.reset());
        document.getElementById('sim-speed-select').addEventListener('change', (e) => {
            Simulation.speedMultiplier = parseFloat(e.target.value);
        });
    },

    _showAuthTab(tab) {
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        document.querySelector(`.auth-tab[data-tab="${tab}"]`).classList.add('active');
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
        document.getElementById(`form-${tab}`).classList.add('active');
        document.getElementById('auth-dialog').showModal();
    },

    attachMapClickHandler() {
        if (MapManager.map) {
            MapManager.map.on('click', (e) => this.onMapClick(e));
        }
    },

    updateUserUI() {
        const user = Auth.currentUser;
        const userDisplay = document.getElementById('user-name-display');
        const userAvatar = document.getElementById('user-avatar');
        const authBtns = document.getElementById('landing-auth-btns');
        const landingWidget = document.getElementById('landing-user-widget');
        const landingName = document.getElementById('landing-user-name');
        const landingAvatar = document.getElementById('landing-user-avatar');
        const heroLogin = document.getElementById('btn-hero-login');
        const heroSignup = document.getElementById('btn-hero-signup');
        const heroDashboard = document.getElementById('btn-hero-dashboard');

        if (user) {
            const initial = user.name.charAt(0).toUpperCase();
            userDisplay.textContent = user.name;
            userAvatar.textContent = initial;
            landingName.textContent = user.name;
            landingAvatar.textContent = initial;
            authBtns.style.display = 'none';
            landingWidget.style.display = '';
            heroLogin.style.display = 'none';
            heroSignup.style.display = 'none';
            heroDashboard.style.display = '';
        } else {
            userDisplay.textContent = 'Not Signed In';
            userAvatar.textContent = '?';
            authBtns.style.display = '';
            landingWidget.style.display = 'none';
            heroLogin.style.display = '';
            heroSignup.style.display = '';
            heroDashboard.style.display = 'none';
        }
    },

    onMapClick(e) {
        const { lat, lng } = e.latlng;
        if (!this.startPoint) {
            this.setStartLocation(lat, lng, 'Selected Location');
        } else if (!this.endPoint) {
            this.setEndLocation(lat, lng, 'Selected Location');
            document.getElementById('find-route-btn').disabled = false;
        }
    },

    setStartLocation(lat, lon, label = null) {
        this.startPoint = { lat, lon };
        const marker = MapManager.setStartMarker(lat, lon);
        marker.on('dragend', (e) => {
            const pos = e.target.getLatLng();
            this.startPoint = { lat: pos.lat, lon: pos.lng };
            this.updateSelectionDisplay();
            if (this.endPoint) this.findRoute();
        });
        this.updateSelectionDisplay(label, null);
    },

    setEndLocation(lat, lon, label = null) {
        this.endPoint = { lat, lon };
        const marker = MapManager.setEndMarker(lat, lon);
        marker.on('dragend', (e) => {
            const pos = e.target.getLatLng();
            this.endPoint = { lat: pos.lat, lon: pos.lng };
            this.updateSelectionDisplay();
            if (this.startPoint) this.findRoute();
        });
        this.updateSelectionDisplay(null, label);
        document.getElementById('find-route-btn').disabled = false;
    },

    updateSelectionDisplay(startLabel = null, endLabel = null) {
        const startEl = document.getElementById('start-coords');
        const endEl = document.getElementById('end-coords');
        startEl.textContent = this.startPoint ?
            (startLabel || `${this.startPoint.lat.toFixed(4)}, ${this.startPoint.lon.toFixed(4)}`) :
            'Click map or choose preset';
        endEl.textContent = this.endPoint ?
            (endLabel || `${this.endPoint.lat.toFixed(4)}, ${this.endPoint.lon.toFixed(4)}`) :
            'Click map or choose preset';
    },

    async findRoute() {
        if (!this.startPoint || !this.endPoint) return;
        const btn = document.getElementById('find-route-btn');
        btn.disabled = true;
        btn.innerHTML = '<i class="ri-loader-4-line ri-spin"></i> Calculating...';

        try {
            const result = this.app.router.findShortestPath(
                this.app.graph.findNearestNode(this.startPoint.lat, this.startPoint.lon),
                this.app.graph.findNearestNode(this.endPoint.lat, this.endPoint.lon),
                Date.now() / 1000
            );

            if (!result.path.length) return;

            const coordinates = result.path.map(id => {
                const node = this.app.graph.getNode(id);
                return node ? [node.lat, node.lon] : null;
            }).filter(Boolean);

            const trafficLightsOnRoute = result.path.map(id => {
                const node = this.app.graph.getNode(id);
                return node ? { id, lat: node.lat, lon: node.lon } : null;
            }).filter(Boolean);

            const details = this.app.router.calculateRouteDetails(result.path, Date.now() / 1000);

            this.routePathCoordinates = coordinates;
            this.routeSignalNodes = trafficLightsOnRoute;

            MapManager.drawRoute(coordinates, trafficLightsOnRoute);
            this._updateRouteAnalytics(details, coordinates.length, result.path.length);

            document.getElementById('btn-sim-play').disabled = false;
            document.getElementById('btn-sim-reset').disabled = false;
            document.getElementById('sim-status-text').textContent = "Ready! Click 'Start Vehicle' to play trajectory.";

            Simulation.setRoute(coordinates);
            Simulation.reset();
            if (MapManager.simVehicleMarker) {
                MapManager.map.removeLayer(MapManager.simVehicleMarker);
                MapManager.simVehicleMarker = null;
            }

        } catch (error) {
            console.error('Route error:', error);
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="ri-navigation-line"></i> Find Optimal Route';
        }
    },

    _updateRouteAnalytics(details, coordCount, edgeCount) {
        const routeInfo = document.getElementById('route-info');
        if (!details.totalTime) {
            routeInfo.innerHTML = '<p class="placeholder">No viable route found.</p>';
            return;
        }

        const totalSec = Math.floor(details.totalTime);
        const min = Math.floor(totalSec / 60);
        const sec = totalSec % 60;
        const timeStr = min > 0 ? `${min}m ${sec}s` : `${sec}s`;
        const tlCount = details.trafficLightsHit.length;
        const baseDriveSec = Math.max(10, Math.floor(totalSec - (tlCount * 12)));
        const signalWaitSec = Math.max(0, totalSec - baseDriveSec);
        const drivePercent = Math.round((baseDriveSec / totalSec) * 100);
        const waitPercent = 100 - drivePercent;

        routeInfo.innerHTML = `
            <div class="route-detail-row"><span class="label">Total Travel Time</span><span class="value">${timeStr}</span></div>
            <div class="route-detail-row"><span class="label">Waypoints</span><span class="value">${coordCount}</span></div>
            <div class="route-detail-row"><span class="label">Road Segments</span><span class="value">${edgeCount - 1}</span></div>
            <div class="route-detail-row"><span class="label">Traffic Signals En Route</span><span class="value">${tlCount}</span></div>
        `;

        document.getElementById('bar-drive-segment').style.width = `${drivePercent}%`;
        document.getElementById('bar-wait-segment').style.width = `${waitPercent}%`;
        document.getElementById('delay-summary-text').textContent = `Drive: ${drivePercent}% | Signal Delays: ${waitPercent}%`;
    },

    clearSelection() {
        this.startPoint = null;
        this.endPoint = null;
        MapManager.clearMarkers();
        this.updateSelectionDisplay();
        document.getElementById('find-route-btn').disabled = true;
        document.getElementById('btn-sim-play').disabled = true;
        document.getElementById('btn-sim-reset').disabled = true;
        document.getElementById('route-info').innerHTML = '<p class="placeholder">Click on map or select preset to calculate timing details.</p>';
        document.getElementById('sim-status-text').textContent = "Select start & destination to enable vehicle trajectory playback.";
        document.getElementById('location-preset').value = "";
    },

    updateConnectionStatus(status) {
        const statusEl = document.getElementById('ws-status');
        const textEl = document.getElementById('ws-status-text');
        if (statusEl) statusEl.className = 'status-dot ' + status;
        if (textEl) textEl.textContent = status.charAt(0).toUpperCase() + status.slice(1);
    }
};
