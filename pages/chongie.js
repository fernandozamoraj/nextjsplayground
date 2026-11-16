import Head from 'next/head';
import BackLink from '../comps/backLink';

// Chongie: Fernando's homebrew SNES game. This page plays the free DEMO (levels 1, 2 and 4)
// in EmulatorJS, inside an iframe (public/chongie/play.html) so the emulator goes away
// cleanly when you leave the page. The full game's ROM is never put on this site.

const CONTROLS = [
  ['Walk / steer in the air', 'D-pad left / right', 'Arrow keys'],
  ['Climb vines, climb onto a drone', 'D-pad up / down', 'Arrow keys'],
  ['Jump', 'A', 'Z'],
  ['Catch / throw a coconut', 'B', 'X'],
  ['Start', 'Start', 'Enter'],
  ['Sound options (in play)', 'Select', 'V'],
];

const card = {
  background: '#1d1a2b',
  color: '#f5f0e1',
  borderRadius: 12,
  padding: '1.25rem 1.5rem',
  marginBottom: '1.5rem',
};

export default function ChongiePage() {
  return (
    <div className="container py-3" style={{ maxWidth: 900 }}>
      <Head>
        <title>Chongie (SNES demo)</title>
        <meta name="description" content="Play the free demo of Chongie, a homebrew Super Nintendo platformer." />
      </Head>

      <BackLink />

      <h1 style={{ fontWeight: 'bold' }}>Chongie</h1>
      <p className="lead">
        A little monkey&apos;s big climb: a brand-new Super Nintendo game, written from scratch in
        65816 assembly. This is the free demo: levels 1, 2 and 4.
      </p>

      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 768,
          aspectRatio: '768 / 720',
          margin: '0 auto 0.5rem',
          background: '#000',
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        <iframe
          src="/chongie/play.html"
          title="Chongie demo"
          allow="autoplay; fullscreen; gamepad; screen-wake-lock"
          allowFullScreen
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
        />
      </div>
      <p className="text-muted text-center" style={{ fontSize: '0.9rem' }}>
        Click the game once to give it the keyboard. Gamepads work too. Keys can be changed from the
        controller icon in the emulator&apos;s bottom bar.
      </p>

      <div style={card}>
        <h2 style={{ fontSize: '1.4rem' }}>How to play</h2>
        <p style={{ marginBottom: '0.75rem' }}>
          The screen scrolls up on its own, so keep climbing! Jump up through ledges, swing onto vines,
          ride the drones and dodge the falling coconuts. Even better, catch a coconut just before it
          bonks you and throw it to knock the snakes off their ledges. Reach the flag to clear a level.
        </p>
        <table className="table table-sm table-dark mb-0" style={{ background: 'transparent' }}>
          <thead>
            <tr><th>Action</th><th>SNES pad</th><th>Keyboard</th></tr>
          </thead>
          <tbody>
            {CONTROLS.map(([action, pad, key]) => (
              <tr key={action}><td>{action}</td><td>{pad}</td><td><strong>{key}</strong></td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={card}>
        <h2 style={{ fontSize: '1.4rem' }}>Tips</h2>
        <ul className="mb-0">
          <li>Press B just before a coconut lands on your head to catch it. Holding one also shields you.</li>
          <li>Push snakes off a ledge from behind. Walking into them face to face is fatal.</li>
          <li>Under a drone, press Up to climb on top and ride it across.</li>
          <li>Rain makes the ledges slippery on level 4: no running starts.</li>
        </ul>
      </div>

      <div style={card}>
        <h2 style={{ fontSize: '1.4rem' }}>The full game</h2>
        <p className="mb-0">
          12 levels in four phases (jungle, rain, ice and fire), three bonus rounds, a secret warp
          room and a robot dragon waiting at the top. Coming to itch.io.
        </p>
      </div>

      <p className="text-muted" style={{ fontSize: '0.85rem' }}>
        Game, code, art and sound by Fernando Zamora. Runs in your browser on{' '}
        <a href="https://emulatorjs.org" target="_blank" rel="noreferrer">EmulatorJS</a>{' '}
        (GPL-3.0) with the Snes9x core.
      </p>
    </div>
  );
}
