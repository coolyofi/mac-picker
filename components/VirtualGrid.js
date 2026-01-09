import React from 'react';
import ProductCard from './ProductCard';

export default function VirtualGrid({ items }) {
  return (
    <div className="mp-grid">
      {items.map((item, index) => (
        <ProductCard key={item.id || item.modelId || index} data={item} priority={index < 8} />
      ))}
    </div>
  );
}
