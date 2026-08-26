const MapManager = {
    map: null,
    trafficLightMarkers: {},
    vehicleMarkers: {},
    startMarker: null,
    endMarker: null,
    routePolyline: null,
    routeMarkers: [],
    simVehicleMarker: null,

    init() {
        if (this.map) return;
        this.map = L.map('map', { zoomControl: false }).setView([30.7350, 76.7780], 13);
        L.control.zoom({ position: 'topleft' }).addTo(this.map);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap &copy; CARTO',
            subdomains: 'abcd',
            maxZoom: 20
        }).addTo(this.map);

        setTimeout(() => {
            if (this.map) this.map.invalidateSize(true);
        }, 250);
    },

    invalidateSize() {
        if (this.map) {
            requestAnimationFrame(() => {
                setTimeout(() => this.map.invalidateSize(true), 200);
            });
        }
    },

    setStartMarker(lat, lon) {
        if (this.startMarker) this.map.removeLayer(this.startMarker);
        const icon = L.divIcon({
            className: '',
            html: '<div class="custom-leaflet-marker start">S</div>',
            iconSize: [32, 32],
            iconAnchor: [16, 16]
        });
        this.startMarker = L.marker([lat, lon], { icon, draggable: true }).addTo(this.map);
        return this.startMarker;
    },

    setEndMarker(lat, lon) {
        if (this.endMarker) this.map.removeLayer(this.endMarker);
        const icon = L.divIcon({
            className: '',
            html: '<div class="custom-leaflet-marker end">E</div>',
            iconSize: [32, 32],
            iconAnchor: [16, 16]
        });
        this.endMarker = L.marker([lat, lon], { icon, draggable: true }).addTo(this.map);
        return this.endMarker;
    },

    clearMarkers() {
        if (this.startMarker) { this.map.removeLayer(this.startMarker); this.startMarker = null; }
        if (this.endMarker) { this.map.removeLayer(this.endMarker); this.endMarker = null; }
        this.clearRoute();
    },

    clearRoute() {
        if (this.routePolyline) { this.map.removeLayer(this.routePolyline); this.routePolyline = null; }
        this.routeMarkers.forEach(m => this.map.removeLayer(m));
        this.routeMarkers = [];
        if (this.simVehicleMarker) { this.map.removeLayer(this.simVehicleMarker); this.simVehicleMarker = null; }
    },

    updateTrafficLightMarkers(trafficLights) {
        const activeIds = new Set();
        for (const tl of trafficLights) {
            activeIds.add(tl.id);
            const color = tl.state === 'red' ? '#ef4444' :
                          tl.state === 'yellow' ? '#f59e0b' : '#10b981';

            if (this.trafficLightMarkers[tl.id]) {
                const marker = this.trafficLightMarkers[tl.id];
                if (!marker._dragging) marker.setLatLng([tl.lat, tl.lon]);
                const el = marker.getElement();
                if (el) {
                    const light = el.querySelector('.signal-marker-badge');
                    if (light) {
                        light.style.background = color;
                        light.style.boxShadow = `0 0 12px ${color}`;
                    }
                }
            } else {
                const icon = L.divIcon({
                    className: '',
                    html: `<div class="signal-marker-badge" style="background:${color};box-shadow:0 0 12px ${color};color:#0f172a;"><i class="ri-traffic-light-line"></i></div>`,
                    iconSize: [22, 22],
                    iconAnchor: [11, 11]
                });
                const marker = L.marker([tl.lat, tl.lon], { icon, draggable: true }).addTo(this.map);
                marker.on('dragstart', () => { marker._dragging = true; });
                marker.on('click', () => {
                    document.dispatchEvent(new CustomEvent('signal-click', { detail: tl }));
                });
                this.trafficLightMarkers[tl.id] = marker;
            }
        }

        for (const id of Object.keys(this.trafficLightMarkers)) {
            if (!activeIds.has(id)) {
                this.map.removeLayer(this.trafficLightMarkers[id]);
                delete this.trafficLightMarkers[id];
            }
        }
    },

    drawRoute(coordinates, trafficLightsOnRoute) {
        this.clearRoute();
        if (!coordinates || !coordinates.length) return;

        this.routePolyline = L.polyline(coordinates, {
            color: '#00f2fe',
            weight: 6,
            opacity: 0.9,
            lineCap: 'round',
            lineJoin: 'round'
        }).addTo(this.map);

        this.map.fitBounds(this.routePolyline.getBounds(), { padding: [40, 40] });

        if (trafficLightsOnRoute) {
            for (const tl of trafficLightsOnRoute) {
                const icon = L.divIcon({
                    className: '',
                    html: '<div class="signal-marker-badge" style="background:#f59e0b;color:#0f172a;"><i class="ri-traffic-light-line"></i></div>',
                    iconSize: [22, 22],
                    iconAnchor: [11, 11]
                });
                const m = L.marker([tl.lat, tl.lon], { icon }).addTo(this.map)
                    .bindPopup(`Signal Node: ${tl.id}`);
                this.routeMarkers.push(m);
            }
        }
    },

    updateVehicleMarkers(vehicles) {
        if (!vehicles) return;
        const activeIds = new Set();
        for (const v of vehicles) {
            activeIds.add(v.id);
            if (this.vehicleMarkers[v.id]) {
                this.vehicleMarkers[v.id].setLatLng([v.lat, v.lon]);
            } else {
                const icon = L.divIcon({
                    className: '',
                    html: '<div style="width:8px;height:8px;background:#f59e0b;border-radius:50%;box-shadow:0 0 6px #f59e0b;"></div>',
                    iconSize: [8, 8],
                    iconAnchor: [4, 4]
                });
                this.vehicleMarkers[v.id] = L.marker([v.lat, v.lon], { icon }).addTo(this.map)
                    .bindPopup(`Vehicle: ${v.id}<br>Speed: ${v.speed} km/h`);
            }
        }
        for (const id of Object.keys(this.vehicleMarkers)) {
            if (!activeIds.has(id)) {
                this.map.removeLayer(this.vehicleMarkers[id]);
                delete this.vehicleMarkers[id];
            }
        }
    },

    createSimVehicleMarker(lat, lon) {
        if (this.simVehicleMarker) this.map.removeLayer(this.simVehicleMarker);
        const icon = L.divIcon({
            className: '',
            html: '<div class="vehicle-playback-marker"><i class="ri-car-fill"></i></div>',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });
        this.simVehicleMarker = L.marker([lat, lon], { icon }).addTo(this.map);
        return this.simVehicleMarker;
    },

    panTo(lat, lon) {
        if (this.map) this.map.panTo([lat, lon]);
    }
};
