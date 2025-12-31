import '../styles/globals.css';
import { useEffect } from 'react';
import LiquidBackground from '@/components/LiquidBackground';

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

  return (
    <div style={{ position: 'relative', zIndex: 1 }}>
      <LiquidBackground 
        cellCount={8}
        colorScheme="tech"
        speed={0.5}
        flowAmount={1.5}
        opacity={0.4}
        hueShiftSpeed={0.3}
        pulseSpeed={0.015}
      />
      <Component {...pageProps} />
    </div>
  );
}
