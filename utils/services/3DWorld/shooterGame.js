import { Explosion } from './explosion';
import { ImpactEffect } from './impactEffect';
import { ShapeFactory } from './shapeFactory';

export const TOTAL_TARGETS = 13; // 8 bottles + 5 orbs

/**
 * ShooterGame — encapsulates all game logic for the shooter page.
 * Handles level building, target management, shooting, effects, and gun overlay.
 *
 * Usage:
 *   const game = new ShooterGame(world, canvas, controller, { onScore, onGameOver });
 *   game.build();   // populate world with level + targets
 *   game.start();   // attach click handler + render hooks
 *   // ... world.start() ...
 *   game.stop();    // cleanup (call on unmount)
 */
export class ShooterGame {
    /**
     * @param {object} world        - World instance
     * @param {HTMLCanvasElement} canvas
     * @param {object} controller   - FirstPersonController instance
     * @param {object} options
     * @param {function} options.onScore    - called with new score (number) when a target is hit
     * @param {function} options.onGameOver - called when all targets are eliminated
     */
    constructor(world, canvas, controller, { onScore, onGameOver, onPlayerHit, onPlayerDead }) {
        this._world      = world;
        this._canvas     = canvas;
        this._controller = controller;
        this._shapes     = new ShapeFactory();

        this._onScore    = onScore;
        this._onGameOver = onGameOver;

        this._gameOver  = false;
        this._score     = 0;
        this._targets   = [];
        this._boxMeshes = [];
        this._explosions = [];
        this._impacts    = [];
        this._ladders    = [];
        this._floors     = [];

        this._handleShoot = this._handleShoot.bind(this);
        this._shotAudio = null;
        this._glassAudio = null;
        this._boxHitAudio = null;
        this._flashFrames = 0; // countdown frames for muzzle flash

        this._orbs = [];
        this._sniperOrbs = [];
        this._playerHealth = 5;
        this._dirChangeInterval = null;
        this._sniperFireInterval = null;
        this._onPlayerHit = onPlayerHit ?? null;
        this._onPlayerDead = onPlayerDead ?? null;
    }

    /** Populate the world: ground + level + targets. Call before start(). */
    build() {
        this._world.add(this._shapes.ground(50), '#ccc', true);
        this._buildLevel();
        this._buildTargets();
        this._buildOrbs();
        this._buildSniperOrbs();
        this._controller.setLadders(this._ladders);
        this._controller.setFloors(this._floors);
    }

    /** Hook into world render loop and attach click listener. */
    start() {
        this._world._onBeforeRender = () => {
            this._controller.update();
            this._targets.forEach(t => { if (t.alive) this._rotateY(t.mesh, t.cx, t.cz, 1.5); });
            this._explosions.forEach(e => e.update());
            this._explosions = this._explosions.filter(e => e.alive);
            this._updateOrbs();
            this._updateSniperOrbs();
        };

        this._dirChangeInterval = setInterval(() => this._randomizeOrbVelocities(), 3000);
        this._sniperFireInterval = setInterval(() => this._fireSnipers(), 5000);

        this._world._onAfterRender = (ctx) => {
            this._impacts.forEach(fx => fx.update(ctx));
            this._impacts = this._impacts.filter(fx => fx.alive);
            if (!this._gameOver) this._drawTargetHints(ctx);
            if (!this._gameOver) this._drawSniperOrbIndicators(ctx);
            this._drawSniperOrbGlows(ctx);
            if (!this._gameOver) this._drawGun(ctx);
            if (this._flashFrames > 0) {
                this._drawMuzzleFlash(ctx);
                this._flashFrames--;
            }
            this._drawHealthBar(ctx);
        };

        this._canvas.addEventListener('click', this._handleShoot);
        this._shotAudio = new Audio('/sounds/shot.wav');
        this._shotAudio.load();
        this._glassAudio = new Audio('/sounds/glasshit.mp3');
        this._glassAudio.load();
        this._boxHitAudio = new Audio('/sounds/boxhit.wav');
        this._boxHitAudio.load();
    }

    /** Remove event listeners. Call on unmount. */
    stop() {
        this._canvas.removeEventListener('click', this._handleShoot);
        if (this._dirChangeInterval) clearInterval(this._dirChangeInterval);
        if (this._sniperFireInterval) clearInterval(this._sniperFireInterval);
    }

