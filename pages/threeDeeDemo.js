import React, { useRef, useEffect } from 'react';
import BackLink from '../comps/backLink';
import { Renderer, Mesh, Light } from '../utils/services/3DWorld/renderer';

const ThreeDeeDemo = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const renderer = new Renderer(canvas, { focalLength: 400, backgroundColor: '#333' });
        renderer.setCamera(0, 0, -6);

        const light = new Light(5, 8, -8);

        // ========== RECTANGLE — centered at x=-4.5 ==========
        const rectVertices = [
            { x: -6,  y: -0.8, z: -1 },
            { x: -3,  y: -0.8, z: -1 },
            { x: -3,  y:  0.8, z: -1 },
            { x: -6,  y:  0.8, z: -1 },
            { x: -6,  y: -0.8, z:  1 },
            { x: -3,  y: -0.8, z:  1 },
            { x: -3,  y:  0.8, z:  1 },
            { x: -6,  y:  0.8, z:  1 }
        ];
        const rectFaces = [
            [0, 1, 2], [0, 2, 3],
            [4, 5, 6], [4, 6, 7],
            [0, 4, 7], [0, 7, 3],
            [1, 5, 6], [1, 6, 2],
            [3, 2, 6], [3, 6, 7],
            [0, 1, 5], [0, 5, 4]
        ];
        const rectMesh = new Mesh(rectVertices, rectFaces);

        // ========== CYLINDER — centered at x=0 ==========
        const cylinderVertices = [];
        const segments = 16;
        const radius = 1;
        const cylHeight = 2;
        for (let i = 0; i < segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            cylinderVertices.push({ x: Math.cos(angle) * radius, y:  cylHeight / 2, z: Math.sin(angle) * radius });
        }
        for (let i = 0; i < segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            cylinderVertices.push({ x: Math.cos(angle) * radius, y: -cylHeight / 2, z: Math.sin(angle) * radius });
        }
        const cylinderFaces = [];
        for (let i = 0; i < segments; i++) {
            const next = (i + 1) % segments;
            cylinderFaces.push([i, next, next + segments]);
            cylinderFaces.push([i, next + segments, i + segments]);
        }
        for (let i = 0; i < segments - 2; i++) cylinderFaces.push([0, i + 1, i + 2]);
        for (let i = 0; i < segments - 2; i++) cylinderFaces.push([segments, segments + i + 2, segments + i + 1]);
        const cylinderMesh = new Mesh(cylinderVertices, cylinderFaces);

        // ========== PYRAMID — centered at x=4.5 ==========
        const pyramidVertices = [
            { x:  4.5, y:  1.5, z:  0 },
            { x:  3.5, y: -0.5, z: -1 },
            { x:  5.5, y: -0.5, z: -1 },
            { x:  5.5, y: -0.5, z:  1 },
            { x:  3.5, y: -0.5, z:  1 }
        ];
        const pyramidFaces = [
            [0, 1, 2],
            [0, 2, 3],
            [0, 3, 4],
            [0, 4, 1],
            [1, 2, 3], [1, 3, 4]
        ];
        const pyramidMesh = new Mesh(pyramidVertices, pyramidFaces);

        // ========== ANIMATION LOOP ==========
        let rotationAngle = 0;
        let animationId;

        function animate() {
            rotationAngle += 1.5;
            const rx = rotationAngle * 0.5;
            const ry = rotationAngle;
            const rz = rotationAngle * 0.3;

            renderer.render(renderer.rotate(rectMesh,     rx, ry, rz), true,  '#4af', light);
            renderer.render(renderer.rotate(cylinderMesh, rx, ry, rz), false, '#fa4', light);
            renderer.render(renderer.rotate(pyramidMesh,  rx, ry, rz), false, '#4fa', light);

            animationId = requestAnimationFrame(animate);
        }

        animationId = requestAnimationFrame(animate);

        return () => cancelAnimationFrame(animationId);
    }, []);

    return (
        <div className="container bg-lighter text-secondary pb-5">
            <BackLink />
            <h1 className="text-center py-4">3D Rotating Objects</h1>
            <p className="text-center text-muted">Homebrewed 3D rendering engine using only JavaScript and the HTML canvas</p>
            <div className="d-flex flex-column align-items-center" style={{ gap: '10px' }}>
                <canvas
                    ref={canvasRef}
                    width={1100}
                    height={450}
                    style={{ border: '2px solid #666' }}
                />
                <div style={{ display: 'flex', width: '1100px', justifyContent: 'space-around', color: '#aaa', fontSize: '14px', fontWeight: 'bold' }}>
                    <span>Rectangle</span>
                    <span>Cylinder</span>
                    <span>Pyramid</span>
                </div>
            </div>
        </div>
    );
};

export default ThreeDeeDemo;
