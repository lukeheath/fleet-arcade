// Multi-layer parallax starfield

const STAR_LAYERS = [
  { count: 200, speed: 0.15, sizeMin: 0.3, sizeMax: 0.8, opacity: 0.4 },
  { count: 120, speed: 0.4, sizeMin: 0.5, sizeMax: 1.2, opacity: 0.6 },
  { count: 60, speed: 0.8, sizeMin: 1.0, sizeMax: 2.0, opacity: 0.85 },
];

export class Starfield {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.layers = STAR_LAYERS.map((layer) => ({
      ...layer,
      stars: this.generateStars(layer.count, layer.sizeMin, layer.sizeMax),
    }));
    // Occasional nebula clouds
    this.nebulae = this.generateNebulae(5);
  }

  generateStars(count, sizeMin, sizeMax) {
    const stars = [];
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: sizeMin + Math.random() * (sizeMax - sizeMin),
        twinkle: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.5 + Math.random() * 2,
        hue: Math.random() > 0.85 ? (Math.random() > 0.5 ? 200 : 30) : 0,
      });
    }
    return stars;
  }

  generateNebulae(count) {
    const nebulae = [];
    for (let i = 0; i < count; i++) {
      nebulae.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        radius: 80 + Math.random() * 200,
        hue: [200, 280, 320, 180, 260][Math.floor(Math.random() * 5)],
        opacity: 0.02 + Math.random() * 0.04,
        speed: 0.05 + Math.random() * 0.1,
      });
    }
    return nebulae;
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
  }

  update(dt) {
    // Stars stay fixed (static camera) — only twinkle animates
    for (const layer of this.layers) {
      for (const star of layer.stars) {
        star.twinkle += star.twinkleSpeed * dt;
      }
    }
  }

  draw(ctx) {
    // Nebulae
    for (const neb of this.nebulae) {
      const grad = ctx.createRadialGradient(neb.x, neb.y, 0, neb.x, neb.y, neb.radius);
      grad.addColorStop(0, `hsla(${neb.hue}, 80%, 40%, ${neb.opacity})`);
      grad.addColorStop(0.5, `hsla(${neb.hue}, 60%, 30%, ${neb.opacity * 0.5})`);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(neb.x - neb.radius, neb.y - neb.radius, neb.radius * 2, neb.radius * 2);
    }

    // Stars
    for (const layer of this.layers) {
      for (const star of layer.stars) {
        const twinkle = 0.5 + 0.5 * Math.sin(star.twinkle);
        const alpha = layer.opacity * (0.6 + 0.4 * twinkle);

        if (star.hue > 0) {
          ctx.fillStyle = `hsla(${star.hue}, 70%, 80%, ${alpha})`;
        } else {
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        }

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size * (0.85 + 0.15 * twinkle), 0, Math.PI * 2);
        ctx.fill();

        // Glow on brighter stars
        if (star.size > 1.2) {
          ctx.fillStyle = star.hue > 0
            ? `hsla(${star.hue}, 70%, 80%, ${alpha * 0.15})`
            : `rgba(255, 255, 255, ${alpha * 0.15})`;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size * 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }
}
