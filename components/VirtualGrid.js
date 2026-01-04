import React from 'react';
import ProductCard from './ProductCard';

// Fix for import issues with react-window and auto-sizer in some Next.js environments
const ReactWindow = require('react-window');
const Grid = ReactWindow.FixedSizeGrid || ReactWindow.default.FixedSizeGrid;

const AutoSizerModule = require('react-virtualized-auto-sizer');
const AutoSizer = AutoSizerModule.default || AutoSizerModule;

const GUTTER_SIZE = 22;
const MIN_COLUMN_WIDTH = 240;
const ROW_HEIGHT = 360;

export default function VirtualGrid({ items }) {
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
