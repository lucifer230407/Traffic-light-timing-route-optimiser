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
| Map | [Leaflet.js](https://leafletjs.com/) with [OpenStreetMap](https://www.openstreetmap.org/) tiles |
| Routing | Custom time-dependent Dijkstra + Yen's K-shortest paths |
| UI | Vanilla JS, Remix Icons, Google Fonts (Inter + Outfit) |
| Backend | Node.js, Express, MongoDB Atlas, Mongoose |
| Authentication | bcrypt password hashing, JWT bearer tokens |
| Persistence | MongoDB (user accounts and per-user signal settings) |

## Getting Started

### Run Locally

1. Install Node.js 20+ and create a MongoDB Atlas database.
2. Configure the API environment:

```bash
git clone https://github.com/lucifer230407/Traffic-light-timing-route-optimiser.git
cd Traffic-light-timing-route-optimiser/backend
cp .env.example .env
# Set MONGODB_URI and a random JWT_SECRET (at least 32 characters) in .env
npm install
npm start
```

Open `http://localhost:3000`. The Express server serves the frontend and API on the same origin. Do not open `frontend/index.html` directly as a file.

## Project Structure

```
├── frontend/               # Existing static web application
│   ├── index.html
│   ├── css/
│   ├── js/
│   │   ├── api.js          # API client
│   │   ├── auth.js         # JWT login/signup client
│   │   └── ...
│   └── traffic_hero.png
├── backend/
│   ├── src/
│   │   ├── config/         # MongoDB connection
│   │   ├── controllers/    # Auth and signal logic
│   │   ├── middleware/     # JWT authentication
│   │   ├── models/         # Mongoose schemas
│   │   ├── routes/         # REST endpoints
│   │   ├── app.js
│   │   └── server.js
│   └── test/
├── postman/TraffIQ.postman_collection.json
└── render.yaml
```

## Dashboard

The dashboard provides three tabs:

- **Route** — Select start/destination via map clicks or presets, find optimal route, play vehicle trajectory with speed control.
- **Signals** — View all 40 live signals with search/filter, override individual signal state and timing, bulk operations (save, randomize, reset).
- **Metrics** — System performance overview with intersection count, active signals, tracked vehicles, optimal flow percentage, and route delay analysis bar.

## Authentication

Account records and bcrypt-hashed passwords are stored in MongoDB. Signup and login return a seven-day JWT; the browser stores the token for authenticated API requests. Each signed-in user has their own MongoDB traffic signal settings.

## API

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/health` | Deployment health check |
| POST | `/api/auth/signup` | Create an account and return a JWT |
| POST | `/api/auth/login` | Sign in and return a JWT |
| GET | `/api/auth/me` | Return the authenticated account |
| GET | `/api/signals` | Load this account's saved signal settings |
| PUT | `/api/signals` | Save this account's signal settings |
| GET | `/api/signals/:id` | Get one saved signal for this account |
| PATCH | `/api/signals/:id` | Update a signal's position or timing |
| DELETE | `/api/signals/:id` | Delete one saved signal for this account |

Protected endpoints require `Authorization: Bearer <token>`. Request bodies and signal timing values are validated by the API.

## Deploy and test

The repository includes a Render Blueprint in `render.yaml`. In Render, create a Blueprint from this existing GitHub repository, provide `MONGODB_URI` from MongoDB Atlas, and deploy. Render generates `JWT_SECRET`; the service serves both the frontend and `/api` from the same deployed URL. In MongoDB Atlas, allow the Render service to connect to the cluster (use network access rules appropriate for your deployment).

Import `postman/TraffIQ.postman_collection.json` into Postman, set `baseUrl`, then run **Sign up** (or **Log in** if the test account already exists) to store a JWT. For the individual signal demo, run **Save signal settings**, **Get one signal**, **Update one signal position**, then **Delete one signal**. These protected requests use the collection's `signalId` variable (default `s1`) and only access the signed-in user's saved settings. The browser uses the same-origin `/api` URL; if hosting the frontend separately, define `window.TRAFFIQ_API_URL` before `js/api.js` and set `CLIENT_ORIGIN` on the API service to the exact frontend origin.

Run backend checks with `cd backend && npm test`.

## Team

| Member | GitHub | Role |
|--------|--------|------|
| Lucifer | [@lucifer230407](https://github.com/lucifer230407) | Core engine, graph model, routing algorithms |
| Taniya | [@taniyaggarwal](https://github.com/taniyaggarwal) | Traffic simulation, map visualization, dashboard UI |
| Himani | [@Himani-batra](https://github.com/Himani-batra) | Landing page, design system, authentication |
