import React, { useRef, useEffect } from 'react';
import BackLink from '../comps/backLink';
import { Mesh } from '../utils/services/rederer';
import { World } from '../utils/services/world';
import { FirstPersonController } from '../utils/services/firstPersonController';

// ---- Mesh factory helpers ----

function createBox(cx, baseY, cz, w, h, d) {
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
        [0, 1, 2], [0, 2, 3],
        [5, 4, 7], [5, 7, 6],
        [4, 0, 3], [4, 3, 7],
        [1, 5, 6], [1, 6, 2],
        [3, 2, 6], [3, 6, 7],
        [4, 5, 1], [4, 1, 0],
    ];
    return new Mesh(vertices, faces);
}

function createCylinder(cx, baseY, cz, radius, height, segments = 12) {
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

function createPyramid(cx, baseY, cz, baseW, baseD, height) {
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

function createGround(size, divisions = 6) {
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

// ---- Page component ----

const ShapeWorld = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;

        const world = new World(canvas, {
            backgroundColor: '#87ceeb',
            focalLength: 800,
            cameraPosition: { x: 0, y: 1.7, z: -10 },
            lightPosition:  { x: 5, y: 15,  z: -5  },
        });

        const controller = new FirstPersonController(world);
        controller.attach(canvas);

        // Hook controller.update() into the world's render loop
        world._onBeforeRender = () => controller.update();

        // ---- Scene objects ----
        world.add(createGround(30),                              '#c8c8c8', true);
        world.add(createBox(       0,  0,  2,  1,   4,   1  ),  '#4af'  );
        world.add(createCylinder( -5,  0,  4,  0.7, 2.5     ),  '#fa4'  );
        world.add(createPyramid(   5,  0,  5,  2,   2,   3  ),  '#4fa'  );
        world.add(createBox(       0,  0,  9,  0.8, 0.8, 0.8),  '#f4a'  );
        world.add(createBox(      -9,  0,  7,  3,   0.5, 2  ),  '#aaf'  );
        world.add(createCylinder(  7,  0,  1,  0.3, 4       ),  '#faa'  );
        world.add(createPyramid(  -6,  0, -1,  2.5, 2.5, 2  ),  '#fa8'  );
        world.add(createBox(       8,  0,  9,  1.5, 2,   1.5),  '#8af'  );
        world.add(createCylinder( -3,  0, 11,  0.5, 1       ),  '#af8'  );
        world.add(createBox(       3,  0, -3,  0.5, 5,   0.5),  '#f8a'  );

        world.start();

        return () => {
            world.stop();
            controller.detach();
        };
    }, []);

    return (
        <div style={{ background: '#1a1a2e', minHeight: '100vh', padding: '20px' }}>
            <BackLink />
            <h1 style={{ color: '#ccc', textAlign: 'center', marginBottom: '4px' }}>Shape World</h1>
            <p style={{ color: '#888', textAlign: 'center', marginBottom: '12px', fontSize: '14px' }}>
                Click the canvas to enable mouse look &mdash; press <kbd style={{ background: '#333', color: '#ccc', padding: '1px 5px', borderRadius: '3px' }}>Esc</kbd> to release
            </p>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <canvas
                    ref={canvasRef}
                    width={1100}
                    height={600}
                    style={{ border: '2px solid #444', cursor: 'crosshair', display: 'block' }}
                />
            </div>
            <p style={{ color: '#555', textAlign: 'center', marginTop: '10px', fontSize: '13px' }}>
                <strong style={{ color: '#888' }}>Move:</strong> W A S D &nbsp;&nbsp;
                <strong style={{ color: '#888' }}>Up / Down:</strong> Q / E &nbsp;&nbsp;
                <strong style={{ color: '#888' }}>Look:</strong> Click canvas, then move mouse
            </p>
        </div>
    );
};

export default ShapeWorld;
