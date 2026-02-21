import "bootstrap/dist/css/bootstrap.css";
import '../styles/globals.css';
import { useEffect } from 'react';
import SiteHeader from '../comps/siteHeader';

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    import("bootstrap/dist/js/bootstrap");
  }, []);

  return (
    <>
      <SiteHeader />
      <Component {...pageProps} />
    </>
  )
}

export default MyApp
