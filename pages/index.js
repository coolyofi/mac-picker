import Head from "next/head";
import { useEffect, useMemo, useRef, useState, useCallback, memo, useDeferredValue } from "react";
import dynamic from "next/dynamic";
import macData from "../data/macs.json";
import SearchWithDropdown from "../components/SearchWithDropdown";
import ClientOnlyTime from "../components/ClientOnlyTime";
import SkeletonCard from "../components/SkeletonCard";
import { useDeviceType } from "../hooks/useDeviceType";

// 1. 动态导入非首屏必要组件，减少初始 JS 体积
const FilterPanel = dynamic(() => import("../components/FilterPanel"), {
  loading: () => <div className="mp-loading">加载筛选面板...</div>,
  ssr: false,
});
const ProductCard = dynamic(() => import("../components/ProductCard"), {
  loading: () => <div className="mp-card-skeleton">加载产品卡片...</div>,
  ssr: false,
});
const VirtualGrid = dynamic(() => import("../components/VirtualGrid"), {
  ssr: false,
  loading: () => <div className="mp-loading">加载列表...</div>,
});

// 2. 抽离重复的 Meta 组件，减少代码重复
const SidebarMeta = memo(({ lastUpdated, count }) => (
  <div className="mp-sidebarMeta">
    <div className="mp-metaRow">
      <span className="mp-metaKey">数据更新时间</span>
      <span className="mp-metaVal">
        <ClientOnlyTime lastUpdated={lastUpdated} />
      </span>
    </div>
    <div className="mp-metaRow">
      <span className="mp-metaKey">当前匹配</span>
      <span className="mp-metaVal mp-metaValStrong">{count} 台</span>
    </div>
  </div>
));
SidebarMeta.displayName = "SidebarMeta";

// 3. 纯函数提升到组件外，支持缓存
const safeItems = (data) => {
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data)) return data;
  return [];
};

function useRandomDarkBackdrop() {
  useEffect(() => {
    const colorSchemes = [
      { h1: 210, h2: 140, h3: 275, a1: 0.14, a2: 0.10, a3: 0.08 },
      { h1: 195, h2: 120, h3: 260, a1: 0.12, a2: 0.08, a3: 0.06 },
      { h1: 230, h2: 160, h3: 290, a1: 0.16, a2: 0.12, a3: 0.10 },
      { h1: 200, h2: 130, h3: 280, a1: 0.13, a2: 0.09, a3: 0.07 },
      { h1: 220, h2: 150, h3: 300, a1: 0.15, a2: 0.11, a3: 0.09 },
      { h1: 190, h2: 110, h3: 250, a1: 0.11, a2: 0.07, a3: 0.05 },
      { h1: 240, h2: 170, h3: 310, a1: 0.17, a2: 0.13, a3: 0.11 },
      { h1: 180, h2: 100, h3: 240, a1: 0.10, a2: 0.06, a3: 0.04 },
      { h1: 250, h2: 180, h3: 320, a1: 0.18, a2: 0.14, a3: 0.12 },
      { h1: 205, h2: 135, h3: 270, a1: 0.14, a2: 0.10, a3: 0.08 },
    ];

    const root = document.documentElement;
    if (!root) return;

    let currentSchemeIndex = Math.floor(Math.random() * colorSchemes.length);
    let scheme = colorSchemes[currentSchemeIndex];

    const applyScheme = () => {
      root.style.setProperty("--bg-h1", `${scheme.h1}`);
      root.style.setProperty("--bg-h2", `${scheme.h2}`);
      root.style.setProperty("--bg-h3", `${scheme.h3}`);
      root.style.setProperty("--bg-a1", `${scheme.a1}`);
      root.style.setProperty("--bg-a2", `${scheme.a2}`);
      root.style.setProperty("--bg-a3", `${scheme.a3}`);

      root.style.setProperty("--bg-color-1", `hsla(${scheme.h1}, 85%, 60%, ${scheme.a1})`);
      root.style.setProperty("--bg-color-2", `hsla(${scheme.h2}, 90%, 65%, ${scheme.a2})`);
      root.style.setProperty("--bg-color-3", `hsla(${scheme.h3}, 80%, 70%, ${scheme.a3})`);
      root.style.setProperty("--bg-color-4", `hsla(${scheme.h1 + 20}, 85%, 55%, ${scheme.a1 * 0.8})`);
      root.style.setProperty("--bg-color-5", `hsla(${scheme.h2 + 30}, 90%, 65%, ${scheme.a2 * 0.9})`);
      root.style.setProperty("--bg-color-6", `hsla(${scheme.h3 - 10}, 75%, 60%, ${scheme.a3 * 0.7})`);
    };

    applyScheme();

    let animationId;
    const handleMouseMove = (e) => {
      const particles = document.getElementById('particles');
      if (particles) {
        const x = e.clientX;
        const y = e.clientY;
        if (animationId) cancelAnimationFrame(animationId);
        animationId = requestAnimationFrame(() => {
          particles.style.setProperty('--mouse-x', `${x}px`);
          particles.style.setProperty('--mouse-y', `${y}px`);
        });
      }
    };

    const handleTouchMove = (e) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const x = touch.clientX;
        const y = touch.clientY;
        if (animationId) cancelAnimationFrame(animationId);
        animationId = requestAnimationFrame(() => {
          const particles = document.getElementById('particles');
          if (particles) {
            particles.style.setProperty('--mouse-x', `${x}px`);
            particles.style.setProperty('--mouse-y', `${y}px`);
          }
        });
      }
    };

    const handleResize = () => {
      applyScheme();
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('resize', handleResize);
      if (animationId) cancelAnimationFrame(animationId);
      root.style.removeProperty("--bg-h1");
      root.style.removeProperty("--bg-h2");
      root.style.removeProperty("--bg-h3");
      root.style.removeProperty("--bg-a1");
      root.style.removeProperty("--bg-a2");
      root.style.removeProperty("--bg-a3");
    };
  }, []);
}

