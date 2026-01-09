import Head from "next/head";
import { useEffect, useMemo, useState, useCallback, memo } from "react";
import ProductCard from "../components/ProductCard";
import FilterPanel from "../components/FilterPanel";
import VirtualGrid from "../components/VirtualGrid";
import macData from "../data/macs.json";
import SearchWithDropdown from "../components/SearchWithDropdown";
import ClientOnlyTime from "../components/ClientOnlyTime";
import { useDeviceType } from "../hooks/useDeviceType";
import { useRandomDarkBackdrop } from "../hooks/useRandomDarkBackdrop";

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
    priceMax: 0,
    ram: 8,
    ssd: 256,
    tags: [],
    logic: "AND",
  }));

  // 初始化 priceMin/priceMax
  useEffect(() => {
    setFilters((f) => ({
      ...f,
      priceMin: priceBounds.min || 0,
      priceMax: priceBounds.max || 0,
    }));
  }, [priceBounds.min, priceBounds.max]);

  // 直接过滤产品
  const filteredProducts = useMemo(() => filterProducts(products, filters), [products, filters]);

  // Track which fields were included in the last applied update
  const [lastAppliedFields, setLastAppliedFields] = useState([]);

  useEffect(() => {
    const keys = ['priceMin','priceMax','ram','ssd','q','tags','logic'];
    setLastAppliedFields(keys);
    const timer = setTimeout(() => setLastAppliedFields([]), 700);
    return () => clearTimeout(timer);
  }, [filters]);

  // useCallback 包裹传递给子组件的函数
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
          {filteredProducts.length === 0 ? (
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
                appliedFields={lastAppliedFields}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
