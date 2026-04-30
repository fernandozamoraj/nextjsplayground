/**
 * FirstPersonController
 *
 * Attaches keyboard + mouse (pointer-lock) controls, and Xbox controller
 * (Gamepad API) controls to a World's camera.
 *
 * Keyboard / Mouse:
 *   W / S            — forward / back
 *   A / D            — strafe left / right
 *   Shift            — sprint (2.5×)
 *   Mouse look       — click canvas to lock pointer, then move mouse
 *   Esc              — release pointer lock
 *
 * Xbox 360 Controller (standard mapping):
 *   Left stick       — move (forward / back / strafe)
 *   Right stick      — look (yaw / pitch)
 *   LB (button 4)    — sprint
 *   RT (button 7)    — shoot  (exposed via this.shootTriggered)
 *
 * When a gamepad is connected it takes control; keyboard/mouse continue
 * to work simultaneously.
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
        this.moveSpeed              = options.moveSpeed              ?? 0.08;
        this.mouseSensitivity        = options.mouseSensitivity        ?? 0.25;
        this.gamepadLookSensitivity  = options.gamepadLookSensitivity  ?? 2.5;
        this.minPitch                = options.minPitch                ?? -80;
        this.maxPitch                = options.maxPitch                ??  80;

        this._keys          = new Set();
        this._gpSynthKeys   = new Set();   // keys injected by gamepad this frame
        this._pointerLocked = false;
        this._canvas        = null;

        // Gamepad state
        this._usingGamepad  = false;
        this.gamepadConnected = false;     // true once browser exposes the gamepad
        this.shootTriggered  = false;      // true for one frame when RT pressed
        this.reloadTriggered = false;      // true for one frame when X pressed
        this._prevRtPressed  = false;
        this._prevXPressed   = false;

        // Virtual joystick input (touch)
        this._virtLX = 0; this._virtLY = 0;
        this._virtRX = 0; this._virtRY = 0;
        this._virtualFirePending   = false;
        this._virtualReloadPending = false;

        this._onGamepadConnected    = this._onGamepadConnected.bind(this);
        this._onGamepadDisconnected = this._onGamepadDisconnected.bind(this);

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
        window.addEventListener('keydown',             this._onKeyDown);
        window.addEventListener('keyup',               this._onKeyUp);
        window.addEventListener('gamepadconnected',    this._onGamepadConnected);
        window.addEventListener('gamepaddisconnected', this._onGamepadDisconnected);
        document.addEventListener('mousemove',         this._onMouseMove);
        document.addEventListener('pointerlockchange', this._onPointerLockChange);
        canvas.addEventListener('click',               this._onCanvasClick);
    }

    /** Remove all event listeners. Call on unmount. */
    detach() {
        window.removeEventListener('keydown',             this._onKeyDown);
        window.removeEventListener('keyup',               this._onKeyUp);
        window.removeEventListener('gamepadconnected',    this._onGamepadConnected);
        window.removeEventListener('gamepaddisconnected', this._onGamepadDisconnected);
        document.removeEventListener('mousemove',         this._onMouseMove);
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

    // ── Virtual joystick ────────────────────────────────────────────────────

    setVirtualLeft(x, y)  { this._virtLX = x; this._virtLY = y; }
    setVirtualRight(x, y) { this._virtRX = x; this._virtRY = y; }
    triggerVirtualFire()   { this._virtualFirePending   = true; }
    triggerVirtualReload() { this._virtualReloadPending = true; }

    /**
     * Apply movement for one frame based on currently held keys.
     * Call this once per animation frame (before rendering).
     */
    update() {
        this.shootTriggered  = false;
        this.reloadTriggered = false;
        if (this._virtualFirePending)   { this.shootTriggered  = true; this._virtualFirePending   = false; }
        if (this._virtualReloadPending) { this.reloadTriggered = true; this._virtualReloadPending = false; }
        this._pollGamepad();
        this._applyVirtualSticks();

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

        // Footstep audio — silent while on a ladder.
        // Allow footsteps when pointer-locked (mouse) OR when gamepad is active.
        const interval = sprinting ? 19 : 26;
        if (movingHoriz && (this._pointerLocked || this._usingGamepad) && !activeLadder) {
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

    // ── Virtual stick application ────────────────────────────────────────────

    _applyVirtualSticks() {
        const DEAD = 0.08;
        const lx = Math.abs(this._virtLX) > DEAD ? this._virtLX : 0;
        const ly = Math.abs(this._virtLY) > DEAD ? this._virtLY : 0;
        const rx = Math.abs(this._virtRX) > DEAD ? this._virtRX : 0;
        const ry = Math.abs(this._virtRY) > DEAD ? this._virtRY : 0;

        if (lx || ly) {
            const add = k => { this._keys.add(k); this._gpSynthKeys.add(k); };
            if (ly < 0) add('w');
            if (ly > 0) add('s');
            if (lx < 0) add('a');
            if (lx > 0) add('d');
        }

        if (rx || ry) {
            const sens = this.gamepadLookSensitivity;
            this.camera.rotation.yaw += rx * sens;
            this.camera.rotation.pitch = Math.max(
                this.minPitch,
                Math.min(this.maxPitch, this.camera.rotation.pitch + ry * sens)
            );
        }
    }

    // ── Gamepad polling ──────────────────────────────────────────────────────

    _pollGamepad() {
        // Remove keys that were injected by the gamepad last frame
        this._gpSynthKeys.forEach(k => this._keys.delete(k));
        this._gpSynthKeys.clear();

        const gamepads = navigator.getGamepads ? Array.from(navigator.getGamepads()) : [];
        const gp = gamepads.find(g => g && g.connected) ?? null;

        if (!gp) {
            this._usingGamepad = false;
            this._prevRtPressed = false;
            return;
        }
        this._usingGamepad    = true;
        this.gamepadConnected = true; // confirm once polled successfully

        const DEAD = 0.15;
        const ax = v => (Math.abs(v) > DEAD ? v : 0);

        const leftX  = ax(gp.axes[0] ?? 0);
        const leftY  = ax(gp.axes[1] ?? 0);
        const rightX = ax(gp.axes[2] ?? 0);
        const rightY = ax(gp.axes[3] ?? 0);

        // Synthesize movement keys from left stick
        const addKey = key => { this._keys.add(key); this._gpSynthKeys.add(key); };
        if (leftY < 0) addKey('w');
        if (leftY > 0) addKey('s');
        if (leftX < 0) addKey('a');
        if (leftX > 0) addKey('d');

        // LB (button 4) = sprint
        if (gp.buttons[4]?.pressed) addKey('shift');

        // Right stick — look (works without pointer lock when gamepad is active)
        const sens = this.gamepadLookSensitivity;
        this.camera.rotation.yaw += rightX * sens;
        this.camera.rotation.pitch = Math.max(
            this.minPitch,
            Math.min(this.maxPitch, this.camera.rotation.pitch + rightY * sens)
        );

        // RT (button 7) — shoot, rising-edge only
        const rtNow = gp.buttons[7]?.pressed ?? false;
        if (rtNow && !this._prevRtPressed) this.shootTriggered = true;
        this._prevRtPressed = rtNow;

        // X button (button 2) — reload, rising-edge only
        const xNow = gp.buttons[2]?.pressed ?? false;
        if (xNow && !this._prevXPressed) this.reloadTriggered = true;
        this._prevXPressed = xNow;
    }

    // ── Gamepad connection handlers ──────────────────────────────────────────

    _onGamepadConnected(e) {
        if (e.gamepad && e.gamepad.connected) {
            this.gamepadConnected = true;
        }
    }

    _onGamepadDisconnected() {
        this.gamepadConnected = false;
        this._usingGamepad    = false;
        this._prevRtPressed   = false;
    }

    // ── Keyboard handlers ────────────────────────────────────────────────────

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
