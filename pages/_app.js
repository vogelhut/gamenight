import {useEffect} from 'react';
import Head from 'next/head'
import { SnackbarProvider } from 'notistack';

/**
 * @param {object} {Component, pageProps} to render error page,
 * include {error: {code, message}} in pageProps returned by getServerSideProps
 * @return {Component}
 */
function MyApp({Component, pageProps}) {
  useEffect(() => {
    // Remove the server-side injected CSS.
    const jssStyles = document.querySelector('#jss-server-side');
    if (jssStyles) {
      jssStyles.parentElement.removeChild(jssStyles);
    }
  }, []);

  return (
    <SnackbarProvider maxSnack={5}>
        <Head>
          <title>Vogelhut Game Night</title>
        </Head>
      <Component {...pageProps} />
    </SnackbarProvider>
  );
}

export default MyApp;
