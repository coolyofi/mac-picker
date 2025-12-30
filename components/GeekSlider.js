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
      <div className="flex justify-between items-end mb-4">
        <label className={`filter-tag filter-tag--${type}`}>
          {label}
        </label>
        <motion.span
          key={value}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-lg font-mono text-blue-200 font-bold"
        >
          {formatLabel(value)}
        </motion.span>
      </div>

      <input
        type="range"
        min="0"
        max={max}
        step="1"
        value={currentIndex}
        onChange={(e) => onChange(stepsArray[e.target.value])}
        className="geek-slider"
      />
    </div>
  );
};

export default GeekSlider;
