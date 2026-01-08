import GeekSlider from "./GeekSlider";
import { useState, useEffect } from "react";

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

export default function FilterPanel({ filters, setFilters, priceBounds, onApply, appliedFields = [] }) {
  const minB = Number(priceBounds?.min || 0);
  const maxB = Number(priceBounds?.max || 0);

  const [localMin, setLocalMin] = useState(filters.priceMin || minB);
  const [localMax, setLocalMax] = useState(filters.priceMax || maxB);
  const [localRam, setLocalRam] = useState(filters.ram || 8);
  const [localSsd, setLocalSsd] = useState(filters.ssd || 256);
  const [priceError, setPriceError] = useState(""); // 价格容错提示
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [selectedMemory, setSelectedMemory] = useState(null);
  const [selectedStorage, setSelectedStorage] = useState(null); // 选中的快捷预算

  // Visual feedback states when a field change was applied by the worker
  const [animatePrice, setAnimatePrice] = useState(false);
  const [animateRam, setAnimateRam] = useState(false);
  const [animateSsd, setAnimateSsd] = useState(false);
  const [animateSearch, setAnimateSearch] = useState(false);

  // 处理价格输入容错：自动交换不合理的大小顺序
  const safeSetMin = (v) => {
    const parsed = Number(v);
    if (!Number.isFinite(parsed)) {
      setPriceError("请输入有效数字");
      return;
    }
    const nextMin = clampNum(parsed, minB, maxB);
    // 如果 min > max，自动交换
    if (nextMin > localMax) {
      setLocalMin(localMax);
      setLocalMax(nextMin);
      setPriceError("已为您调整价格顺序");
      setTimeout(() => setPriceError(""), 2000);
    } else {
      setLocalMin(nextMin);
      setPriceError("");
    }
    // 检查是否仍匹配快捷预算
    checkSelectedBudget(nextMin, localMax);
  };

  const safeSetMax = (v) => {
    const parsed = Number(v);
    if (!Number.isFinite(parsed)) {
      setPriceError("请输入有效数字");
      return;
    }
    const nextMax = clampNum(parsed, minB, maxB);
    // 如果 max < min，自动交换
    if (nextMax < localMin) {
      setLocalMax(localMin);
      setLocalMin(nextMax);
      setPriceError("已为您调整价格顺序");
      setTimeout(() => setPriceError(""), 2000);
    } else {
      setLocalMax(nextMax);
      setPriceError("");
    }
    // 检查是否仍匹配快捷预算
    checkSelectedBudget(localMin, nextMax);
  };

  const setMin = (v) => {
    const nextMin = clampNum(v, minB, maxB);
    setLocalMin(nextMin);
    setPriceError("");
    checkSelectedBudget(nextMin, localMax);
  };

  const setMax = (v) => {
    const nextMax = clampNum(v, minB, maxB);
    setLocalMax(nextMax);
    setPriceError("");
    checkSelectedBudget(localMin, nextMax);
  };

  // 快捷预算快按钮
  const quickBudgets = [
    { label: "6k-8k", min: 6000, max: 8000 },
    { label: "8k-12k", min: 8000, max: 12000 },
    { label: "12k+", min: 12000, max: maxB },
  ];

  const applyQuickBudget = (budget) => {
    setLocalMin(Math.max(minB, budget.min));
    setLocalMax(Math.min(maxB, budget.max));
    setSelectedBudget(budget.label);
    setPriceError("");
  };

  // 检查当前价格是否匹配快捷预算
  const checkSelectedBudget = (min, max) => {
    const matched = quickBudgets.find(budget => 
      Math.abs(min - Math.max(minB, budget.min)) < 100 && 
      Math.abs(max - Math.min(maxB, budget.max)) < 100
    );
    setSelectedBudget(matched ? matched.label : null);
  };

  const checkSelectedMemory = (value) => {
    const memoryOptions = [8, 16, 32, 64, 128];
    setSelectedMemory(memoryOptions.includes(value) ? value : null);
  };

  const checkSelectedStorage = (value) => {
    const storageOptions = [256, 512, 1024, 2048, 4096];
    setSelectedStorage(storageOptions.includes(value) ? value : null);
  };

  const apply = () => {
    const nextFilters = {
      priceMin: clampNum(localMin, minB, maxB),
      priceMax: clampNum(localMax, minB, maxB),
      ram: localRam,
      ssd: localSsd,
    };
    setFilters((f) => ({
      ...f,
      ...nextFilters,
    }));
    if (typeof onApply === 'function') onApply();
  };

  // PC 端实时同步（避免用户手动点击"应用"）
  useEffect(() => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 700;
    if (isMobile) return; // 移动端由用户手动点击"应用筛选"

    console.log('[FilterPanel] Updating filters:', { localMin, localMax, localRam, localSsd });
    setFilters((f) => ({
      ...f,
      priceMin: clampNum(localMin, minB, maxB),
      priceMax: clampNum(localMax, minB, maxB),
      ram: localRam,
      ssd: localSsd,
    }));
  }, [localMin, localMax, localRam, localSsd, minB, maxB, setFilters]);

  const reset = () => {
    setLocalMin(minB);
    setLocalMax(maxB);
    setLocalRam(8);
    setLocalSsd(256);
    setSelectedBudget(null);
    setSelectedMemory(null);
    setSelectedStorage(null);
    setFilters((f) => ({
      ...f,
      q: f.q,
      priceMin: minB || 0,
      priceMax: maxB || 0,
      ram: 8,
      ssd: 256,
    }));
    if (typeof onApply === 'function') onApply();
  };

  // 当 worker 确认某些筛选已被应用时，接收到的字段会通过 `appliedFields` 传入，短暂触发局部动画
  useEffect(() => {
    if (!appliedFields || appliedFields.length === 0) return;
    if (appliedFields.some(k => k === 'priceMin' || k === 'priceMax')) {
      setAnimatePrice(true);
      setTimeout(() => setAnimatePrice(false), 450);
    }
    if (appliedFields.includes('ram')) {
      setAnimateRam(true);
      setTimeout(() => setAnimateRam(false), 450);
    }
    if (appliedFields.includes('ssd')) {
      setAnimateSsd(true);
      setTimeout(() => setAnimateSsd(false), 450);
    }
    if (appliedFields.some(k => k === 'q' || k === 'tags')) {
      setAnimateSearch(true);
      setTimeout(() => setAnimateSearch(false), 450);
    }
  }, [appliedFields]);

  // 同步 local state 与 filters
  useEffect(() => {
    setLocalMin(filters.priceMin);
    setLocalMax(filters.priceMax);
    setLocalRam(filters.ram);
    setLocalSsd(filters.ssd);
  }, [filters.priceMin, filters.priceMax, filters.ram, filters.ssd]);

  return (
    <div className="fp">
      {/* Price */}
      <section className={`fp-sec ${animatePrice ? "fp-sec--pulse" : ""}`}>
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
              className={`fp-input ${priceError ? "fp-input--error" : ""}`}
              value={localMin || ""}
              onChange={(e) => setLocalMin(e.target.value)}
              onBlur={() => safeSetMin(localMin)}
              inputMode="numeric"
              placeholder={`${Math.round(minB)}`}
            />
          </div>
          <div className="fp-field">
            <div className="fp-fieldLabel">最高</div>
            <input
              className={`fp-input ${priceError ? "fp-input--error" : ""}`}
              value={localMax || ""}
              onChange={(e) => setLocalMax(e.target.value)}
              onBlur={() => safeSetMax(localMax)}
              inputMode="numeric"
              placeholder={`${Math.round(maxB)}`}
            />
          </div>
        </div>

        {/* 容错提示 */}
        {priceError && <div className="fp-errorTip">{priceError}</div>}

        {/* 快捷预算按钮 */}
        <div className="fp-quickBudgets">
          {quickBudgets.map((budget) => (
            <button
              key={budget.label}
              className={`fp-quickBtn ${selectedBudget === budget.label ? "fp-quickBtn--active" : ""}`}
              onClick={() => applyQuickBudget(budget)}
              title={`快速选择 ${fmtPrice(budget.min)} - ${fmtPrice(budget.max)}`}
            >
              {budget.label}
            </button>
          ))}
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
      <section className={`fp-sec ${animateRam ? "fp-sec--pulse" : ""}`}>
        <div>
          <div className="fp-label">统一内存（RAM）</div>
          <div className="fp-subLabel">滑动调整最低内存要求</div>
        </div>
        <GeekSlider
          type="ram"
          label=""
          value={localRam}
          onChange={(v) => {
            setLocalRam(v);
            checkSelectedMemory(v);
          }}
        />
      </section>

      {/* SSD */}
      <section className={`fp-sec ${animateSsd ? "fp-sec--pulse" : ""}`}>
        <div className="fp-label">固态硬盘（SSD）</div>
        <GeekSlider
          type="ssd"
          label=""
          value={localSsd}
          onChange={(v) => {
            setLocalSsd(v);
            checkSelectedStorage(v);
          }}
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