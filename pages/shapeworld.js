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
            lightPosition:  { x: 5, y: 15,  z: -5  },
        });

        const controller = new FirstPersonController(world);
        controller.attach(canvas);

        // Hook controller.update() into the world's render loop
        world._onBeforeRender = () => controller.update();

        // ---- Scene objects ----
        world.add(shapes.ground(30),                              '#c8c8c8', true);
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
