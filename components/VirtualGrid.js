import React from 'react';
import ProductCard from './ProductCard';

const GUTTER_SIZE = 22;
const MIN_COLUMN_WIDTH = 240;

export default function VirtualGrid({ items }) {
  console.log('[VirtualGrid] render: items=', (items||[]).length);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(auto-fill, minmax(${MIN_COLUMN_WIDTH}px, 1fr))`,
      gap: `${GUTTER_SIZE}px`,
      width: '100%',
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      {items.map((item, index) => (
        <ProductCard key={item.id || index} data={item} priority={index < 8} />
      ))}
    </div>
  );
}
