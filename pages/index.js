import Head from "next/head";
import { useEffect, useMemo, useRef, useState } from "react";
import macData from "../data/macs.json";
import FilterPanel from "../components/FilterPanel";
import ProductCard from "../components/ProductCard";
import SkeletonCard from "../components/SkeletonCard";
import ClientOnlyTime from "../components/ClientOnlyTime";

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
    let currentSchemeIndex = Math.floor(Math.random() * colorSchemes.length);
    let scheme = colorSchemes[currentSchemeIndex];

    const applyScheme = () => {
      root.style.setProperty("--bg-h1", `${scheme.h1}`);
      root.style.setProperty("--bg-h2", `${scheme.h2}`);
      root.style.setProperty("--bg-h3", `${scheme.h3}`);
      root.style.setProperty("--bg-a1", `${scheme.a1}`);
      root.style.setProperty("--bg-a2", `${scheme.a2}`);
      root.style.setProperty("--bg-a3", `${scheme.a3}`);

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
    };
  }, []);
}

export default function Home() {
  useRandomDarkBackdrop();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const products = useMemo(() => safeItems(macData), []);

  // 价格范围（用真实数据自动算）
  const priceBounds = useMemo(() => {
    let min = Infinity;
    let max = 0;
    for (const it of products) {
      const p = Number(it?.priceNum || 0);
      if (!Number.isFinite(p) || p <= 0) continue;
      if (p < min) min = p;
      if (p > max) max = p;
    }
    if (!Number.isFinite(min)) min = 0;
    return { min, max };
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

  const filteredProducts = useMemo(() => {
    const minP = Number(filters.priceMin || 0);
    const maxP = Number(filters.priceMax || 0);
    const ramMin = Number(filters.ram || 0);
    const ssdMin = Number(filters.ssd || 0);

    const out = [];
    for (const item of products) {
      const s = item?.specs || {};
      const price = Number(item?.priceNum || 0);

      // 价格过滤
      if (minP && price && price < minP) continue;
      if (maxP && price && price > maxP) continue;

      // RAM / SSD 过滤（数字比对）
      if (Number(s?.ram || 0) < ramMin) continue;
      if (Number(s?.ssd_gb || 0) < ssdMin) continue;

      // 全局搜索（标题/型号/芯片/颜色/details 全匹配）
      if (normalizedQuery) {
        const hay = [
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
        if (!hay.includes(normalizedQuery)) continue;
      }

      out.push(item);
    }

    // 价格从低到高（符合“选购工具”直觉）
    out.sort((a, b) => Number(a?.priceNum || 0) - Number(b?.priceNum || 0));
    return out;
  }, [products, filters.priceMin, filters.priceMax, filters.ram, filters.ssd, normalizedQuery]);

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
      </Head>

      {/* 顶部：标题 + 右上角全局搜索 */}
      <header className="mp-topbar">
        <div className="mp-brand">
          <div className="mp-title">
            MacPicker<span className="mp-dot">.</span>Pro
          </div>
          <div className="mp-subtitle">选 Mac 小助手</div>
        </div>

        <div className="mp-searchWrap">
          {/* 移动端菜单按钮 */}
          <button
            className="mp-menuBtn"
            onClick={() => setIsDrawerOpen(true)}
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
          <div className="mp-searchHint">匹配 {filteredProducts.length} 台</div>
        </div>
      </header>

      <div className="mp-layout">
        {/* 左侧筛选（只保留：价格 / RAM / SSD） */}
        <aside className="mp-sidebar">
          <div className="mp-sidebarMeta">
            <div className="mp-metaRow">
              <span className="mp-metaKey">数据更新时间</span>
              <span className="mp-metaVal">
                <ClientOnlyTime lastUpdated={macData?.lastUpdated} />
              </span>
            </div>
            <div className="mp-metaRow">
              <span className="mp-metaKey">当前匹配</span>
              <span className="mp-metaVal mp-metaValStrong">{filteredProducts.length} 台</span>
            </div>
          </div>

          <FilterPanel
            filters={filters}
            setFilters={setFilters}
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
        <div className="mp-drawer-overlay" onClick={() => setIsDrawerOpen(false)}>
          <div className="mp-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="mp-drawer-header">
              <h3>筛选条件</h3>
              <button
                className="mp-drawer-close"
                onClick={() => setIsDrawerOpen(false)}
                aria-label="关闭菜单"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <div className="mp-drawer-content">
              <div className="mp-sidebarMeta">
                <div className="mp-metaRow">
                  <span className="mp-metaKey">数据更新时间</span>
                  <span className="mp-metaVal">
                    <ClientOnlyTime lastUpdated={macData?.lastUpdated} />
                  </span>
                </div>
                <div className="mp-metaRow">
                  <span className="mp-metaKey">当前匹配</span>
                  <span className="mp-metaVal mp-metaValStrong">{filteredProducts.length} 台</span>
                </div>
              </div>

              <FilterPanel
                filters={filters}
                setFilters={setFilters}
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