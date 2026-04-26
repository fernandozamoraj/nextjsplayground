import { Mesh } from './renderer';

/**
 * Explosion particle effect.
 * Spawns small shard meshes that fly outward and fall under gravity.
 * Call update() every frame from _onBeforeRender.
 * Check .alive to know when all fragments have landed (safe to discard).
 */
export class Explosion {

    /**
     * @param {object} world       - World instance
     * @param {number} x           - World-space origin X
     * @param {number} y           - World-space origin Y
     * @param {number} z           - World-space origin Z
     * @param {string} color       - Hex color for shards (e.g. '#dd2233')
     * @param {object} [options]
     * @param {number} [options.count=22]      - Number of shards
     * @param {number} [options.gravity=-0.016] - Downward acceleration per frame
     * @param {number} [options.speed=0.12]    - Max launch speed
     */
    constructor(world, x, y, z, color, options = {}) {
        this._world   = world;
        this._alive   = true;
        this._gravity = options.gravity ?? -0.006;
        this._fragments = [];
        this._spawn(x, y, z, color, options.count ?? 35, options.speed ?? 0.22, options.size ?? 0.18);
    }

    // ---- private helpers ----

    _makeShard(x, y, z, s) {
        // Irregular tetrahedron so each piece looks a bit different
        const jitter = () => (Math.random() - 0.5) * s * 0.6;
        const vertices = [
            { x: x + jitter(), y: y + s,       z: z + jitter() },
            { x: x - s,        y: y - s * 0.5, z: z - s + jitter() },
            { x: x + s,        y: y - s * 0.5, z: z - s + jitter() },
            { x: x + jitter(), y: y - s * 0.5, z: z + s },
        ];
        const faces = [[0, 1, 2], [0, 2, 3], [0, 3, 1], [1, 3, 2]];
        return new Mesh(vertices, faces);
    }

    _spawn(ox, oy, oz, color, count, maxSpeed, baseSize) {
        for (let i = 0; i < count; i++) {
            // Spherical random direction, biased slightly upward
            const theta = Math.random() * Math.PI * 2;
            const phi   = (Math.random() * 0.7 + 0.15) * Math.PI; // avoid straight down
            const speed = maxSpeed * (0.4 + Math.random() * 0.6);

            const vx = Math.sin(phi) * Math.cos(theta) * speed;
            const vy = Math.abs(Math.cos(phi)) * speed + 0.06 + Math.random() * 0.08;
            const vz = Math.sin(phi) * Math.sin(theta) * speed;

            const s    = baseSize * (0.5 + Math.random());
            const mesh = this._makeShard(ox, oy, oz, s);

            this._world.add(mesh, color);
            this._fragments.push({ mesh, vx, vy, vz, dead: false });
        }
    }

    // ---- public API ----

    /** Advance all fragments one frame. Call once per frame. */
    update() {
        if (!this._alive) return;

        let anyAlive = false;

        this._fragments.forEach(f => {
            if (f.dead) return;

            // Translate every vertex by the fragment's velocity
            f.mesh.vertices = f.mesh.vertices.map(v => ({
                x: v.x + f.vx,
                y: v.y + f.vy,
                z: v.z + f.vz,
            }));

            // Gravity
            f.vy += this._gravity;

            // Land when lowest vertex hits ground
            const minY = Math.min(...f.mesh.vertices.map(v => v.y));
            if (minY <= 0) {
                f.dead = true;
                this._world._objects = this._world._objects.filter(o => o.mesh !== f.mesh);
            } else {
                anyAlive = true;
            }
        });

        if (!anyAlive) this._alive = false;
    }

    /** True until all shards have landed and been removed from the scene. */
    get alive() { return this._alive; }
}
