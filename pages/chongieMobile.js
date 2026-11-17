import Head from 'next/head';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import s from '../styles/ChongieMobile.module.css';

// Chongie demo for phones: the same EmulatorJS iframe as pages/chongie.js (play.html?touch=1,
// which turns off EmulatorJS's own overlay pad) with an SNES pad drawn under the game.
// The pad presses buttons straight in the emulator: the iframe is same-origin, so we call
// EJS_emulator.gameManager.simulateInput(player 0, button, 1 = down / 0 = up).
// No site header on this page (_app.js honours ChongieMobile.hideHeader) so the game gets the room.

const TOUCH_VERSION = '1.0.0';

// libretro RetroPad button ids (what simulateInput takes)
const BTN = { B: 0, Y: 1, SELECT: 2, START: 3, UP: 4, DOWN: 5, LEFT: 6, RIGHT: 7, A: 8, X: 9, L: 10, R: 11 };
const DIRS = ['UP', 'DOWN', 'LEFT', 'RIGHT'];

export default function ChongieMobile() {
  const frameRef = useRef(null);
  const held = useRef(new Set());          // button names currently pressed by the pad
  const [lit, setLit] = useState({});      // for drawing pressed buttons

  const press = useCallback((name, down) => {
    if (down === held.current.has(name)) return;
    if (down) held.current.add(name); else held.current.delete(name);
    setLit((l) => ({ ...l, [name]: down }));
    try {
      const gm = frameRef.current?.contentWindow?.EJS_emulator?.gameManager;
      gm?.simulateInput(0, BTN[name], down ? 1 : 0);
    } catch (e) { /* emulator not started yet */ }
    if (down && navigator.vibrate) navigator.vibrate(8);
  }, []);

  const releaseAll = useCallback(() => {
    [...held.current].forEach((n) => press(n, false));
  }, [press]);

  // Dark page behind the game (and no pull-to-refresh bounce) while this page is shown.
  useEffect(() => {
    const b = document.body.style, h = document.documentElement.style;
    const old = [b.background, h.overscrollBehavior];
    b.background = '#14121f'; h.overscrollBehavior = 'none';
    return () => { b.background = old[0]; h.overscrollBehavior = old[1]; };
  }, []);

  // Let go of everything if the page loses focus mid-press (a call, the app switcher...)
  useEffect(() => {
    const onHide = () => releaseAll();
    window.addEventListener('blur', onHide);
    document.addEventListener('visibilitychange', onHide);
    return () => {
      window.removeEventListener('blur', onHide);
      document.removeEventListener('visibilitychange', onHide);
      releaseAll();
    };
  }, [releaseAll]);

  // Keep getting this finger's moves/lift even if it slides off the control.
  const capture = (e) => { try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ } };

  // ---- D-pad: one pointer, direction from where the finger is relative to the pad's centre,
  // so you can slide between directions (and diagonals) without lifting.
  const padPointer = useRef(null);
  const steer = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    const dead = r.width * 0.12;
    const want = new Set();
    if (Math.hypot(dx, dy) > dead) {
      const ang = Math.atan2(dy, dx) * 180 / Math.PI;   // 0 = right, 90 = down
      // 8 sectors of 45 degrees; diagonals press two directions
      if (ang > -67.5 && ang < 67.5) want.add('RIGHT');
      if (ang > 112.5 || ang < -112.5) want.add('LEFT');
      if (ang > 22.5 && ang < 157.5) want.add('DOWN');
      if (ang < -22.5 && ang > -157.5) want.add('UP');
    }
    DIRS.forEach((d) => press(d, want.has(d)));
  };
  const padDown = (e) => {
    e.preventDefault();
    padPointer.current = e.pointerId;
    capture(e);
    steer(e);
  };
  const padMove = (e) => { if (padPointer.current === e.pointerId) steer(e); };
  const padUp = (e) => {
    if (padPointer.current !== e.pointerId) return;
    padPointer.current = null;
    DIRS.forEach((d) => press(d, false));
  };

  // ---- face / small buttons: each its own pointer, so jump + catch + steering work together
  const btnProps = (name) => ({
    onPointerDown: (e) => { e.preventDefault(); press(name, true); capture(e); },
    onPointerUp: () => press(name, false),
    onPointerCancel: () => press(name, false),
    onContextMenu: (e) => e.preventDefault(),
    'data-on': lit[name] ? '1' : undefined,
  });

  return (
    <div className={s.root}>
      <Head>
        <title>Chongie (SNES demo, touch)</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="theme-color" content="#14121f" />
        <meta name="description" content="Play the free demo of Chongie, a homebrew Super Nintendo game, with touch controls." />
      </Head>

      <div className={s.top}>
        <Link href="/chongie"><a className={s.back}>&larr; Chongie</a></Link>
        <span className={s.title}>CHONGIE <small>demo</small></span>
        <span className={s.ver}>touch v{TOUCH_VERSION}</span>
      </div>

      <div className={s.game}>
        <iframe
          ref={frameRef}
          src="/chongie/play.html?touch=1"
          title="Chongie demo"
          allow="autoplay; fullscreen; gamepad; screen-wake-lock"
          allowFullScreen
        />
      </div>

      <div className={s.pad} onContextMenu={(e) => e.preventDefault()}>
        <div className={s.small}>
          <button className={s.pill} {...btnProps('SELECT')}>SELECT</button>
          <button className={s.pill} {...btnProps('START')}>START</button>
        </div>

        <div
          className={s.dpad}
          onPointerDown={padDown}
          onPointerMove={padMove}
          onPointerUp={padUp}
          onPointerCancel={padUp}
          aria-label="D-pad"
        >
          <span className={`${s.arm} ${s.up}`} data-on={lit.UP ? '1' : undefined} />
          <span className={`${s.arm} ${s.down}`} data-on={lit.DOWN ? '1' : undefined} />
          <span className={`${s.arm} ${s.left}`} data-on={lit.LEFT ? '1' : undefined} />
          <span className={`${s.arm} ${s.right}`} data-on={lit.RIGHT ? '1' : undefined} />
          <span className={s.hub} />
        </div>

        <div className={s.face}>
          <button className={`${s.btn} ${s.b}`} {...btnProps('B')}>B<em>catch</em></button>
          <button className={`${s.btn} ${s.a}`} {...btnProps('A')}>A<em>jump</em></button>
        </div>
      </div>

      <p className={s.hint}>Tap the game once to start it (and its sound). Hold the phone sideways for a bigger picture.</p>

    </div>
  );
}

ChongieMobile.hideHeader = true;
