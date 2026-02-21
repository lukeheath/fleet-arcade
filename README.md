# Fleet Arcade

Retro arcade visualization of your [Fleet](https://fleetdm.com) device management. Each host enrolled in Fleet is rendered as a spaceship flying in formation across a starfield, grouped by team.

![HTML5 Canvas](https://img.shields.io/badge/canvas-HTML5-orange) ![Vite](https://img.shields.io/badge/build-Vite-646CFF)

## Setup

```bash
npm install
```

Create a `.env` file with your Fleet credentials:

```
VITE_FLEET_API_TOKEN=your_api_token_here
VITE_FLEET_URL=https://your-fleet-instance.example.com
```

Run the dev server:

```bash
npm run dev
```

## Deploy to Render

The included `render.yaml` configures a Render Web Service. Set the `VITE_FLEET_API_TOKEN` environment variable in the Render dashboard (it's marked `sync: false` so it won't be committed).

```bash
npm run build   # Vite production build
npm start       # Express server with API proxy
```

## How it works

- **Ships** represent hosts, styled by platform (macOS = fighter, Windows = cruiser, Linux = stealth, Chrome = drone, iOS/Android = interceptor/scout)
- **Formations** fly at random headings with gentle turning curves and per-ship wander/stray behavior
- **Colors** are assigned per team (cyan, magenta, yellow, orange, blue)
- Click a ship to view host details; click fleet labels to toggle visibility
