import '../styles/globals.css';
import { useEffect } from 'react';

export default function MyApp({ Component, pageProps }) {
  useEffect(() => {
    // Generate random colors for dynamic background
    const generateRandomColor = () => {
      const hue = Math.random() * 360;
      const saturation = 70 + Math.random() * 20; // 70-90%
      const lightness = 50 + Math.random() * 20; // 50-70%
      return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    };

    // Set random background colors
    const root = document.documentElement;
    root.style.setProperty('--bg-color-1', generateRandomColor());
    root.style.setProperty('--bg-color-2', generateRandomColor());
    root.style.setProperty('--bg-color-3', generateRandomColor());
    root.style.setProperty('--bg-color-4', generateRandomColor());
    root.style.setProperty('--bg-color-5', generateRandomColor());
    root.style.setProperty('--bg-color-6', generateRandomColor());
  }, []);

  return <Component {...pageProps} />;
}
