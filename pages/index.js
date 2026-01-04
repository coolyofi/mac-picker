import Head from "next/head";
import { useEffect, useMemo, useRef, useState, useCallback, memo } from "react";
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

  const normalizedQuery = useMemo(() => (filters.q || "").trim().toLowerCase(), [filters.q]);

  // 标签匹配函数
  const matchesTag = useCallback((item, tag) => {
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
      default:
        // 自定义标签，搜索所有字段
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
        return haystack.includes(text);
    }
  }, []);

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

    // 标签筛选
    if (filters.tags && filters.tags.length > 0) {
      const matches = filters.tags.map(tag => matchesTag(item, tag));
      if (filters.logic === "AND") {
        return matches.every(Boolean);
      } else {
        return matches.some(Boolean);
      }
    }

    // 传统搜索匹配（向后兼容）
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
  }, [filters.priceMin, filters.priceMax, filters.ram, filters.ssd, filters.tags, filters.logic, normalizedQuery, matchesTag]);

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

  // ============ 动态性能检测 ============
  const getDeviceCapability = useCallback(() => {
    // 仅在客户端运行（避免 SSR 时 window 不存在）
    if (typeof window === 'undefined') {
      return { cpuCores: 4, isHighEnd: false, isMidRange: true };
    }
    const cpuCores = navigator.hardwareConcurrency || 4;
    const memoryInfo = window.performance?.memory;
    const totalMemory = memoryInfo?.jsHeapSizeLimit || 0;
    const isHighEnd = cpuCores >= 8 || totalMemory > 8 * 1024 * 1024 * 1024;
    const isMidRange = cpuCores >= 4;
    return { cpuCores, isHighEnd, isMidRange };
  }, []);

  const getBatchSize = useCallback(() => {
    // 仅在客户端运行
    if (typeof window === 'undefined') {
      return 8; // SSR 时返回默认值
    }
    const { cpuCores, isHighEnd, isMidRange } = getDeviceCapability();
    const isMobile = window.innerWidth < 700;

    if (isHighEnd) {
      return isMobile ? 8 : 12; // 高端机：多加载，更快完成
    } else if (isMidRange) {
      return isMobile ? 6 : 8; // 中端机：保持较好平衡
    } else {
      return isMobile ? 4 : 6; // 低端机：少加载，避免卡顿
    }
  }, [getDeviceCapability]);

  // ============ 渐进式渲染 + 滚动预判加载 ============
  const [visibleCount, setVisibleCount] = useState(0);
  const [skeletonVisible, setSkeletonVisible] = useState(true);
  const renderAbort = useRef(false);
  const scrollHandlerRef = useRef(null);

  useEffect(() => {
    // 骨架屏最小显示时间：300ms，避免加载太快时的闪烁
    const skeletonTimer = setTimeout(() => {
      setSkeletonVisible(false);
    }, 300);

    return () => clearTimeout(skeletonTimer);
  }, []);

  useEffect(() => {
    let mounted = true;
    const total = filteredProducts.length;

    // 筛选变更时立即中断旧渲染
    renderAbort.current = true;
    if (scrollHandlerRef.current) {
      window.removeEventListener('scroll', scrollHandlerRef.current);
    }

    // 重置渲染状态 (同步重置，避免 race condition)
    setVisibleCount(0);
    setSkeletonVisible(true);
    renderAbort.current = false;

    // 如果结果集较小，一次性渲染
    if (total <= 24) {
      const timer = setTimeout(() => {
        if (mounted && !renderAbort.current) {
          setVisibleCount(total);
          setSkeletonVisible(false);
        }
      }, 10);
      return () => {
        clearTimeout(timer);
        mounted = false;
      };
    }

    // 大列表：渐进式渲染 + 滚动预判加载
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 700;
    const batchSize = getBatchSize();
    const initial = Math.min(total, isMobile ? Math.ceil(batchSize * 1.5) : Math.ceil(batchSize * 1.2));
    let current = 0;

    // 1. 初始渲染首屏
    const initRender = () => {
      if (!mounted || renderAbort.current) return;
      current = Math.min(total, initial);
      setVisibleCount(current);

      // 若首屏就是全部，不监听滚动
      if (current >= total) {
        setSkeletonVisible(false);
        return;
      }

      // 2. 设置滚动监听：预判加载
      const handleScroll = () => {
        if (!mounted || renderAbort.current || current >= total) return;

        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        // 当滚动到已渲染内容的 80% 时，提前加载下一批
        const scrollTrigger = scrollTop + windowHeight >= documentHeight * 0.8;

        if (scrollTrigger && current < total) {
          loadNextBatch();
        }
      };

      window.addEventListener('scroll', handleScroll, { passive: true });
    };

    // 3. 加载下一批（利用 requestIdleCallback 优先占用空闲时间）
    const loadNextBatch = () => {
      if (!mounted || renderAbort.current) return;
      const nextCurrent = Math.min(total, current + batchSize);

      if ('requestIdleCallback' in window) {
        requestIdleCallback(
          () => {
            if (mounted && !renderAbort.current) {
              current = nextCurrent;
              setVisibleCount(current);
              if (current >= total) setSkeletonVisible(false);
            }
          },
          { timeout: 150 } // 150ms 内没有空闲时间则强制加载，避免等太久
        );
      } else {
        setTimeout(() => {
          if (mounted && !renderAbort.current) {
            current = nextCurrent;
            setVisibleCount(current);
            if (current >= total) setSkeletonVisible(false);
          }
        }, 40); // 低端机 timeout 缩短，加快加载
      }
    };

    // 初始化
    initRender();

    return () => {
      mounted = false;
      renderAbort.current = true;
      if (scrollHandlerRef.current) {
        window.removeEventListener('scroll', scrollHandlerRef.current);
      }
    };
  }, [filteredProducts, getBatchSize]);

  // ============ 模块3：缓存已渲染卡片 ============
  const renderedCards = useMemo(() => {
    return filteredProducts.slice(0, visibleCount).map((mac) => (
      <ProductCard key={mac?.id || `${mac?.modelId}-${mac?.priceNum}`} data={mac} />
    ));
  }, [filteredProducts, visibleCount]);

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
              {/* 使用缓存的已渲染卡片 */}
              {renderedCards}

              {/* 仅当还有未加载的卡片且骨架屏未超时时，才渲染骨架屏
                  数量 = 下一批次数量，避免过多骨架屏造成视觉混乱 */}
              {visibleCount < filteredProducts.length && skeletonVisible && Array.from({
                length: Math.min(getBatchSize(), Math.max(2, filteredProducts.length - visibleCount))
              }).map((_, i) => (
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
