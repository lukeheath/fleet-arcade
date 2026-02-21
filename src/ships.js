// Ship designs and rendering for different platform types

// Fleet/team color palette
const FLEET_COLORS = {
  '💻 Workstations': { primary: '#00ffff', secondary: '#0088aa', engine: '#00ffff' },
  '🧪 Testing & QA': { primary: '#ff00ff', secondary: '#880088', engine: '#ff66ff' },
  '📱🔐 Personal mobile devices': { primary: '#ffff00', secondary: '#888800', engine: '#ffff66' },
  '📱🏢 Employee-issued mobile devices': { primary: '#ff8800', secondary: '#884400', engine: '#ffaa44' },
  '☁️ IT servers': { primary: '#4488ff', secondary: '#224488', engine: '#66aaff' },
  'No team': { primary: '#888888', secondary: '#444444', engine: '#aaaaaa' },
};

const DEFAULT_FLEET_COLOR = { primary: '#39ff14', secondary: '#1a8809', engine: '#66ff44' };

// Platform to ship type mapping
const PLATFORM_SHIPS = {
  darwin: 'fighter',      // Sleek Mac fighter
  windows: 'cruiser',     // Bulky Windows cruiser
  ubuntu: 'stealth',      // Angular Linux stealth
  rhel: 'stealth',
  amzn: 'stealth',
  chrome: 'drone',        // Small Chromebook drone
  ios: 'interceptor',     // Swift iOS interceptor
  ipados: 'interceptor',
  android: 'scout',       // Android scout
};

export function getFleetColor(fleetName) {
  return FLEET_COLORS[fleetName] || DEFAULT_FLEET_COLOR;
}

export function getShipType(platform) {
  return PLATFORM_SHIPS[platform] || 'fighter';
}

export function getShipScale(platform) {
  switch (getShipType(platform)) {
    case 'cruiser': return 0.85;
    case 'fighter': return 0.7;
    case 'stealth': return 0.75;
    case 'interceptor': return 0.6;
    case 'scout': return 0.65;
    case 'drone': return 0.45;
    default: return 0.7;
  }
}

export function drawShip(ctx, x, y, host, time, heading = 0) {
  const type = getShipType(host.platform);
  const colors = getFleetColor(host.fleet_name || host.team_name || 'No team');
  const isOnline = host.status === 'online';
  const scale = getShipScale(host.platform);
  const issues = host.issues?.total_issues_count || 0;

  ctx.save();
  ctx.translate(x, y);
  // Rotate to face the direction of travel
  ctx.rotate(heading);
  ctx.scale(scale, scale);

  // Offline ships are dimmer (multiply, don't override)
  if (!isOnline) {
    ctx.globalAlpha *= 0.45;
  }

  // Draw based on ship type
  switch (type) {
    case 'fighter': drawFighter(ctx, colors, isOnline, time); break;
    case 'cruiser': drawCruiser(ctx, colors, isOnline, time); break;
    case 'stealth': drawStealth(ctx, colors, isOnline, time); break;
    case 'interceptor': drawInterceptor(ctx, colors, isOnline, time); break;
    case 'scout': drawScout(ctx, colors, isOnline, time); break;
    case 'drone': drawDrone(ctx, colors, isOnline, time); break;
  }

  // Draw damage/warning indicators for issues
  if (issues > 0 && isOnline) {
    drawIssueIndicators(ctx, issues, host.issues?.critical_vulnerabilities_count || 0, time);
  }

  ctx.restore();
}

