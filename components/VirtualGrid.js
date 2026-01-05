import React from 'react';
import { Grid } from 'react-window';
import { AutoSizer } from 'react-virtualized-auto-sizer';
import ProductCard from './ProductCard';

// Client-side dynamic import: ensures compatibility across bundlers and ESM/CJS differences.
// We intentionally load these in an effect so the import happens only in the browser
// (the page already async-loads `VirtualGrid` with `ssr:false`).
const GUTTER_SIZE = 22;
const MIN_COLUMN_WIDTH = 240;
const ROW_HEIGHT = 360;

export default function VirtualGrid({ items }) {
  console.log('[VirtualGrid] render: items=', (items||[]).length);

  return (
    <div style={{ height: '600px', width: '100%', position: 'relative', overflow: 'hidden' }}>
      <AutoSizer>
        {({ height, width }) => {
          console.log('[VirtualGrid] AutoSizer dimensions', { height, width });
          
          // Calculate columns
          const columnCount = Math.floor((width + GUTTER_SIZE) / (MIN_COLUMN_WIDTH + GUTTER_SIZE));
          const safeColumnCount = Math.max(1, columnCount);
          console.log('[VirtualGrid] columns', { columnCount, safeColumnCount });
          
          // Column width including gutter space for proper spacing
          const columnWidth = MIN_COLUMN_WIDTH + GUTTER_SIZE;
          const rowHeight = ROW_HEIGHT + GUTTER_SIZE;

          const rowCount = Math.ceil(items.length / safeColumnCount);

          const Cell = ({ columnIndex, rowIndex, style }) => {
            const index = rowIndex * safeColumnCount + columnIndex;
            if (index >= items.length) return null;
            
            const item = items[index];
            const isPriority = rowIndex < 2;
            
            return (
              <div style={style}>
                <ProductCard data={item} priority={isPriority} />
              </div>
            );
          };

          console.log('[VirtualGrid] rendering Grid with', { safeColumnCount, columnWidth, height, rowCount, rowHeight, width });
          // Use react-window Grid for virtualization
          return (
            <Grid
              columnCount={safeColumnCount}
              columnWidth={columnWidth}
              height={height}
              rowCount={rowCount}
              rowHeight={rowHeight}
              width={width}
            >
              {Cell}
            </Grid>
          );
        }}
      </AutoSizer>
    </div>
  );
}
