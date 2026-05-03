import { Mesh } from './renderer';

export class ShapeFactory {

    box(cx, baseY, cz, w, h, d) {
        const hw = w / 2, hd = d / 2;
        const vertices = [
            { x: cx - hw, y: baseY,     z: cz - hd },
            { x: cx + hw, y: baseY,     z: cz - hd },
            { x: cx + hw, y: baseY + h, z: cz - hd },
            { x: cx - hw, y: baseY + h, z: cz - hd },
            { x: cx - hw, y: baseY,     z: cz + hd },
            { x: cx + hw, y: baseY,     z: cz + hd },
            { x: cx + hw, y: baseY + h, z: cz + hd },
            { x: cx - hw, y: baseY + h, z: cz + hd },
        ];
        const faces = [
            [0, 1, 2], [0, 2, 3],   // front
            [5, 4, 7], [5, 7, 6],   // back
            [4, 0, 3], [4, 3, 7],   // left
            [1, 5, 6], [1, 6, 2],   // right
            [3, 2, 6], [3, 6, 7],   // top
            [4, 5, 1], [4, 1, 0],   // bottom
        ];
        return new Mesh(vertices, faces);
    }

    cylinder(cx, baseY, cz, radius, height, segments = 12) {
        const vertices = [];
        for (let i = 0; i < segments; i++) {
            const a = (i / segments) * Math.PI * 2;
            vertices.push({ x: cx + Math.cos(a) * radius, y: baseY + height, z: cz + Math.sin(a) * radius });
        }
        for (let i = 0; i < segments; i++) {
            const a = (i / segments) * Math.PI * 2;
            vertices.push({ x: cx + Math.cos(a) * radius, y: baseY, z: cz + Math.sin(a) * radius });
        }
        const faces = [];
        for (let i = 0; i < segments; i++) {
            const next = (i + 1) % segments;
            faces.push([i, next, next + segments]);
            faces.push([i, next + segments, i + segments]);
        }
        for (let i = 0; i < segments - 2; i++) faces.push([0, i + 1, i + 2]);
        for (let i = 0; i < segments - 2; i++) faces.push([segments, segments + i + 2, segments + i + 1]);
        return new Mesh(vertices, faces);
    }

    pyramid(cx, baseY, cz, baseW, baseD, height) {
        const hw = baseW / 2, hd = baseD / 2;
        const vertices = [
            { x: cx,      y: baseY + height, z: cz      },
            { x: cx - hw, y: baseY,          z: cz - hd },
            { x: cx + hw, y: baseY,          z: cz - hd },
            { x: cx + hw, y: baseY,          z: cz + hd },
            { x: cx - hw, y: baseY,          z: cz + hd },
        ];
        const faces = [
            [0, 1, 2], [0, 2, 3], [0, 3, 4], [0, 4, 1],
            [1, 2, 3], [1, 3, 4],
        ];
        return new Mesh(vertices, faces);
    }

    ground(size, divisions = 6) {
        const step = size / divisions;
        const half = size / 2;
        const vertices = [];
        const faces = [];
        for (let row = 0; row <= divisions; row++) {
            for (let col = 0; col <= divisions; col++) {
                vertices.push({ x: -half + col * step, y: 0, z: -half + row * step });
            }
        }
        const stride = divisions + 1;
        for (let row = 0; row < divisions; row++) {
            for (let col = 0; col < divisions; col++) {
                const i = row * stride + col;
                faces.push([i, i + stride + 1, i + 1]);
                faces.push([i, i + stride,     i + stride + 1]);
            }
        }
        return new Mesh(vertices, faces);
    }

    sphere(cx, cy, cz, radius, latSegments = 10, lonSegments = 16) {
        const vertices = [];
        const faces = [];
        for (let lat = 0; lat <= latSegments; lat++) {
            const phi = (lat / latSegments) * Math.PI;
            for (let lon = 0; lon <= lonSegments; lon++) {
                const theta = (lon / lonSegments) * Math.PI * 2;
                vertices.push({
                    x: cx + radius * Math.sin(phi) * Math.cos(theta),
                    y: cy + radius * Math.cos(phi),
                    z: cz + radius * Math.sin(phi) * Math.sin(theta),
                });
            }
        }
        const stride = lonSegments + 1;
        for (let lat = 0; lat < latSegments; lat++) {
            for (let lon = 0; lon < lonSegments; lon++) {
                const a = lat * stride + lon;
                const b = a + stride;
                faces.push([a, b, b + 1]);
                faces.push([a, b + 1, a + 1]);
            }
        }
        return new Mesh(vertices, faces);
    }

