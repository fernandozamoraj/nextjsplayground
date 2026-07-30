import { Explosion } from './explosion';
import { ImpactEffect } from './impactEffect';
import { SmokeEffect } from './smokeEffect';
import { ShapeFactory } from './shapeFactory';

export const TOTAL_TARGETS = 13; // 8 bottles + 5 orbs

/**
 * ShooterGame — encapsulates all game logic for the shooter page.
 * Handles level building, target management, shooting, effects, and spgun overlay.
 *
 * Usage:
 *   const game = new ShooterGame(world, canvas, controller, { onScore, onGameOver });
 *   game.build();   // populate world with level + targets
 *   game.start();   // attach click handler + render hooks
 *   // ... world.start() ...
 *   game.stop();    // cleanup (call on unmount)
 */
export class ShooterGame {

    // ...existing imports...

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
        this._smokes     = [];
        this._ladders    = [];
        this._floors     = [];
        this._trashcans  = [];

        this._handleShoot = this._handleShoot.bind(this);
        this._handleReloadKey = this._handleReloadKey.bind(this);
        this._handlePointerDown = this._handlePointerDown.bind(this);
        this._handlePointerUp = this._handlePointerUp.bind(this);
        this._stopAutoFire = this._stopAutoFire.bind(this);
        this._shotAudio   = null;
        this._glassAudio  = null;
        this._boxHitAudio = null;
        this._reloadAudio = null;
        this._grenadeAudio = null;

        this._flashTime    = 0;
        this._flashTotal   = 4 / 60;
        this._noAmmoTime   = 0;
        this._noAmmoTotal  = 1.5;

        this._autoFireHoldMs = 500;
        this._autoFireRateMs = 110;
        this._pointerIsDown = false;
        this._autoFireActive = false;
        this._autoFireHoldTimeout = null;
        this._autoFireInterval = null;
        this._handleContextMenu = this._handleContextMenu.bind(this);

        this._gunRecoilX = 0;
        this._gunRecoilY = 0;
        this._gunKickX = 16;
        this._gunKickY = 12;
        this._gunRecoilReturn = 0.72;

        this._grenadesMax = 10;
        this._grenades = 10;
        this._grenadeThrowSpeed = 0.48 * 60;
        this._grenadeArcHeight = 0.23 * 60;
        this._grenadePitchInfluence = 0.32;
        this._grenadeBlastRadius = 3.2;
        this._grenadeProximityFactor = 0.65;
        this._grenadeProjectiles = [];
        this._grenadeFragments = [];

        this._maxRounds      = 20;
        this._rounds         = 20;
        this._reloading      = false;
        this._reloadProgress = 0;
        this._reloadTotal    = 1.5;

        this._orbs = [];
        this._sniperOrbs = [];
        this._trackingOrbs = [];
        this._playerHealth = 5;
        this._trackingHitTime = 0;
        this._trackingHitTotal = 40 / 60;
        this._smokeTimer    = 0;
        this._smokeInterval = 14 / 60;
        this._dirChangeInterval = null;
        this._sniperFireInterval = null;
        this._sniperSpawnInterval = null;
        this._trackingOrbSpawnInterval = null;
        this._onPlayerHit = onPlayerHit ?? null;
        this._onPlayerDead = onPlayerDead ?? null;

