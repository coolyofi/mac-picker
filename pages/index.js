import Head from "next/head";
import { useEffect, useMemo, useRef, useState, useCallback, memo } from "react";
import dynamic from "next/dynamic";
import macData from "../data/macs.json";
<<<<<<< HEAD
import FilterPanel from "../components/FilterPanel";
import ProductCard from "../components/ProductCard";
import SkeletonCard from "../components/SkeletonCard";
=======
>>>>>>> 7190f33 (refactor: optimize component imports and enhance filtering logic)
import ClientOnlyTime from "../components/ClientOnlyTime";

// 1. 动态导入非首屏必要组件，减少初始 JS 体积
const FilterPanel = dynamic(() => import("../components/FilterPanel"), {
  loading: () => <div className="mp-loading">加载筛选面板...</div>,
  ssr: false, // 筛选面板仅客户端渲染
});
const ProductCard = dynamic(() => import("../components/ProductCard"), {
  loading: () => <div className="mp-card-skeleton">加载产品卡片...</div>,
  ssr: false,
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
    // 10种预设科技感配色方案
    const colorSchemes = [
      { h1: 210, h2: 140, h3: 275, a1: 0.14, a2: 0.10, a3: 0.08 }, // 冷蓝紫
      { h1: 195, h2: 120, h3: 260, a1: 0.12, a2: 0.08, a3: 0.06 }, // 深蓝绿紫
      { h1: 230, h2: 160, h3: 290, a1: 0.16, a2: 0.12, a3: 0.10 }, // 青绿紫
      { h1: 200, h2: 130, h3: 280, a1: 0.13, a2: 0.09, a3: 0.07 }, // 蓝绿紫
      { h1: 220, h2: 150, h3: 300, a1: 0.15, a2: 0.11, a3: 0.09 }, // 蓝紫粉
      { h1: 190, h2: 110, h3: 250, a1: 0.11, a2: 0.07, a3: 0.05 }, // 深蓝青紫
      { h1: 240, h2: 170, h3: 310, a1: 0.17, a2: 0.13, a3: 0.11 }, // 青紫粉
      { h1: 180, h2: 100, h3: 240, a1: 0.10, a2: 0.06, a3: 0.04 }, // 深青蓝紫
      { h1: 250, h2: 180, h3: 320, a1: 0.18, a2: 0.14, a3: 0.12 }, // 紫粉青
      { h1: 205, h2: 135, h3: 270, a1: 0.14, a2: 0.10, a3: 0.08 }, // 蓝紫绿
    ];

    const root = document.documentElement;
<<<<<<< HEAD
    let currentSchemeIndex = Math.floor(Math.random() * colorSchemes.length);
    let scheme = colorSchemes[currentSchemeIndex];
=======
    if (!root) return; // 防错：避免服务端渲染时操作 DOM

    const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
>>>>>>> 7190f33 (refactor: optimize component imports and enhance filtering logic)

    const applyScheme = () => {
      root.style.setProperty("--bg-h1", `${scheme.h1}`);
      root.style.setProperty("--bg-h2", `${scheme.h2}`);
      root.style.setProperty("--bg-h3", `${scheme.h3}`);
      root.style.setProperty("--bg-a1", `${scheme.a1}`);
      root.style.setProperty("--bg-a2", `${scheme.a2}`);
      root.style.setProperty("--bg-a3", `${scheme.a3}`);

<<<<<<< HEAD
      // 设置6个渐变颜色
      root.style.setProperty("--bg-color-1", `hsla(${scheme.h1}, 85%, 60%, ${scheme.a1})`);
      root.style.setProperty("--bg-color-2", `hsla(${scheme.h2}, 90%, 65%, ${scheme.a2})`);
      root.style.setProperty("--bg-color-3", `hsla(${scheme.h3}, 80%, 70%, ${scheme.a3})`);
      root.style.setProperty("--bg-color-4", `hsla(${scheme.h1 + 20}, 85%, 55%, ${scheme.a1 * 0.8})`);
      root.style.setProperty("--bg-color-5", `hsla(${scheme.h2 + 30}, 90%, 65%, ${scheme.a2 * 0.9})`);
      root.style.setProperty("--bg-color-6", `hsla(${scheme.h3 - 10}, 75%, 60%, ${scheme.a3 * 0.7})`);
    };

    applyScheme();

    // 定时切换（每30秒）- 禁用以保持液态背景稳定
    // const interval = setInterval(() => {
    //   currentSchemeIndex = (currentSchemeIndex + 1) % colorSchemes.length;
    //   scheme = colorSchemes[currentSchemeIndex];
    //   applyScheme();
    // }, 30000);

    // 鼠标跟随光点
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

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      // clearInterval(interval); // 已禁用自动切换
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationId) cancelAnimationFrame(animationId);
=======
    root.style.setProperty("--bg-h1", `${h1}`);
    root.style.setProperty("--bg-h2", `${h2}`);
    root.style.setProperty("--bg-h3", `${h3}`);
    root.style.setProperty("--bg-a1", `${a1}`);
    root.style.setProperty("--bg-a2", `${a2}`);
    root.style.setProperty("--bg-a3", `${a3}`);

    // 清理副作用：避免卸载时残留样式
    return () => {
      root.style.removeProperty("--bg-h1");
      root.style.removeProperty("--bg-h2");
      root.style.removeProperty("--bg-h3");
      root.style.removeProperty("--bg-a1");
      root.style.removeProperty("--bg-a2");
      root.style.removeProperty("--bg-a3");
>>>>>>> 7190f33 (refactor: optimize component imports and enhance filtering logic)
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

  const normalizedQuery = useMemo(() => (filters.q || "").trim().toLowerCase(), [filters.q]);

  // 优化过滤逻辑：使用短路评估减少计算，缓存的 filterProduct 函数避免重复创建
  const filterProduct = useCallback((item) => {
    const s = item?.specs || {};
    const price = Number(item?.priceNum || 0);
    const minP = Number(filters.priceMin || 0);
    const maxP = Number(filters.priceMax || 0);
    const ramMin = Number(filters.ram || 0);
    const ssdMin = Number(filters.ssd || 0);

    // 短路优化：先判断简单条件，不满足直接返回 false
    if (minP && price < minP) return false;
    if (maxP && price > maxP) return false;
    if (Number(s?.ram || 0) < ramMin) return false;
    if (Number(s?.ssd_gb || 0) < ssdMin) return false;

    // 搜索匹配：提前拼接 haystack，避免多次拼接
    if (normalizedQuery) {
      const haystack = [
        item?.displayTitle,
        item?.modelId,
        s?.chip_model,
        s?.chip_series,
        item?.color,
        ...(Array.isArray(item?.details) ? item.details : []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    }
    return true;
  }, [filters.priceMin, filters.priceMax, filters.ram, filters.ssd, normalizedQuery]);

  // 优化过滤+排序：减少重复计算
  const filteredProducts = useMemo(() => {
    // 先过滤
    const filtered = products.filter(filterProduct);
    // 排序：仅在过滤结果变化时排序
    return filtered.sort((a, b) => Number(a?.priceNum || 0) - Number(b?.priceNum || 0));
  }, [products, filterProduct]);

  // 4. useCallback 包裹传递给子组件的函数（避免子组件重渲染）
  const handleSetFilters = useCallback((newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const toggleDrawer = useCallback((open) => {
    setIsDrawerOpen(open);
  }, []);

  // Progressive rendering state to avoid jank when many items
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    const total = filteredProducts.length;

    // If small list, render all at once
    if (total <= 24) {
      if (mounted) setVisibleCount(total);
      return;
    }

    // For large lists, render progressively in batches
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 700;
    const initial = isMobile ? 6 : 12;
    const batch = isMobile ? 6 : 8;

    let current = 0;
    const scheduleNext = () => {
      if (!mounted) return;
      current = Math.min(total, current + (current === 0 ? initial : batch));
      setVisibleCount(current);
      if (current < total) {
        if ('requestIdleCallback' in window) {
          requestIdleCallback(scheduleNext, { timeout: 200 });
        } else {
          setTimeout(scheduleNext, 60);
        }
      }
    };

    // start
    scheduleNext();

    return () => {
      mounted = false;
    };
  }, [filteredProducts]);

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
        <link rel="preload" href="/styles/main.css" as="style" />
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

          <input
            value={filters.q}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
            className="mp-search"
            placeholder="搜索：型号 / 芯片 / 颜色 / 关键字…"
            inputMode="search"
          />
          {/* search hint removed per design: counts hidden on homepage */}
        </div>
      </header>

      <div className="mp-layout">
        {/* 左侧筛选（只保留：价格 / RAM / SSD） */}
        <aside className="mp-sidebar">
<<<<<<< HEAD
          <div className="mp-sidebarMeta">
            <div className="mp-metaRow">
              <span className="mp-metaKey">当前匹配</span>
              <span className="mp-metaVal mp-metaValStrong">{filteredProducts.length} 台</span>
            </div>
          </div>

=======
          <SidebarMeta lastUpdated={macData?.lastUpdated} count={filteredProducts.length} />
>>>>>>> 7190f33 (refactor: optimize component imports and enhance filtering logic)
          <FilterPanel
            filters={filters}
            setFilters={handleSetFilters}
            priceBounds={priceBounds}
          />
        </aside>

        {/* 主内容：卡片网格 */}
        <main className="mp-main">
          {filteredProducts.length === 0 ? (
            <div className="mp-empty">
              <div className="mp-emptyTitle">没有匹配到机器</div>
              <div className="mp-emptySub">试试降低 RAM/SSD 要求，或者清空搜索关键字。</div>
            </div>
          ) : (
            <div className="mp-grid">
              {filteredProducts.slice(0, visibleCount).map((mac) => (
                <ProductCard key={mac?.id || `${mac?.modelId}-${mac?.priceNum}`} data={mac} />
              ))}

              {/* Render skeleton placeholders while progressive loading continues */}
              {visibleCount < filteredProducts.length && Array.from({ length: Math.min(8, Math.max(3, filteredProducts.length - visibleCount)) }).map((_, i) => (
                <SkeletonCard key={`skeleton-${i}`} />
              ))}
            </div>
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
<<<<<<< HEAD
              <div className="mp-sidebarMeta">
                <div className="mp-metaRow">
                  <span className="mp-metaKey">当前匹配</span>
                  <span className="mp-metaVal mp-metaValStrong">{filteredProducts.length} 台</span>
                </div>
              </div>

=======
              <SidebarMeta lastUpdated={macData?.lastUpdated} count={filteredProducts.length} />
>>>>>>> 7190f33 (refactor: optimize component imports and enhance filtering logic)
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
