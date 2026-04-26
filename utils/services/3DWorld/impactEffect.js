/**
 * ImpactEffect — world-anchored particle fountain drawn on the 2D canvas overlay.
 * Each particle lives in world space and is re-projected to screen every frame,
 * so moving the camera doesn't cause particles to drift away from the surface.
 *
 * Usage:
 *   const fx = new ImpactEffect(wx, wy, wz, renderer, color);
 *   // each frame inside world._onAfterRender:
 *   fx.update(ctx);
 *   // discard when: !fx.alive
 */
export class ImpactEffect {

    /**
     * @param {number} wx        - World-space X of the impact
     * @param {number} wy        - World-space Y of the impact
     * @param {number} wz        - World-space Z of the impact
     * @param {object} renderer  - Renderer instance
     * @param {string} [color]   - Particle color (should match the hit surface)
     */
    constructor(wx, wy, wz, renderer, color = '#ffcc00') {
        this.renderer = renderer;
        this.color    = color;
        this.life     = 55;
        this.maxLife  = 55;

        // Spawn particles in world space — burst upward with wide scatter
        this._particles = Array.from({ length: 22 }, () => {
            const angle = (Math.random() - 0.5) * Math.PI * 1.6; // horizontal spread
            const speed = 0.04 + Math.random() * 0.09;
            return {
                wx: wx,
                wy: wy,
                wz: wz,
                vx: Math.sin(angle) * speed,
                vy: 0.06 + Math.random() * 0.08,  // upward in world Y
                vz: Math.cos(angle) * speed,
                size: 2.5 + Math.random() * 3,
            };
        });
    }

    get alive() { return this.life > 0; }

    update(ctx) {
        if (this.life <= 0) return;

        const alpha = this.life / this.maxLife;

        ctx.save();
        ctx.fillStyle = this.color;
        ctx.globalAlpha = alpha;

        this._particles.forEach(p => {
            // Advance world-space position
            p.wx += p.vx;
            p.wy += p.vy;
            p.wz += p.vz;
            p.vy -= 0.006; // gravity in world Y

            // Project to screen this frame
            const cam = this.renderer.worldToCamera(p.wx, p.wy, p.wz);
            if (cam.z <= 0) return;
            const screen = this.renderer.project3DTo2D(cam.x, cam.y, cam.z);
            if (!screen) return;

            const r = p.size * alpha;
            if (r < 0.2) return;
            ctx.beginPath();
            ctx.arc(screen.x, screen.y, r, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.restore();
        this.life--;
    }
}