        this._gunOverlayImg = new Image();
        this._gunOverlayReady = false;
        this._gunOverlayImg.onload = () => {
            this._gunOverlayReady = true;
        };
        this._gunOverlayImg.src = '/images/machinegun-aim.png';
            this._handleMapFileChosen = this._handleMapFileChosen.bind(this);
        this._mapFileInput = null;
    }

    /** Hook into world render loop and attach click listener. */
    start() {

        if (!this._mapFileInput) {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.shtr,.shr,application/json';
            input.style.display = 'none';
            input.addEventListener('change', this._handleMapFileChosen);
            document.body.appendChild(input);
            this._mapFileInput = input;
        }

        this._world._onBeforeRender = (delta) => {
            this._controller.update(delta);

            if (this._controller.shootTriggered && !this._gameOver) this._handleShoot(true);
            if (this._controller.reloadTriggered && !this._gameOver) this._startReload();

            this._updateGrenades(delta);

            if (this._reloading) {
                this._reloadProgress += delta;
                if (this._reloadProgress >= this._reloadTotal) {
                    this._rounds         = this._maxRounds;
                    this._reloading      = false;
                    this._reloadProgress = 0;
                    if (this._reloadAudio) { this._reloadAudio.currentTime = 0; this._reloadAudio.play().catch(() => {}); }
                }
            }

            this._targets.forEach(t => { if (t.alive) this._rotateY(t.mesh, t.cx, t.cz, 90 * delta); });

            this._explosions.forEach(e => e.update());
            this._explosions = this._explosions.filter(e => e.alive);

            this._updateOrbs(delta);
            this._updateSniperOrbs(delta);
            this._updateTrackingOrbs(delta);

            this._smokeTimer += delta;
            if (this._smokeTimer >= this._smokeInterval) {
                this._smokeTimer = 0;
                this._trashcans.forEach(tc => {
                    this._smokes.push(new SmokeEffect(tc.x, tc.y, tc.z, this._world.renderer, {
                        count: 9,
                        visibilityCheck: (ox, oy, oz) => {
                            const cp = this._world.renderer.camera.position;
                            return this._hasLineOfSight(cp.x, cp.y, cp.z, ox, oy, oz);
                        },
                    }));
                });
            }
        };

        this._dirChangeInterval = setInterval(() => this._randomizeOrbVelocities(), 3000);
        this._sniperFireInterval = setInterval(() => this._fireSnipers(), 5000);
        this._sniperSpawnInterval = setInterval(() => this._maybeSpawnSniperOrb(), 15000);
        this._trackingOrbSpawnInterval = setInterval(() => this._spawnTrackingOrb(), 10000);

        this._world._onAfterRender = (ctx) => {
            const dt = this._world._lastDelta || (1 / 60);

            const recoilFactor = Math.pow(0.72, 60 * dt);
            if (Math.abs(this._gunRecoilX) < 0.1) this._gunRecoilX = 0;
            else this._gunRecoilX *= recoilFactor;
            if (Math.abs(this._gunRecoilY) < 0.1) this._gunRecoilY = 0;
            else this._gunRecoilY *= recoilFactor;

            this._impacts.forEach(fx => fx.update(ctx));
            this._impacts = this._impacts.filter(fx => fx.alive);
            this._smokes.forEach(fx => fx.update(ctx));
            this._smokes = this._smokes.filter(fx => fx.alive);
            this._drawTrashcanFires(ctx);
            if (!this._gameOver) this._drawTargetHints(ctx);
            if (!this._gameOver) this._drawSniperOrbIndicators(ctx);
            this._drawSniperOrbGlows(ctx);
            this._drawTrackingOrbGlows(ctx);
            this._drawGrenades(ctx);
            if (!this._gameOver) this._drawGun(ctx);
            this._drawTrackingHit(ctx);
            if (this._flashTime > 0) {
                this._drawMuzzleFlash(ctx);
                this._flashTime -= dt;
                if (this._flashTime < 0) this._flashTime = 0;
            }
            this._drawHealthBar(ctx);
            if (!this._gameOver) this._drawAmmoBar(ctx);
            if (!this._gameOver) this._drawGrenadeHud(ctx);
        };

        this._canvas.addEventListener('pointerdown', this._handlePointerDown);
        this._canvas.addEventListener('pointerup', this._handlePointerUp);
        this._canvas.addEventListener('pointerleave', this._stopAutoFire);
        this._canvas.addEventListener('pointercancel', this._stopAutoFire);
        this._canvas.addEventListener('lostpointercapture', this._stopAutoFire);
        this._canvas.addEventListener('contextmenu', this._handleContextMenu);
        window.addEventListener('pointerup', this._stopAutoFire);
        window.addEventListener('keydown', this._handleReloadKey);
        this._shotAudio = new Audio('/sounds/shot.wav');
        this._shotAudio.load();
        this._glassAudio = new Audio('/sounds/glasshit.mp3');
        this._glassAudio.load();
        this._boxHitAudio = new Audio('/sounds/boxhit.wav');
        this._boxHitAudio.load();
        this._reloadAudio = new Audio('/sounds/reload.wav');
        this._reloadAudio.load();
        this._grenadeAudio = new Audio('/sounds/grenade.wav');
        this._grenadeAudio.load();
    }


    _buildOrbs() {
        const colors = ['#ff44ff', '#44ffff', '#ffff44', '#ff8844', '#88ff44'];
        this._orbs = colors.map(color => {
            const x = -18 + Math.random() * 36;
            const y = 1.2 + Math.random() * 3.0;
            const z = -18 + Math.random() * 34;
            const mesh = this._shapes.sphere(x, y, z, 0.1, 6, 8);
            this._world.add(mesh, color);
            const speed = (0.04 + Math.random() * 0.03) * 60;
            const angle = Math.random() * Math.PI * 2;
            return {
                mesh, alive: true, color,
                x, y, z,
                vx: Math.cos(angle) * speed,
                vy: (Math.random() - 0.5) * 0.02 * 60,
                vz: Math.sin(angle) * speed,
            };
        });
    }

    _handleMapFileChosen(event) {
        const file = event.target.files && event.target.files[0];
        if (!file) return;

        const name = (file.name || '').toLowerCase();
        if (!name.endsWith('.shtr') && !name.endsWith('.shr')) return;

        const reader = new FileReader();
        reader.onload = () => {
            try {
                const data = JSON.parse(reader.result);
                this._applySavedMapState(data); // map-only apply
            } catch (_) {}
        };
        reader.readAsText(file);
    }

    _saveMapToFile() {
        const payload = this._serializeMapState(); // map-only serialize
        const json = JSON.stringify(payload, null, 2);
        const blob = new Blob([json], { type: 'application/json' });

        const now = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        const fileName =
            `map-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-` +
            `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}.shtr`;

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    // map-only: ground + boxes only
    _serializeMapState() {
        const cloneMesh = (mesh) => ({
            vertices: (mesh.vertices || []).map(v => ({ x: v.x, y: v.y, z: v.z })),
            faces: (mesh.faces || []).map(f => ({ v1: f.v1, v2: f.v2, v3: f.v3 })),
        });

        const groundObj = this._world._objects.find(o => o.isGround);

        const boxItems = this._boxMeshes.map((mesh) => {
            const obj = this._world._objects.find(o => o.mesh === mesh);
            return {
                mesh: cloneMesh(mesh),
                color: obj?.color || '#8b6914',
            };
        });

        return {
            type: 'shooter-map',
            version: 1,
            savedAt: new Date().toISOString(),
            ground: groundObj
                ? {
                    mesh: cloneMesh(groundObj.mesh),
                    color: groundObj.color || '#ccc',
                    isGround: true,
                }
                : null,
            boxes: boxItems,
        };
    }

    // map-only: replace world static geometry with uploaded map
    _applySavedMapState(data) {
        if (!data || typeof data !== 'object') return;
        if (data.type !== 'shooter-map') return;

        
        // Remove current static map geometry (ground + boxes)
        const existingGroundMeshes = this._world._objects.filter(o => o.isGround).map(o => o.mesh);
        const toRemove = new Set([...existingGroundMeshes, ...this._boxMeshes]);
        this._world._objects = this._world._objects.filter(o => !toRemove.has(o.mesh));

        // Reset map-related arrays
        this._boxMeshes = [];
        this._floors = [];
        this._ladders = [];

        // Restore boxes and rebuild collision/LOS floors from box bounds
        const getBounds = (mesh) => {
            const xs = mesh.vertices.map(v => v.x);
            const ys = mesh.vertices.map(v => v.y);
            const zs = mesh.vertices.map(v => v.z);
            return {
                minX: Math.min(...xs), maxX: Math.max(...xs),
                minY: Math.min(...ys), maxY: Math.max(...ys),
                minZ: Math.min(...zs), maxZ: Math.max(...zs),
            };
        };

        if (data.ground?.mesh && this._isValidMesh(data.ground.mesh)) {
            this._world.add(data.ground.mesh, data.ground.color || '#ccc', true);
        }

        (data.boxes || []).forEach((item) => {
            if (!item?.mesh || !this._isValidMesh(item.mesh)) return;
            this._world.add(item.mesh, item.color || '#8b6914', false);
            this._boxMeshes.push(item.mesh);

            const xs = item.mesh.vertices.map(v => v.x);
            const ys = item.mesh.vertices.map(v => v.y);
            const zs = item.mesh.vertices.map(v => v.z);

            this._floors.push({
                minX: Math.min(...xs),
                maxX: Math.max(...xs),
                minZ: Math.min(...zs),
                maxZ: Math.max(...zs),
                topY: Math.max(...ys),
            });
        });

        this._controller.setLadders(this._ladders);
        this._controller.setFloors(this._floors);
    }

    _updateOrbs(delta) {
        const minX = -21, maxX = 21, minZ = -21, maxZ = 19, minY = 1.0, maxY = 4.5;
        this._orbs.forEach(orb => {
            if (!orb.alive) return;
            const dx = orb.vx * delta;
            const dy = orb.vy * delta;
            const dz = orb.vz * delta;
            if (orb.x + dx < minX || orb.x + dx > maxX) orb.vx *= -1;
            if (orb.y + dy < minY || orb.y + dy > maxY) orb.vy *= -1;
            if (orb.z + dz < minZ || orb.z + dz > maxZ) orb.vz *= -1;
            orb.x += orb.vx * delta;
            orb.y += orb.vy * delta;
            orb.z += orb.vz * delta;
            this._translateMesh(orb.mesh, orb.vx * delta, orb.vy * delta, orb.vz * delta);
        });
    }

    _randomizeOrbVelocities() {
        [...this._orbs, ...this._sniperOrbs].forEach(orb => {
            if (!orb.alive) return;
            const speed = (0.04 + Math.random() * 0.03) * 60;
            const angle = Math.random() * Math.PI * 2;
            orb.vx = Math.cos(angle) * speed;
            orb.vz = Math.sin(angle) * speed;
            orb.vy = (Math.random() - 0.5) * 0.02 * 60;
        });
    }

    _buildSniperOrbs() {
        this._sniperOrbs = ['#ff1111', '#ff6600'].map(glowColor => {
            const x = -15 + Math.random() * 30;
            const y = 1.5 + Math.random() * 2.5;
            const z = -15 + Math.random() * 30;
            const mesh = this._shapes.sphere(x, y, z, 0.1, 6, 8);
            this._world.add(mesh, '#ffffff');
            const speed = (0.03 + Math.random() * 0.02) * 60;
            const angle = Math.random() * Math.PI * 2;
            return {
                mesh, alive: true, color: glowColor,
                x, y, z,
                vx: Math.cos(angle) * speed,
                vy: (Math.random() - 0.5) * 0.015 * 60,
                vz: Math.sin(angle) * speed,
            };
        });
    }

    _updateSniperOrbs(delta) {
        const minX = -21, maxX = 21, minZ = -21, maxZ = 19, minY = 1.0, maxY = 4.5;
        this._sniperOrbs.forEach(orb => {
            if (!orb.alive) return;
            const dx = orb.vx * delta;
            const dy = orb.vy * delta;
            const dz = orb.vz * delta;
            if (orb.x + dx < minX || orb.x + dx > maxX) orb.vx *= -1;
            if (orb.y + dy < minY || orb.y + dy > maxY) orb.vy *= -1;
            if (orb.z + dz < minZ || orb.z + dz > maxZ) orb.vz *= -1;
            orb.x += orb.vx * delta;
            orb.y += orb.vy * delta;
            orb.z += orb.vz * delta;
            this._translateMesh(orb.mesh, orb.vx * delta, orb.vy * delta, orb.vz * delta);
        });
    }

    _updateGrenades(delta) {
        if (this._gameOver) {
            this._grenadeProjectiles = [];
            this._grenadeFragments = [];
            return;
        }

        const GRAVITY = 12.0;
        const GROUND_Y = 0;

        this._grenadeProjectiles = this._grenadeProjectiles.filter(g => {
            g.age += delta;
            g.vy -= GRAVITY * delta;
            g.x  += g.vx * delta;
            g.y  += g.vy * delta;
            g.z  += g.vz * delta;
            g.life -= delta;

            const shouldExplode =
                g.life <= 0 ||
                (g.age >= (g.armingDelay || 0) && (
                    g.y <= GROUND_Y + g.radius ||
                    this._isGrenadeNearAnyTarget(
                        g.x, g.y, g.z,
                        this._grenadeBlastRadius * this._grenadeProximityFactor
                    )
                ));

            if (shouldExplode) {
                this._explodeGrenade(g.x, Math.max(g.y, GROUND_Y + 0.05), g.z);
                return false;
            }
            return true;
        });

        this._grenadeFragments = this._grenadeFragments.filter(f => {
            f.vy -= GRAVITY * 0.8 * delta;
            f.x  += f.vx * delta;
            f.y  += f.vy * delta;
            f.z  += f.vz * delta;
            f.life -= delta;
            if (f.y < GROUND_Y + 0.02) {
                f.y   = GROUND_Y + 0.02;
                f.vx *= 0.82;
                f.vz *= 0.82;
                f.vy *= -0.22;
            }
            return f.life > 0;
        });
    }
 
    _handleThrowGrenade() {
        if (document.pointerLockElement !== this._canvas) return;
        if (this._gameOver || this._grenades <= 0) return;

        const cam = this._world.renderer.camera;
        const yaw   = cam.rotation.yaw   * Math.PI / 180;
        const pitch = cam.rotation.pitch * Math.PI / 180;
        const forward = {
            x:  Math.sin(yaw) * Math.cos(pitch),
            y: -Math.sin(pitch),
            z:  Math.cos(yaw) * Math.cos(pitch),
        };
        const right = { x: Math.cos(yaw), y: 0, z: -Math.sin(yaw) };

        const spawn = {
            x: cam.position.x + forward.x * 0.9 + right.x * 0.15,
            y: cam.position.y - 0.1,
            z: cam.position.z + forward.z * 0.9 + right.z * 0.15,
        };

        this._grenades--;
        this._grenadeProjectiles.push({
            x: spawn.x,
            y: spawn.y,
            z: spawn.z,
            vx: forward.x * this._grenadeThrowSpeed,
            vy: forward.y * this._grenadePitchInfluence * 60 + this._grenadeArcHeight,
            vz: forward.z * this._grenadeThrowSpeed,
            radius: 0.18,
            life: 4.0,
            age: 0,
            armingDelay: 0.18,
        });

        this._grenadeFragments.push({
            x: spawn.x, y: spawn.y + 0.08, z: spawn.z,
            vx: (forward.x * 0.2 + right.x * 0.25) * 60,
            vy: 0.22 * 60,
            vz: (forward.z * 0.2 + right.z * 0.25) * 60,
            life: 75 / 60,
            type: 'clip',
        });
    }

    _spawnTrackingOrb() {
        if (this._gameOver) return;
        const cp = this._world.renderer.camera.position;
        let x, z, attempts = 0;
        do {
            x = -18 + Math.random() * 36;
            z = -18 + Math.random() * 34;
            attempts++;
        } while (attempts < 20 && Math.sqrt((x - cp.x) ** 2 + (z - cp.z) ** 2) < 8);
        const y = 1.0 + Math.random() * 2.0;
        const mesh = this._shapes.sphere(x, y, z, 0.18, 7, 10);
        this._world.add(mesh, '#cc44ff');
        const tSpeed = (0.04 + Math.random() * 0.03) * 60;
        const tAngle = Math.random() * Math.PI * 2;
        const orb = {
            mesh, alive: true, tracking: false, x, y, z,
            vx: Math.cos(tAngle) * tSpeed,
            vy: (Math.random() - 0.5) * 0.02 * 60,
            vz: Math.sin(tAngle) * tSpeed,
        };
        this._trackingOrbs.push(orb);
        setTimeout(() => {
            if (!orb.alive) return;
            orb.alive = false;
            this._world._objects = this._world._objects.filter(o => o.mesh !== orb.mesh);
        }, 10000);
    }

    _updateTrackingOrbs(delta) {
        if (this._gameOver || this._playerHealth <= 0) return;
        const cp = this._world.renderer.camera.position;
        const cw = this._canvas.width;
        const ch = this._canvas.height;
        this._trackingOrbs.forEach(orb => {
            if (!orb.alive) return;
            if (!orb.tracking) {
                const cam = this._world.renderer.worldToCamera(orb.x, orb.y, orb.z);
                if (cam.z > 0) {
                    const proj = this._world.renderer.project3DTo2D(cam.x, cam.y, cam.z);
                    if (proj && proj.x >= 0 && proj.x <= cw && proj.y >= 0 && proj.y <= ch) {
                        if (this._hasLineOfSight(cp.x, cp.y, cp.z, orb.x, orb.y, orb.z)) {
                            orb.tracking = true;
                        }
                    }
                }
            }
            if (orb.tracking) {
                const dx   = cp.x - orb.x;
                const dy   = cp.y - orb.y;
                const dz   = cp.z - orb.z;
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
                if (dist < 0.7) {
                    orb.alive = false;
                    this._world._objects = this._world._objects.filter(o => o.mesh !== orb.mesh);
                    this._playerHealth--;
                    this._trackingHitTime = this._trackingHitTotal;
                    if (this._onPlayerHit) this._onPlayerHit(this._playerHealth);
                    if (this._playerHealth <= 0) {
                        this._gameOver = true;
                        if (this._onPlayerDead) this._onPlayerDead();
                    }
                    return;
                }
                const speed = 4.2;
                orb.vx = (dx / dist) * speed;
                orb.vy = (dy / dist) * speed;
                orb.vz = (dz / dist) * speed;
            } else {
                const minX = -21, maxX = 21, minZ = -21, maxZ = 19, minY = 1.0, maxY = 4.5;
                const dx = orb.vx * delta;
                const dy = orb.vy * delta;
                const dz = orb.vz * delta;
                if (orb.x + dx < minX || orb.x + dx > maxX) orb.vx *= -1;
                if (orb.y + dy < minY || orb.y + dy > maxY) orb.vy *= -1;
                if (orb.z + dz < minZ || orb.z + dz > maxZ) orb.vz *= -1;
            }
            orb.x += orb.vx * delta;
            orb.y += orb.vy * delta;
            orb.z += orb.vz * delta;
            this._translateMesh(orb.mesh, orb.vx * delta, orb.vy * delta, orb.vz * delta);
        });
        this._trackingOrbs = this._trackingOrbs.filter(o => o.alive);
    }

    _drawAmmoBar(ctx) {
        const cw = this._canvas.width;
        const BAR_W  = 7;
        const BAR_H  = 20;
        const GAP    = 3;
        const totalW = this._maxRounds * (BAR_W + GAP) - GAP;
        const startX = (cw - totalW) / 2;
        const y      = 14;

        ctx.save();
        ctx.font      = 'bold 10px monospace';
        ctx.fillStyle = 'rgba(255,255,255,0.65)';
        ctx.textAlign = 'center';
        ctx.fillText('AMMO', cw / 2, y - 2);

        for (let i = 0; i < this._maxRounds; i++) {
            const bx     = startX + i * (BAR_W + GAP);
            const filled = i < this._rounds;
            ctx.fillStyle = filled
                ? (this._reloading ? 'rgba(200,200,50,0.35)' : '#dddd22')
                : 'rgba(40,40,40,0.8)';
            ctx.fillRect(bx, y, BAR_W, BAR_H);
            ctx.strokeStyle = 'rgba(180,180,180,0.28)';
            ctx.lineWidth   = 0.5;
            ctx.strokeRect(bx, y, BAR_W, BAR_H);
        }

        if (this._reloading) {
            const prog = this._reloadProgress / this._reloadTotal;
            const barY = y + BAR_H + 4;
            ctx.fillStyle = 'rgba(30,30,30,0.7)';
            ctx.fillRect(startX, barY, totalW, 4);
            ctx.fillStyle = '#ffee44';
            ctx.fillRect(startX, barY, totalW * prog, 4);
            ctx.fillStyle  = 'rgba(255,238,68,0.85)';
            ctx.font       = 'bold 10px monospace';
            ctx.textAlign  = 'center';
            ctx.fillText('RELOADING\u2026', cw / 2, barY + 14);
        } else if (this._rounds === 0) {
            ctx.fillStyle = 'rgba(255,60,60,0.92)';
            ctx.font      = 'bold 11px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('PRESS X TO RELOAD', cw / 2, y + BAR_H + 16);
        }

        if (this._noAmmoTime > 0) {
            const alpha = Math.min(1, this._noAmmoTime / this._noAmmoTotal);
            const ch    = this._canvas.height;
            ctx.font        = 'bold 56px monospace';
            ctx.textAlign   = 'center';
            ctx.shadowColor = 'rgba(0,0,0,0.75)';
            ctx.shadowBlur  = 14;
            ctx.fillStyle   = `rgba(255, 140, 0, ${alpha})`;
            ctx.fillText('RELOAD', cw / 2, ch / 2 - 60);
            ctx.shadowBlur  = 0;
        }

        ctx.restore();
    }

    _drawTrackingHit(ctx) {
        if (this._trackingHitTime <= 0) return;
        const cw = this._canvas.width;
        const ch = this._canvas.height;
        const alpha = this._trackingHitTime / this._trackingHitTotal;
        ctx.save();
        const vg = ctx.createRadialGradient(cw / 2, ch / 2, ch * 0.18, cw / 2, ch / 2, ch * 0.85);
        vg.addColorStop(0,   'rgba(160,0,0,0)');
        vg.addColorStop(0.5, `rgba(200,0,0,${alpha * 0.38})`);
        vg.addColorStop(1,   `rgba(255,0,0,${alpha * 0.80})`);
        ctx.fillStyle = vg;
        ctx.fillRect(0, 0, cw, ch);
        const size = Math.floor(64 + 20 * Math.sin(alpha * Math.PI));
        ctx.font        = `bold ${size}px monospace`;
        ctx.textAlign   = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#ff2200';
        ctx.shadowBlur  = 28;
        ctx.fillStyle   = `rgba(255,255,255,${alpha})`;
        ctx.fillText('HIT', cw / 2, ch / 2 - 80);
        ctx.shadowBlur  = 0;
        ctx.restore();
    }



    /** Populate the world: ground + level + targets. Call before start(). */
    build() {
        this._world.add(this._shapes.ground(50), '#ccc', true);
        this._buildLevel();
        this._buildTargets();
        this._buildOrbs();
        this._buildSniperOrbs();
        this._buildTrashcans();
        this._controller.setLadders(this._ladders);
        this._controller.setFloors(this._floors);
    }


    /** Remove event listeners. Call on unmount. */
    stop() {
        this._canvas.removeEventListener('pointerdown', this._handlePointerDown);
        this._canvas.removeEventListener('pointerup', this._handlePointerUp);
        this._canvas.removeEventListener('pointerleave', this._stopAutoFire);
        this._canvas.removeEventListener('pointercancel', this._stopAutoFire);
        this._canvas.removeEventListener('lostpointercapture', this._stopAutoFire);
        this._canvas.removeEventListener('contextmenu', this._handleContextMenu);
        window.removeEventListener('pointerup', this._stopAutoFire);
        window.removeEventListener('keydown', this._handleReloadKey);
        this._stopAutoFire();
        if (this._dirChangeInterval) clearInterval(this._dirChangeInterval);
        if (this._sniperFireInterval) clearInterval(this._sniperFireInterval);
        if (this._sniperSpawnInterval) clearInterval(this._sniperSpawnInterval);
        if (this._trackingOrbSpawnInterval) clearInterval(this._trackingOrbSpawnInterval);

        if (this._mapFileInput) {
            this._mapFileInput.removeEventListener('change', this._handleMapFileChosen);
            this._mapFileInput.remove();
            this._mapFileInput = null;
        }
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

        // ── Moon — large sphere centred over the play area, high in the sky ──
        this._world.add(this._shapes.sphere(0, 40, -1, 2.5, 18, 24), '#d6d4c2');
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

    _maybeSpawnSniperOrb() {
        if (this._gameOver) return;
        const anyAlive = this._sniperOrbs.some(o => o.alive);
        if (anyAlive) return;
        const glowColor = Math.random() < 0.5 ? '#ff1111' : '#ff6600';
        const x = -15 + Math.random() * 30;
        const y = 1.5 + Math.random() * 2.5;
        const z = -15 + Math.random() * 30;
        const mesh = this._shapes.sphere(x, y, z, 0.1, 6, 8);
        this._world.add(mesh, '#ffffff');
        const speed = 0.03 + Math.random() * 0.02;
        const angle = Math.random() * Math.PI * 2;
        const orb = {
            mesh, alive: true, color: glowColor,
            spawned: true, // not shootable
            x, y, z,
            vx: Math.cos(angle) * speed,
            vy: (Math.random() - 0.5) * 0.015,
            vz: Math.sin(angle) * speed,
        };
        this._sniperOrbs.push(orb);
        // Auto-despawn after 5 seconds
        setTimeout(() => {
            if (!orb.alive) return;
            orb.alive = false;
            this._world._objects = this._world._objects.filter(o => o.mesh !== orb.mesh);
        }, 5000);
    }

    _buildTrashcans() {
        const positions = [
            { x: -10, z: -12 },
            { x:  10, z: -12 },
            { x:  -3, z:   3 },
            { x:   7, z:  14 },
        ];
        this._trashcans = positions.map(({ x, z }) => {
            // Body
            this._world.add(this._shapes.cylinder(x, 0, z, 0.20, 0.50, 10), '#252525');
            // Rim (slightly wider ring at the top)
            this._world.add(this._shapes.cylinder(x, 0.48, z, 0.24, 0.04, 10), '#3a3a3a');
            return { x, y: 0.54, z };
        });
    }

        _drawTrashcanFires(ctx) {
        const cw = this._canvas.width;

        this._trashcans.forEach(tc => {
            const cam = this._world.renderer.worldToCamera(tc.x, tc.y, tc.z);
            if (!cam || !Number.isFinite(cam.z) || cam.z <= 0) return;

            const proj = this._world.renderer.project3DTo2D(cam.x, cam.y, cam.z);
            if (!proj || !Number.isFinite(proj.x) || !Number.isFinite(proj.y)) return;

            const cp = this._world.renderer.camera.position;
            if (!this._hasLineOfSight(cp.x, cp.y, cp.z, tc.x, tc.y, tc.z)) return;

            const { x, y } = proj;
            const ds = 5.0 / Math.max(cam.z, 0.5);
            if (!Number.isFinite(ds)) return;

            ctx.save();
            ctx.beginPath();
            ctx.rect(0, 0, cw, y);
            ctx.clip();

            const f1 = 0.8 + Math.random() * 0.4;
            const r1 = 26 * ds * f1;
            if (!this._isFiniteRadius(r1)) { ctx.restore(); return; }
            const g1 = ctx.createRadialGradient(x, y, 0, x, y, r1);
            g1.addColorStop(0,    'rgba(255,255,210,0.95)');
            g1.addColorStop(0.18, 'rgba(255,230,80,0.88)');
            g1.addColorStop(0.45, 'rgba(255,120,20,0.55)');
            g1.addColorStop(0.78, 'rgba(255,40,0,0.18)');
            g1.addColorStop(1,    'rgba(255,10,0,0)');
            ctx.beginPath();
            ctx.arc(x, y, r1, 0, Math.PI * 2);
            ctx.fillStyle = g1;
            ctx.fill();

            const f2 = 0.7 + Math.random() * 0.5;
            const jx2 = (Math.random() - 0.5) * 6 * ds;
            const gy2 = y - 16 * ds * f2;
            const r2  = 16 * ds * f2;
            if (!Number.isFinite(jx2) || !Number.isFinite(gy2) || !this._isFiniteRadius(r2)) { ctx.restore(); return; }
            const g2 = ctx.createRadialGradient(x + jx2, gy2, 0, x + jx2, gy2, r2);
            g2.addColorStop(0,    'rgba(255,200,50,0.92)');
            g2.addColorStop(0.35, 'rgba(255,100,10,0.65)');
            g2.addColorStop(0.70, 'rgba(255,30,0,0.22)');
            g2.addColorStop(1,    'rgba(200,0,0,0)');
            ctx.beginPath();
            ctx.arc(x + jx2, gy2, r2, 0, Math.PI * 2);
            ctx.fillStyle = g2;
            ctx.fill();

            const f3 = 0.6 + Math.random() * 0.55;
            const jx3 = (Math.random() - 0.5) * 5 * ds;
            const gy3 = y - 32 * ds * f3;
            const r3  = 10 * ds * f3;
            if (!Number.isFinite(jx3) || !Number.isFinite(gy3) || !this._isFiniteRadius(r3)) { ctx.restore(); return; }
            const g3 = ctx.createRadialGradient(x + jx3, gy3, 0, x + jx3, gy3, r3);
            g3.addColorStop(0,    'rgba(255,150,30,0.80)');
            g3.addColorStop(0.40, 'rgba(220,50,0,0.40)');
            g3.addColorStop(1,    'rgba(160,0,0,0)');
            ctx.beginPath();
            ctx.arc(x + jx3, gy3, r3, 0, Math.PI * 2);
            ctx.fillStyle = g3;
            ctx.fill();

            ctx.restore();
        });
    }

     _fireSnipers() {
        if (this._gameOver || this._playerHealth <= 0) return;
        const cw = this._canvas.width;
        const ch = this._canvas.height;
        this._sniperOrbs.forEach(orb => {
            if (!orb.alive || this._playerHealth <= 0) return;
            // Only fire if the orb is within the player's field of view
            const cam = this._world.renderer.worldToCamera(orb.x, orb.y, orb.z);
            if (cam.z <= 0) return; // behind the player
            const proj = this._world.renderer.project3DTo2D(cam.x, cam.y, cam.z);
            if (!proj || proj.x < 0 || proj.x > cw || proj.y < 0 || proj.y > ch) return; // off-screen
            const cp = this._world.renderer.camera.position;
            if (!this._hasLineOfSight(orb.x, orb.y, orb.z, cp.x, cp.y, cp.z)) return; // wall in between
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

    /** Slab-method segment vs AABB intersection. tMin/tMax shrunk by epsilon to avoid surface grazing. */
    _segmentIntersectsAABB(ax, ay, az, bx, by, bz, minX, minY, minZ, maxX, maxY, maxZ) {
        const dx = bx - ax, dy = by - ay, dz = bz - az;
        let tMin = 0.02, tMax = 0.98;
        for (const [d, a, lo, hi] of [[dx, ax, minX, maxX], [dy, ay, minY, maxY], [dz, az, minZ, maxZ]]) {
            if (Math.abs(d) < 1e-8) {
                if (a < lo || a > hi) return false;
            } else {
                let t1 = (lo - a) / d, t2 = (hi - a) / d;
                if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; }
                tMin = Math.max(tMin, t1);
                tMax = Math.min(tMax, t2);
                if (tMin > tMax) return false;
            }
        }
        return true;
    }

    /** Returns true if the straight line from (ax,ay,az) to (bx,by,bz) is not blocked by any wall. */
    _hasLineOfSight(ax, ay, az, bx, by, bz) {
        for (const f of this._floors) {
            if (this._segmentIntersectsAABB(ax, ay, az, bx, by, bz, f.minX, 0, f.minZ, f.maxX, f.topY, f.maxZ))
                return false;
        }
        return true;
    }

    _handleReloadKey(e) {
        if (e.key.toLowerCase() === 'x') this._startReload();
    }

    _startReload() {
        if (this._reloading || this._rounds >= this._maxRounds || this._gameOver) return;
        this._reloading      = true;
        this._reloadProgress = 0;
    }

    _handlePointerDown(event) {
        if (this._gameOver) return;

        if (event.button === 2) {
            event.preventDefault();
            this._handleThrowGrenade();
            return;
        }

        if (event.button !== 0) return;
        this._pointerIsDown = true;
        this._autoFireActive = false;

        if (this._autoFireHoldTimeout) clearTimeout(this._autoFireHoldTimeout);
        this._autoFireHoldTimeout = setTimeout(() => {
            if (!this._pointerIsDown || this._gameOver) return;
            this._autoFireActive = true;
            this._handleShoot();
            if (this._autoFireInterval) clearInterval(this._autoFireInterval);
            this._autoFireInterval = setInterval(() => {
                if (!this._pointerIsDown || this._gameOver) {
                    this._stopAutoFire();
                    return;
                }
                this._handleShoot();
            }, this._autoFireRateMs);
        }, this._autoFireHoldMs);
    }

    _handlePointerUp(event) {
        if (event.button !== 0) return;
        const wasPointerDown = this._pointerIsDown;
        const wasAutoFire = this._autoFireActive;
        this._stopAutoFire();
        if (wasPointerDown && !wasAutoFire) this._handleShoot();
    }

    _stopAutoFire() {
        this._pointerIsDown = false;
        if (this._autoFireHoldTimeout) {
            clearTimeout(this._autoFireHoldTimeout);
            this._autoFireHoldTimeout = null;
        }
        if (this._autoFireInterval) {
            clearInterval(this._autoFireInterval);
            this._autoFireInterval = null;
        }
        this._autoFireActive = false;
    }

    _handleContextMenu(event) {
        event.preventDefault();
    }
    
    _explodeGrenade(x, y, z) {
        this._explosions.push(new Explosion(this._world, x, y, z, '#ff8800'));
        this._smokes.push(new SmokeEffect(x, y, z, this._world.renderer, { count: 26, tint: '#ffaa55' }));
        if (this._grenadeAudio) {
            this._grenadeAudio.currentTime = 0;
            this._grenadeAudio.play().catch(() => {});
        }

        const radiusSq = this._grenadeBlastRadius * this._grenadeBlastRadius;
        const within = (tx, ty, tz) => {
            const dx = tx - x;
            const dy = ty - y;
            const dz = tz - z;
            return (dx * dx + dy * dy + dz * dz) <= radiusSq;
        };

        this._targets.forEach(t => {
            if (!t.alive) return;
            const c = this._world.renderer.getObjectCenter(t.mesh);
            if (!within(c.x, c.y, c.z)) return;
            t.alive = false;
            this._world._objects = this._world._objects.filter(o => o.mesh !== t.mesh);
            this._explosions.push(new Explosion(this._world, c.x, c.y, c.z, t.color));
            this._score++;
        });

        this._orbs.forEach(o => {
            if (!o.alive || !within(o.x, o.y, o.z)) return;
            o.alive = false;
            this._world._objects = this._world._objects.filter(obj => obj.mesh !== o.mesh);
            this._explosions.push(new Explosion(this._world, o.x, o.y, o.z, o.color));
            this._smokes.push(new SmokeEffect(o.x, o.y, o.z, this._world.renderer, { tint: o.color }));
            this._score++;
        });

        this._sniperOrbs.forEach(o => {
            if (!o.alive || !within(o.x, o.y, o.z)) return;
            o.alive = false;
            this._world._objects = this._world._objects.filter(obj => obj.mesh !== o.mesh);
            this._explosions.push(new Explosion(this._world, o.x, o.y, o.z, o.color));
            this._smokes.push(new SmokeEffect(o.x, o.y, o.z, this._world.renderer, { count: 20, tint: o.color }));
        });

        this._trackingOrbs.forEach(o => {
            if (!o.alive || !within(o.x, o.y, o.z)) return;
            o.alive = false;
            this._world._objects = this._world._objects.filter(obj => obj.mesh !== o.mesh);
            this._explosions.push(new Explosion(this._world, o.x, o.y, o.z, '#cc44ff'));
            this._smokes.push(new SmokeEffect(o.x, o.y, o.z, this._world.renderer, { count: 18 }));
        });

        this._onScore(this._score);
        if (this._score >= TOTAL_TARGETS) {
            this._gameOver = true;
            this._onGameOver();
        }
    }

    // ── Private: shooting ─────────────────────────────────────────────────────

    // ...existing code...
_isValidMesh(mesh) {
    if (!mesh || !Array.isArray(mesh.vertices) || !Array.isArray(mesh.faces)) return false;
    return mesh.vertices.every((v) =>
        v && Number.isFinite(v.x) && Number.isFinite(v.y) && Number.isFinite(v.z)
    );
}
// ...existing code...


    _handleShoot(fromGamepad = false) {
        if (!fromGamepad && document.pointerLockElement !== this._canvas) return;
        if (this._reloading || this._rounds <= 0) {
            if (this._rounds <= 0) this._noAmmoTime = this._noAmmoTotal;
            return;
        }
        this._rounds--;
        if (this._shotAudio) {
            this._shotAudio.currentTime = 0;
            this._shotAudio.play().catch(() => {});
        }
        this._flashTime = this._flashTotal;
        this._gunRecoilX = Math.max(this._gunRecoilX, this._gunKickX);
        this._gunRecoilY = Math.max(this._gunRecoilY, this._gunKickY);

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
            const cp = this._world.renderer.camera.position;
            if (!this._hasLineOfSight(cp.x, cp.y, cp.z, center.x, center.y, center.z)) return;
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
            const cp = this._world.renderer.camera.position;
            if (!this._hasLineOfSight(cp.x, cp.y, cp.z, closestOrb.x, closestOrb.y, closestOrb.z)) return;
            closestOrb.alive = false;
            this._world._objects = this._world._objects.filter(o => o.mesh !== closestOrb.mesh);
            this._explosions.push(new Explosion(this._world, closestOrb.x, closestOrb.y, closestOrb.z, closestOrb.color));
            this._smokes.push(new SmokeEffect(closestOrb.x, closestOrb.y, closestOrb.z, this._world.renderer, { tint: closestOrb.color }));
            if (this._glassAudio) { this._glassAudio.currentTime = 0; this._glassAudio.play().catch(() => {}); }
            this._score++;
            this._onScore(this._score);
            if (this._score >= TOTAL_TARGETS) {
                this._gameOver = true;
                this._onGameOver();
            }
            return;
        }

        // Check sniper orbs (killable if not spawned, not scored)
        let closestSniper = null, closestSniperDist = 30;
        this._sniperOrbs.forEach(orb => {
            if (!orb.alive || orb.spawned) return;
            const cam = this._world.renderer.worldToCamera(orb.x, orb.y, orb.z);
            if (cam.z <= 0) return;
            const proj = this._world.renderer.project3DTo2D(cam.x, cam.y, cam.z);
            if (!proj) return;
            const dx = proj.x - cw / 2, dy = proj.y - ch / 2;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < closestSniperDist) { closestSniper = orb; closestSniperDist = dist; }
        });
        if (closestSniper) {
            const cp = this._world.renderer.camera.position;
            if (!this._hasLineOfSight(cp.x, cp.y, cp.z, closestSniper.x, closestSniper.y, closestSniper.z)) return;
            closestSniper.alive = false;
            this._world._objects = this._world._objects.filter(o => o.mesh !== closestSniper.mesh);
            this._explosions.push(new Explosion(this._world, closestSniper.x, closestSniper.y, closestSniper.z, closestSniper.color));
            this._smokes.push(new SmokeEffect(closestSniper.x, closestSniper.y, closestSniper.z, this._world.renderer, { tint: closestSniper.color, count: 24 }));
            if (this._glassAudio) { this._glassAudio.currentTime = 0; this._glassAudio.play().catch(() => {}); }
            return;
        }

        // Check tracking orbs (shootable — destroy them before they reach you)
        let closestTracking = null, closestTrackingDist = 40;
        this._trackingOrbs.forEach(orb => {
            if (!orb.alive) return;
            const cam = this._world.renderer.worldToCamera(orb.x, orb.y, orb.z);
            if (cam.z <= 0) return;
            const proj = this._world.renderer.project3DTo2D(cam.x, cam.y, cam.z);
            if (!proj) return;
            const dx = proj.x - cw / 2, dy = proj.y - ch / 2;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < closestTrackingDist) { closestTracking = orb; closestTrackingDist = dist; }
        });
        if (closestTracking) {
            const cp = this._world.renderer.camera.position;
            if (!this._hasLineOfSight(cp.x, cp.y, cp.z, closestTracking.x, closestTracking.y, closestTracking.z)) return;
            closestTracking.alive = false;
            this._world._objects = this._world._objects.filter(o => o.mesh !== closestTracking.mesh);
            this._explosions.push(new Explosion(this._world, closestTracking.x, closestTracking.y, closestTracking.z, '#cc44ff'));
            this._smokes.push(new SmokeEffect(closestTracking.x, closestTracking.y, closestTracking.z, this._world.renderer, { count: 20 }));
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
        const cw  = this._canvas.width;
        const ch  = this._canvas.height;
        const cx  = cw / 2;
        const cy  = ch / 2;
        const cam = this._world.renderer.camera;
        const yaw = cam.rotation.yaw;

        const allTargets = [
            ...this._targets.filter(t => t.alive).map(t => ({ x: t.cx, z: t.cz })),
            ...this._orbs.filter(o => o.alive).map(o => ({ x: o.x, z: o.z })),
        ];

        // Indicator circle radius — sits just inside the shorter half-dimension
        const R = Math.min(cx, cy) * 0.90;

        // Draw a lens-shaped (tapered) arc: thick in the middle, pointy at both ends.
        // Traces outer edge forward, inner edge backward, closes to a filled shape.
        const drawLens = (angleCenter, halfSpan, maxWidth, color, glow = 0) => {
            const STEPS = 48;
            ctx.save();
            if (glow > 0) { ctx.shadowColor = '#ff0000'; ctx.shadowBlur = glow; }
            ctx.beginPath();
            // Outer arc (R + taper offset)
            for (let i = 0; i <= STEPS; i++) {
                const t    = i / STEPS;
                const ang  = angleCenter - halfSpan + t * halfSpan * 2;
                const taper = Math.sin(t * Math.PI);
                const r    = R + (maxWidth / 2) * taper;
                const px = cx + Math.cos(ang) * r;
                const py = cy + Math.sin(ang) * r;
                i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
            }
            // Inner arc (R - taper offset), traversed in reverse
            for (let i = STEPS; i >= 0; i--) {
                const t    = i / STEPS;
                const ang  = angleCenter - halfSpan + t * halfSpan * 2;
                const taper = Math.sin(t * Math.PI);
                const r    = R - (maxWidth / 2) * taper;
                ctx.lineTo(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r);
            }
            ctx.closePath();
            ctx.fillStyle = color;
            ctx.fill();
            ctx.restore();
        };

        allTargets.forEach(t => {
            const dx = t.x - cam.position.x;
            const dz = t.z - cam.position.z;

            let worldAngle = Math.atan2(dx, dz) * 180 / Math.PI;
            let rel = worldAngle - yaw;
            while (rel >  180) rel -= 360;
            while (rel < -180) rel += 360;

            if (Math.abs(rel) < 45) return;

            // Canvas angle: rel=0 (ahead) → straight up (−π/2)
            const angle = (rel - 90) * Math.PI / 180;

            // Soft outer haze
            drawLens(angle, 0.28, 28, 'rgba(255, 20, 20, 0.18)');
            // Bright glowing core
            drawLens(angle, 0.20, 13, 'rgba(255, 55, 55, 0.88)', 14);
        });
    }

    _drawGrenades(ctx) {
        const drawDot = (sx, sy, radius, color, glow) => {
            if (!Number.isFinite(sx) || !Number.isFinite(sy) || !this._isFiniteRadius(radius)) return;

            const outer = radius * 2.2;
            if (!this._isFiniteRadius(outer)) return;

            const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, outer);
            g.addColorStop(0, color);
            g.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.beginPath();
            ctx.arc(sx, sy, outer, 0, Math.PI * 2);
            ctx.fillStyle = g;
            ctx.fill();

            ctx.beginPath();
            ctx.arc(sx, sy, radius, 0, Math.PI * 2);
            ctx.fillStyle = glow;
            ctx.fill();
        };

        this._grenadeProjectiles.forEach(g => {
            const cam = this._world.renderer.worldToCamera(g.x, g.y, g.z);
            if (!cam || !Number.isFinite(cam.z) || cam.z <= 0) return;

            const proj = this._world.renderer.project3DTo2D(cam.x, cam.y, cam.z);
            if (!proj || !Number.isFinite(proj.x) || !Number.isFinite(proj.y)) return;

            const r = Math.max(3, Math.min(12, 140 / cam.z));
            if (!this._isFiniteRadius(r)) return;

            drawDot(proj.x, proj.y, r, 'rgba(120,220,120,0.7)', '#7ee27e');
        });

        this._grenadeFragments.forEach(f => {
            const cam = this._world.renderer.worldToCamera(f.x, f.y, f.z);
            if (!cam || !Number.isFinite(cam.z) || cam.z <= 0) return;

            const proj = this._world.renderer.project3DTo2D(cam.x, cam.y, cam.z);
            if (!proj || !Number.isFinite(proj.x) || !Number.isFinite(proj.y)) return;

            const s = Math.max(2, Math.min(7, 90 / cam.z));
            if (!this._isFiniteRadius(s)) return;

            ctx.save();
            ctx.translate(proj.x, proj.y);
            ctx.rotate((75 - f.life) * 0.18);
            ctx.fillStyle = '#d9d9d9';
            ctx.fillRect(-s, -s * 0.35, s * 2.2, s * 0.7);
            ctx.restore();
        });
    }

     _isFiniteRadius(value) {
        return Number.isFinite(value) && value > 0;
    }

    _drawSniperOrbGlows(ctx) {
        this._sniperOrbs.forEach(orb => {
            if (!orb.alive) return;
            const cam = this._world.renderer.worldToCamera(orb.x, orb.y, orb.z);
            if (!cam || !this._isFiniteNumber(cam.z) || cam.z <= 0) return;

            const proj = this._world.renderer.project3DTo2D(cam.x, cam.y, cam.z);
            if (!this._isFinitePoint2D(proj)) return;

            const { x, y } = proj;
            const radius = 28;
            if (!this._isFiniteNumber(radius) || radius <= 0) return;

            const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
            g.addColorStop(0, 'rgba(255,60,60,0.7)');
            g.addColorStop(0.35, 'rgba(255,0,0,0.4)');
            g.addColorStop(1, 'rgba(255,0,0,0)');
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fillStyle = g;
            ctx.fill();
        });
    }

     _isFiniteNumber(value) {
        return Number.isFinite(value);
    }

    _isFinitePoint2D(point) {
        return !!point &&
            this._isFiniteNumber(point.x) &&
            this._isFiniteNumber(point.y);
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

C

    _drawGun(ctx) {
        const cw = this._canvas.width;
        const ch = this._canvas.height;

        if (!this._gunOverlayReady) return;

        const naturalW = this._gunOverlayImg.naturalWidth || 1200;
        const naturalH = this._gunOverlayImg.naturalHeight || 500;
        const aspect = naturalW / naturalH;
        const drawW = Math.min(cw * 0.44, 400);
        const drawH = drawW / aspect;
        const baseX = (cw - drawW) / 2 + drawW * 0.5;
        const baseY = ch - drawH + 14;
        const drawX = baseX + this._gunRecoilX;
        const drawY = baseY + this._gunRecoilY;

        ctx.save();
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(this._gunOverlayImg, drawX, drawY, drawW, drawH);
        ctx.restore();
    }

    _drawGrenadeHud(ctx) {
        const cw = this._canvas.width;
        const count = this._grenades;
        const y = 56;
        const size = 12;
        const gap = 8;
        const totalW = count > 0 ? (count * size + (count - 1) * gap) : 0;
        const startX = cw / 2 - totalW / 2;

        ctx.save();
        ctx.font = 'bold 10px monospace';
        ctx.fillStyle = 'rgba(255,255,255,0.72)';
        ctx.textAlign = 'center';
        ctx.fillText('GRENADES (RIGHT CLICK)', cw / 2, y - 8);

        for (let i = 0; i < count; i++) {
            const x = startX + i * (size + gap);
            ctx.beginPath();
            ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
            ctx.fillStyle = '#66dd66';
            ctx.fill();
            ctx.strokeStyle = '#c8ffc8';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
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


    _drawTrackingOrbGlows(ctx) {
        const t = Date.now();
        this._trackingOrbs.forEach(orb => {
            if (!orb.alive) return;
            const cam = this._world.renderer.worldToCamera(orb.x, orb.y, orb.z);
            if (!cam || !this._isFiniteNumber(cam.z) || cam.z <= 0) return;

            const proj = this._world.renderer.project3DTo2D(cam.x, cam.y, cam.z);
            if (!this._isFinitePoint2D(proj)) return;

            const { x, y } = proj;
            const pulse = 0.6 + 0.4 * Math.sin(t / (orb.tracking ? 70 : 350));
            const radius = (orb.tracking ? 44 : 22) * pulse;
            if (!this._isFiniteNumber(radius) || radius <= 0) return;

            const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
            if (orb.tracking) {
                g.addColorStop(0,    'rgba(255,100,255,0.90)');
                g.addColorStop(0.3,  'rgba(180,0,255,0.60)');
                g.addColorStop(0.65, 'rgba(100,0,220,0.22)');
                g.addColorStop(1,    'rgba(80,0,180,0)');
            } else {
                g.addColorStop(0,    'rgba(160,60,255,0.55)');
                g.addColorStop(0.5,  'rgba(100,0,200,0.22)');
                g.addColorStop(1,    'rgba(60,0,150,0)');
            }
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fillStyle = g;
            ctx.fill();
        });
    }

    _isGrenadeNearAnyTarget(x, y, z, radius) {
        const within = (tx, ty, tz) => {
            const dx = tx - x;
            const dy = ty - y;
            const dz = tz - z;
            return (dx * dx + dy * dy + dz * dz) <= (radius * radius);
        };

        for (const t of this._targets) {
            if (!t.alive) continue;
            const c = this._world.renderer.getObjectCenter(t.mesh);
            if (within(c.x, c.y, c.z)) return true;
        }

        for (const o of this._orbs) {
            if (o.alive && within(o.x, o.y, o.z)) return true;
        }

        for (const o of this._sniperOrbs) {
            if (o.alive && within(o.x, o.y, o.z)) return true;
        }

        for (const o of this._trackingOrbs) {
            if (o.alive && within(o.x, o.y, o.z)) return true;
        }

        return false;
    }
}
