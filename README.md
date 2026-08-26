# TraffIQ — Smart Signal Timing & Route Optimizer

Real-time traffic signal synchronization with time-dependent Dijkstra routing. Minimize intersection delays. Optimize every commute.

![TraffIQ](traffic_hero.png)

## Features

- **Dynamic Signal Sync** — Real-time simulation synchronizes live signal state countdowns, green phase durations, and offset phases across 40 intersections.
- **Time-Dependent Dijkstra** — Computes optimal paths using dynamic wait-time matrices at intersections based on precise arrival timestamps.
- **Manual Signal Override** — Instantly override individual signal colors, modify phase timings, or randomize the entire network.
- **Live Trajectory Playback** — Animate virtual vehicles along calculated routes with real-time signal detection and stopping behavior.

## How It Works

1. **Plot Waypoints** — Select origin and destination using interactive presets or custom map coordinates.
2. **Sync Signal Phases** — Fetch active green, yellow, and red cycle lengths with arrival time offsets across all 40 intersections.
3. **Compute & Navigate** — Calculate minimal-delay routes using dynamic time-dependent costs and track vehicle trajectories live.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Map | [Leaflet.js](https://leafletjs.com/) with CARTO dark tiles |
| Routing | Custom time-dependent Dijkstra + Yen's K-shortest paths |
| UI | Vanilla JS, Remix Icons, Google Fonts (Inter + Outfit) |
| Persistence | localStorage |

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- No server or build tools required

### Run Locally

```bash
git clone https://github.com/lucifer230407/Traffic-light-timing-route-optimiser.git
cd Traffic-light-timing-route-optimiser
open index.html
```

## Project Structure

```
traffiq/
├── index.html            # Landing page, auth dialog, dashboard
├── css/
│   └── style.css         # Full dark theme design system
├── js/
│   ├── utils.js          # Haversine distance, clamp utility
│   ├── graph.js          # Road network graph with 40-node grid
│   ├── routing.js        # Time-dependent Dijkstra + K-shortest paths
│   ├── traffic.js        # Traffic signal simulation engine
│   ├── simulation.js     # Vehicle trajectory playback
│   ├── map.js            # Leaflet map visualization
│   ├── ui.js             # Dashboard UI event handling
│   ├── auth.js           # User authentication (localStorage)
│   └── app.js            # Application entry point
└── traffic_hero.png      # Hero image asset
```

## Dashboard

The dashboard provides three tabs:

- **Route** — Select start/destination via map clicks or presets, find optimal route, play vehicle trajectory with speed control.
- **Signals** — View all 40 live signals with search/filter, override individual signal state and timing, bulk operations (save, randomize, reset).
- **Metrics** — System performance overview with intersection count, active signals, tracked vehicles, optimal flow percentage, and route delay analysis bar.

## Authentication

User accounts are stored in localStorage with SHA-256 password hashing. Supports signup, login, session persistence, and logout.

## Team

| Member | GitHub | Role |
|--------|--------|------|
| Lucifer | [@lucifer230407](https://github.com/lucifer230407) | Core engine, graph model, routing algorithms |
| Taniya | [@taniyaggarwal](https://github.com/taniyaggarwal) | Traffic simulation, map visualization, dashboard UI |
| Himani | [@Himani-batra](https://github.com/Himani-batra) | Landing page, design system, authentication |
