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
}
