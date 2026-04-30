import React, { useRef, useEffect, useState, useCallback } from 'react';
import BackLink from '../comps/backLink';
import { World } from '../utils/services/3DWorld/world';
import { FirstPersonController } from '../utils/services/3DWorld/firstPersonController';
import { ShooterGame, TOTAL_TARGETS } from '../utils/services/3DWorld/shooterGame';
import { VirtualJoystick } from '../comps/shooter/VirtualJoystick';

const ShooterPage = () => {
    const canvasRef     = useRef(null);
    const gameOverRef   = useRef(false);
    const timerRef      = useRef(null);
    const controllerRef = useRef(null);
    const [score,        setScore]       = useState(0);
    const [elapsed,      setElapsed]     = useState(0);
    const [gameOver,     setGameOver]    = useState(false);
    const [gameKey,      setGameKey]     = useState(0);
    const [onLadder,     setOnLadder]    = useState(false);
    const [playerDead,   setPlayerDead]  = useState(false);
    const [gamepadActive,setGamepadActive] = useState(false);
    const [showVirtual,  setShowVirtual] = useState(false);

    // Stable callbacks for VirtualJoystick — safe to pass as props
    const onLeftStick  = useCallback((x, y) => controllerRef.current?.setVirtualLeft(x, y),  []);
    const onRightStick = useCallback((x, y) => controllerRef.current?.setVirtualRight(x, y), []);
    const onVirtualFire   = useCallback(() => controllerRef.current?.triggerVirtualFire(),   []);
    const onVirtualReload = useCallback(() => controllerRef.current?.triggerVirtualReload(), []);

    // Detect touch device once on mount
    useEffect(() => {
        if (typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0)) {
            setShowVirtual(true);
        }
    }, []);

    const handleRestart = () => {
        setScore(0);
        setElapsed(0);
        setGameOver(false);
        setPlayerDead(false);
        setGameKey(k => k + 1);
    };

    useEffect(() => {
        gameOverRef.current = false;

        const canvas = canvasRef.current;

        const world = new World(canvas, {
            backgroundColor: '#aaaaff',
            focalLength: 800,
            cameraPosition: { x: 0, y: 0.6, z: 0 },
            lightPosition:  { x: 10, y: 20, z: -10 },
        });

        const controller = new FirstPersonController(world, { moveSpeed: 0.1 });
        controller.attach(canvas);
        controllerRef.current = controller;

        const game = new ShooterGame(world, canvas, controller, {
            onScore: setScore,
            onGameOver: () => {
                clearInterval(timerRef.current);
                setTimeout(() => {
                    gameOverRef.current = true;
                    setGameOver(true);
                    document.exitPointerLock();
                }, 1800);
            },
            onPlayerHit: () => {},
            onPlayerDead: () => {
                clearInterval(timerRef.current);
                gameOverRef.current = true;
                setGameOver(true);
                setPlayerDead(true);
                document.exitPointerLock();
            },
        });
        game.build();
        game.start();

        // Poll ladder state each frame for HUD — only update React state on change
        const prevOnBeforeRender = world._onBeforeRender;
        let lastOnLadder = false;
        let lastGamepad  = false;
        world._onBeforeRender = () => {
            if (prevOnBeforeRender) prevOnBeforeRender();
            const cur = controller.onLadder;
            if (cur !== lastOnLadder) {
                lastOnLadder = cur;
                setOnLadder(cur);
            }
            const gp = controller._usingGamepad;
            if (gp !== lastGamepad) {
                lastGamepad = gp;
                setGamepadActive(gp);
            }
        };

        const startTime = Date.now();
        timerRef.current = setInterval(() => {
            if (!gameOverRef.current) {
                setElapsed(Math.floor((Date.now() - startTime) / 1000));
            }
        }, 1000);

        world.start();

        return () => {
            controllerRef.current = null;
            world.stop();
            controller.detach();
            game.stop();
            clearInterval(timerRef.current);
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
                    <li><span style={{ color: '#ff4444' }}>Move:</span> W / A / S / D &nbsp;|&nbsp; <span style={{ color: '#ff4444' }}>Sprint:</span> hold <kbd style={{ background: '#440000', color: '#ff4444', padding: '1px 6px', borderRadius: '3px', border: '1px solid #ff4444' }}>Shift</kbd></li>
                    <li><span style={{ color: '#ff4444' }}>Release mouse:</span> press <kbd style={{ background: '#440000', color: '#ff4444', padding: '1px 6px', borderRadius: '3px', border: '1px solid #ff4444' }}>Esc</kbd></li>
                    <li style={{ marginTop: '4px', borderTop: '1px solid #550000', paddingTop: '4px' }}>
                        <span style={{ color: '#ff4444' }}>Xbox controller:</span> Left stick move · Right stick look · <span style={{ color: '#ff4444' }}>LB</span> sprint · <span style={{ color: '#ff4444' }}>RT</span> shoot
                        &nbsp;— <em style={{ color: '#ff8888' }}>press any button to activate</em>
                    </li>
                    <li style={{ marginTop: '4px', borderTop: '1px solid #550000', paddingTop: '4px' }}>
                        <span style={{ color: '#ff4444' }}>Touch:</span> Left stick — move · Right stick — look · <span style={{ color: '#ff4444' }}>FIRE</span> button · <span style={{ color: '#ff4444' }}>X</span> reload
                    </li>
                </ul>
            </div>

            <div style={{ position: 'relative', display: 'inline-block', marginLeft: '50%', transform: 'translateX(-50%)' }}>
                <canvas
                    ref={canvasRef}
                    width={1100}
                    height={600}
                    style={{ border: '2px solid #444', cursor: 'crosshair', display: 'block' }}
                />

                {showVirtual && !gameOver && (
                    <VirtualJoystick
                        onLeftStick={onLeftStick}
                        onRightStick={onRightStick}
                        onFire={onVirtualFire}
                        onReload={onVirtualReload}
                    />
                )}

                <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'rgba(0,0,0,0.65)', padding: '8px 18px', borderRadius: '8px', color: '#fff', fontFamily: 'monospace', fontSize: '20px', lineHeight: '1.7', border: '1px solid #555' }}>
                    <div>🎯 {score} / {TOTAL_TARGETS}</div>
                    <div>⏱ {formatTime(elapsed)}</div>
                    {gamepadActive
                        ? <div style={{ fontSize: '13px', color: '#7fff7f', marginTop: '4px' }}>🎮 Controller active</div>
                        : <div style={{ fontSize: '13px', color: '#888', marginTop: '4px' }}>🎮 No controller</div>
                    }
                </div>

                {!gameOver && onLadder && (
                    <div style={{ position: 'absolute', bottom: '80px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.72)', color: '#ffcc00', fontFamily: 'monospace', fontSize: '15px', padding: '8px 20px', borderRadius: '8px', border: '1px solid #ffcc00aa', pointerEvents: 'none', whiteSpace: 'nowrap' }}>
                        🪜 <strong>W</strong> climb up &nbsp;·&nbsp; <strong>S</strong> climb down &nbsp;·&nbsp; <strong>A/D</strong> step off
                    </div>
                )}

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

                {gameOver && (
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.72)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <h2 style={{ color: playerDead ? '#ff3333' : '#ffcc00', fontSize: '52px', margin: '0 0 16px', textShadow: playerDead ? '0 0 24px #ff3333' : '0 0 24px #ffcc00' }}>{playerDead ? 'You Died!' : 'All Clear!'}</h2>
                        <p style={{ color: '#fff', fontSize: '22px', margin: '0 0 8px' }}>{playerDead ? 'The sniper orbs took you down.' : `All ${TOTAL_TARGETS} targets eliminated`}</p>
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

export default ShooterPage;
