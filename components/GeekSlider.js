import { motion } from 'framer-motion';

const STEPS = {
  ssd: [256, 512, 1024, 2048, 4096, 8192],
  ram: [8, 16, 24, 32, 64, 96, 128, 192]
};

const GeekSlider = ({ type, label, value, onChange }) => {
  const stepsArray = STEPS[type] || [];
  const exactIndex = stepsArray.indexOf(value);
  const fallbackIndex = stepsArray.findIndex(step => step >= value);
  const currentIndex =
    exactIndex !== -1
      ? exactIndex
      : fallbackIndex !== -1
      ? fallbackIndex
      : Math.max(stepsArray.length - 1, 0);
  const max = stepsArray.length - 1;

  const formatLabel = (val) =>
    val >= 1024 ? `${val / 1024}TB` : `${val}GB`;

  return (
    <div className="mb-10">
      <div className="slider-header">
        <label className="slider-label">{label}</label>
        <motion.span
          key={value}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className={`slider-value slider-value--${type}`}
        >
          {formatLabel(value)}
        </motion.span>
      </div>

      <div className="slider-track">
        <input
          type="range"
          min="0"
          max={max}
          step="1"
          value={currentIndex}
          onChange={(e) => onChange(stepsArray[e.target.value])}
          className="geek-slider"
        />
        <div className="slider-ticks">
          {stepsArray.map((_, index) => (
            <span
              key={`${type}-tick-${index}`}
              className={`slider-tick ${
                index <= currentIndex ? 'is-active' : ''
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default GeekSlider;
