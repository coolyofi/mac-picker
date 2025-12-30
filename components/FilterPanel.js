import GeekSlider from "./GeekSlider";

function clampNum(n, min, max) {
  const v = Number(n);
  if (!Number.isFinite(v)) return min;
  return Math.min(max, Math.max(min, v));
}

function fmtPrice(n) {
  const v = Number(n || 0);
  if (!Number.isFinite(v)) return "—";
  // 不带 .00；千分位
  return `¥${Math.round(v).toLocaleString("zh-CN")}`;
}

export default function FilterPanel({ filters, setFilters, priceBounds }) {
  const minB = Number(priceBounds?.min || 0);
  const maxB = Number(priceBounds?.max || 0);

  const priceMin = Number(filters.priceMin || 0);
  const priceMax = Number(filters.priceMax || 0);

  const setMin = (v) => {
    const nextMin = clampNum(v, minB, maxB);
    setFilters((f) => {
      const next = { ...f, priceMin: nextMin };
      // 保证 min <= max
      if (next.priceMax && nextMin > next.priceMax) next.priceMax = nextMin;
      return next;
    });
  };

  const setMax = (v) => {
    const nextMax = clampNum(v, minB, maxB);
    setFilters((f) => {
      const next = { ...f, priceMax: nextMax };
      if (next.priceMin && next.priceMin > nextMax) next.priceMin = nextMax;
      return next;
    });
  };

  const reset = () => {
    setFilters((f) => ({
      ...f,
      q: f.q, // 搜索不动
      priceMin: minB || 0,
      priceMax: maxB || 0,
      ram: 8,
      ssd: 256,
    }));
  };

  return (
    <div className="fp">
      {/* Price */}
      <section className="fp-sec">
        <div className="fp-head">
          <div className="fp-label">价格范围</div>
          <div className="fp-badge">
            {fmtPrice(priceMin)} <span className="fp-badgeSep">–</span> {fmtPrice(priceMax)}
          </div>
        </div>

        <div className="fp-priceGrid">
          <div className="fp-field">
            <div className="fp-fieldLabel">最低</div>
            <input
              className="fp-input"
              value={priceMin || ""}
              onChange={(e) => setMin(e.target.value)}
              inputMode="numeric"
              placeholder={`${Math.round(minB)}`}
            />
          </div>
          <div className="fp-field">
            <div className="fp-fieldLabel">最高</div>
            <input
              className="fp-input"
              value={priceMax || ""}
              onChange={(e) => setMax(e.target.value)}
              inputMode="numeric"
              placeholder={`${Math.round(maxB)}`}
            />
          </div>
        </div>

        <div className="fp-rangeWrap">
          <input
            className="fp-range"
            type="range"
            min={minB || 0}
            max={maxB || 0}
            step={50}
            value={priceMin || 0}
            onChange={(e) => setMin(e.target.value)}
            aria-label="价格最低"
          />
          <input
            className="fp-range fp-range--top"
            type="range"
            min={minB || 0}
            max={maxB || 0}
            step={50}
            value={priceMax || 0}
            onChange={(e) => setMax(e.target.value)}
            aria-label="价格最高"
          />
          <div className="fp-rangeHint">
            <span>{fmtPrice(minB)}</span>
            <span>{fmtPrice(maxB)}</span>
          </div>
        </div>
      </section>

      {/* RAM */}
      <section className="fp-sec">
        <div className="fp-head">
          <div className="fp-label">统一内存（RAM）</div>
          <div className="fp-badge fp-badge--ram">≥ {filters.ram}GB</div>
        </div>
        <GeekSlider
          type="ram"
          label=""
          value={filters.ram}
          onChange={(v) => setFilters((f) => (f.ram === v ? f : { ...f, ram: v }))}
        />
      </section>

      {/* SSD */}
      <section className="fp-sec">
        <div className="fp-head">
          <div className="fp-label">固态硬盘（SSD）</div>
          <div className="fp-badge fp-badge--ssd">≥ {filters.ssd}GB</div>
        </div>
        <GeekSlider
          type="ssd"
          label=""
          value={filters.ssd}
          onChange={(v) => setFilters((f) => (f.ssd === v ? f : { ...f, ssd: v }))}
        />
      </section>

      <button className="fp-reset" type="button" onClick={reset}>
        重置筛选（不清空搜索）
      </button>
    </div>
  );
}