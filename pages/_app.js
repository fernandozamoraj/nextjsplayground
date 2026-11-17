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
      {/* A page can set Page.hideHeader = true to get the whole screen (pages/chongieMobile.js). */}
      {!Component.hideHeader && <SiteHeader />}
      <Component {...pageProps} />
    </>
  )
}

export default MyApp
