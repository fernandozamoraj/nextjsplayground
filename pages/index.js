import Head from 'next/head'
import styles from '../styles/Home.module.css'
import Link from 'next/link'

const TILES = [
  { href: '/calendar',                label: 'Paydate Calendar',    desc: 'Full-year calendar with highlighted paydays',             bg: '#2e6da4', img: '/images/paydate-calendar.png' },
  { href: '/ammortizationCalculator',   label: 'Amortization Calc',      desc: 'Calculate loan payments and amortization schedule',       bg: '#2e8b57', img: '/images/ammortization-calculator.png' },
  { href: '/loanBubbles',              label: 'Loan Bubbles',           desc: 'Compare loans with draggable bubble cards',              bg: '#2563eb' },
  { href: '/betterSimpleCalculator',   label: 'Better Simple Calc',     desc: 'Chain arithmetic operations step by step',                bg: '#4a6fa5', img: '/images/a-better-simple-calculator.png' },
  { href: '/sudokuSolver',            label: 'Sudoku Solver',       desc: 'Plug in numbers and solve any Sudoku puzzle',             bg: '#7b52b9', img: '/images/sudoku-solver.png' },
  { href: '/towersOfHanoi',           label: 'Towers of Hanoi',     desc: 'Step through the classic recursive puzzle',               bg: '#c0622a', img: '/images/towers-of-hanoi.png' },
  { href: '/investmentCalculator',    label: 'Investment Calc',     desc: 'Growth with monthly contributions and compounding',       bg: '#1a8a8a', img: '/images/investment-calculator.png' },
  { href: '/stockPicks',              label: 'Stock Picks',         desc: 'Track stock prices with real-time historical data',       bg: '#a07828', img: '/images/stock-picks.png' },
  { href: '/dpsWaitTimes',            label: 'TX DPS Wait Times',   desc: 'Driver license office wait times by location',            bg: '#2563a8', img: '/images/tx-dps-wait-times.png' },
  { href: '/students',                label: 'Student Directory',   desc: 'Manage student records with drawer-based edits',          bg: '#b04040', img: '/images/student-directory.png' },
  { href: '/todoapp',                 label: 'Todo App',            desc: 'Track tasks with due dates, notes, and status',           bg: '#2e6896', img: '/images/todo-app.png' },
  { href: '/pythonConsole',           label: 'Python Console',      desc: 'Run basic Python code in the browser',                   bg: '#8a7a20', img: '/images/python-console.png' },
  { href: '/typingGame',              label: 'Typing Game',         desc: 'Type the falling words to score points',                 bg: '#3a8a3a', img: '/images/typing-game.png' },
  { href: '/threeDeeDemo',            label: '3D Demo',             desc: 'Homebrewed 3D engine using JS and canvas',               bg: '#6a3aaa', img: '/images/3d-demo.png' },
  { href: '/shapeworld',              label: 'Shape World',         desc: 'Walk a 3D world in first-person with WASD',              bg: '#b06020', img: '/images/shape-world.png' },
  { href: '/shooter',                 label: 'Shooter Game',        desc: 'Hunt down targets in a 3D arena, dodge tracking orbs',   bg: '#b03030', img: '/images/shooter-game.png' },
  { href: 'https://fernandozamoraj.github.io/picorico/', label: 'Pico Rico Games', desc: 'Check out my Pico games', bg: '#1a5c2e', img: '/images/pico-games.png', external: true },
]

export default function Home() {
  return (
    <div className={styles.container}>
      <Head>
        <title>Fernando&apos;s NextJS Playground</title>
        <meta name="description" content="a first next js application" />
        <link rel="icon" href="/favicon.ico" />
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap" rel="stylesheet" />
      </Head>

      <div style={{ width: '100%', position: 'relative', lineHeight: 0 }}>
        <img
          src="/images/rocket-car.png"
          alt="Rocket Car Banner"
          style={{ width: '100%', maxHeight: '280px', objectFit: 'cover', display: 'block' }}
        />
        <img
          src="/images/homepage.png"
          alt="Fernando Next JS Playground"
          style={{
            position: 'absolute',
            right: '2rem',
            top: '50%',
            transform: 'translateY(-50%)',
            width: 200,
            height: 'auto',
          }}
        />
      </div>

      <main className={styles.main}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '1.5rem', padding: '0 0.5rem' }}>
          <p style={{ color: '#ccc', fontSize: '1.6rem', margin: 0, fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.05em' }}>
            A playground for me&hellip; useful tools for you.
          </p>
          <a
            href="https://buymeacoffee.com/fernandozat"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              backgroundColor: '#ff6a00',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '0.5rem 1.25rem',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              marginLeft: '1.5rem',
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            Buy Me a Coffee
          </a>
        </div>

        <p className={`${styles.mobileWarning} d-block d-md-none`}>
          Best viewed on desktop - some pages require more screen space.
        </p>

        <div className={styles.grid}>
          {TILES.map(tile => (
            tile.external
              ? (
                <a key={tile.href} href={tile.href} target="_blank" rel="noreferrer" className={styles.card} style={{ backgroundColor: tile.bg }}>
                  {tile.img && <img src={tile.img} alt="" className={styles.cardImg} />}
                  <h2>{tile.label}</h2>
                  <p>{tile.desc}</p>
                </a>
              )
              : (
                <Link key={tile.href} href={tile.href}>
                  <a className={styles.card} style={{ backgroundColor: tile.bg }}>
                    {tile.img && <img src={tile.img} alt="" className={styles.cardImg} />}
                    <h2>{tile.label}</h2>
                    <p>{tile.desc}</p>
                  </a>
                </Link>
              )
          ))}
        </div>
      </main>

      <footer className={styles.footer}>
        Code at{' '}
        <a href="https://github.com/fernandozamoraj/nextjsplayground" target="_blank" rel="noreferrer">
          github.com/fernandozamoraj/nextjsplayground
        </a>
      </footer>
    </div>
  )
}
