import { useState, useEffect } from "react";

/**
 * Custom hook to detect the device type (mobile, tablet, desktop).
 * Uses window.innerWidth for detection and ensures SSR safety.
 */
export function useDeviceType() {
  const [deviceType, setDeviceType] = useState("desktop");

  useEffect(() => {
    const updateDeviceType = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setDeviceType("mobile");
      } else if (width < 1024) {
        setDeviceType("tablet");
      } else {
        setDeviceType("desktop");
      }
    };

    // Initial check
    updateDeviceType();

    // Add resize listener
    window.addEventListener("resize", updateDeviceType);

    return () => {
      window.removeEventListener("resize", updateDeviceType);
    };
  }, []);

  return deviceType;
}