/**
 * SmokeEffect — world-anchored smoke cloud drawn on the 2D canvas overlay.
 * Particles live in world space and are re-projected each frame so the effect
 * stays locked to the destroy position regardless of camera movement.
 *
 * Usage:
 *   const fx = new SmokeEffect(wx, wy, wz, renderer);
 *   // each frame inside world._onAfterRender:
 *   fx.update(ctx);
 *   // discard when: !fx.alive
 */
export class SmokeEffect {

    /**
     * @param {number} wx        - World-space X of the origin
     * @param {number} wy        - World-space Y of the origin
     * @param {number} wz        - World-space Z of the origin
     * @param {object} renderer  - Renderer instance
     * @param {object} [options]
     * @param {number} [options.count]   - Number of smoke puffs (default 18)
     */
    constructor(wx, wy, wz, renderer, options = {}) {
        this.renderer  = renderer;
        this.life      = 110;
        this.maxLife   = 110;
        this._originX  = wx;
        this._originY  = wy;
        this._originZ  = wz;
        this._visCheck = options.visibilityCheck ?? null;

        // Pre-load the smoke sprite once per effect instance
        this._img = new Image();
        this._img.src = '/images/Smoke10.png';

        const count = options.count ?? 84;

        this._particles = Array.from({ length: count }, () => {
            const angle  = Math.random() * Math.PI * 2;
            const hSpeed = 0.008 + Math.random() * 0.022;
            return {
                wx, wy, wz,
                vx: Math.sin(angle) * hSpeed,
                vy: 0.018 + Math.random() * 0.028,
                vz: Math.cos(angle) * hSpeed,
                baseSize:   5 + Math.random() * 8,
                growRate:   1.4 + Math.random() * 1.6,   // ~3× faster than before
                rotation:   Math.random() * Math.PI * 2,
                spinSpeed:  (Math.random() < 0.5 ? 1 : -1) * (0.06 + Math.random() * 0.10),
                spawnDelay: Math.floor(Math.random() * 25),
            };
        });
    }

    get alive() { return this.life > 0; }

    update(ctx) {
        if (this.life <= 0) return;

        // Skip drawing if a wall is occluding the origin, but still advance life
        if (this._visCheck && !this._visCheck(this._originX, this._originY, this._originZ)) {
            this.life--;
            return;
        }

        const age = this.maxLife - this.life;

        if (!this._img.complete || !this._img.naturalWidth) {
            this.life--;
            return;
        }

        ctx.save();

        this._particles.forEach(p => {
            if (age < p.spawnDelay) return;

            p.wx += p.vx;
            p.wy += p.vy;
            p.wz += p.vz;
            p.vy -= 0.00025;
            p.rotation += p.spinSpeed;

            const cam = this.renderer.worldToCamera(p.wx, p.wy, p.wz);
            if (cam.z <= 0) return;
            const screen = this.renderer.project3DTo2D(cam.x, cam.y, cam.z);
            if (!screen) return;

            const activeAge = age - p.spawnDelay;
            const distScale = 5.0 / Math.max(cam.z, 0.5);   // ref dist 5 units → scale 1
            const half = (p.baseSize + p.growRate * activeAge) * 0.5 * distScale;
            if (half < 0.3) return;

            const maxHalf   = (p.baseSize + p.growRate * (this.maxLife - p.spawnDelay)) * 0.5;
            const sizeRatio = half / maxHalf;
            const fadeIn    = Math.min(1, activeAge / 6);
            ctx.globalAlpha = 0.55 * fadeIn * (1 - sizeRatio);

            ctx.save();
            ctx.translate(screen.x, screen.y);
            ctx.rotate(p.rotation);
            ctx.drawImage(this._img, -half, -half, half * 2, half * 2);
            ctx.restore();
        });

        ctx.restore();
        this.life--;
    }
}
