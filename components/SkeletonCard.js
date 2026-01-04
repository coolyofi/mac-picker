import { useMemo, useState, useEffect } from "react";

export default function SkeletonCard() {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // 检测低端设备：CPU 核心数 ≤ 2 或内存 < 4GB
  // 仅在客户端运行（避免 SSR 时 window 不存在）
  const isLowEndDevice = useMemo(() => {
    if (typeof window === 'undefined') {
      return false; // SSR 时不应用低端设备样式
    }
    const cpuCores = navigator.hardwareConcurrency || 4;
    const memoryInfo = window.performance?.memory;
    const totalMemory = memoryInfo?.jsHeapSizeLimit || 0;
    return cpuCores <= 2 || (totalMemory > 0 && totalMemory < 4 * 1024 * 1024 * 1024);
  }, []);

  return (
    <article className={`pc pc--skeleton ${isHydrated && isLowEndDevice ? "pc--skeleton-no-animation" : ""}`}>
      <div className="pc-flip">
        <div className="pc-face pc-front">
          <div className="pc-top">
            <div className="pc-titleWrap">
              <div className="pc-title skeleton-line short" />
              <div className="pc-model skeleton-line thinner" />
            </div>

            <div className="pc-price skeleton-line small" />
          </div>

          <div className="pc-sep" />

          <div className="pc-imgContainer">
            <div className="pc-img">
              <div className="skeleton-rect" />
            </div>

            <div className="pc-tagsOverlay">
              <div className="pc-tagRow">
                <span className="pc-tag skeleton-line tiny" />
                <span className="pc-tag skeleton-line tiny" />
                <span className="pc-tag skeleton-line tiny" />
              </div>
              <div className="pc-tagRow">
                <span className="pc-tag skeleton-line tiny" />
                <span className="pc-tag skeleton-line tiny" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
