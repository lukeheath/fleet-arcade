import { fetchHosts } from './api.js';
import { Starfield } from './starfield.js';
import { drawShip, getShipHitRadius, getFleetColor } from './ships.js';
import { FleetFormation } from './fleet-formations.js';
import { updateHUD, updateClock, buildLegend, showTooltip, hideTooltip, showDetailPanel, hideDetailPanel } from './ui.js';

// ─── State ───────────────────────────────────────────────────────────
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

let hosts = [];
let formations = [];
let starfield = null;
let lastTime = 0;
let gameTime = 0;
let mouseX = 0;
let mouseY = 0;
let hoveredHost = null;
let detailOpen = false;
const fleetVisibility = {}; // fleetName -> boolean (true = visible)

// ─── Canvas Setup ────────────────────────────────────────────────────
function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  if (starfield) starfield.resize(window.innerWidth, window.innerHeight);
  for (const f of formations) f.resize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ─── Loading ─────────────────────────────────────────────────────────
async function init() {
  const loadingBar = document.getElementById('loading-bar');
  const loadingText = document.getElementById('loading-text');
  const loadingScreen = document.getElementById('loading-screen');

  // Create starfield immediately so it's visible behind loading
  starfield = new Starfield(window.innerWidth, window.innerHeight);

  try {
    loadingBar.style.width = '20%';
    loadingText.textContent = 'ESTABLISHING UPLINK...';

    hosts = await fetchHosts((msg) => {
      loadingText.textContent = msg;
      loadingBar.style.width = '50%';
    });

    loadingBar.style.width = '80%';
    loadingText.textContent = `${hosts.length} VESSELS DETECTED`;

    // Build formations grouped by fleet
    buildFormations();

    loadingBar.style.width = '100%';
    loadingText.textContent = 'ALL SYSTEMS OPERATIONAL';

    // Update HUD
    updateHUD(hosts);
    updateClock();
    setInterval(updateClock, 1000);

    // Build legend with toggle support
    const fleetNames = [...new Set(hosts.map((h) => h.fleet_name || h.team_name || 'No team'))].sort();
    for (const name of fleetNames) fleetVisibility[name] = true;
    buildLegend(fleetNames, (name, visible) => {
      fleetVisibility[name] = visible;
      // Set target alpha on the matching formation
      for (const f of formations) {
        if (f.name === name) {
          f.targetAlpha = visible ? 1 : 0.06;
        }
      }
    });

    // Fade out loading screen after a beat
    await sleep(800);
    loadingScreen.classList.add('fade-out');
    await sleep(1000);
    loadingScreen.style.display = 'none';

    // Start game loop
    requestAnimationFrame(gameLoop);
  } catch (err) {
    console.error('Failed to initialize:', err);
    loadingText.textContent = 'UPLINK FAILED - CHECK CONSOLE';
    loadingText.style.color = '#ff3333';
  }
}

function buildFormations() {
  // Group hosts by fleet
  const groups = {};
  for (const host of hosts) {
    const fleet = host.fleet_name || host.team_name || 'No team';
    if (!groups[fleet]) groups[fleet] = [];
    groups[fleet].push(host);
  }

  formations = [];
  const fleetNames = Object.keys(groups).sort((a, b) => groups[b].length - groups[a].length);

  fleetNames.forEach((name, i) => {
    const formation = new FleetFormation(
      name,
      groups[name],
      window.innerWidth,
      window.innerHeight,
    );

    // Stagger initial off-screen distance so they don't all arrive at once
    formation.placeOffScreen(i * 150);

    formations.push(formation);
  });
}

// ─── Game Loop ───────────────────────────────────────────────────────
function gameLoop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.1); // Cap delta to avoid jumps
  lastTime = timestamp;
  gameTime += dt;

  update(dt, gameTime);
  draw(gameTime);

  requestAnimationFrame(gameLoop);
}

function update(dt, time) {
  starfield.update(dt);

  for (const formation of formations) {
    formation.update(dt, time);
  }
}

function draw(time) {
  const w = window.innerWidth;
  const h = window.innerHeight;

  // Clear
  ctx.fillStyle = '#000408';
  ctx.fillRect(0, 0, w, h);

  // Starfield
  starfield.draw(ctx);

  // Draw formations
  for (const formation of formations) {
    drawFormation(ctx, formation, time);
  }
}

function drawFormation(ctx, formation, time) {
  const ships = formation.getShipWorldPositions();
  const colors = getFleetColor(formation.name);
  const alpha = formation.displayAlpha;

  // Draw formation label (stays horizontal / readable)
  if (formation.labelAlpha > 0.05 && alpha > 0.1 && ships.length > 0) {
    ctx.save();
    ctx.globalAlpha = formation.labelAlpha * 0.6;
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillStyle = colors.primary;
    ctx.textAlign = 'center';
    ctx.shadowColor = colors.primary;
    ctx.shadowBlur = 8;

    // Find bounding center of visible ships
    let sumX = 0, sumY = 0, minY = Infinity;
    for (const s of ships) {
      sumX += s.x;
      sumY += s.y;
      if (s.y < minY) minY = s.y;
    }
    const cx = sumX / ships.length;
    // Place label above the topmost ship
    const labelY = Math.max(30, minY - 30);

    const labelText = formation.name.replace(/[^\w\s&]/g, '').trim();
    ctx.fillText(labelText, cx, labelY);

    ctx.font = '6px "Press Start 2P", monospace';
    ctx.globalAlpha = formation.labelAlpha * 0.35;
    ctx.fillText(`${ships.length} VESSELS`, cx, labelY + 14);

    ctx.restore();
  }

  // Draw each ship with formation alpha applied
  ctx.save();
  ctx.globalAlpha = alpha;
  for (const { x, y, host } of ships) {
    // Only draw if on-screen (with margin)
    if (x > -50 && x < window.innerWidth + 50 && y > -50 && y < window.innerHeight + 50) {
      drawShip(ctx, x, y, host, time, formation.heading);
    }
  }
  ctx.restore();
}

// ─── Mouse Interaction ───────────────────────────────────────────────
canvas.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;

  if (detailOpen) return;

  // Find closest ship under cursor
  let closest = null;
  let closestDist = Infinity;

  for (const formation of formations) {
    // Skip stealthed fleets for hover/click
    if (fleetVisibility[formation.name] === false) continue;
    const ships = formation.getShipWorldPositions();
    for (const { x, y, host } of ships) {
      const dx = mouseX - x;
      const dy = mouseY - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const hitRadius = getShipHitRadius(host.platform);

      if (dist < hitRadius && dist < closestDist) {
        closest = host;
        closestDist = dist;
      }
    }
  }

  if (closest) {
    hoveredHost = closest;
    showTooltip(mouseX, mouseY, closest);
    canvas.style.cursor = 'pointer';
  } else {
    hoveredHost = null;
    hideTooltip();
    canvas.style.cursor = 'crosshair';
  }
});

canvas.addEventListener('click', (e) => {
  if (hoveredHost) {
    detailOpen = true;
    showDetailPanel(hoveredHost);
    hideTooltip();
  }
});

// Close detail panel on Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    hideDetailPanel();
    detailOpen = false;
  }
});

// Watch for detail panel close
const observer = new MutationObserver(() => {
  const panel = document.getElementById('detail-panel');
  if (panel.classList.contains('hidden')) {
    detailOpen = false;
  }
});
observer.observe(document.getElementById('detail-panel'), { attributes: true, attributeFilter: ['class'] });

// ─── Utility ─────────────────────────────────────────────────────────
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Start ───────────────────────────────────────────────────────────
init();