    // ── Private: level ────────────────────────────────────────────────────────

    _buildLevel() {
        const cc = ['#8b6914', '#6b4a10', '#a0522d', '#cd853f', '#7b5426'];

        const addCube = (cx, baseY, cz, ci = 0) => {
            const m = this._shapes.box(cx, baseY, cz, 1, 1, 1);
            this._world.add(m, cc[ci % cc.length]);
            this._boxMeshes.push(m);
        };

        // addWall(wx, wz, w, d, h, ci) — wx/wz = min-x/min-z corner of the stack
        const addWall = (wx, wz, w, d, h, ci = 0) => {
            for (let ix = 0; ix < w; ix++)
                for (let iz = 0; iz < d; iz++)
                    for (let iy = 0; iy < h; iy++)
                        addCube(wx + ix + 0.5, iy, wz + iz + 0.5, ci);
            this._addLadder(wx + w / 2, wz, h);
            this._floors.push({ minX: wx, maxX: wx + w, minZ: wz, maxZ: wz + d, topY: h });
        };

        // ── Entrance zone ──────────────────────────────────────────────────
        addWall(-20,   0,  1, 1, 2, 0);  // left lone pillar   1×1×2
        addWall( 18,   0,  1, 1, 2, 2);  // right lone pillar  1×1×2
        addWall(-12, -14,  4, 1, 3, 1);  // left EW wall       4×1×3
        addWall(  6, -14,  4, 1, 3, 3);  // right EW wall      4×1×3
        addWall(-18, -22,  2, 1, 2, 4);  // left gap stack     2×1×2
        addWall( 16, -22,  2, 1, 2, 0);  // right gap stack    2×1×2

        // ── Zone 1 ────────────────────────────────────────────────────────
        addWall(-18,  -8,  1, 4, 3, 2);  // long left NS wall  1×4×3
        addWall( 18,  -8,  1, 4, 3, 4);  // long right NS wall 1×4×3
        addWall( -6,  -6,  6, 1, 2, 0);  // center EW shelf    6×1×2
        addWall( -4,  -6,  4, 1, 3, 1);  // staggered row      4×1×3
        addWall(  6,  -8,  1, 1, 5, 3);  // tall skinny pillar 1×1×5
        addWall(-10,  -8,  3, 2, 2, 2);  // left cluster       3×2×2
        addWall( 12,  -4,  2, 3, 3, 4);  // right deep cluster 2×3×3
        addWall( -2,  -4,  1, 1, 2, 1);  // lone center stack  1×1×2

        // ── Zone 2 ────────────────────────────────────────────────────────
        addWall(-20,   2,  3, 1, 2, 0);  // back-left short EW  3×1×2
        addWall( 16,   2,  2, 1, 3, 3);  // back-right short    2×1×3
        addWall( -8,   4,  8, 1, 2, 2);  // wide center EW wall 8×1×2
        addWall( -6,   6,  6, 1, 3, 4);  // staggered row above 6×1×3
        addWall( -4,   8,  4, 1, 2, 1);  // jagged top row      4×1×2
        addWall(-14,   6,  1, 3, 4, 0);  // deep left tall      1×3×4
        addWall( 14,   6,  2, 2, 4, 2);  // deep right cluster  2×2×4
        addWall(  4,   6,  1, 4, 2, 3);  // center NS wall      1×4×2

        // ── Zone 3 / back ─────────────────────────────────────────────────
        addWall(-18,  12,  4, 1, 3, 1);  // back-left EW wall   4×1×3
        addWall( 12,  12,  4, 1, 3, 4);  // back-right EW wall  4×1×3
        addWall( -4,  10,  4, 2, 2, 0);  // back center cluster 4×2×2
        addWall( -4,  16,  2, 1, 3, 2);  // jagged top stack    2×1×3

        // ── Side corridor walls ───────────────────────────────────────────
        addWall(-22,  -8,  1, 5, 2, 3);  // far-left side mid   1×5×2
        addWall( 22,  -8,  1, 5, 2, 1);  // far-right side mid  1×5×2
        addWall(-22,   4,  1, 4, 3, 0);  // far-left side deep  1×4×3
        addWall( 22,   5,  1, 4, 3, 2);  // far-right side deep 1×4×3
    }

