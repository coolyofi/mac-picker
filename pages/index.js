import Head from "next/head";
import { useEffect, useMemo, useRef, useState, useCallback, memo, useDeferredValue } from "react";
import dynamic from "next/dynamic";
import ProductCard from "../components/ProductCard";
import macData from "../data/macs.json";
import SearchWithDropdown from "../components/SearchWithDropdown";
import ClientOnlyTime from "../components/ClientOnlyTime";
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

const matchesTag = (item, tag) => {
  const s = item?.specs || {};
  const category = tag.category;
  const text = tag.text.toLowerCase();
  switch (category) {
    case "机型":
      return item?.displayTitle?.toLowerCase().includes(text) ||
             item?.modelId?.toLowerCase().includes(text);
    case "芯片":
      return s?.chip_model?.toLowerCase().includes(text) ||
             s?.chip_series?.toLowerCase().includes(text);
    case "存储":
      return String(s?.ssd_gb || "").includes(text.replace(/gb/i, "")) ||
             item?.details?.some(d => d.toLowerCase().includes(text));
    case "内存":
      return String(s?.ram || "").includes(text.replace(/gb/i, "")) ||
             item?.details?.some(d => d.toLowerCase().includes(text));
    case "颜色":
      return item?.color?.toLowerCase().includes(text);
    default: {
      const haystack = [
        item?.displayTitle,
        item?.modelId,
        s?.chip_model,
        s?.chip_series,
        item?.color,
        ...(Array.isArray(item?.details) ? item.details : []),
      ].filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(text);
    }
  }
};

const filterProducts = (items, filters) => {
  const { q, priceMin, priceMax, ram, ssd, tags, logic } = filters;
  const normalizedQuery = (q || "").trim().toLowerCase();
  const minP = Number(priceMin || 0);
  const maxP = Number(priceMax || 0);
  const ramMin = Number(ram || 0);
  const ssdMin = Number(ssd || 0);

  console.log('[filterProducts] Filtering with:', { minP, maxP, ramMin, ssdMin, q: normalizedQuery });

  const filtered = items.filter((item) => {
    const s = item?.specs || {};
    const price = Number(item?.priceNum || 0);
    if (minP && price < minP) return false;
    if (maxP && price > maxP) return false;
    if (Number(s?.ram || 0) < ramMin) return false;
    if (Number(s?.ssd_gb || 0) < ssdMin) return false;
    if (tags && tags.length > 0) {
      const matches = tags.map(tag => matchesTag(item, tag));
      if (logic === "AND") {
        if (!matches.every(Boolean)) return false;
      } else if (!matches.some(Boolean)) {
        return false;
      }
    }
    if (normalizedQuery) {
      const haystack = [
        item?.displayTitle,
        item?.modelId,
        s?.chip_model,
        s?.chip_series,
        item?.color,
        ...(Array.isArray(item?.details) ? item.details : []),
      ].filter(Boolean).join(" ").toLowerCase();
      if (!haystack.includes(normalizedQuery)) return false;
    }
    return true;
  });

  console.log('[filterProducts] Filtered count:', filtered.length);
  return filtered.sort((a, b) => Number(a?.priceNum || 0) - Number(b?.priceNum || 0));
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

  // Concurrent React: Defer the filter updates to keep input responsive
  const filteredProducts = useMemo(() => filterProducts(products, filters), [products, filters]);

  // Track which fields were included in the last applied update (for per-field feedback)
  const [lastAppliedFields, setLastAppliedFields] = useState([]);
  const lastSentFiltersRef = useRef(filters);

  useEffect(() => {
    const prev = lastSentFiltersRef.current || {};
    const keys = ['priceMin','priceMax','ram','ssd','q','tags','logic'];
    const changed = keys.filter((k) => JSON.stringify(prev[k]) !== JSON.stringify(filters[k]));
    lastSentFiltersRef.current = filters;
    if (changed.length > 0) {
      setLastAppliedFields(changed);
      const timer = setTimeout(() => setLastAppliedFields([]), 700);
      return () => clearTimeout(timer);
    }
    setLastAppliedFields([]);
  }, [filters]);

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
  const vgridPreloadedRef = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => {
      const hasVGrid = !!document.querySelector('.mp-virtual-grid');
      setVGridMissing(!hasVGrid);
    }, 3000);
    return () => clearTimeout(t);
  }, [filteredProducts.length]);

  // Try to proactively preload the VirtualGrid chunk when we have results
  useEffect(() => {
    console.log('[Index] Preload check: filteredProducts=', (filteredProducts||[]).length);
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
  }, [filteredProducts]);

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

          {(filters.tags || []).map((t, idx) => (
            <div key={`${t.category}-${t.text}-${idx}`} className="mp-tag">
              {t.category}: {t.text}
              <button className="mp-tag-close" onClick={() => setFilters((f) => ({ ...f, tags: (f.tags||[]).filter((_, i) => i !== idx) }))} aria-label="删除标签">×</button>
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
          {console.log('[Index] Render check: filteredProducts=', (filteredProducts||[]).length, 'vgridMissing=', vgridMissing)}
          {filteredProducts.length === 0 ? (
            <div className="mp-empty">
              <div className="mp-emptyTitle">没有匹配到机器</div>
              <div className="mp-emptySub">试试降低 RAM/SSD 要求，或者清空搜索关键字。</div>
            </div>
          ) : vgridMissing ? (
            <div>
              <div className="mp-empty mp-empty--warn">
                <div className="mp-emptyTitle">列表加载失败（已回退）</div>
                <div className="mp-emptySub">虚拟化列表无法渲染，已切换为非虚拟化回退渲染（前 24 条）。若需更快恢复，请刷新页面。</div>
              </div>

              <div className="mp-grid">
                {filteredProducts.slice(0, 24).map((item) => (
                  <ProductCard key={item.id || item.modelId || Math.random()} data={item} />
                ))}
              </div>
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
