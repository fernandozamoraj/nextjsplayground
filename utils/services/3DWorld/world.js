import { Renderer, Light } from './renderer';

export class World {
    /**
     * @param {HTMLCanvasElement} canvas
     * @param {object} options
     * @param {string}  [options.backgroundColor='#87ceeb']
     * @param {number}  [options.focalLength=800]
     * @param {object}  [options.cameraPosition]  { x, y, z }
     * @param {object}  [options.lightPosition]   { x, y, z }
     */
    constructor(canvas, options = {}) {
        this.renderer = new Renderer(canvas, {
            focalLength:     options.focalLength     || 800,
            backgroundColor: options.backgroundColor || '#87ceeb',
        });

        const cam = options.cameraPosition || { x: 0, y: 1.7, z: -10 };
        this.renderer.setCamera(cam.x, cam.y, cam.z);

        const lp = options.lightPosition || { x: 5, y: 15, z: -5 };
        this.light = new Light(lp.x, lp.y, lp.z);

        // { mesh, color, isGround }
        this._objects = [];
        this._animationId = null;
    }

    get camera() {
        return this.renderer.camera;
    }

    /** Add a mesh to the world. Pass isGround=true for the floor object. */
    add(mesh, color = '#ffffff', isGround = false) {
        this._objects.push({ mesh, color, isGround });
        return this;
    }

    /** Start the render loop. */
    start() {
        const loop = () => {
            if (this._onBeforeRender) this._onBeforeRender();
            this._renderFrame();
            this._animationId = requestAnimationFrame(loop);
        };
        this._animationId = requestAnimationFrame(loop);
    }

    /** Stop the render loop. */
    stop() {
        if (this._animationId !== null) {
            cancelAnimationFrame(this._animationId);
            this._animationId = null;
        }
    }

    _renderFrame() {
        const ground  = this._objects.find(o => o.isGround);
        const objects = this._objects.filter(o => !o.isGround);

        // Depth-sort non-ground objects farthest-first (painter's algorithm)
        const cam = this.renderer.camera.position;
        const sorted = [...objects].sort((a, b) => {
            const ca = this.renderer.getObjectCenter(a.mesh);
            const cb = this.renderer.getObjectCenter(b.mesh);
            const da = (ca.x - cam.x) ** 2 + (ca.y - cam.y) ** 2 + (ca.z - cam.z) ** 2;
            const db = (cb.x - cam.x) ** 2 + (cb.y - cam.y) ** 2 + (cb.z - cam.z) ** 2;
            return db - da;
        });

        // Ground always drawn first (clears canvas), objects drawn on top
        if (ground) {
            this.renderer.render(ground.mesh, true, ground.color, this.light);
        } else {
            this.renderer.clear();
        }

        sorted.forEach(obj => {
            this.renderer.render(obj.mesh, false, obj.color, this.light);
        });
    }
}