    _buildTargets() {
        const defs = [
            { x: -17, z: 20, color: '#22dd44' },
            { x:  17, z: 19, color: '#dd2233' },
            { x: -19, z:  4, color: '#2244dd' },
            { x:  19, z:  5, color: '#ddaa22' },
            { x:  11, z:  5, color: '#dd22dd' },
            { x: -13, z:  8, color: '#22dddd' },
            { x:  17, z:  9, color: '#dddd22' },
            { x: -11, z: 11, color: '#dd6688' },
        ];
        this._targets = defs.map(def => {
            const mesh = this._shapes.bottle(def.x, 1.2, def.z);
            this._world.add(mesh, def.color);
            return { mesh, alive: true, cx: def.x, cz: def.z, color: def.color };
        });
    }

    _buildOrbs() {
        const colors = ['#ff44ff', '#44ffff', '#ffff44', '#ff8844', '#88ff44'];
        this._orbs = colors.map(color => {
            const x = -18 + Math.random() * 36;
            const y = 1.2 + Math.random() * 3.0;
            const z = -18 + Math.random() * 34;
            const mesh = this._shapes.sphere(x, y, z, 0.1, 6, 8);
            this._world.add(mesh, color);
            const speed = 0.04 + Math.random() * 0.03;
            const angle = Math.random() * Math.PI * 2;
            return {
                mesh, alive: true, color,
                x, y, z,
                vx: Math.cos(angle) * speed,
                vy: (Math.random() - 0.5) * 0.02,
                vz: Math.sin(angle) * speed,
            };
        });
    }

    _updateOrbs() {
        const minX = -21, maxX = 21, minZ = -21, maxZ = 19, minY = 1.0, maxY = 4.5;
        this._orbs.forEach(orb => {
            if (!orb.alive) return;
            if (orb.x + orb.vx < minX || orb.x + orb.vx > maxX) orb.vx *= -1;
            if (orb.y + orb.vy < minY || orb.y + orb.vy > maxY) orb.vy *= -1;
            if (orb.z + orb.vz < minZ || orb.z + orb.vz > maxZ) orb.vz *= -1;
            orb.x += orb.vx;
            orb.y += orb.vy;
            orb.z += orb.vz;
            this._translateMesh(orb.mesh, orb.vx, orb.vy, orb.vz);
        });
    }

    _randomizeOrbVelocities() {
        [...this._orbs, ...this._sniperOrbs].forEach(orb => {
            if (!orb.alive) return;
            const speed = 0.04 + Math.random() * 0.03;
            const angle = Math.random() * Math.PI * 2;
            orb.vx = Math.cos(angle) * speed;
            orb.vz = Math.sin(angle) * speed;
            orb.vy = (Math.random() - 0.5) * 0.02;
        });
    }

    _buildSniperOrbs() {
        this._sniperOrbs = ['#ff1111', '#ff6600'].map(glowColor => {
            const x = -15 + Math.random() * 30;
            const y = 1.5 + Math.random() * 2.5;
            const z = -15 + Math.random() * 30;
            const mesh = this._shapes.sphere(x, y, z, 0.1, 6, 8);
            this._world.add(mesh, '#ffffff'); // white sphere
            const speed = 0.03 + Math.random() * 0.02;
            const angle = Math.random() * Math.PI * 2;
            return {
                mesh, alive: true, color: glowColor,
                x, y, z,
                vx: Math.cos(angle) * speed,
                vy: (Math.random() - 0.5) * 0.015,
                vz: Math.sin(angle) * speed,
            };
        });
    }

    _updateSniperOrbs() {
        const minX = -21, maxX = 21, minZ = -21, maxZ = 19, minY = 1.0, maxY = 4.5;
        this._sniperOrbs.forEach(orb => {
            if (!orb.alive) return;
            if (orb.x + orb.vx < minX || orb.x + orb.vx > maxX) orb.vx *= -1;
            if (orb.y + orb.vy < minY || orb.y + orb.vy > maxY) orb.vy *= -1;
            if (orb.z + orb.vz < minZ || orb.z + orb.vz > maxZ) orb.vz *= -1;
            orb.x += orb.vx;
            orb.y += orb.vy;
            orb.z += orb.vz;
            this._translateMesh(orb.mesh, orb.vx, orb.vy, orb.vz);
        });
    }

