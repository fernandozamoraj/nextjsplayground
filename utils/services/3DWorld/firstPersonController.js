/**
 * FirstPersonController
 *
 * Attaches keyboard and mouse-pointer-lock controls to a World's camera.
 * Controls:
 *   W / S       — move forward / back
 *   A / D       — strafe left / right
 *   Q / E       — move up / down
 *   Shift       — hold to sprint (2.5× speed)
 *   Mouse       — click canvas to lock pointer; move mouse to look
 *   Esc         — release pointer lock
 */
export class FirstPersonController {
    /**
     * @param {import('./world').World} world
     * @param {object} options
     * @param {number} [options.moveSpeed=0.08]
     * @param {number} [options.mouseSensitivity=0.25]
     * @param {number} [options.minPitch=-80]
     * @param {number} [options.maxPitch=80]
     */
    constructor(world, options = {}) {
        this.camera          = world.camera;
        this.moveSpeed       = options.moveSpeed       ?? 0.08;
        this.mouseSensitivity = options.mouseSensitivity ?? 0.25;
        this.minPitch        = options.minPitch        ?? -80;
        this.maxPitch        = options.maxPitch        ??  80;

        this._keys          = new Set();
        this._pointerLocked = false;
        this._canvas        = null;

        // Footstep sound
        this._stepAudio     = new Audio('/sounds/step.wav');
        this._stepAudio.load();
        this._stepTimer     = 0;   // frames since last step
        this._stepInterval  = 22;  // frames between steps at walk speed
        this._stepClipTimer = null; // timeout handle to cut clip at 0.5s

        // Ladder zones (set by ShooterGame after build)
        this._ladders  = null;
        this._groundY  = 0; // set on attach()
        this._floors   = null; // box surface AABBs for gravity collision
        this._velY     = 0;   // vertical velocity for gravity
        this.onLadder  = false; // readable by page for HUD

        // Landing thump sound
        this._thumpAudio = new Audio('/sounds/thump.wav');
        this._thumpAudio.load();

        // Bound handlers kept as references so they can be removed
        this._onKeyDown           = this._onKeyDown.bind(this);
        this._onKeyUp             = this._onKeyUp.bind(this);
        this._onMouseMove         = this._onMouseMove.bind(this);
        this._onPointerLockChange = this._onPointerLockChange.bind(this);
        this._onCanvasClick       = this._onCanvasClick.bind(this);
    }

    /** Attach controls to a canvas element. Call once after mount. */
    attach(canvas) {
        this._canvas  = canvas;
        this._groundY = this.camera.position.y; // snapshot floor-level camera Y
        window.addEventListener('keydown',         this._onKeyDown);
        window.addEventListener('keyup',           this._onKeyUp);
        document.addEventListener('mousemove',     this._onMouseMove);
        document.addEventListener('pointerlockchange', this._onPointerLockChange);
        canvas.addEventListener('click',           this._onCanvasClick);
    }

    /** Remove all event listeners. Call on unmount. */
    detach() {
        window.removeEventListener('keydown',         this._onKeyDown);
        window.removeEventListener('keyup',           this._onKeyUp);
        document.removeEventListener('mousemove',     this._onMouseMove);
        document.removeEventListener('pointerlockchange', this._onPointerLockChange);
        if (this._canvas) {
            this._canvas.removeEventListener('click', this._onCanvasClick);
        }
        if (document.pointerLockElement === this._canvas) {
            document.exitPointerLock();
        }
        this._stepAudio.pause();
        this._canvas = null;
    }

    /** Provide ladder zones so update() can detect and handle climbing. */
    setLadders(ladders) {
        this._ladders = ladders;
    }

    /** Provide box surface AABBs so gravity can land on walls. */
    setFloors(floors) {
        this._floors = floors;
    }

