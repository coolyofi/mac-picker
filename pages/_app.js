import '../styles/globals.css';
import { useEffect } from 'react';
import LiquidBackground from '@/components/LiquidBackground';

export default function MyApp({ Component, pageProps }) {
  useEffect(() => {
    // Generate random colors for dynamic background with better color spread
    const generateRandomColor = () => {
      const hue = Math.random() * 360;
      const saturation = 65 + Math.random() * 25; // 65-90%
      const lightness = 45 + Math.random() * 25; // 45-70%
      return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    };

    // Set random background colors - for additional gradient layers
    const root = document.documentElement;
    root.style.setProperty('--bg-color-1', generateRandomColor());
    root.style.setProperty('--bg-color-2', generateRandomColor());
    root.style.setProperty('--bg-color-3', generateRandomColor());
    root.style.setProperty('--bg-color-4', generateRandomColor());
    root.style.setProperty('--bg-color-5', generateRandomColor());
    root.style.setProperty('--bg-color-6', generateRandomColor());
  }, []);

  // Color schemes for rotation: tech, cyberpunk, ocean, aurora, sunset, forest
  const colorSchemes = ['tech', 'cyberpunk', 'ocean', 'aurora', 'sunset', 'forest'];
  const randomScheme = colorSchemes[Math.floor(Math.random() * colorSchemes.length)];

  return (
    <div style={{ position: 'relative', zIndex: 1 }}>
      <LiquidBackground 
        cellCount={10}
        colorScheme={randomScheme}
        speed={0.6}
        flowAmount={2}
        opacity={0.45}
        pulseSpeed={0.018}
        enableNetworkLines={true}
        networkLineDistance={250}
      />
      <Component {...pageProps} />
    </div>
  );
}
