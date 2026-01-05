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
    <div style={{ flex: 1, height: '100%', width: '100%', minHeight: '400px' }}>
      <AutoSizer>
        {({ height, width }) => {
          console.log('[VirtualGrid] AutoSizer dimensions', { height, width });
          
          // Calculate columns
          const columnCount = Math.floor((width + GUTTER_SIZE) / (MIN_COLUMN_WIDTH + GUTTER_SIZE));
          const safeColumnCount = Math.max(1, columnCount);
          console.log('[VirtualGrid] columns', { columnCount, safeColumnCount });
          
          // Calculate column width including gutter space
          const totalColumnSpace = width + GUTTER_SIZE;
          const columnWidth = totalColumnSpace / safeColumnCount;
          
          const rowCount = Math.ceil(items.length / safeColumnCount);
          const rowHeight = ROW_HEIGHT + GUTTER_SIZE;

          const Cell = ({ columnIndex, rowIndex, style }) => {
            const index = rowIndex * safeColumnCount + columnIndex;
            if (index >= items.length) return null;
            
            const item = items[index];
            const isPriority = rowIndex < 2;
            
            return (
              <div style={{
                ...style,
                left: style.left,
                top: style.top,
                width: style.width - GUTTER_SIZE,
                height: style.height - GUTTER_SIZE,
              }}>
                <ProductCard data={item} priority={isPriority} />
              </div>
            );
          };

          console.log('[VirtualGrid] rendering Grid with', { safeColumnCount, columnWidth, height, rowCount, rowHeight, width });
          try {
            const gridProps = {
              className: "mp-virtual-grid",
              columnCount: safeColumnCount,
              height: height,
              rowCount: rowCount,
              width: width,
              columnWidth: columnWidth,
              rowHeight: rowHeight,
            };

            return (
              <Grid {...gridProps}>
                {Cell}
              </Grid>
            );
          } catch (err) {
            console.error('[VirtualGrid] Grid render error:', err);
            return (
              <div className="mp-virtual-grid-error">
                <div className="mp-empty mp-empty--warn">
                  <div className="mp-emptyTitle">虚拟化渲染错误</div>
                  <div className="mp-emptySub">Grid 组件渲染失败：{err.message}</div>
                </div>
              </div>
            );
          }
        }}
      </AutoSizer>
    </div>
  );
}
