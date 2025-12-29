import React, { useState, useMemo } from 'react';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import GeekSlider from '../components/GeekSlider';
import ProductCard from '../components/ProductCard';
import macData from '../data/macs.json';

export default function Home() {
  const [filters, setFilters] = useState({
    ram: 8,
    ssd: 256,
    cpu: 8,
    has10GbE: false
  });
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const filteredProducts = useMemo(() => {
    return macData.items
      ? macData.items.filter(item => {
          if (item.specs?.ram < filters.ram) return false;
          if (item.specs?.ssd_gb < filters.ssd) return false;
          if (filters.cpu && item.specs?.cpu < filters.cpu) return false;
          if (filters.has10GbE && !item.specs?.has10GbE) return false;
          return true;
        })
      : [];
  }, [filters]);

  const FilterPanel = () => (
    <div className="space-y-8">
      <GeekSlider
        type="ram"
        label="统一内存"
        value={filters.ram}
        onChange={v => setFilters({ ...filters, ram: v })}
      />
      <GeekSlider
        type="ssd"
        label="固态硬盘"
        value={filters.ssd}
        onChange={v => setFilters({ ...filters, ssd: v })}
      />

      <div className="pt-4 border-t border-white/5">
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm text-gray-400">10Gb 以太网端口</span>
          <input
            type="checkbox"
            checked={filters.has10GbE}
            onChange={e =>
              setFilters({ ...filters, has10GbE: e.target.checked })
            }
          />
        </label>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <Head>
        <title>MacPicker - 极客选购指南</title>
      </Head>

      <nav className="fixed top-0 w-full h-16 border-b border-white/5 bg-[#050505]/80 backdrop-blur-xl z-40 flex items-center px-6">
        <div className="flex items-center gap-2 font-black text-xl">
          <div className="w-3 h-3 bg-blue-500 rounded-full" />
          MACPICKER
        </div>
      </nav>

      <div className="flex pt-16 max-w-[1600px] mx-auto">
        <aside className="hidden md:block w-80 fixed h-screen border-r border-white/5 p-8 overflow-y-auto">
          <h2 className="text-xl font-bold mb-10">配置筛选</h2>
          <FilterPanel />
          <div className="mt-20 p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10">
            <p className="text-[10px] text-blue-400 font-bold uppercase mb-1">
              匹配结果
            </p>
            <p className="text-3xl font-black">
              {filteredProducts.length}{' '}
              <span className="text-sm font-normal text-gray-500">台</span>
            </p>
          </div>
        </aside>

        <main className="flex-1 md:ml-80 p-6 md:p-10">
          <motion.div layout className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredProducts.map(mac => (
                <ProductCard key={mac.id} data={mac} />
              ))}
            </AnimatePresence>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