    bottle(cx, baseY, cz, scale = 1) {
        const seg = 10;
        const bodyR = 0.12 * scale;
        const neckR = 0.045 * scale;
        const bodyH = 0.38 * scale;
        const neckH = 0.42 * scale;
        const vertices = [];

        const addRing = (y, r) => {
            for (let i = 0; i < seg; i++) {
                const a = (i / seg) * Math.PI * 2;
                vertices.push({ x: cx + Math.cos(a) * r, y, z: cz + Math.sin(a) * r });
            }
        };

        addRing(baseY,                    bodyR); // ring 0: body bottom
        addRing(baseY + bodyH,            bodyR); // ring 1: body top
        addRing(baseY + bodyH,            neckR); // ring 2: neck bottom (shoulder inset)
        addRing(baseY + bodyH + neckH,    neckR); // ring 3: neck top
        vertices.push({ x: cx, y: baseY,                 z: cz }); // 4*seg:   bottom cap center
        vertices.push({ x: cx, y: baseY + bodyH + neckH, z: cz }); // 4*seg+1: top cap center

        const bBot = 0, bTop = seg, nBot = 2 * seg, nTop = 3 * seg;
        const capBot = 4 * seg, capTop = 4 * seg + 1;
        const faces = [];

        for (let i = 0; i < seg; i++) {
            const j = (i + 1) % seg;
            faces.push([bBot+i, bTop+i,  bTop+j]); faces.push([bBot+i, bTop+j,  bBot+j]); // body side
            faces.push([bTop+i, nBot+i,  nBot+j]); faces.push([bTop+i, nBot+j,  bTop+j]); // shoulder
            faces.push([nBot+i, nTop+i,  nTop+j]); faces.push([nBot+i, nTop+j,  nBot+j]); // neck side
            faces.push([capBot, bBot+j,  bBot+i]);                                          // bottom cap
            faces.push([capTop, nTop+i,  nTop+j]);                                          // top cap
        }

        return new Mesh(vertices, faces);
    }

    // ── Utilities ─────────────────────────────────────────────────────────────

    /** Combine multiple Mesh objects into one. */
    merge(meshes) {
        const allVerts = [];
        const allFaces = [];
        for (const m of meshes) {
            const offset = allVerts.length;
            allVerts.push(...m.vertices.map(v => ({ ...v })));
            allFaces.push(...m.faces.map(f => f.map(i => i + offset)));
        }
        return new Mesh(allVerts, allFaces);
    }

    /**
     * Low-poly man-on-horse statue.
     * Horse faces +Z (tail at back, head toward -Z).
     * @param {number} cx centre X
     * @param {number} baseY ground Y (hooves touch this)
     * @param {number} cz centre Z
     * @param {number} scale overall scale multiplier (default 1)
     */
    horseAndRider(cx, baseY, cz, scale = 1) {
        const s = scale;
        const parts = [
            // ── Horse ──────────────────────────────────────────────────────
            // Body
            this.box(cx, baseY + s*1.1, cz,          s*0.65, s*0.85, s*2.0),
            // Neck (slightly forward)
            this.box(cx, baseY + s*1.78, cz - s*0.82, s*0.48, s*0.70, s*0.46),
            // Head
            this.box(cx, baseY + s*2.28, cz - s*1.18, s*0.42, s*0.42, s*0.66),
            // Snout
            this.box(cx, baseY + s*2.04, cz - s*1.60, s*0.26, s*0.20, s*0.44),
            // Ear L
            this.box(cx - s*0.14, baseY + s*2.60, cz - s*1.12, s*0.10, s*0.22, s*0.10),
            // Ear R
            this.box(cx + s*0.14, baseY + s*2.60, cz - s*1.12, s*0.10, s*0.22, s*0.10),
            // Front left leg
            this.box(cx - s*0.21, baseY, cz - s*0.62, s*0.21, s*1.10, s*0.21),
            // Front right leg
            this.box(cx + s*0.21, baseY, cz - s*0.62, s*0.21, s*1.10, s*0.21),
            // Back left leg
            this.box(cx - s*0.21, baseY, cz + s*0.62, s*0.21, s*1.10, s*0.21),
            // Back right leg
            this.box(cx + s*0.21, baseY, cz + s*0.62, s*0.21, s*1.10, s*0.21),
            // Tail
            this.box(cx, baseY + s*1.55, cz + s*1.14, s*0.13, s*0.42, s*0.42),
            // ── Rider ──────────────────────────────────────────────────────
            // Hips / seat
            this.box(cx, baseY + s*2.18, cz - s*0.10, s*0.46, s*0.28, s*0.32),
            // Torso
            this.box(cx, baseY + s*2.75, cz - s*0.10, s*0.40, s*0.58, s*0.26),
            // Head
            this.sphere(cx, baseY + s*3.38, cz - s*0.10, s*0.28, 5, 8),
            // Hat brim
            this.box(cx, baseY + s*3.64, cz - s*0.10, s*0.54, s*0.08, s*0.54),
            // Hat crown
            this.box(cx, baseY + s*3.82, cz - s*0.10, s*0.34, s*0.24, s*0.34),
            // Left arm (raised slightly forward — holding reins)
            this.box(cx - s*0.34, baseY + s*2.76, cz - s*0.30, s*0.16, s*0.54, s*0.16),
            // Right arm
            this.box(cx + s*0.34, baseY + s*2.76, cz - s*0.30, s*0.16, s*0.54, s*0.16),
            // Left lower leg / stirrup
            this.box(cx - s*0.32, baseY + s*1.62, cz + s*0.15, s*0.15, s*0.52, s*0.15),
            // Right lower leg / stirrup
            this.box(cx + s*0.32, baseY + s*1.62, cz + s*0.15, s*0.15, s*0.52, s*0.15),
        ];
        return this.merge(parts);
    }
}
