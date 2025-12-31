import GeekSlider from "./GeekSlider";
import { useState } from "react";

function clampNum(n, min, max) {
  const v = Number(n);
  if (!Number.isFinite(v)) return min;
  return Math.min(max, Math.max(min, v));
}

function fmtPrice(n) {
  const v = Number(n || 0);
  if (!Number.isFinite(v)) return "—";
  return `¥${Math.round(v).toLocaleString("zh-CN")}`;
}

export default function FilterPanel({ filters, setFilters, priceBounds, onApply }) {
  const minB = Number(priceBounds?.min || 0);
  const maxB = Number(priceBounds?.max || 0);

  const [localMin, setLocalMin] = useState(filters.priceMin || minB);
  const [localMax, setLocalMax] = useState(filters.priceMax || maxB);
  const [localRam, setLocalRam] = useState(filters.ram || 8);
  const [localSsd, setLocalSsd] = useState(filters.ssd || 256);

  const setMin = (v) => {
    const nextMin = clampNum(v, minB, maxB);
    setLocalMin(nextMin);
  };

  const setMax = (v) => {
    const nextMax = clampNum(v, minB, maxB);
    setLocalMax(nextMax);
  };

  const apply = () => {
    setFilters((f) => ({
      ...f,
      priceMin: clampNum(localMin, minB, maxB),
      priceMax: clampNum(localMax, minB, maxB),
      ram: localRam,
      ssd: localSsd,
    }));
    onApply();
  };

  const reset = () => {
    setLocalMin(minB);
    setLocalMax(maxB);
    setLocalRam(8);
    setLocalSsd(256);
    setFilters((f) => ({
      ...f,
      q: f.q,
      priceMin: minB || 0,
      priceMax: maxB || 0,
      ram: 8,
      ssd: 256,
    }));
    onApply();
  };

  return (
    <div className="fp">
      {/* Price */}
      <section className="fp-sec">
        <div className="fp-head">
          <div className="fp-label">价格范围</div>
          <div className="fp-badge">
            {fmtPrice(localMin)} <span className="fp-badgeSep">–</span> {fmtPrice(localMax)}
          </div>
        </div>

        <div className="fp-priceGrid">
          <div className="fp-field">
            <div className="fp-fieldLabel">最低</div>
            <input
              className="fp-input"
              value={localMin || ""}
              onChange={(e) => setLocalMin(e.target.value)}
              onBlur={() => setMin(localMin)}
              inputMode="numeric"
              placeholder={`${Math.round(minB)}`}
            />
          </div>
          <div className="fp-field">
            <div className="fp-fieldLabel">最高</div>
            <input
              className="fp-input"
              value={localMax || ""}
              onChange={(e) => setLocalMax(e.target.value)}
              onBlur={() => setMax(localMax)}
              inputMode="numeric"
              placeholder={`${Math.round(maxB)}`}
            />
          </div>
        </div>

        <div className="fp-rangeWrap">
          <div className="fp-rangeBackground" />
          <div className="fp-rangeProgress" style={{
            left: 0,
            right: `${100 - (localMax - minB) / (maxB - minB) * 100}%`
          }} />
          <input
            className="fp-range"
            type="range"
            min={minB || 0}
            max={maxB || 0}
            step={50}
            value={localMin || 0}
            onChange={(e) => setMin(e.target.value)}
            aria-label="价格最低"
          />
          <input
            className="fp-range fp-range--top"
            type="range"
            min={minB || 0}
            max={maxB || 0}
            step={50}
            value={localMax || 0}
            onChange={(e) => setMax(e.target.value)}
            aria-label="价格最高"
          />
        </div>
      </section>

      {/* RAM */}
      <section className="fp-sec">
        <div className="fp-head">
          <div className="fp-label">统一内存（RAM）</div>
          <div className="fp-badge fp-badge--ram">≥ {localRam}GB</div>
        </div>
        <GeekSlider
          type="ram"
          label=""
          value={localRam}
          onChange={(v) => setLocalRam(v)}
        />
      </section>

      {/* SSD */}
      <section className="fp-sec">
        <div className="fp-head">
          <div className="fp-label">固态硬盘（SSD）</div>
          <div className="fp-badge fp-badge--ssd">≥ {localSsd}GB</div>
        </div>
        <GeekSlider
          type="ssd"
          label=""
          value={localSsd}
          onChange={(v) => setLocalSsd(v)}
        />
      </section>

      <div className="fp-actions">
        <button className="fp-reset" type="button" onClick={reset}>
          重置筛选
        </button>
        <button className="fp-apply" type="button" onClick={apply}>
          应用筛选
        </button>
      </div>
    </div>
  );
}