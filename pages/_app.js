import Head from 'next/head';
import './globals.css';
import '../styles/transitions.css';
import critical from '../styles/critical.css?raw';
import { useState, useEffect } from 'react';

// `critical` may be imported as an object (e.g. { default: '...' }) depending on bundler interop.
const criticalCss = typeof critical === 'string' ? critical : (critical && critical.default) ? critical.default : String(critical);

export default function MyApp({ Component, pageProps }) {
  const [error, setError] = useState(null);

  useEffect(() => {
    const onError = (eventOrMessage, source, lineno, colno, err) => {
      const payload = err || eventOrMessage || { message: eventOrMessage, source, lineno, colno };
      setError(payload);
      return false;
    };
    const onRejection = (e) => setError(e?.reason || e);

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  return (
    <>
      <Head>
        <style id="critical-css" dangerouslySetInnerHTML={{ __html: criticalCss }} />
      </Head>
      <div style={{ position: 'relative', zIndex: 1 }}>
        {error && (
          <div className="app-error-overlay" role="alert" aria-live="assertive" onClick={() => setError(null)}>
            <div className="app-error-card">
              <h2>Runtime Error</h2>
              <pre>{typeof error === 'string' ? error : (error?.stack || JSON.stringify(error, null, 2))}</pre>
              <div className="app-error-help">点击任意处关闭 · 错误仅用于调试</div>
            </div>
          </div>
        )}

        <Component {...pageProps} />
      </div>
    </>
  );
}
