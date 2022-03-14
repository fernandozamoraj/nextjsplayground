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
        <h1 className={styles.title}>
          Fernando&apos;s NextJS Playground
        </h1>
        <p>
          All code available at <a href="https://github.com/fernandozamoraj/nextjsplayground" target="_blank" rel="noreferrer">https://github.com/fernandozamoraj/nextjsplayground</a>
        </p>
        <p className="bg-warning">
              This content requires a large (PC) screen for the best experience
        </p>

        <div className={styles.grid}>
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

          <div className="card" style={{width: '18rem;'}}>
            <img className="card-img-top" src="/images/TowersThumbnailSmall.PNG" alt="towers of hanoi image"/>
            <div className="card-body">
              <h5 className="card-title">Visual Towers of Hanoi</h5>
              <p className="card-text">Towers of hanoi</p>
              
              <Link href="/towersOfHanoi">
                <a href="#" className="btn btn-primary">Go...</a>
              </Link>
            </div>
          </div>

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
