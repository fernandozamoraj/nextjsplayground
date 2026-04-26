import React, { useRef, useEffect, useState } from 'react';
import BackLink from '../comps/backLink';
import { World } from '../utils/services/3DWorld/world';
import { FirstPersonController } from '../utils/services/3DWorld/firstPersonController';
import { ShapeFactory } from '../utils/services/3DWorld/shapeFactory';
import { Explosion } from '../utils/services/3DWorld/explosion';
import { ImpactEffect } from '../utils/services/3DWorld/impactEffect';

const shapes = new ShapeFactory();

const TOTAL_TARGETS = 8;

const ShooterGame = () => {
    const canvasRef = useRef(null);
    const scoreRef = useRef(0);
    const gameOverRef = useRef(false);
    const [score, setScore] = useState(0);
    const [elapsed, setElapsed] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [gameKey, setGameKey] = useState(0);

    const handleRestart = () => {
        setScore(0);
        setElapsed(0);
        setGameOver(false);
        setGameKey(k => k + 1);
    };

    useEffect(() => {
        // Reset refs so a restart gets a clean slate
        scoreRef.current = 0;
        gameOverRef.current = false;

        const canvas = canvasRef.current;

        const world = new World(canvas, {
            backgroundColor: '#aaaaff',
            focalLength: 800,
            cameraPosition: { x: 0, y: .3, z: 0 },
            lightPosition:  { x: 10, y: 20, z: -10 },
        });

        const controller = new FirstPersonController(world, { moveSpeed: 0.1 });
        controller.attach(canvas);

        // Ground
        world.add(shapes.ground(50), '#3a5a2a', true);

        // Warehouse crate maze — all unit cubes (1×1×1) stacked into walls
        const cc = ['#8b6914', '#6b4a10', '#a0522d', '#cd853f', '#7b5426'];
        const boxMeshes = [];
        const addCube = (cx, baseY, cz, ci = 0) => {
            const m = shapes.box(cx, baseY, cz, 1, 1, 1);
            world.add(m, cc[ci % cc.length]);
            boxMeshes.push(m);
        };
        // addWall(wx, wz, w, d, h, ci) — wx/wz = min-x/min-z corner of the stack
        const addWall = (wx, wz, w, d, h, ci = 0) => {
            for (let ix = 0; ix < w; ix++)
                for (let iz = 0; iz < d; iz++)
                    for (let iy = 0; iy < h; iy++)
                        addCube(wx + ix + 0.5, iy, wz + iz + 0.5, ci);
        };

        // ── Entrance zone (z 4–7) ──────────────────────────────────────────
        addWall(-20,  0,  1, 1, 2, 0);  // left lone pillar  1×1×2
        addWall(  18,  0,  1, 1, 2, 2);  // right lone pillar 1×1×2
        addWall( -12,  -14,  4, 1, 3, 1);  // left EW wall      4×1×3
        addWall(  6,  -14,  4, 1, 3, 3);  // right EW wall     4×1×3
        addWall( -18,  -22,  2, 1, 2, 4);  // left gap stack    2×1×2
        addWall(  16,  -22,  2, 1, 2, 0);  // right gap stack   2×1×2

        // ── Zone 1 (z 8–12) ───────────────────────────────────────────────
        addWall( -18,  -8,  1, 4, 3, 2);  // long left NS wall  1×4×3
        addWall(  18,  -8,  1, 4, 3, 4);  // long right NS wall 1×4×3
        addWall( -6,  -6,  6, 1, 2, 0);  // center EW shelf    6×1×2
        addWall( -4, -6,  4, 1, 3, 1);  // staggered row      4×1×3
        addWall(  6,  -8,  1, 1, 5, 3);  // tall skinny pillar 1×1×5
        addWall( -10, -8,  3, 2, 2, 2);  // left cluster       3×2×2
        addWall(  12, -4,  2, 3, 3, 4);  // right deep cluster 2×3×3
        addWall( -2, -4,  1, 1, 2, 1);  // lone center stack  1×1×2

        // ── Zone 2 (z 13–17) ──────────────────────────────────────────────
        addWall(-20, 2,  3, 1, 2, 0);  // back-left short EW  3×1×2
        addWall(  16, 2,  2, 1, 3, 3);  // back-right short    2×1×3
        addWall( -8, 4,  8, 1, 2, 2);  // wide center EW wall 8×1×2
        addWall( -6, 6,  6, 1, 3, 4);  // staggered row above 6×1×3
        addWall( -4, 8,  4, 1, 2, 1);  // jagged top row      4×1×2
        addWall( -14, 6,  1, 3, 4, 0);  // deep left tall      1×3×4
        addWall(  14, 6,  2, 2, 4, 2);  // deep right cluster  2×2×4
        addWall(  4, 6,  1, 4, 2, 3);  // center NS wall      1×4×2

        // ── Zone 3 / back (z 18–21) ───────────────────────────────────────
        addWall( -18, 12,  4, 1, 3, 1);  // back-left EW wall   4×1×3
        addWall(  12, 12,  4, 1, 3, 4);  // back-right EW wall  4×1×3
        addWall( -4, 10,  4, 2, 2, 0);  // back center cluster 4×2×2
        addWall( -4, 16,  2, 1, 3, 2);  // jagged top stack    2×1×3

        // ── Side corridor walls ────────────────────────────────────────────
        addWall(-22,  -8,  1, 5, 2, 3);  // far-left side mid   1×5×2
        addWall( 22,  -8,  1, 5, 2, 1);  // far-right side mid  1×5×2
        addWall(-22, 4,  1, 4, 3, 0);  // far-left side deep  1×4×3
        addWall( 22, 5,  1, 4, 3, 2);  // far-right side deep 1×4×3

        let impacts = [];

        // Targets — wine bottles hidden throughout the warehouse maze
        const targetDefs = [
            { x: -17,  z: 20, color: '#22dd44' },  // tucked in left aisle
            { x:  17,  z:  19, color: '#dd2233' },  // right aisle gap
            { x: -19,  z: 4, color: '#2244dd' },  // deep left corner
            { x:  19,  z: 5, color: '#ddaa22' },  // deep right corner
            { x:  11,  z: 5, color: '#dd22dd' },  // behind back center shelf
            { x: -13,  z: 8, color: '#22dddd' },  // far back-left open area
            { x:  17,  z: 9, color: '#dddd22' },  // far back-right
            { x: -11,  z: 11, color: '#dd6688' },  // sneaky center-mid
        ];

        const targets = targetDefs.map(def => {
            const mesh = shapes.bottle(def.x, 1.2, def.z);
            world.add(mesh, def.color);
            return { mesh, alive: true, cx: def.x, cz: def.z, color: def.color };
        });

        let explosions = [];

        // Rotate a mesh in-place around a fixed world-space Y axis (no drift)
        const rotateY = (mesh, cx, cz, degrees) => {
            const rad = degrees * Math.PI / 180;
            const cos = Math.cos(rad), sin = Math.sin(rad);
            mesh.vertices = mesh.vertices.map(({ x, y, z }) => {
                const lx = x - cx, lz = z - cz;
                return { x: cx + lx * cos - lz * sin, y, z: cz + lx * sin + lz * cos };
            });
        };

        world._onBeforeRender = () => {
            controller.update();
            targets.forEach(t => { if (t.alive) rotateY(t.mesh, t.cx, t.cz, 1.5); });
            explosions.forEach(e => e.update());
            explosions = explosions.filter(e => e.alive);
        };

        world._onAfterRender = (ctx) => {
            impacts.forEach(fx => fx.update(ctx));
            impacts = impacts.filter(fx => fx.alive);
        };

        // Timer — updates display every second
        const startTime = Date.now();
        const timerInterval = setInterval(() => {
            if (!gameOverRef.current) {
                setElapsed(Math.floor((Date.now() - startTime) / 1000));
            }
        }, 1000);

        // Shooting — fires when pointer is already locked (first click enters lock via controller)
        const handleShoot = () => {
            if (document.pointerLockElement !== canvas) return;
            let closest = null, closestDist = 65; // pixel threshold around crosshair
            targets.forEach(t => {
                if (!t.alive) return;
                const center = world.renderer.getObjectCenter(t.mesh);
                const cam = world.renderer.worldToCamera(center.x, center.y, center.z);
                if (cam.z <= 0) return;
                const proj = world.renderer.project3DTo2D(cam.x, cam.y, cam.z);
                if (!proj) return;
                const dx = proj.x - canvas.width / 2;
                const dy = proj.y - canvas.height / 2;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < closestDist) { closest = t; closestDist = dist; }
            });
            if (closest) {
                const center = world.renderer.getObjectCenter(closest.mesh);
                closest.alive = false;
                world._objects = world._objects.filter(o => o.mesh !== closest.mesh);
                explosions.push(new Explosion(world, center.x, center.y, center.z, closest.color));
                scoreRef.current++;
                setScore(scoreRef.current);
                if (scoreRef.current >= TOTAL_TARGETS) {
                    clearInterval(timerInterval);
                    setTimeout(() => {
                        gameOverRef.current = true;
                        setGameOver(true);
                        document.exitPointerLock();
                    }, 1800);
                }
            } else {
                // Check if we hit a box — find the box whose projected center is nearest crosshair
                let hitBox = null, hitBoxDist = 80, hitBoxCenter = null;
                boxMeshes.forEach(m => {
                    const center = world.renderer.getObjectCenter(m);
                    const cam = world.renderer.worldToCamera(center.x, center.y, center.z);
                    if (cam.z <= 0) return;
                    const proj = world.renderer.project3DTo2D(cam.x, cam.y, cam.z);
                    if (!proj) return;
                    const dx = proj.x - canvas.width / 2;
                    const dy = proj.y - canvas.height / 2;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < hitBoxDist) { hitBox = proj; hitBoxDist = dist; hitBoxCenter = center; }
                });
                if (hitBoxCenter) {
                    impacts.push(new ImpactEffect(hitBoxCenter.x, hitBoxCenter.y, hitBoxCenter.z, world.renderer, '#8b4513'));
                }
            }
        };

        canvas.addEventListener('click', handleShoot);
        world.start();

        return () => {
            world.stop();
            controller.detach();
            canvas.removeEventListener('click', handleShoot);
            clearInterval(timerInterval);
        };
    }, [gameKey]);

    const formatTime = (s) =>
        `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

    return (
        <div style={{ background: '#111', minHeight: '100vh', padding: '20px' }}>
            <BackLink />
            <h1 style={{ color: '#ccc', textAlign: 'center', marginBottom: '8px' }}>Shooter Game</h1>

            <div style={{ maxWidth: '700px', margin: '0 auto 14px', background: '#1a0000', border: '2px solid #cc0000', borderRadius: '8px', padding: '10px 20px' }}>
                <p style={{ color: '#ff4444', fontWeight: 'bold', margin: '0 0 4px', fontSize: '15px', textAlign: 'center' }}>Controls</p>
                <ul style={{ color: '#ff6666', fontWeight: 'bold', margin: 0, paddingLeft: '20px', fontSize: '13px', lineHeight: '1.8' }}>
                    <li><span style={{ color: '#ff4444' }}>Click canvas</span> to lock mouse and enter the world</li>
                    <li><span style={{ color: '#ff4444' }}>Aim</span> with the mouse — <span style={{ color: '#ff4444' }}>click</span> to shoot a target in your crosshair</li>
                    <li><span style={{ color: '#ff4444' }}>Move:</span> W / A / S / D &nbsp;|&nbsp; <span style={{ color: '#ff4444' }}>Up / Down:</span> Q / E</li>
                    <li><span style={{ color: '#ff4444' }}>Release mouse:</span> press <kbd style={{ background: '#440000', color: '#ff4444', padding: '1px 6px', borderRadius: '3px', border: '1px solid #ff4444' }}>Esc</kbd></li>
                </ul>
            </div>

            <div style={{ position: 'relative', display: 'inline-block', marginLeft: '50%', transform: 'translateX(-50%)' }}>
                <canvas
                    ref={canvasRef}
                    width={1100}
                    height={600}
                    style={{ border: '2px solid #444', cursor: 'crosshair', display: 'block' }}
                />

                {/* HUD */}
                <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'rgba(0,0,0,0.65)', padding: '8px 18px', borderRadius: '8px', color: '#fff', fontFamily: 'monospace', fontSize: '20px', lineHeight: '1.7', border: '1px solid #555' }}>
                    <div>🎯 {score} / {TOTAL_TARGETS}</div>
                    <div>⏱ {formatTime(elapsed)}</div>
                </div>

                {/* Crosshair */}
                {!gameOver && (
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none' }}>
                        <svg width="32" height="32">
                            <line x1="16" y1="2"  x2="16" y2="12" stroke="white" strokeWidth="2" opacity="0.85" />
                            <line x1="16" y1="20" x2="16" y2="30" stroke="white" strokeWidth="2" opacity="0.85" />
                            <line x1="2"  y1="16" x2="12" y2="16" stroke="white" strokeWidth="2" opacity="0.85" />
                            <line x1="20" y1="16" x2="30" y2="16" stroke="white" strokeWidth="2" opacity="0.85" />
                            <circle cx="16" cy="16" r="2" fill="white" opacity="0.85" />
                        </svg>
                    </div>
                )}

                {/* Game Over Overlay */}
                {gameOver && (
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.72)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <h2 style={{ color: '#ffcc00', fontSize: '52px', margin: '0 0 16px', textShadow: '0 0 24px #ffcc00' }}>All Clear!</h2>
                        <p style={{ color: '#fff', fontSize: '22px', margin: '0 0 8px' }}>All {TOTAL_TARGETS} targets eliminated</p>
                        <p style={{ color: '#aaa', fontSize: '20px', margin: '0 0 28px' }}>Final time: {formatTime(elapsed)}</p>
                        <button
                            onClick={handleRestart}
                            style={{ background: '#ffcc00', color: '#111', fontWeight: 'bold', fontSize: '20px', padding: '12px 36px', border: 'none', borderRadius: '8px', cursor: 'pointer', boxShadow: '0 0 18px #ffcc00aa', letterSpacing: '1px' }}
                        >
                            Try Again
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ShooterGame;
