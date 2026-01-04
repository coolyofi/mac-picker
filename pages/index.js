import Head from "next/head";
import { useEffect, useMemo, useRef, useState, useCallback, memo, useDeferredValue } from "react";
import dynamic from "next/dynamic";
import macData from "../data/macs.json";
import SearchWithDropdown from "../components/SearchWithDropdown";
import ClientOnlyTime from "../components/ClientOnlyTime";
import SkeletonCard from "../components/SkeletonCard";
import { useDeviceType } from "../hooks/useDeviceType";
import { useRandomDarkBackdrop } from "../hooks/useRandomDarkBackdrop";

// 1. 动态导入非首屏必要组件，减少初始 JS 体积
const FilterPanel = dynamic(() => import("../components/FilterPanel"), {
  loading: () => <div className="mp-loading">加载筛选面板...</div>,
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