export default function Home() {
  useRandomDarkBackdrop();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const products = useMemo(() => safeItems(macData), []);

  // 价格范围（用真实数据自动算，过滤无效数据提高效率）
  const priceBounds = useMemo(() => {
    const validPrices = products
      .map(item => Number(item?.priceNum || 0))
      .filter(p => Number.isFinite(p) && p > 0);
    
    if (validPrices.length === 0) return { min: 0, max: 0 };
    
    return {
      min: Math.min(...validPrices),
      max: Math.max(...validPrices),
    };
  }, [products]);

  const [filters, setFilters] = useState(() => ({
    q: "",
    priceMin: 0,
    priceMax: 0, // 0 表示不设上限（初始化后会 set）
    ram: 8,
    ssd: 256,
    tags: [],
    logic: "AND",
  }));

  // 初始化 priceMin/priceMax（避免 SSR/CSR 不一致）
  const didInit = useRef(false);
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    setFilters((f) => ({
      ...f,
      priceMin: priceBounds.min || 0,
      priceMax: priceBounds.max || 0,
    }));
  }, [priceBounds.min, priceBounds.max]);

  // Worker integration for high-performance filtering
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [isWorkerReady, setIsWorkerReady] = useState(false);
  const workerRef = useRef(null);

  // Concurrent React: Defer the filter updates to keep input responsive
  const deferredFilters = useDeferredValue(filters);

  useEffect(() => {
    // Initialize worker
    workerRef.current = new Worker(new URL('../workers/filter.worker.js', import.meta.url));
    workerRef.current.onmessage = (e) => {
      // View Transitions API: Animate list changes
      if (document.startViewTransition) {
        document.startViewTransition(() => {
          setFilteredProducts(e.data);
        });
      } else {
        setFilteredProducts(e.data);
      }
      setIsWorkerReady(true);
    };
    
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  // Send updates to worker (using deferred value)
  useEffect(() => {
    if (workerRef.current) {
      workerRef.current.postMessage({ products, filters: deferredFilters });
    }
  }, [products, deferredFilters]);

  // 4. useCallback 包裹传递给子组件的函数（避免子组件重渲染）
  const handleSetFilters = useCallback((newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const toggleDrawer = useCallback((open) => {
    setIsDrawerOpen(open);
  }, []);



  const deviceType = useDeviceType();

  return (
    <div className="mp-root">
      {/* 固定背景层 */}
      <div className="mp-bg-fixed">
        <div className="mp-bg-gradients"></div>
        <div className="mp-bg-grid"></div>
        <div className="mp-bg-particles" id="particles"></div>
      </div>

      <Head>
        <title>MacPicker Pro</title>
        <meta name="description" content="选 Mac 小助手" />
        {/* 预加载关键 CSS，减少渲染阻塞 */}
        <link rel="preload" href="/styles/globals.css" as="style" />
      </Head>

      {/* 顶部：标题 + 右上角全局搜索 */}
      <header className="mp-topbar">
        <div className="mp-brand">
          <div className="mp-title">
            MacPicker<span className="mp-dot">.</span>Pro
          </div>
          <div className="mp-subtitle">选 Mac 小助手</div>
          <div className="mp-status" style={{ marginTop: 6 }}>
            <div className="mp-status-updated">
              <span className="mp-updatedBadge">最近更新</span>
              <ClientOnlyTime lastUpdated={macData?.lastUpdated} />
            </div>
          </div>
        </div>

        <div className="mp-searchWrap">
          {/* 移动端菜单按钮 */}
          <button
            className="mp-menuBtn"
            onClick={() => toggleDrawer(true)}
            aria-label="打开筛选菜单"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12h18M3 6h18M3 18h18"/>
            </svg>
          </button>

          <SearchWithDropdown
            tags={filters.tags}
            logic={filters.logic}
            onTagsChange={(newTags) => setFilters((f) => ({ ...f, tags: newTags }))}
            onLogicChange={(newLogic) => setFilters((f) => ({ ...f, logic: newLogic }))}
            products={products}
            placeholder="搜索：型号 / 芯片 / 颜色 / 关键字…"
          />
          {/* search hint removed per design: counts hidden on homepage */}
        </div>

        {/* 已选条件标签栏 */}
        <div className="mp-appliedTags">
          {filters.priceMin > priceBounds.min && (
            <div className="mp-tag">
              ¥{Math.round(filters.priceMin).toLocaleString("zh-CN")} 起
              <button
                className="mp-tag-close"
                onClick={() =>
                  setFilters((f) => ({
                    ...f,
                    priceMin: priceBounds.min || 0,
                  }))
                }
                aria-label="删除价格筛选"
              >
                ×
              </button>
            </div>
          )}
          {filters.priceMax < priceBounds.max && (
            <div className="mp-tag">
              最高 ¥{Math.round(filters.priceMax).toLocaleString("zh-CN")}
              <button
                className="mp-tag-close"
                onClick={() =>
                  setFilters((f) => ({
                    ...f,
                    priceMax: priceBounds.max || 0,
                  }))
                }
                aria-label="删除价格上限"
              >
                ×
              </button>
            </div>
          )}
          {filters.ram > 8 && (
            <div className="mp-tag">
              ≥ {filters.ram}GB RAM
              <button
                className="mp-tag-close"
                onClick={() =>
                  setFilters((f) => ({
                    ...f,
                    ram: 8,
                  }))
                }
                aria-label="删除RAM筛选"
              >
                ×
              </button>
            </div>
          )}
          {filters.ssd > 256 && (
            <div className="mp-tag">
              ≥ {filters.ssd}GB SSD
              <button
                className="mp-tag-close"
                onClick={() =>
                  setFilters((f) => ({
                    ...f,
                    ssd: 256,
                  }))
                }
                aria-label="删除SSD筛选"
              >
                ×
              </button>
            </div>
          )}
        </div>
      </header>

      <div className={`mp-layout ${deviceType}`}>
        {/* 左侧筛选（只保留：价格 / RAM / SSD） */}
        <aside className="mp-sidebar">
          <SidebarMeta lastUpdated={macData?.lastUpdated} count={filteredProducts.length} />
          <FilterPanel
            filters={filters}
            setFilters={handleSetFilters}
            priceBounds={priceBounds}
            onApply={() => {}} // 应用筛选时让 useEffect 自然重置 visibleCount
          />
        </aside>

        {/* 主内容：卡片网格 */}
        <main className="mp-main">
          {!isWorkerReady ? (
             <div className="mp-grid">
                {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
             </div>
          ) : filteredProducts.length === 0 ? (
            <div className="mp-empty">
              <div className="mp-emptyTitle">没有匹配到机器</div>
              <div className="mp-emptySub">试试降低 RAM/SSD 要求，或者清空搜索关键字。</div>
            </div>
          ) : (
            <VirtualGrid items={filteredProducts} />
          )}
        </main>
      </div>

      {/* 移动端抽屉菜单 */}
      {isDrawerOpen && (
        <div className="mp-drawer-overlay" onClick={() => toggleDrawer(false)}>
          <div className="mp-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="mp-drawer-header">
              <h3>筛选条件</h3>
              <button
                className="mp-drawer-close"
                onClick={() => toggleDrawer(false)}
                aria-label="关闭菜单"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <div className="mp-drawer-content">
              <SidebarMeta lastUpdated={macData?.lastUpdated} count={filteredProducts.length} />
              <FilterPanel
                filters={filters}
                setFilters={handleSetFilters}
                priceBounds={priceBounds}
                onApply={() => setIsDrawerOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