    _fireSnipers() {
        if (this._gameOver || this._playerHealth <= 0) return;
        this._sniperOrbs.forEach(orb => {
            if (!orb.alive || this._playerHealth <= 0) return;
            if (Math.random() < 0.5) {
                this._playerHealth--;
                if (this._onPlayerHit) this._onPlayerHit(this._playerHealth);
                if (this._playerHealth <= 0) {
                    this._gameOver = true;
                    if (this._onPlayerDead) this._onPlayerDead();
                }
            }
        });
    }

    _addLadder(lx, lz, h) {
        const railColor = '#5C3A1E';
        const rungColor = '#8B5A2B';
        const fz = lz - 0.15; // flush against the wall face
        // Two vertical rails
        this._world.add(this._shapes.box(lx - 0.15, 0, fz, 0.06, h, 0.06), railColor);
        this._world.add(this._shapes.box(lx + 0.15, 0, fz, 0.06, h, 0.06), railColor);
        // Rungs every 0.25 units
        for (let ry = 0.25; ry < h; ry += 0.25) {
            this._world.add(this._shapes.box(lx, ry, fz, 0.36, 0.05, 0.06), rungColor);
        }
        this._ladders.push({ x: lx, z: fz, topY: h });
    }

    // ── Private: per-frame helpers ────────────────────────────────────────────

    _rotateY(mesh, cx, cz, degrees) {
        const rad = degrees * Math.PI / 180;
        const cos = Math.cos(rad), sin = Math.sin(rad);
        mesh.vertices = mesh.vertices.map(({ x, y, z }) => {
            const lx = x - cx, lz = z - cz;
            return { x: cx + lx * cos - lz * sin, y, z: cz + lx * sin + lz * cos };
        });
    }

    _translateMesh(mesh, dx, dy, dz) {
        mesh.vertices = mesh.vertices.map(({ x, y, z }) => ({ x: x + dx, y: y + dy, z: z + dz }));
    }

    // ── Private: shooting ─────────────────────────────────────────────────────

    _handleShoot() {
        if (document.pointerLockElement !== this._canvas) return;
        if (this._shotAudio) {
            this._shotAudio.currentTime = 0;
            this._shotAudio.play().catch(() => {});
        }
        this._flashFrames = 4; // show flash for 4 frames (~66ms)
        const cw = this._canvas.width;
        const ch = this._canvas.height;

        // Check bottles first
        let closest = null, closestDist = 22;
        this._targets.forEach(t => {
            if (!t.alive) return;
            const center = this._world.renderer.getObjectCenter(t.mesh);
            const cam  = this._world.renderer.worldToCamera(center.x, center.y, center.z);
            if (cam.z <= 0) return;
            const proj = this._world.renderer.project3DTo2D(cam.x, cam.y, cam.z);
            if (!proj) return;
            const dx = proj.x - cw / 2, dy = proj.y - ch / 2;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < closestDist) { closest = t; closestDist = dist; }
        });

        if (closest) {
            const center = this._world.renderer.getObjectCenter(closest.mesh);
            closest.alive = false;
            this._world._objects = this._world._objects.filter(o => o.mesh !== closest.mesh);
            this._explosions.push(new Explosion(this._world, center.x, center.y, center.z, closest.color));
            if (this._glassAudio) { this._glassAudio.currentTime = 0; this._glassAudio.play().catch(() => {}); }
            this._score++;
            this._onScore(this._score);
            if (this._score >= TOTAL_TARGETS) {
                this._gameOver = true;
                this._onGameOver();
            }
            return;
        }

