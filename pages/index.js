import Head from "next/head";
import { useEffect, useMemo, useRef, useState, useCallback, memo, useDeferredValue } from "react";
import dynamic from "next/dynamic";
import ProductCard from "../components/ProductCard";
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

  // Track which fields were included in the last applied update (for per-field feedback)
  const [lastAppliedFields, setLastAppliedFields] = useState([]);
  const pendingAppliedFieldsRef = useRef([]);
  const lastSentFiltersRef = useRef(filters);

  // Concurrent React: Defer the filter updates to keep input responsive
  const deferredFilters = useDeferredValue(filters);

  useEffect(() => {
    // Initialize worker
    console.log('[Index] Initializing filter worker');
    workerRef.current = new Worker(new URL('../workers/filter.worker.js', import.meta.url));
    workerRef.current.onmessage = (e) => {
      console.log('[Index] Worker onmessage received', e?.data?.length ? `${e.data.length} items` : e.data);
      // When worker responds, update the list (no global view-transition)
      setFilteredProducts(e.data);
      setIsWorkerReady(true);

      // Trigger per-field visual feedback for the fields that changed in the last request
      const applied = pendingAppliedFieldsRef.current || [];
      if (applied.length > 0) {
        setLastAppliedFields(applied);
        setTimeout(() => setLastAppliedFields([]), 700);
      }
    };
    
    return () => {
      console.log('[Index] Terminating filter worker');
      workerRef.current?.terminate();
    };
  }, []);

  // Send updates to worker (using deferred value)
  useEffect(() => {
    if (workerRef.current) {
      const prev = lastSentFiltersRef.current || {};
      const changed = [];
      const keys = ['priceMin','priceMax','ram','ssd','q','tags','logic'];
      keys.forEach(k => {
        if (JSON.stringify(prev[k]) !== JSON.stringify(deferredFilters[k])) changed.push(k);
      });
      pendingAppliedFieldsRef.current = changed;
      lastSentFiltersRef.current = deferredFilters;
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
  const [showParticles, setShowParticles] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReducedMotion && window.innerWidth >= 980) setShowParticles(true);
  }, []);

  const [vgridMissing, setVGridMissing] = useState(false);
  const [forceFallback, setForceFallback] = useState(false);
  const vgridPreloadedRef = useRef(false);

  // If after a few seconds the worker hasn't hydrated or the virtual grid isn't present,
  // enable a forced fallback to render a simple non-virtualized list from server-provided `products`.
  useEffect(() => {
    const t = setTimeout(() => {
      const hasVGrid = !!document.querySelector('.mp-virtual-grid');
      if (!hasVGrid && !isWorkerReady) {
        setVGridMissing(true);
        setForceFallback(true);
      }
    }, 3000);
    return () => clearTimeout(t);
  }, [isWorkerReady]);

  // Try to proactively preload the VirtualGrid chunk when we have results
  useEffect(() => {
    console.log('[Index] Preload check: isWorkerReady=', isWorkerReady, 'filteredProducts=', (filteredProducts||[]).length);
    if (!isWorkerReady) return;
    if (!filteredProducts || filteredProducts.length === 0) return;
    try {
      if (VirtualGrid && typeof VirtualGrid.preload === 'function' && !vgridPreloadedRef.current) {
        console.log('[Index] Calling VirtualGrid.preload()');
        VirtualGrid.preload();
        vgridPreloadedRef.current = true;
        // After a short timeout, check whether the virtual DOM appeared
        const t = setTimeout(() => {
          const hasVGrid = !!document.querySelector('.mp-virtual-grid');
          console.log('[Index] after preload check mp-virtual-grid exists=', hasVGrid);
          if (!hasVGrid) setVGridMissing(true);
        }, 2000);
        return () => clearTimeout(t);
      } else if (!vgridPreloadedRef.current) {
        console.log('[Index] Fallback dynamic import: importing VirtualGrid directly');
        import('../components/VirtualGrid')
          .then((mod) => {
            console.log('[Index] Dynamic import resolved for VirtualGrid', !!mod);
            vgridPreloadedRef.current = true;
            // After import, check DOM
            setTimeout(() => {
              const hasVGrid = !!document.querySelector('.mp-virtual-grid');
              console.log('[Index] after dynamic import mp-virtual-grid exists=', hasVGrid);
              if (!hasVGrid) setVGridMissing(true);
            }, 1000);
          })
          .catch(err => {
            console.warn('[Index] Dynamic import failed', err && err.message ? err.message : err);
            setVGridMissing(true);
          });
      }
    } catch (err) {
      // don't crash the UI; mark missing and surface a hint
      console.warn('VirtualGrid preload failed', err);
      setVGridMissing(true);
    }
  }, [isWorkerReady, filteredProducts]);

  return (
    <div className="mp-root">
      {/* 固定背景层 */}
      <div className="mp-bg-fixed">
        <div className="mp-bg-gradients"></div>
        <div className="mp-bg-grid"></div>
        {showParticles && <div className="mp-bg-particles" id="particles"></div>}
      </div>

      <Head>
        <title>MacPicker Pro</title>
        <meta name="description" content="选 Mac 小助手" />
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
            query={filters.q}
            onQueryChange={(val) => setFilters((f) => ({ ...f, q: val }))}
            tags={filters.tags}
            logic={filters.logic}
            onTagsChange={(newTags) => setFilters((f) => ({ ...f, tags: newTags }))}
            onLogicChange={(newLogic) => setFilters((f) => ({ ...f, logic: newLogic }))}
            products={products}
            placeholder="搜索：型号 / 芯片 / 颜色 / 关键字…"
          />
        </div>

        {/* 已选条件标签栏 */}
        <div className="mp-appliedTags" aria-live="polite">
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

          {filters.ram && filters.ram !== 8 && (
            <div className="mp-tag">
              内存 {filters.ram} GB
              <button
                className="mp-tag-close"
                onClick={() => setFilters((f) => ({ ...f, ram: 8 }))}
                aria-label="删除内存筛选"
              >×</button>
            </div>
          )}

          {filters.ssd && filters.ssd !== 256 && (
            <div className="mp-tag">
              存储 {filters.ssd} GB
              <button
                className="mp-tag-close"
                onClick={() => setFilters((f) => ({ ...f, ssd: 256 }))}
                aria-label="删除存储筛选"
              >×</button>
            </div>
          )}

          {filters.q && (
            <div className="mp-tag">
              搜索: {filters.q}
              <button className="mp-tag-close" onClick={() => setFilters((f) => ({ ...f, q: '' }))} aria-label="删除搜索关键字">×</button>
            </div>
          )}

          {(filters.tags || []).map((t) => (
            <div key={t} className="mp-tag">
              {t}
              <button className="mp-tag-close" onClick={() => setFilters((f) => ({ ...f, tags: (f.tags||[]).filter(x => x !== t) }))} aria-label="删除标签">×</button>
            </div>
          ))}

          {lastAppliedFields.length > 0 && (
            <div className="mp-tag mp-tag--muted">已应用: {lastAppliedFields.join(', ')}</div>
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
            appliedFields={lastAppliedFields}
          />
        </aside>

        {/* 主内容：卡片网格 */}
        <main className="mp-main">
          {console.log('[Index] Render check: isWorkerReady=', isWorkerReady, 'filteredProducts=', (filteredProducts||[]).length, 'vgridMissing=', vgridMissing)}
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
            (console.log('[Index] Rendering VirtualGrid with', (filteredProducts||[]).length, 'items'), <VirtualGrid items={filteredProducts} />)
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
                appliedFields={lastAppliedFields}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
