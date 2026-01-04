import React, { useState, useEffect } from 'react';
import ProductCard from './ProductCard';

// Client-side dynamic import: ensures compatibility across bundlers and ESM/CJS differences.
// We intentionally load these in an effect so the import happens only in the browser
// (the page already async-loads `VirtualGrid` with `ssr:false`).
const GUTTER_SIZE = 22;
const MIN_COLUMN_WIDTH = 240;
const ROW_HEIGHT = 360;

function useVirtualDeps() {
  const [Grid, setGrid] = useState(null);
  const [AutoSizer, setAutoSizer] = useState(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let mounted = true;
    Promise.all([import('react-window'), import('react-virtualized-auto-sizer')])
      .then(([rw, as]) => {
        if (!mounted) return;
        console.log('[VirtualGrid] react-window module keys:', Object.keys(rw || {}));
        console.log('[VirtualGrid] auto-sizer module keys:', Object.keys(as || {}));

        // Try several known export shapes (FixedSizeGrid, Grid), and accept AutoSizer as named or default export
        const MaybeGrid = rw?.FixedSizeGrid || rw?.Grid || rw?.default?.FixedSizeGrid || rw?.default?.Grid;
        const MaybeAuto = as?.AutoSizer || as?.default || as;

        if (!MaybeGrid || !MaybeAuto) {
          console.warn('VirtualGrid: react-window.FixedSizeGrid/Grid or AutoSizer not found', {
            fixed: !!(rw && rw.FixedSizeGrid),
            grid: !!(rw && rw.Grid),
            fixedDefault: !!(rw && rw.default && rw.default.FixedSizeGrid),
            gridDefault: !!(rw && rw.default && rw.default.Grid),
            autoNamed: !!(as && as.AutoSizer),
            autoDefault: !!(as && as.default),
          });
          setMissing(true);
          return;
        }

        setGrid(() => MaybeGrid);
        setAutoSizer(() => MaybeAuto);
      })
      .catch((err) => {
        console.error('VirtualGrid dynamic import failed', err && err.message ? err.message : err);
        setMissing(true);
      });
    return () => { mounted = false; };
  }, []);

  return { Grid, AutoSizer, missing };
}

export default function VirtualGrid({ items }) {
  const { Grid, AutoSizer, missing } = useVirtualDeps();

  if (missing) {
    console.warn('VirtualGrid: missing Grid or AutoSizer, will not render virtualized list');
    return (
      <div className="mp-virtual-grid-missing">
        <div className="mp-empty mp-empty--warn">
          <div className="mp-emptyTitle">虚拟化依赖缺失</div>
          <div className="mp-emptySub">缺少依赖：虚拟化列表无法渲染。将回退为非虚拟化渲染。</div>
        </div>
      </div>
    );
  }

  if (!Grid || !AutoSizer) {
    // still loading – parent will show skeleton/placeholder; avoid rendering until deps ready
    return null;
  }

  return (
    <div style={{ flex: 1, height: 'calc(100vh - 140px)', width: '100%' }}>
      <AutoSizer>
        {({ height, width }) => {
          // Calculate columns
          const columnCount = Math.floor((width + GUTTER_SIZE) / (MIN_COLUMN_WIDTH + GUTTER_SIZE));
          const safeColumnCount = Math.max(1, columnCount);
          
          // Calculate column width including gutter space
          // We give each column (width + gutter) / count space
          // But inside the cell we subtract the gutter
          const totalColumnSpace = width + GUTTER_SIZE;
          const columnWidth = totalColumnSpace / safeColumnCount;
          
          const rowCount = Math.ceil(items.length / safeColumnCount);
          const rowHeight = ROW_HEIGHT + GUTTER_SIZE;

          const Cell = ({ columnIndex, rowIndex, style }) => {
            const index = rowIndex * safeColumnCount + columnIndex;
            if (index >= items.length) return null;
            
            const item = items[index];
            // Priority Hints: Prioritize loading for the first 2 rows
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

          return (
            <Grid
              className="mp-virtual-grid"
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