        // Check orbs
        let closestOrb = null, closestOrbDist = 30;
        this._orbs.forEach(orb => {
            if (!orb.alive) return;
            const cam = this._world.renderer.worldToCamera(orb.x, orb.y, orb.z);
            if (cam.z <= 0) return;
            const proj = this._world.renderer.project3DTo2D(cam.x, cam.y, cam.z);
            if (!proj) return;
            const dx = proj.x - cw / 2, dy = proj.y - ch / 2;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < closestOrbDist) { closestOrb = orb; closestOrbDist = dist; }
        });
        if (closestOrb) {
            closestOrb.alive = false;
            this._world._objects = this._world._objects.filter(o => o.mesh !== closestOrb.mesh);
            this._explosions.push(new Explosion(this._world, closestOrb.x, closestOrb.y, closestOrb.z, closestOrb.color));
            if (this._glassAudio) { this._glassAudio.currentTime = 0; this._glassAudio.play().catch(() => {}); }
            this._score++;
            this._onScore(this._score);
            if (this._score >= TOTAL_TARGETS) {
                this._gameOver = true;
                this._onGameOver();
            }
            return;
        }

        // Check sniper orbs (killable, not scored)
        let closestSniper = null, closestSniperDist = 30;
        this._sniperOrbs.forEach(orb => {
            if (!orb.alive) return;
            const cam = this._world.renderer.worldToCamera(orb.x, orb.y, orb.z);
            if (cam.z <= 0) return;
            const proj = this._world.renderer.project3DTo2D(cam.x, cam.y, cam.z);
            if (!proj) return;
            const dx = proj.x - cw / 2, dy = proj.y - ch / 2;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < closestSniperDist) { closestSniper = orb; closestSniperDist = dist; }
        });
        if (closestSniper) {
            closestSniper.alive = false;
            this._world._objects = this._world._objects.filter(o => o.mesh !== closestSniper.mesh);
            this._explosions.push(new Explosion(this._world, closestSniper.x, closestSniper.y, closestSniper.z, closestSniper.color));
            if (this._glassAudio) { this._glassAudio.currentTime = 0; this._glassAudio.play().catch(() => {}); }
            return;
        }

        // Check boxes
        let hitBoxDist = 80, hitBoxCenter = null;
        this._boxMeshes.forEach(m => {
            const center = this._world.renderer.getObjectCenter(m);
            const cam  = this._world.renderer.worldToCamera(center.x, center.y, center.z);
            if (cam.z <= 0) return;
            const proj = this._world.renderer.project3DTo2D(cam.x, cam.y, cam.z);
            if (!proj) return;
            const dx = proj.x - cw / 2, dy = proj.y - ch / 2;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < hitBoxDist) { hitBoxDist = dist; hitBoxCenter = center; }
        });
        if (hitBoxCenter) {
            this._impacts.push(new ImpactEffect(
                hitBoxCenter.x, hitBoxCenter.y, hitBoxCenter.z,
                this._world.renderer, '#8b4513'
            ));
            if (this._boxHitAudio) { this._boxHitAudio.currentTime = 0; this._boxHitAudio.play().catch(() => {}); }
        }
    }

    _drawTargetHints(ctx) {
        const cw = this._canvas.width;
        const ch = this._canvas.height;
        const cam = this._world.renderer.camera;
        const yaw = cam.rotation.yaw;

        // Accumulate presence per edge: top=ahead, right=right, bottom=behind, left=left
        const edges = { top: 0, right: 0, bottom: 0, left: 0 };

        const allTargets = [
            ...this._targets.filter(t => t.alive).map(t => ({ x: t.cx, z: t.cz })),
            ...this._orbs.filter(o => o.alive).map(o => ({ x: o.x, z: o.z })),
        ];

        allTargets.forEach(t => {
            const dx = t.x - cam.position.x;
            const dz = t.z - cam.position.z;
            // World angle to target (yaw=0 means facing +Z)
            let worldAngle = Math.atan2(dx, dz) * 180 / Math.PI;
            // Relative angle: positive = right, negative = left
            let rel = worldAngle - yaw;
            // Normalize to -180..180
            while (rel >  180) rel -= 360;
            while (rel < -180) rel += 360;

            if      (rel >= -45  && rel <   45) edges.top    = 1;
            else if (rel >=  45  && rel <  135) edges.right  = 1;
            else if (rel >= -135 && rel <  -45) edges.left   = 1;
            else                                edges.bottom = 1;
        });

        const SIZE = 80; // gradient band thickness
        const COLOR = 'rgba(220,30,30,';

        if (edges.top) {
            const g = ctx.createLinearGradient(0, 0, 0, SIZE);
            g.addColorStop(0,   COLOR + '0.45)');
            g.addColorStop(1,   COLOR + '0)');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, cw, SIZE);
        }
        if (edges.bottom) {
            const g = ctx.createLinearGradient(0, ch, 0, ch - SIZE);
            g.addColorStop(0,   COLOR + '0.45)');
            g.addColorStop(1,   COLOR + '0)');
            ctx.fillStyle = g;
            ctx.fillRect(0, ch - SIZE, cw, SIZE);
        }
        if (edges.right) {
            const g = ctx.createLinearGradient(cw, 0, cw - SIZE, 0);
            g.addColorStop(0,   COLOR + '0.45)');
            g.addColorStop(1,   COLOR + '0)');
            ctx.fillStyle = g;
            ctx.fillRect(cw - SIZE, 0, SIZE, ch);
        }
        if (edges.left) {
            const g = ctx.createLinearGradient(0, 0, SIZE, 0);
            g.addColorStop(0,   COLOR + '0.45)');
            g.addColorStop(1,   COLOR + '0)');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, SIZE, ch);
        }
    }

    _drawSniperOrbGlows(ctx) {
        this._sniperOrbs.forEach(orb => {
            if (!orb.alive) return;
            const cam = this._world.renderer.worldToCamera(orb.x, orb.y, orb.z);
            if (cam.z <= 0) return;
            const proj = this._world.renderer.project3DTo2D(cam.x, cam.y, cam.z);
            if (!proj) return;
            const { x, y } = proj;
            const g = ctx.createRadialGradient(x, y, 0, x, y, 28);
            g.addColorStop(0,   'rgba(255,60,60,0.7)');
            g.addColorStop(0.35,'rgba(255,0,0,0.4)');
            g.addColorStop(1,   'rgba(255,0,0,0)');
            ctx.beginPath();
            ctx.arc(x, y, 28, 0, Math.PI * 2);
            ctx.fillStyle = g;
            ctx.fill();
        });
    }

    _drawSniperOrbIndicators(ctx) {
        const cw = this._canvas.width;
        const ch = this._canvas.height;
        const cam = this._world.renderer.camera;
        const yaw = cam.rotation.yaw;
        const MARGIN = 22;
        const TRI = 14;

        this._sniperOrbs.forEach(orb => {
            if (!orb.alive) return;

            const dx = orb.x - cam.position.x;
            const dz = orb.z - cam.position.z;
            let worldAngle = Math.atan2(dx, dz) * 180 / Math.PI;
            let rel = worldAngle - yaw;
            while (rel >  180) rel -= 360;
            while (rel < -180) rel += 360;

            // Screen direction: rel=0 → top, rel=90 → right, rel=±180 → bottom
            const rad = rel * Math.PI / 180;
            const sx = Math.sin(rad);
            const sy = -Math.cos(rad);

            // Intersection with inset screen boundary
            const hw = cw / 2 - MARGIN;
            const hh = ch / 2 - MARGIN;
            const t = (Math.abs(sx) === 0) ? hh / Math.abs(sy)
                    : (Math.abs(sy) === 0) ? hw / Math.abs(sx)
                    : Math.min(hw / Math.abs(sx), hh / Math.abs(sy));
            const ex = cw / 2 + sx * t;
            const ey = ch / 2 + sy * t;

            // Rotation: tip at (0, TRI) locally points in +y; rotate so it faces screen center
            const rotation = Math.atan2(-sx, -sy);

            ctx.save();
            ctx.translate(ex, ey);
            ctx.rotate(rotation);
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 12;
            ctx.fillStyle = '#ff2020';
            ctx.beginPath();
            ctx.moveTo(0, TRI);               // tip (points inward)
            ctx.lineTo(-TRI * 0.65, -TRI * 0.5);  // base left
            ctx.lineTo( TRI * 0.65, -TRI * 0.5);  // base right
            ctx.closePath();
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.strokeStyle = 'rgba(255,255,255,0.5)';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.restore();
        });
    }

    // ── Private: gun overlay ──────────────────────────────────────────────────

    _drawMuzzleFlash(ctx) {
        const cw = this._canvas.width;
        const ch = this._canvas.height;
        const tipX = cw / 2 + 8;
        const tipY = ch / 2 + 190;
        const alpha = this._flashFrames / 4; // fade out as frames count down

        // Outer glow bloom
        const bloom = ctx.createRadialGradient(tipX, tipY, 0, tipX, tipY, 38);
        bloom.addColorStop(0,   `rgba(255,240,160,${alpha * 0.9})`);
        bloom.addColorStop(0.3, `rgba(255,160,40,${alpha * 0.6})`);
        bloom.addColorStop(1,   `rgba(255,80,0,0)`);
        ctx.beginPath();
        ctx.arc(tipX, tipY, 38, 0, Math.PI * 2);
        ctx.fillStyle = bloom;
        ctx.fill();

        // Bright core
        const core = ctx.createRadialGradient(tipX, tipY, 0, tipX, tipY, 12);
        core.addColorStop(0,   `rgba(255,255,220,${alpha})`);
        core.addColorStop(0.5, `rgba(255,220,80,${alpha * 0.8})`);
        core.addColorStop(1,   `rgba(255,120,0,0)`);
        ctx.beginPath();
        ctx.arc(tipX, tipY, 12, 0, Math.PI * 2);
        ctx.fillStyle = core;
        ctx.fill();

        // 4 spiky rays
        ctx.save();
        ctx.translate(tipX, tipY);
        ctx.globalAlpha = alpha * 0.7;
        for (let i = 0; i < 4; i++) {
            ctx.rotate(Math.PI / 4);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(-3, 28);
            ctx.lineTo(0, 44);
            ctx.lineTo(3, 28);
            ctx.closePath();
            ctx.fillStyle = '#ffdd44';
            ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.restore();
    }

    _drawGun(ctx) {
        const cw = this._canvas.width;
        const ch = this._canvas.height;

        const tipX = cw / 2 + 8;
        const tipY = ch / 2 + 190;
        const endX = cw / 2 + 32;
        const endY = ch * 0.75 + 170;

        const splitT = 0.42;
        const midX = tipX + (endX - tipX) * splitT;
        const midY = tipY + (endY - tipY) * splitT;

        const perpOf = (ax, ay, bx, by, r) => {
            const dx = bx - ax, dy = by - ay;
            const len = Math.sqrt(dx * dx + dy * dy);
            return { px: (-dy / len) * r, py: (dx / len) * r };
        };

        const drawCylinder = (ax, ay, ra, bx, by, rb, stops) => {
            const { px, py } = perpOf(ax, ay, bx, by, 1);
            const mx = (ax + bx) / 2, my = (ay + by) / 2;
            const rMax = Math.max(ra, rb);
            const g = ctx.createLinearGradient(
                mx - px * rMax, my - py * rMax,
                mx + px * rMax, my + py * rMax
            );
            stops.forEach(([t, c]) => g.addColorStop(t, c));
            ctx.beginPath();
            ctx.moveTo(ax + px * ra, ay + py * ra);
            ctx.lineTo(bx + px * rb, by + py * rb);
            ctx.lineTo(bx - px * rb, by - py * rb);
            ctx.lineTo(ax - px * ra, ay - py * ra);
            ctx.closePath();
            ctx.fillStyle = g;
            ctx.fill();
        };

        ctx.save();

        // Barrel (tip → mid)
        drawCylinder(tipX, tipY, 7, midX, midY, 13, [
            [0, '#111'], [0.2, '#777'], [0.45, '#ccc'], [0.65, '#888'], [0.85, '#444'], [1, '#0d0d0d'],
        ]);

        // Gas block bump
        const gbFrac = 0.52;
        const gbX = tipX + (midX - tipX) * gbFrac;
        const gbY = tipY + (midY - tipY) * gbFrac;
        drawCylinder(gbX - 5, gbY - 5, 18, gbX + 5, gbY + 5, 18, [
            [0, '#111'], [0.2, '#555'], [0.5, '#888'], [0.75, '#555'], [1, '#0d0d0d'],
        ]);

        // Picatinny top rail
        const { px: rpx, py: rpy } = perpOf(tipX, tipY, midX, midY, 5);
        ctx.beginPath();
        ctx.moveTo(tipX + rpx, tipY + rpy);
        ctx.lineTo(midX + rpx, midY + rpy);
        ctx.lineTo(midX - rpx, midY - rpy);
        ctx.lineTo(tipX - rpx, tipY - rpy);
        ctx.closePath();
        ctx.fillStyle = '#2a2a2a';
        ctx.fill();
        for (let i = 0; i <= 12; i++) {
            const t = i / 12;
            const rx = tipX + (midX - tipX) * t;
            const ry = tipY + (midY - tipY) * t;
            ctx.beginPath();
            ctx.moveTo(rx + rpx, ry + rpy);
            ctx.lineTo(rx - rpx, ry - rpy);
            ctx.strokeStyle = '#111';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }

        // Handguard (mid → end)
        drawCylinder(midX, midY, 22, endX, endY, 28, [
            [0, '#0d0d0d'], [0.15, '#444'], [0.45, '#777'], [0.7, '#444'], [0.9, '#222'], [1, '#0a0a0a'],
        ]);

        // M-LOK cutout slots
        const { px: hpx, py: hpy } = perpOf(midX, midY, endX, endY, 1);
        for (let i = 1; i <= 5; i++) {
            const t = i / 6;
            const sx = midX + (endX - midX) * t;
            const sy = midY + (endY - midY) * t;
            const slotW = 3.5;
            // left slot
            ctx.beginPath();
            ctx.moveTo(sx + hpx * 10 - hpy * slotW, sy + hpy * 10 + hpx * slotW);
            ctx.lineTo(sx + hpx * 14 - hpy * slotW, sy + hpy * 14 + hpx * slotW);
            ctx.lineTo(sx + hpx * 14 + hpy * slotW, sy + hpy * 14 - hpx * slotW);
            ctx.lineTo(sx + hpx * 10 + hpy * slotW, sy + hpy * 10 - hpx * slotW);
            ctx.closePath();
            ctx.fillStyle = '#060606';
            ctx.fill();
            // right slot
            ctx.beginPath();
            ctx.moveTo(sx - hpx * 10 - hpy * slotW, sy - hpy * 10 + hpx * slotW);
            ctx.lineTo(sx - hpx * 14 - hpy * slotW, sy - hpy * 14 + hpx * slotW);
            ctx.lineTo(sx - hpx * 14 + hpy * slotW, sy - hpy * 14 - hpx * slotW);
            ctx.lineTo(sx - hpx * 10 + hpy * slotW, sy - hpy * 10 - hpx * slotW);
            ctx.closePath();
            ctx.fillStyle = '#060606';
            ctx.fill();
        }

        // Muzzle cap
        ctx.beginPath();
        ctx.arc(tipX, tipY, 7.5, 0, Math.PI * 2);
        ctx.fillStyle = '#1c1c1c';
        ctx.fill();
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 0.8;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(tipX, tipY, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#000';
        ctx.fill();

        ctx.restore();
    }

    _drawHealthBar(ctx) {
        if (this._gameOver) return;
        const cw = this._canvas.width;
        const SEG_W = 24, SEG_H = 16, GAP = 3;
        const totalW = 5 * SEG_W + 4 * GAP;
        const x = cw - totalW - 16;
        const y = 16;

        ctx.save();
        ctx.font = 'bold 11px monospace';
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.fillText('HEALTH', x, y - 2);

        for (let i = 0; i < 5; i++) {
            const segX = x + i * (SEG_W + GAP);
            const filled = i < this._playerHealth;
            if (filled) {
                if (this._playerHealth >= 3)      ctx.fillStyle = '#22dd44';
                else if (this._playerHealth === 2) ctx.fillStyle = '#ddaa22';
                else                               ctx.fillStyle = '#dd2222';
            } else {
                ctx.fillStyle = 'rgba(60,60,60,0.8)';
            }
            ctx.fillRect(segX, y, SEG_W, SEG_H);
            ctx.strokeStyle = 'rgba(200,200,200,0.4)';
            ctx.lineWidth = 1;
            ctx.strokeRect(segX, y, SEG_W, SEG_H);
        }
        ctx.restore();
    }
}
