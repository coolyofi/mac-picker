import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import macData from "../data/macs.json";
import FilterPanel from "../components/FilterPanel";
import ProductCard from "../components/ProductCard";
import AnimatedCount from "../components/AnimatedCount";
import ClientOnlyTime from "../components/ClientOnlyTime";

const isIOS =
  typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);

function normalizeItems(data) {
  const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
  return items.filter(Boolean);
}

function fmtScreen(screenIn) {
  if (!screenIn) return "ALL";
  const n = Number(screenIn);
  return Number.isFinite(n) ? `${n}"` : "ALL";
}

export default function Home() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const [filters, setFilters] = useState({
    ram: 8,
    ssd: 256,
    has10GbE: false,
    chipSeries: "all",
    screenIn: "all",
  });

  const products = useMemo(() => normalizeItems(macData), []);

  const screenSizes = useMemo(() => {
    const sizes = new Set();
    products.forEach((item) => {
      const size = item?.specs?.screen_in;
      if (size) sizes.add(size);
    });
    return Array.from(sizes).sort((a, b) => a - b);
  }, [products]);

  const filteredProducts = useMemo(() => {
    const list = products
      .filter((item) => {
        const s = item?.specs || {};
        const ramOK = Number(s?.ram || 0) >= Number(filters.ram);
        const ssdOK = Number(s?.ssd_gb || 0) >= Number(filters.ssd);

        const tenGOK = !filters.has10GbE || Boolean(s?.has10GbE);

        const chipOK =
          filters.chipSeries === "all" || String(s?.chip_series || "") === String(filters.chipSeries);

        const screenOK =
          filters.screenIn === "all" ||
          Number(s?.screen_in || 0) === Number(filters.screenIn);

        return ramOK && ssdOK && tenGOK && chipOK && screenOK;
      })
      .sort((a, b) => (a?.priceNum || 0) - (b?.priceNum || 0));

    return list;
  }, [products, filters]);

  const summaryChips = useMemo(() => {
    const chips = [
      { k: "ram", label: `RAM ≥ ${filters.ram}GB`, tone: "ram" },
      { k: "ssd", label: `SSD ≥ ${filters.ssd}GB`, tone: "ssd" },
    ];

    if (filters.chipSeries !== "all") chips.push({ k: "chip", label: `CHIP ${filters.chipSeries}`, tone: "muted" });
    if (filters.screenIn !== "all") chips.push({ k: "screen", label: `DISPLAY ${fmtScreen(filters.screenIn)}`, tone: "muted" });
    if (filters.has10GbE) chips.push({ k: "10gbe", label: "10GbE ON", tone: "blue" });

    return chips;
  }, [filters]);

  const isLoading = !hydrated; // 这里我们用“首次 hydration 前”当 Loading 状态（避免任何 SSR/CSR 文本不一致）
  const isEmpty = !isLoading && filteredProducts.length === 0;

  return (
    <div className={`app ${isIOS ? "is-ios" : ""}`}>
      <Head>
        <title>MacPicker Pro | Apple Internal Tool</title>
        <meta name="description" content="MacPicker Pro - price-first internal picker" />
      </Head>

      {/* Top Nav */}
      <header className="topnav">
        <div className="topnav__inner">
          <div className="brand">
            <span className="brand__dot" aria-hidden="true" />
            <span className="brand__text">MACPICKER</span>
            <span className="brand__sub">INTERNAL</span>
          </div>

          <div className="topnav__center">
            <div className="summary">
              <div className="summary__title">Filter Summary</div>
              <div className="summary__chips">
                {summaryChips.map((c) => (
                  <span key={c.k} className={`chip chip--${c.tone}`}>
                    {c.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="topnav__right">
            <div className="meta">
              <div className="meta__row">
                <span className="meta__k">Updated</span>
                <span className="meta__v">
                  <ClientOnlyTime lastUpdated={macData?.lastUpdated} />
                </span>
              </div>
              <div className="meta__row">
                <span className="meta__k">Units</span>
                <span className="meta__v">
                  <AnimatedCount value={isLoading ? 0 : filteredProducts.length} />
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="shell">
        {/* Left Panel */}
        <aside className="panel">
          <div className="panel__header">
            <div className="panel__title">Config Filters</div>
            <div className="panel__hint">Price-first sorting, Apple-style density.</div>
          </div>

          <FilterPanel
            filters={filters}
            setFilters={setFilters}
            screenSizes={screenSizes}
          />

          <div className="panel__footer">
            <div className="resultCard">
              <div className="resultCard__k">Matched</div>
              <div className="resultCard__v">
                <AnimatedCount value={isLoading ? 0 : filteredProducts.length} />
                <span className="resultCard__unit">units</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="main">
          <div className="main__header">
            <div className="main__title">All Configurations</div>
            <div className="main__sub">Sorted by lowest price first. Click a card to expand specs.</div>
          </div>

          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                className="state state--loading"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                <div className="state__art">
                  <span className="ring" />
                  <span className="ring ring--alt" />
                </div>
                <div className="state__text">
                  Loading inventory…
                  <span>Rendering optimized for Safari / iOS stability.</span>
                </div>
              </motion.div>
            ) : isEmpty ? (
              <motion.div
                key="empty"
                className="state state--empty"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                <div className="state__art">
                  <span className="ring" />
                  <span className="ring ring--alt" />
                </div>
                <div className="state__text">
                  No matches found
                  <span>Try lowering RAM / SSD thresholds or switching chip series.</span>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="grid"
                className="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                {filteredProducts.map((mac) => (
                  <ProductCard key={mac?.id || mac?.model || mac?.title} data={mac} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}