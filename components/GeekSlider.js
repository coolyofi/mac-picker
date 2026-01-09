const STEPS = {
  ssd: [256, 512, 1024, 2048, 4096, 8192],
  ram: [8, 16, 24, 32, 64, 96, 128, 192],
};

function formatLabel(val) {
  const n = Number(val);
  if (!Number.isFinite(n)) return "—";
  return n >= 1024 ? `${n / 1024}${n % 1024 === 0 ? "" : ".0"}TB` : `${n}GB`;
}

export default function GeekSlider({ type, value, onChange }) {
  const stepsArray = STEPS[type] || [];
  const exactIndex = stepsArray.indexOf(value);
  const fallbackIndex = stepsArray.findIndex((step) => step >= value);

  const currentIndex =
    exactIndex !== -1
      ? exactIndex
      : fallbackIndex !== -1
      ? fallbackIndex
      : Math.max(stepsArray.length - 1, 0);

  const max = Math.max(stepsArray.length - 1, 0);

  return (
    <div className="slider">
      <div className="slider__top">
        <div className={`slider__value slider__value--${type}`}>
          {formatLabel(value)}
        </div>
      </div>

      <div className="slider__track">
        <div className="slider__background" />
        <div className="slider__progress" style={{ width: `${(currentIndex / max) * 100}%` }} />

        <div
          className="slider__handle"
          style={{
            left: `calc(${(currentIndex / max) * 100}% - 9px)`,
          }}
        />

        <input
          className="geekRange"
          type="range"
          min="0"
          max={max}
          step="1"
          value={currentIndex}
          onChange={(e) => {
            const newValue = stepsArray[Number(e.target.value)];
            onChange(newValue);
          }}
          aria-label={`${type}-slider`}
        />

        <div className="ticks" aria-hidden="true">
          {stepsArray.map((step, idx) => (
            <span
              key={`${type}-tick-${idx}`}
              className={`tick ${idx <= currentIndex ? "isActive" : ""}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}