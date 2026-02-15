import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import Link from 'next/link'

export default function Home() {
  return (
    <div className={styles.container}>
      <Head>
        <title>Fernando&apos;s NextJS Playground</title>
        <meta name="description" content="a first next js application" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <div className="mb-4" style={{width: '75%', maxWidth: '75%', margin: '0 auto'}}>
          <img src="/images/homepage.png" alt="Fernando's NextJS Playground" style={{width: '50%', height: 'auto', display: 'block', margin: '0 auto'}} />
        </div>
        <p>
          All code available at <a href="https://github.com/fernandozamoraj/nextjsplayground" target="_blank" rel="noreferrer">https://github.com/fernandozamoraj/nextjsplayground</a>
        </p>
        <p className="bg-warning d-block d-md-none">
              This content is best viewed in desktop mode due to the amount of data displayed in some of the pages. Please switch to a desktop or laptop for the best experience.
        </p>

        <div className={styles.grid}>
          <Link href="/calendar">
            <a className={styles.card}>
            <h2>Paydate Calendar&rarr;</h2>
            <p>A full year calendar with highlighted paydays</p>
          </a>
          </Link>
          <Link href="/ammortizationCalculator">
            <a className={styles.card}>
            <h2>Ammortization Calculator &rarr;</h2>
            <p>An ammortization calculator to calculate your payments</p>
          </a>
          </Link>

          <Link href="/sudokuSolver">
            <a className={styles.card}>
            <h2>Sudoku Solver &rarr;</h2>
            <p>Plug in the numbers and solve any Sudoku puzzle</p>
          </a>
          </Link>

          <Link href="/towersOfHanoi">
            <a className={styles.card}>
            <h2>Visual Towers of Hanoi &rarr;</h2>
            <p>Step through the classic Tower of Hanoi puzzle visualization</p>
          </a>
          </Link>

          <Link href="/investmentCalculator">
            <a className={styles.card}>
            <h2>Investment Calculator &rarr;</h2>
            <p>Calculate investment growth with monthly contributions and compounding</p>
          </a>
          </Link>

          <Link href="/stockPicks">
            <a className={styles.card}>
            <h2>Stock Picks Tracker &rarr;</h2>
            <p>Track stock prices with historical highs and lows using real-time data</p>
          </a>
          </Link>

          <Link href="/pythonConsole">
            <a className={styles.card}>
            <h2>Python Console &rarr;</h2>
            <p>Run basic Python code in the browser</p>
          </a>
          </Link>

          <Link href="/typingGame">
            <a className={styles.card}>
            <h2>Typing Game &rarr;</h2>
            <p>Type the falling words to score points</p>
          </a>
          </Link>

          <a
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
            className={styles.card}
            target="_blank"
            rel="noreferrer"
          >
            <h2>Deploy &rarr;</h2>
            <p>
              Instantly deploy your Next.js site to a public URL with Vercel.
            </p>

          </a>
        </div>
      </main>

      <footer className={styles.footer}>
        <a
          href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by{' '}
          <span className={styles.logo}>
            <Image src="/vercel.svg" alt="Vercel Logo" width={72} height={16} />
          </span>
        </a>
      </footer>
    </div>
  )
}
