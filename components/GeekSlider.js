import { motion } from 'framer-motion';

const STEPS = {
  ssd: [256, 512, 1024, 2048, 4096, 8192],
  ram: [8, 16, 24, 32, 36, 48, 64, 96, 128, 192]
};

const GeekSlider = ({ type, label, value, onChange }) => {
  const stepsArray = STEPS[type] || [];
  const currentIndex = stepsArray.indexOf(value);
  const max = stepsArray.length - 1;

  const formatLabel = (val) =>
    val >= 1024 ? `${val / 1024}TB` : `${val}GB`;

  return (
    <div className="mb-10">
      <div className="flex justify-between items-end mb-4">
        <label className="text-xs font-bold text-gray-400 uppercase">
          {label}
        </label>
        <motion.span
          key={value}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-lg font-mono text-blue-500 font-bold"
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
        className="w-full"
      />
    </div>
  );
};

export default GeekSlider;
