import React, { useRef, useEffect } from 'react';
import BackLink from '../comps/backLink';
import { World } from '../utils/services/3DWorld/world';
import { FirstPersonController } from '../utils/services/3DWorld/firstPersonController';
import { ShapeFactory } from '../utils/services/3DWorld/shapeFactory';

const shapes = new ShapeFactory();

// ---- Page component ----

const ShapeWorld = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;

        const world = new World(canvas, {
            backgroundColor: '#87ceeb',
            focalLength: 800,
            cameraPosition: { x: 0, y: 0.6, z: -10 },
            lightPosition:  { x: 60, y: 60,  z: -20  },
        });

        const controller = new FirstPersonController(world, { verticalFlight: true });
        controller.attach(canvas);

        // Hook controller.update() into the world's render loop
        world._onBeforeRender = () => controller.update();

        // ---- Floating rotating shapes ----
        // Rodrigues rotation: rotate point p around unit axis u by angle θ
        function rotatePoint(p, cx, cy, cz, ux, uy, uz, angle) {
            const cos = Math.cos(angle), sin = Math.sin(angle), t = 1 - cos;
            const dx = p.x - cx, dy = p.y - cy, dz = p.z - cz;
            const dot = ux * dx + uy * dy + uz * dz;
            return {
                x: cx + dx * cos + (uy * dz - uz * dy) * sin + ux * dot * t,
                y: cy + dy * cos + (uz * dx - ux * dz) * sin + uy * dot * t,
                z: cz + dz * cos + (ux * dy - uy * dx) * sin + uz * dot * t,
            };
        }

        function randomAxis() {
            // random axis not aligned to x/y/z — all components non-zero
            const v = {
                x: 0.3 + Math.random() * 0.7,
                y: 0.3 + Math.random() * 0.7,
                z: 0.3 + Math.random() * 0.7,
            };
            if (Math.random() < 0.5) v.x = -v.x;
            if (Math.random() < 0.5) v.y = -v.y;
            if (Math.random() < 0.5) v.z = -v.z;
            const len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
            return { x: v.x / len, y: v.y / len, z: v.z / len };
        }

        // Build the 4 floating shapes
        const floaters = [
            { mesh: shapes.sphere(   -6, 5,  4, 0.9, 8, 12), color: '#ff6688', cx: -6, cy: 5.9, cz:  4 },
            { mesh: shapes.box(       0, 4,  8, 1.2, 1.2, 1.2), color: '#44ddff', cx: 0,  cy: 4.6, cz:  8 },
            { mesh: shapes.cylinder(  6, 4,  3, 0.6, 1.4, 14),  color: '#ffcc44', cx: 6,  cy: 4.7, cz:  3 },
            { mesh: shapes.pyramid(  -2, 4, 12, 1.5, 1.5, 2),   color: '#88ff88', cx: -2, cy: 5,   cz: 12 },
        ].map(f => {
            const axis = randomAxis();
            const speed = 0.008 + Math.random() * 0.012; // radians per frame
            // Snapshot original vertex positions
            const origVerts = f.mesh.vertices.map(v => ({ ...v }));
            world.add(f.mesh, f.color);
            return { mesh: f.mesh, origVerts, cx: f.cx, cy: f.cy, cz: f.cz, axis, speed, angle: 0 };
        });

        world._onBeforeRender = () => {
            controller.update();
            for (const f of floaters) {
                f.angle += f.speed;
                const { cx, cy, cz, axis: { x: ux, y: uy, z: uz }, angle } = f;
                f.origVerts.forEach((orig, i) => {
                    const r = rotatePoint(orig, cx, cy, cz, ux, uy, uz, angle);
                    f.mesh.vertices[i].x = r.x;
                    f.mesh.vertices[i].y = r.y;
                    f.mesh.vertices[i].z = r.z;
                });
            }
        };

        // ---- Scene objects ----
        world.add(shapes.ground(30),                              '#c8c8c8', true);
        world.add(shapes.horseAndRider(-8, 0, 6, 1.4),            '#b87333');  // bronze statue
        world.add(shapes.box(       0,  0,  2,  1,   4,   1  ),  '#4af'  );
        world.add(shapes.cylinder( -5,  0,  4,  0.7, 2.5     ),  '#fa4'  );
        world.add(shapes.pyramid(   5,  0,  5,  2,   2,   3  ),  '#4fa'  );
        world.add(shapes.box(       0,  0,  9,  0.8, 0.8, 0.8),  '#f4a'  );
        world.add(shapes.box(      -9,  0,  7,  3,   0.5, 2  ),  '#aaf'  );
        world.add(shapes.cylinder(  7,  0,  1,  0.3, 4       ),  '#faa'  );
        world.add(shapes.pyramid(  -6,  0, -1,  2.5, 2.5, 2  ),  '#fa8'  );
        world.add(shapes.box(       8,  0,  9,  1.5, 2,   1.5),  '#8af'  );
        world.add(shapes.cylinder( -3,  0, 11,  0.5, 1       ),  '#af8'  );
        world.add(shapes.box(       3,  0, -3,  0.5, 5,   0.5),  '#f8a'  );
        world.add(shapes.sphere(    0, 30,  0,  8             ),  '#d4d4d4');

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

            <div style={{ maxWidth: '700px', margin: '0 auto 14px', background: '#2a0000', border: '2px solid #cc0000', borderRadius: '8px', padding: '12px 20px' }}>
                <p style={{ color: '#ff4444', fontWeight: 'bold', margin: '0 0 6px', fontSize: '15px', textAlign: 'center' }}>
                    ⚠ Controls &amp; How to Exit
                </p>
                <ul style={{ color: '#ff6666', fontWeight: 'bold', margin: 0, paddingLeft: '20px', fontSize: '14px', lineHeight: '1.8' }}>
                    <li><span style={{ color: '#ff4444' }}>Click the canvas</span> to capture your mouse and enter first-person mode.</li>
                    <li><span style={{ color: '#ff4444' }}>Move:</span> W / A / S / D &nbsp;|&nbsp; <span style={{ color: '#ff4444' }}>Up / Down:</span> Q / E</li>
                    <li><span style={{ color: '#ff4444' }}>Look:</span> Move the mouse left and right to turn.</li>
                    <li><span style={{ color: '#ff4444' }}>To release your mouse &amp; exit: press <kbd style={{ background: '#440000', color: '#ff4444', padding: '1px 6px', borderRadius: '3px', border: '1px solid #ff4444' }}>Esc</kbd></span></li>
                </ul>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <canvas
                    ref={canvasRef}
                    width={1100}
                    height={600}
                    style={{ border: '2px solid #444', cursor: 'crosshair', display: 'block' }}
                />
            </div>
        </div>
    );
};

export default ShapeWorld;
