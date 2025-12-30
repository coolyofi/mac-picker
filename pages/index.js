import Head from "next/head";
import { useEffect, useMemo, useRef, useState } from "react";
import macData from "../data/macs.json";
import FilterPanel from "../components/FilterPanel";
import ProductCard from "../components/ProductCard";
import ClientOnlyTime from "../components/ClientOnlyTime";

const safeItems = (data) => {
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data)) return data;
  return [];
};

function useRandomDarkBackdrop() {
  useEffect(() => {
    // 每次打开随机一点，但都偏暗；不用 blur（性能稳）
    const root = document.documentElement;
    const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

    const h1 = rand(195, 230); // 冷色偏蓝
    const h2 = rand(120, 160); // 绿/青
    const h3 = rand(260, 290); // 紫
    const a1 = rand(10, 18) / 100;
    const a2 = rand(7, 14) / 100;
    const a3 = rand(6, 12) / 100;

    root.style.setProperty("--bg-h1", `${h1}`);
    root.style.setProperty("--bg-h2", `${h2}`);
    root.style.setProperty("--bg-h3", `${h3}`);
    root.style.setProperty("--bg-a1", `${a1}`);
    root.style.setProperty("--bg-a2", `${a2}`);
    root.style.setProperty("--bg-a3", `${a3}`);
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

  return (
    <div className="mp-root">
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
              {filteredProducts.map((mac) => (
                <ProductCard key={mac?.id || `${mac?.modelId}-${mac?.priceNum}`} data={mac} />
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
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}