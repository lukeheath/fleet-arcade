// Fleet formation system - ships grouped by team flying at any angle

import { getShipScale } from './ships.js';

export class FleetFormation {
  constructor(fleetName, hosts, canvasWidth, canvasHeight) {
    this.name = fleetName;
    this.hosts = hosts;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;

    // True heading angle in radians — any direction
    this.heading = Math.random() * Math.PI * 2;
    this.speed = 25 + Math.random() * 35;

    // Turning: some formations fly straight, others curve
    this.initTurning();

    // Start off-screen, behind the direction they're heading
    this.x = 0;
    this.y = 0;
    this.placeOffScreen();

    // Track whether the formation has entered the visible area at least once
    // (prevents the off-screen wrap from firing before they arrive)
    this.hasEntered = false;

    // Label display
    this.labelAlpha = 0;

    // Visibility: smooth transition between full and stealthed
    this.displayAlpha = 1;
    this.targetAlpha = 1;

    // Calculate formation positions for each ship
    this.shipEntities = this.arrangeFormation(hosts);
  }

  initTurning() {
    // Turn rate oscillates over time via layered sine waves
    // so each formation smoothly alternates between left turns, straight, and right turns
    this.turnSeed = Math.random() * 100;
    this.turnStrength = 0.03 + Math.random() * 0.06; // gentle turns only

    // Subtle speed oscillation so paths feel more organic
    this.speedPhase = Math.random() * Math.PI * 2;
    this.speedVariation = Math.random() * 8;
  }

  getTurnRate(time) {
    // Layer two sine waves at different frequencies for non-repeating feel
    const t = time + this.turnSeed;
    return this.turnStrength * (
      Math.sin(t * 0.15) * 0.6 +
      Math.sin(t * 0.37 + 2.0) * 0.4
    );
  }

  // Place the formation just off-screen on the opposite side of its heading
  placeOffScreen(extraDist = 0) {
    // Project backward from a random point on screen
    const enterX = Math.random() * this.canvasWidth;
    const enterY = Math.random() * this.canvasHeight;
    // Place just far enough back to be off-screen, plus the extra stagger
    const dist = 150 + extraDist;
    const backAngle = this.heading + Math.PI;
    this.x = enterX + Math.cos(backAngle) * dist;
    this.y = enterY + Math.sin(backAngle) * dist;
  }

  arrangeFormation(hosts) {
    const entities = [];
    const count = hosts.length;
    if (count === 0) return entities;

    const sorted = [...hosts].sort((a, b) => {
      if (a.status !== b.status) return a.status === 'online' ? -1 : 1;
      return (b.issues?.total_issues_count || 0) - (a.issues?.total_issues_count || 0);
    });

    if (count <= 12) {
      // V-formation with generous spacing
      const spacing = 48;

      for (let idx = 0; idx < sorted.length; idx++) {
        let ox, oy;
        if (idx === 0) {
          ox = 0;
          oy = 0;
        } else {
          const wingPos = Math.ceil(idx / 2);
          const side = idx % 2 === 1 ? -1 : 1;
          ox = -wingPos * spacing;
          oy = side * wingPos * spacing * 0.65;
        }
        entities.push(createShipEntity(sorted[idx], ox, oy));
      }
    } else {
      // Loose grid for large groups
      const cols = Math.ceil(Math.sqrt(count * 1.2));
      const spacing = 44;

      sorted.forEach((host, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const totalRows = Math.ceil(count / cols);

        let ox = -col * spacing;
        const oy = (row - (totalRows - 1) / 2) * spacing;
        // Stagger even rows
        if (row % 2 === 1) ox -= spacing * 0.4;
        // Add a little random scatter to break up the grid feel
        ox += (Math.random() - 0.5) * 10;
        const oyScattered = oy + (Math.random() - 0.5) * 10;

        entities.push(createShipEntity(host, ox, oyScattered));
      });
    }

    return entities;
  }

  resize(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
  }

