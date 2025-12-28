import React, { useState, useMemo } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import GeekSlider from '../components/GeekSlider';
import ProductCard from '../components/ProductCard';
import macData from '../data/macs.json';

const isIOS =
  typeof navigator !== 'undefined' &&
  /iPad|iPhone|iPod/.test(navigator.userAgent);

export default function Home() {
  const [filters, setFilters] = useState({
    ram: 8,
    ssd: 256,
    has10GbE: false
  });

  const filtered = useMemo(() => {
    return [...macData]
      .filter(item => {
        const s = item.specs || {};
        return (
          s.ram >= filters.ram &&
          s.ssd_gb >= filters.ssd &&
          (!filters.has10GbE || s.has10GbE)
        );
      })
      .sort((a, b) => (a.priceNum || 0) - (b.priceNum || 0));
  }, [filters]);

  const FilterUI = () => (
    <div className="space-y-12">
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

      <div className="pt-8 border-t border-white/5">
        <label className="flex items-center justify-between cursor-pointer p-3 bg-white/[0.02] rounded-xl border border-white/5">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            10Gb 万兆网口
          </span>
          <input
            type="checkbox"
            className="w-5 h-5 accent-blue-600"
            checked={filters.has10GbE}
            onChange={e =>
              setFilters(f =>
                f.has10GbE === e.target.checked
                  ? f
                  : { ...f, has10GbE: e.target.checked }
              )
            }
          />
        </label>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <Head>
        <title>MAC PICKER | 极客翻新机选购</title>
      </Head>

      {/* 顶部 Nav：iOS 降级 backdrop */}
      <nav
        className={`fixed top-0 w-full h-16 border-b border-white/5 z-50 flex items-center px-8 justify-between ${
          isIOS
            ? 'bg-[#050505]'
            : 'bg-[#050505]/80 backdrop-blur-2xl'
        }`}
      >
        <div className="flex items-center gap-3 font-black text-xl italic tracking-tighter">
          <div className="w-3 h-3 bg-blue-500 rounded-full shadow-[0_0_12px_#3b82f6]" />
          MACPICKER
        </div>
        <div className="text-[10px] font-mono text-gray-500 uppercase">
          Total Units: {macData.length}
        </div>
      </nav>

      <div className="flex pt-16 max-w-[1800px] mx-auto">
        <aside className="hidden lg:block w-80 fixed h-screen p-10 border-r border-white/5 overflow-y-auto">
          <FilterUI />

          <div className="mt-12 p-6 rounded-2xl bg-blue-600/10 border border-blue-600/20">
            <p className="text-[10px] font-black text-blue-500 uppercase mb-1">
              匹配结果
            </p>
            <p className="text-3xl font-black">
              {filtered.length}{' '}
              <span className="text-sm font-normal text-gray-600 italic">
                Units
              </span>
            </p>
          </div>
        </aside>

        <main className="flex-1 lg:ml-80 p-6 lg:p-12 min-h-screen">
          <motion.div
            {...(!isIOS && { layout: true })}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
          >
            {filtered.map(item => (
              <ProductCard key={item.id} data={item} />
            ))}
          </motion.div>
        </main>
      </div>
    </div>
  );
}