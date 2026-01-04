import './globals.css';
import '../styles/transitions.css';

export default function MyApp({ Component, pageProps }) {
  return (
    <div style={{ position: 'relative', zIndex: 1 }}>
      <Component {...pageProps} />
    </div>
  );
}
