import React, { useRef, useEffect } from 'react';

const OUTER_R  = 54;              // outer ring radius (px)
const INNER_R  = 22;              // knob radius (px)
const MAX_DISP = OUTER_R - INNER_R; // max knob travel

/**
 * Single thumb-stick.
 * Calls onChange(nx, ny) with values in -1..1.
 * Uses pointer capture so dragging outside the circle still works.
 */
function Stick({ onChange, style }) {
    const outerRef    = useRef(null);
    const knobRef     = useRef(null);
    const cbRef       = useRef(onChange);
    const state       = useRef({ ptrid: null, cx: 0, cy: 0 });

    // Keep callback ref fresh without re-registering events
    useEffect(() => { cbRef.current = onChange; });

    useEffect(() => {
        const el   = outerRef.current;
        const knob = knobRef.current;

        const onDown = (e) => {
            if (state.current.ptrid !== null) return;
            e.preventDefault();
            el.setPointerCapture(e.pointerId);
            state.current.ptrid = e.pointerId;
            const r = el.getBoundingClientRect();
            state.current.cx = r.left + r.width  / 2;
            state.current.cy = r.top  + r.height / 2;
            cbRef.current(0, 0);
        };

        const onMove = (e) => {
            if (e.pointerId !== state.current.ptrid) return;
            e.preventDefault();
            const dx  = e.clientX - state.current.cx;
            const dy  = e.clientY - state.current.cy;
            const len = Math.sqrt(dx * dx + dy * dy) || 1;
            const cl  = Math.min(len, MAX_DISP);
            const nx  = dx / len;
            const ny  = dy / len;
            knob.style.transform = `translate(${nx * cl}px, ${ny * cl}px)`;
            cbRef.current(nx * (cl / MAX_DISP), ny * (cl / MAX_DISP));
        };

        const onUp = (e) => {
            if (e.pointerId !== state.current.ptrid) return;
            state.current.ptrid = null;
            knob.style.transform = 'translate(0,0)';
            cbRef.current(0, 0);
        };

        el.addEventListener('pointerdown',   onDown, { passive: false });
        el.addEventListener('pointermove',   onMove, { passive: false });
        el.addEventListener('pointerup',     onUp);
        el.addEventListener('pointercancel', onUp);
        return () => {
            el.removeEventListener('pointerdown',   onDown);
            el.removeEventListener('pointermove',   onMove);
            el.removeEventListener('pointerup',     onUp);
            el.removeEventListener('pointercancel', onUp);
        };
    }, []); // register once

    return (
        <div
            ref={outerRef}
            style={{
                width:          OUTER_R * 2,
                height:         OUTER_R * 2,
                borderRadius:   '50%',
                background:     'rgba(255,255,255,0.08)',
                border:         '2px solid rgba(255,255,255,0.28)',
                position:       'relative',
                touchAction:    'none',
                userSelect:     'none',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                boxShadow:      '0 0 18px rgba(0,0,0,0.45)',
                ...style,
            }}
        >
            <div
                ref={knobRef}
                style={{
                    width:        INNER_R * 2,
                    height:       INNER_R * 2,
                    borderRadius: '50%',
                    background:   'rgba(255,255,255,0.45)',
                    border:       '2px solid rgba(255,255,255,0.70)',
                    position:     'absolute',
                    pointerEvents:'none',
                    boxShadow:    '0 0 10px rgba(255,255,255,0.2)',
                }}
            />
        </div>
    );
}

/**
 * Full virtual gamepad overlay.
 *
 * Props:
 *   onLeftStick(x, y)  — left thumb movement  (-1..1)
 *   onRightStick(x, y) — right thumb look      (-1..1)
 *   onFire()           — fire button pressed
 *   onReload()         — reload (X) button pressed
 */
export function VirtualJoystick({ onLeftStick, onRightStick, onFire, onReload }) {
    const actionBtn = (label, onPress, extra) => (
        <button
            onPointerDown={(e) => { e.preventDefault(); onPress(); }}
            style={{
                borderRadius:   '50%',
                color:          '#fff',
                fontWeight:     'bold',
                cursor:         'pointer',
                touchAction:    'none',
                userSelect:     'none',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                letterSpacing:  1,
                position:       'absolute',
                boxShadow:      '0 0 14px rgba(0,0,0,0.5)',
                pointerEvents:  'auto',
                ...extra,
            }}
        >
            {label}
        </button>
    );

    return (
        <div style={{
            position:      'absolute',
            inset:         0,
            pointerEvents: 'none',
            userSelect:    'none',
            zIndex:        10,
        }}>
            {/* ── Left stick: movement ── */}
            <Stick
                onChange={onLeftStick}
                style={{ position: 'absolute', bottom: 22, left: 22, pointerEvents: 'auto' }}
            />

            {/* ── Right stick: look ── */}
            <Stick
                onChange={onRightStick}
                style={{ position: 'absolute', bottom: 22, right: 128, pointerEvents: 'auto' }}
            />

            {/* ── FIRE button (big, red) ── */}
            {actionBtn('FIRE', onFire, {
                bottom:     24,
                right:      18,
                width:      76,
                height:     76,
                fontSize:   14,
                background: 'rgba(210,30,30,0.78)',
                border:     '2px solid rgba(255,90,90,0.85)',
            })}

            {/* ── X / Reload button ── */}
            {actionBtn('X', onReload, {
                bottom:     116,
                right:      36,
                width:      48,
                height:     48,
                fontSize:   15,
                background: 'rgba(210,175,20,0.72)',
                border:     '2px solid rgba(255,225,60,0.85)',
            })}

            {/* ── Labels ── */}
            <span style={{ position: 'absolute', bottom: 6,  left: 44,  fontSize: 10, color: 'rgba(255,255,255,0.4)', pointerEvents: 'none', userSelect: 'none' }}>MOVE</span>
            <span style={{ position: 'absolute', bottom: 6,  right: 152, fontSize: 10, color: 'rgba(255,255,255,0.4)', pointerEvents: 'none', userSelect: 'none' }}>LOOK</span>
            <span style={{ position: 'absolute', bottom: 168, right: 46, fontSize: 9,  color: 'rgba(255,220,60,0.55)', pointerEvents: 'none', userSelect: 'none' }}>RELOAD</span>
        </div>
    );
}