function drawEngine(ctx, x, y, color, isOnline, time, size = 1) {
  if (!isOnline) return;
  const flicker = 0.7 + 0.3 * Math.sin(time * 8 + x);
  const len = (8 + 4 * Math.sin(time * 12)) * size;

  ctx.save();
  ctx.globalAlpha *= flicker;

  // Engine flame
  const grad = ctx.createLinearGradient(x, y, x - len, y);
  grad.addColorStop(0, color);
  grad.addColorStop(0.3, color);
  grad.addColorStop(1, 'transparent');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(x, y - 2 * size);
  ctx.lineTo(x - len, y);
  ctx.lineTo(x, y + 2 * size);
  ctx.fill();

  // Engine glow
  ctx.fillStyle = color;
  ctx.globalAlpha *= 0.3;
  ctx.beginPath();
  ctx.arc(x, y, 4 * size, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawFighter(ctx, colors, isOnline, time) {
  // Sleek arrowhead design
  ctx.strokeStyle = colors.primary;
  ctx.fillStyle = colors.secondary;
  ctx.lineWidth = 1.5;

  // Main body
  ctx.beginPath();
  ctx.moveTo(18, 0);
  ctx.lineTo(-6, -10);
  ctx.lineTo(-12, -8);
  ctx.lineTo(-8, 0);
  ctx.lineTo(-12, 8);
  ctx.lineTo(-6, 10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Cockpit
  ctx.save();
  ctx.fillStyle = colors.primary;
  ctx.globalAlpha = ctx.globalAlpha * 0.6;
  ctx.beginPath();
  ctx.ellipse(6, 0, 5, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Wings accent
  ctx.strokeStyle = colors.primary;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(4, -3);
  ctx.lineTo(-6, -10);
  ctx.moveTo(4, 3);
  ctx.lineTo(-6, 10);
  ctx.stroke();

  // Engines
  drawEngine(ctx, -12, -5, colors.engine, isOnline, time);
  drawEngine(ctx, -12, 5, colors.engine, isOnline, time);
}

function drawCruiser(ctx, colors, isOnline, time) {
  // Heavier, wider design
  ctx.strokeStyle = colors.primary;
  ctx.fillStyle = colors.secondary;
  ctx.lineWidth = 1.5;

  // Main hull
  ctx.beginPath();
  ctx.moveTo(16, 0);
  ctx.lineTo(8, -6);
  ctx.lineTo(-4, -8);
  ctx.lineTo(-14, -12);
  ctx.lineTo(-16, -10);
  ctx.lineTo(-14, 0);
  ctx.lineTo(-16, 10);
  ctx.lineTo(-14, 12);
  ctx.lineTo(-4, 8);
  ctx.lineTo(8, 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Bridge
  ctx.save();
  ctx.fillStyle = colors.primary;
  ctx.globalAlpha = ctx.globalAlpha * 0.5;
  ctx.fillRect(2, -3, 8, 6);
  ctx.restore();

  // Side panels
  ctx.strokeStyle = colors.primary;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(-4, -8);
  ctx.lineTo(-4, -14);
  ctx.lineTo(-10, -14);
  ctx.lineTo(-14, -12);
  ctx.moveTo(-4, 8);
  ctx.lineTo(-4, 14);
  ctx.lineTo(-10, 14);
  ctx.lineTo(-14, 12);
  ctx.stroke();

  // Engines (3)
  drawEngine(ctx, -16, -10, colors.engine, isOnline, time, 0.8);
  drawEngine(ctx, -14, 0, colors.engine, isOnline, time, 1.2);
  drawEngine(ctx, -16, 10, colors.engine, isOnline, time, 0.8);
}

function drawStealth(ctx, colors, isOnline, time) {
  // Angular stealth design
  ctx.strokeStyle = colors.primary;
  ctx.fillStyle = colors.secondary;
  ctx.lineWidth = 1.5;

  ctx.beginPath();
  ctx.moveTo(16, 0);
  ctx.lineTo(0, -12);
  ctx.lineTo(-12, -10);
  ctx.lineTo(-10, 0);
  ctx.lineTo(-12, 10);
  ctx.lineTo(0, 12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Angular accent lines
  ctx.strokeStyle = colors.primary;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(16, 0);
  ctx.lineTo(-2, 0);
  ctx.moveTo(6, -5);
  ctx.lineTo(-6, -8);
  ctx.moveTo(6, 5);
  ctx.lineTo(-6, 8);
  ctx.stroke();

  drawEngine(ctx, -12, -5, colors.engine, isOnline, time, 0.7);
  drawEngine(ctx, -12, 5, colors.engine, isOnline, time, 0.7);
}

function drawInterceptor(ctx, colors, isOnline, time) {
  // Small, swift design
  ctx.strokeStyle = colors.primary;
  ctx.fillStyle = colors.secondary;
  ctx.lineWidth = 1.2;

  ctx.beginPath();
  ctx.moveTo(12, 0);
  ctx.lineTo(2, -6);
  ctx.lineTo(-8, -4);
  ctx.lineTo(-6, 0);
  ctx.lineTo(-8, 4);
  ctx.lineTo(2, 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Cockpit dot
  ctx.fillStyle = colors.primary;
  ctx.beginPath();
  ctx.arc(4, 0, 2, 0, Math.PI * 2);
  ctx.fill();

  drawEngine(ctx, -8, 0, colors.engine, isOnline, time, 0.6);
}

function drawScout(ctx, colors, isOnline, time) {
  // Round scout
  ctx.strokeStyle = colors.primary;
  ctx.fillStyle = colors.secondary;
  ctx.lineWidth = 1.2;

  ctx.beginPath();
  ctx.moveTo(10, 0);
  ctx.lineTo(4, -7);
  ctx.lineTo(-6, -6);
  ctx.lineTo(-8, 0);
  ctx.lineTo(-6, 6);
  ctx.lineTo(4, 7);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Antenna
  ctx.beginPath();
  ctx.moveTo(4, -7);
  ctx.lineTo(6, -11);
  ctx.stroke();
  ctx.fillStyle = colors.primary;
  ctx.beginPath();
  ctx.arc(6, -11, 1, 0, Math.PI * 2);
  ctx.fill();

  drawEngine(ctx, -8, 0, colors.engine, isOnline, time, 0.5);
}

function drawDrone(ctx, colors, isOnline, time) {
  // Tiny drone
  ctx.strokeStyle = colors.primary;
  ctx.fillStyle = colors.secondary;
  ctx.lineWidth = 1;

  // Hexagonal body
  ctx.beginPath();
  ctx.moveTo(8, 0);
  ctx.lineTo(4, -6);
  ctx.lineTo(-4, -6);
  ctx.lineTo(-8, 0);
  ctx.lineTo(-4, 6);
  ctx.lineTo(4, 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Center light
  ctx.save();
  const pulse = 0.5 + 0.5 * Math.sin(time * 4);
  ctx.fillStyle = colors.primary;
  ctx.globalAlpha = ctx.globalAlpha * pulse;
  ctx.beginPath();
  ctx.arc(0, 0, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  drawEngine(ctx, -8, 0, colors.engine, isOnline, time, 0.4);
}

function drawIssueIndicators(ctx, totalIssues, criticalVulns, time) {
  // Red warning sparks for critical vulns
  if (criticalVulns > 0) {
    const intensity = Math.min(criticalVulns / 20, 1);
    const pulse = 0.5 + 0.5 * Math.sin(time * 6);

    ctx.fillStyle = `rgba(255, 50, 50, ${0.3 * intensity * pulse})`;
    ctx.beginPath();
    ctx.arc(0, 0, 20 + intensity * 10, 0, Math.PI * 2);
    ctx.fill();

    // Spark particles
    const sparkCount = Math.min(Math.floor(criticalVulns / 5) + 1, 4);
    for (let i = 0; i < sparkCount; i++) {
      const angle = time * 3 + (i * Math.PI * 2) / sparkCount;
      const dist = 12 + 4 * Math.sin(time * 5 + i);
      const sx = Math.cos(angle) * dist;
      const sy = Math.sin(angle) * dist;
      ctx.fillStyle = `rgba(255, ${100 + Math.random() * 100}, 50, ${0.6 * pulse})`;
      ctx.beginPath();
      ctx.arc(sx, sy, 1 + Math.random(), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Yellow triangle warning for failing policies
  if (totalIssues > criticalVulns && totalIssues > 0) {
    const blink = Math.sin(time * 4) > 0.3 ? 1 : 0;
    if (blink) {
      ctx.fillStyle = 'rgba(255, 255, 0, 0.7)';
      ctx.beginPath();
      ctx.moveTo(-18, -4);
      ctx.lineTo(-15, -9);
      ctx.lineTo(-12, -4);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#000';
      ctx.font = '5px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', -15, -5);
    }
  }
}

// Get the hit radius for click detection
export function getShipHitRadius(platform) {
  return getShipScale(platform) * 18;
}