    /**
     * Apply movement for one frame based on currently held keys.
     * Call this once per animation frame (before rendering).
     */
    update() {
        const k = this._keys;
        const sprinting = k.has('shift');
        const speed = this.moveSpeed * (sprinting ? 2.5 : 1);
        const movingHoriz = k.has('w') || k.has('s') || k.has('a') || k.has('d');
        const GY = this._groundY;       // camera Y at ground level (0.6)
        const EYE = GY;                 // eye offset above feet = GY
        const LADDER_RADIUS = 1.5;
        const CLIMB_SPEED = this.moveSpeed * 2.0;
        const GRAVITY = 0.005;
        const TERM_VEL = -0.4;

        // ── Find the floor surface directly under the player ──────────────
        const feetY = this.camera.position.y - EYE;
        let floorWorldY = 0; // world ground
        if (this._floors) {
            for (const f of this._floors) {
                if (this.camera.position.x >= f.minX &&
                    this.camera.position.x <= f.maxX &&
                    this.camera.position.z >= f.minZ &&
                    this.camera.position.z <= f.maxZ &&
                    f.topY <= feetY + 0.15 &&
                    f.topY > floorWorldY) {
                    floorWorldY = f.topY;
                }
            }
        }
        const floorCamY = floorWorldY + EYE;

        // ── Detect active ladder ──────────────────────────────────────────
        let activeLadder = null;
        if (this._ladders) {
            for (const ld of this._ladders) {
                const dx = this.camera.position.x - ld.x;
                const dz = this.camera.position.z - ld.z;
                if (Math.sqrt(dx * dx + dz * dz) < LADDER_RADIUS &&
                    this.camera.position.y < ld.topY + GY + 0.3) {
                    activeLadder = ld;
                    break;
                }
            }
        }

        if (activeLadder) {
            this.onLadder = true;
            this._velY = 0; // reset gravity while on ladder
            const atTop = this.camera.position.y >= activeLadder.topY + GY - 0.2;
            if (atTop) {
                // At the top — W/S move forward so player can step off onto the wall
                if (k.has('w')) this.camera.moveForward(speed);
                if (k.has('s')) this.camera.moveForward(-speed);
            } else {
                // Climbing — W goes up, S goes down at 2× speed
                if (k.has('w')) this.camera.moveVertical(CLIMB_SPEED);
                if (k.has('s')) this.camera.moveVertical(-CLIMB_SPEED);
            }
            // A/D always available to strafe off the ladder
            if (k.has('a')) this.camera.strafeRight(-speed);
            if (k.has('d')) this.camera.strafeRight(speed);
            // Snap XZ to ladder center — disabled at top so player can step off freely
            if (!atTop) {
                this.camera.position.x += (activeLadder.x - this.camera.position.x) * 0.25;
                this.camera.position.z += (activeLadder.z - this.camera.position.z) * 0.25;
            }
            // Clamp Y to ladder range
            const minY = GY;
            const maxY = activeLadder.topY + GY;
            this.camera.position.y = Math.max(minY, Math.min(maxY, this.camera.position.y));
        } else {
            this.onLadder = false;
            // Horizontal movement
            if (k.has('w')) this.camera.moveForward(speed);
            if (k.has('s')) this.camera.moveForward(-speed);
            if (k.has('a')) this.camera.strafeRight(-speed);
            if (k.has('d')) this.camera.strafeRight(speed);
            // Gravity
            this._velY = Math.max(this._velY - GRAVITY, TERM_VEL);
            this.camera.position.y += this._velY;
            // Land on floor
            if (this.camera.position.y < floorCamY) {
                const impact = this._velY; // negative — how hard we hit
                this.camera.position.y = floorCamY;
                this._velY = 0;
                if (impact < -0.05) {
                    this._thumpAudio.currentTime = 0;
                    this._thumpAudio.play().catch(() => {});
                }
            }
        }

        // Footstep audio — silent while on a ladder
        const interval = sprinting ? 19 : 26;
        if (movingHoriz && this._pointerLocked && !activeLadder) {
            this._stepTimer++;
            if (this._stepTimer >= interval) {
                this._stepTimer = 0;
                clearTimeout(this._stepClipTimer);
                this._stepAudio.playbackRate = sprinting ? 1.5 : 1.0;
                this._stepAudio.currentTime = 0;
                this._stepAudio.play().catch(() => {});
                this._stepClipTimer = setTimeout(() => {
                    this._stepAudio.pause();
                    this._stepAudio.currentTime = 0;
                }, 750);
            }
        } else {
            if (!this._stepAudio.paused) {
                this._stepAudio.pause();
                this._stepAudio.currentTime = 0;
            }
            this._stepTimer = interval;
        }
    }

    _onKeyDown(e) {
        const key = e.key === 'Shift' ? 'shift' : e.key.toLowerCase();
        this._keys.add(key);
        if (['w', 'a', 's', 'd'].includes(key)) e.preventDefault();
    }

    _onKeyUp(e) {
        const key = e.key === 'Shift' ? 'shift' : e.key.toLowerCase();
        this._keys.delete(key);
    }

    _onMouseMove(e) {
        if (!this._pointerLocked) return;
        this.camera.rotation.yaw += e.movementX * this.mouseSensitivity;
        this.camera.rotation.pitch = Math.max(
            this.minPitch,
            Math.min(this.maxPitch, this.camera.rotation.pitch + e.movementY * this.mouseSensitivity)
        );
    }

    _onPointerLockChange() {
        this._pointerLocked = document.pointerLockElement === this._canvas;
    }

    _onCanvasClick() {
        if (this._canvas) this._canvas.requestPointerLock();
    }
}
