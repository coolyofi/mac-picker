import Head from 'next/head';
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import macData from '../data/macs.json';
import GeekSlider from '../components/GeekSlider';
import ProductCard from '../components/ProductCard';
import AnimatedCount from '../components/AnimatedCount';

const isIOS =
  typeof navigator !== 'undefined' &&
  /iPad|iPhone|iPod/.test(navigator.userAgent);

export default function Home() {
  const [filters, setFilters] = useState({
    ram: 8,
    ssd: 256,
    has10GbE: false,
    chipSeries: 'all',
    screenIn: 'all'
  });

  const products = Array.isArray(macData?.items)
    ? macData.items
    : Array.isArray(macData)
    ? macData
    : [];

  const filteredProducts = useMemo(() => {
    return products
      .filter(item => {
        const s = item.specs || {};
        return (
          s.ram >= filters.ram &&
          s.ssd_gb >= filters.ssd &&
          (!filters.has10GbE || s.has10GbE) &&
          (filters.chipSeries === 'all' ||
            s.chip_series === filters.chipSeries) &&
          (filters.screenIn === 'all' ||
            s.screen_in === Number(filters.screenIn))
        );
      })
      .sort((a, b) => (a.priceNum || 0) - (b.priceNum || 0));
  }, [products, filters]);

  const screenSizes = useMemo(() => {
    const sizes = new Set();
    products.forEach(item => {
      const size = item?.specs?.screen_in;
      if (size) sizes.add(size);
    });
    return Array.from(sizes).sort((a, b) => a - b);
  }, [products]);

  const FilterPanel = () => (
    <div className="space-y-10">
      <GeekSlider
        type="ram"
        label="统一内存要求"
        value={filters.ram}
        onChange={v =>
          setFilters(f => (f.ram === v ? f : { ...f, ram: v }))
        }
      />

      <GeekSlider
        type="ssd"
        label="固态硬盘要求"
        value={filters.ssd}
        onChange={v =>
          setFilters(f => (f.ssd === v ? f : { ...f, ssd: v }))
        }
      />

      <div>
        <p className="filter-label">芯片系列</p>
        <div className="filter-row">
          {['all', 'M1', 'M2', 'M3', 'M4'].map(series => (
            <button
              key={series}
              type="button"
              onClick={() =>
                setFilters(f =>
                  f.chipSeries === series ? f : { ...f, chipSeries: series }
                )
              }
              className={`filter-chip ${
                filters.chipSeries === series ? 'is-active' : ''
              }`}
            >
              {series === 'all' ? '全部' : series}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="filter-label">屏幕尺寸</p>
        <div className="filter-row">
          <button
            type="button"
            onClick={() =>
              setFilters(f =>
                f.screenIn === 'all' ? f : { ...f, screenIn: 'all' }
              )
            }
            className={`filter-chip ${
              filters.screenIn === 'all' ? 'is-active' : ''
            }`}
          >
            全部
          </button>
          {screenSizes.map(size => (
            <button
              key={size}
              type="button"
              onClick={() =>
                setFilters(f =>
                  f.screenIn === size ? f : { ...f, screenIn: size }
                )
              }
              className={`filter-chip ${
                Number(filters.screenIn) === size ? 'is-active' : ''
              }`}
            >
              {size}&quot;
            </button>
          ))}
        </div>
      </div>

      <div className="pt-6 border-t border-white/5">
        <label className="flex items-center justify-between cursor-pointer p-3 rounded-xl bg-white/[0.03]">
          <span className="text-xs font-bold text-gray-400 uppercase">
            10Gb 万兆网口
          </span>
          <input
            type="checkbox"
            checked={filters.has10GbE}
            onChange={e =>
              setFilters(f => ({ ...f, has10GbE: e.target.checked }))
            }
            className="w-5 h-5 accent-blue-600"
          />
        </label>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#000000] text-white">
      <Head>
        <title>MacPicker - 极客选购指南</title>
      </Head>

      {/* 顶部导航 */}
      <nav
        className={`fixed top-0 w-full h-16 border-b border-white/5 z-50 flex items-center px-6 ${
          isIOS ? 'bg-[#000000]' : 'bg-[#000000]'
        }`}
      >
        <div className="flex items-center gap-2 font-black text-xl">
          <div className="w-3 h-3 bg-blue-500 rounded-full" />
          MACPICKER
        </div>
      </nav>

      <div className="flex pt-16 max-w-[1600px] mx-auto">
        {/* 左侧筛选 */}
        <aside className="hidden md:block w-80 fixed h-screen border-r border-white/5 p-8 overflow-y-auto">
          <p className="text-xs text-gray-500 mb-6">
            数据更新时间：
            {macData?.lastUpdated
              ? new Date(macData.lastUpdated).toLocaleString()
              : '未知'}
          </p>

          <h2 className="text-xl font-bold mb-10">配置筛选</h2>
          <FilterPanel />

          <div className="mt-16 p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10">
            <p className="text-[10px] text-blue-400 font-bold uppercase mb-1">
              匹配结果
            </p>
            <p className="text-3xl font-black">
              <AnimatedCount value={filteredProducts.length} />{' '}
              <span className="text-sm font-normal text-gray-500">台</span>
            </p>
          </div>
        </aside>

        {/* 主内容 */}
        <main className="flex-1 md:ml-80 p-6 md:p-10">
          <motion.div
            className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
          >
            {filteredProducts.length === 0 ? (
              <motion.div
                className="col-span-full empty-state"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="empty-state__art">
                  <span className="empty-state__ring" />
                  <span className="empty-state__ring empty-state__ring--alt" />
                </div>
                <div className="empty-state__text">
                  未找到匹配硬件
                  <span>尝试放宽筛选条件或切换芯片系列</span>
                </div>
              </motion.div>
            ) : (
              filteredProducts.map(mac => (
                <ProductCard key={mac.id} data={mac} />
              ))
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