  update(dt, time) {
    // Smoothly transition display alpha toward target
    const alphaSpeed = 3; // ~0.3s transition
    if (this.displayAlpha < this.targetAlpha) {
      this.displayAlpha = Math.min(this.targetAlpha, this.displayAlpha + alphaSpeed * dt);
    } else if (this.displayAlpha > this.targetAlpha) {
      this.displayAlpha = Math.max(this.targetAlpha, this.displayAlpha - alphaSpeed * dt);
    }

    // Turn rate varies over time — curves left, straightens, curves right
    this.heading += this.getTurnRate(time) * dt;

    // Vary speed slightly over time
    this.speedPhase += dt * 0.5;
    const currentSpeed = this.speed + Math.sin(this.speedPhase) * this.speedVariation;

    // Move along heading
    this.x += Math.cos(this.heading) * currentSpeed * dt;
    this.y += Math.sin(this.heading) * currentSpeed * dt;

    // Check if formation center is within the visible area (with padding)
    const pad = 100;
    const isVisible = this.x > -pad && this.x < this.canvasWidth + pad
                   && this.y > -pad && this.y < this.canvasHeight + pad;
    if (isVisible) this.hasEntered = true;

    // Only wrap once the formation has entered and then fully left
    if (this.hasEntered) {
      const margin = this.getFormationRadius() + 200;
      const outLeft = this.x < -margin;
      const outRight = this.x > this.canvasWidth + margin;
      const outTop = this.y < -margin;
      const outBottom = this.y > this.canvasHeight + margin;

      if (outLeft || outRight || outTop || outBottom) {
        this.heading = Math.random() * Math.PI * 2;
        this.speed = 25 + Math.random() * 35;
        this.initTurning();
        this.placeOffScreen(Math.random() * 400);
        this.hasEntered = false;
      }
    }

    // Update individual ship movements — this is where the organic feel comes from
    for (const entity of this.shipEntities) {
      // Phase advances at different rates per ship
      entity.driftPhase += entity.driftSpeed * dt;

      // Wander: smooth perlin-like wandering around formation slot
      const wanderX = Math.sin(entity.driftPhase * 0.8 + entity.wanderSeed) * entity.wanderRadius
                     + Math.sin(entity.driftPhase * 0.3 + entity.wanderSeed * 2.7) * entity.wanderRadius * 0.5;
      const wanderY = Math.cos(entity.driftPhase * 0.6 + entity.wanderSeed * 1.3) * entity.wanderRadius
                     + Math.cos(entity.driftPhase * 0.25 + entity.wanderSeed * 3.1) * entity.wanderRadius * 0.4;

      // Stray behavior: occasionally a ship drifts far out then comes back
      entity.strayTimer += dt;
      let strayX = 0;
      let strayY = 0;
      if (entity.strayTimer > entity.nextStrayTime) {
        // Straying phase
        const strayProgress = (entity.strayTimer - entity.nextStrayTime) / entity.strayDuration;
        if (strayProgress < 1) {
          // Smooth out-and-back: sine curve peaks at 0.5
          const strayAmount = Math.sin(strayProgress * Math.PI) * entity.strayDistance;
          strayX = Math.cos(entity.strayAngle) * strayAmount;
          strayY = Math.sin(entity.strayAngle) * strayAmount;
        } else {
          // Done straying — schedule next stray
          entity.strayTimer = 0;
          entity.nextStrayTime = 8 + Math.random() * 25;
          entity.strayDuration = 3 + Math.random() * 5;
          entity.strayDistance = 15 + Math.random() * 40;
          entity.strayAngle = Math.random() * Math.PI * 2;
        }
      }

      entity.currentX = entity.offsetX + wanderX + strayX;
      entity.currentY = entity.offsetY + wanderY + strayY;
    }

    // Label visibility
    const onScreen = this.x > -100 && this.x < this.canvasWidth + 100
                  && this.y > -100 && this.y < this.canvasHeight + 100;
    this.labelAlpha += (onScreen ? 1 : -1) * dt * 2;
    this.labelAlpha = Math.max(0, Math.min(1, this.labelAlpha));
  }

  getFormationRadius() {
    if (this.shipEntities.length === 0) return 100;
    let maxDist = 0;
    for (const e of this.shipEntities) {
      const d = Math.sqrt(e.offsetX * e.offsetX + e.offsetY * e.offsetY);
      if (d > maxDist) maxDist = d;
    }
    return maxDist + 40;
  }

  getShipWorldPositions() {
    // Rotate local formation coords by heading so the V always points forward
    const cosH = Math.cos(this.heading);
    const sinH = Math.sin(this.heading);
    return this.shipEntities.map((e) => ({
      x: this.x + e.currentX * cosH - e.currentY * sinH,
      y: this.y + e.currentX * sinH + e.currentY * cosH,
      host: e.host,
      entity: e,
    }));
  }
}

function createShipEntity(host, offsetX, offsetY) {
  return {
    host,
    offsetX,
    offsetY,
    currentX: offsetX,
    currentY: offsetY,

    // Wandering
    driftPhase: Math.random() * Math.PI * 2,
    driftSpeed: 0.4 + Math.random() * 0.8,
    wanderSeed: Math.random() * 100,
    wanderRadius: 6 + Math.random() * 12, // how far they wander from slot

    // Occasional straying
    strayTimer: Math.random() * 15, // offset so they don't all stray at once
    nextStrayTime: 8 + Math.random() * 25,
    strayDuration: 3 + Math.random() * 5,
    strayDistance: 15 + Math.random() * 40,
    strayAngle: Math.random() * Math.PI * 2,

    scale: getShipScale(host.platform),
  };
}
