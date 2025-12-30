import { AnimatePresence, motion } from 'framer-motion';

const AnimatedCount = ({ value, className }) => {
  return (
    <span className={`count-roll ${className || ''}`}>
      <AnimatePresence mode="wait">
        <motion.span
          key={value}
          initial={{ y: 14, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -14, opacity: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="count-roll__value"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
};

export default AnimatedCount;
