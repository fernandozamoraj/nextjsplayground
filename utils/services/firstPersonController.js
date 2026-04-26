/**
 * FirstPersonController
 *
 * Attaches keyboard and mouse-pointer-lock controls to a World's camera.
 * Controls:
 *   W / S       — move forward / back
 *   A / D       — strafe left / right
 *   Q / E       — move up / down
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

        // Bound handlers kept as references so they can be removed
        this._onKeyDown           = this._onKeyDown.bind(this);
        this._onKeyUp             = this._onKeyUp.bind(this);
        this._onMouseMove         = this._onMouseMove.bind(this);
        this._onPointerLockChange = this._onPointerLockChange.bind(this);
        this._onCanvasClick       = this._onCanvasClick.bind(this);
    }

    /** Attach controls to a canvas element. Call once after mount. */
    attach(canvas) {
        this._canvas = canvas;
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
        this._canvas = null;
    }

    /**
     * Apply movement for one frame based on currently held keys.
     * Call this once per animation frame (before rendering).
     */
    update() {
        const k = this._keys;
        const speed = this.moveSpeed;
        if (k.has('w')) this.camera.moveForward(speed);
        if (k.has('s')) this.camera.moveForward(-speed);
        if (k.has('a')) this.camera.strafeRight(-speed);
        if (k.has('d')) this.camera.strafeRight(speed);
        if (k.has('q')) this.camera.moveVertical(speed);
        if (k.has('e')) this.camera.moveVertical(-speed);
    }

    _onKeyDown(e) {
        const key = e.key.toLowerCase();
        this._keys.add(key);
        if (['w', 'a', 's', 'd', 'q', 'e'].includes(key)) e.preventDefault();
    }

    _onKeyUp(e) {
        this._keys.delete(e.key.toLowerCase());
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
