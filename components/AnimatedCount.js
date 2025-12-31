import { AnimatePresence, motion } from 'framer-motion';
import { useMemo } from 'react';

/**
 * AnimatedCount Component
 * 
 * 支持多种动画效果的计数器组件，带格式化和性能优化
 * 
 * @param {number} value - 要显示的数值
 * @param {string} className - 额外的 CSS 类名
 * @param {string} variant - 动画效果变体: 'flip' | 'slide' | 'fade' | 'bounce'
 * @param {function} format - 格式化函数，用于自定义数字显示
 * @param {number} duration - 动画持续时间（秒），默认 0.18
 * @param {boolean} monospace - 是否使用等宽字体，默认 true
 */
const AnimatedCount = ({ 
  value, 
  className = '',
  variant = 'flip',
  format,
  duration = 0.18,
  monospace = true
}) => {
  // 格式化显示的值
  const displayValue = useMemo(() => {
    if (format && typeof format === 'function') {
      return format(value);
    }
    return String(value);
  }, [value, format]);

  // 动画变体配置
  const animationVariants = {
    flip: {
      initial: { rotateX: -90, opacity: 0 },
      animate: { rotateX: 0, opacity: 1 },
      exit: { rotateX: 90, opacity: 0 },
      transition: { 
        duration,
        ease: 'easeOut',
        rotateX: { duration: duration * 0.8 }
      }
    },
    slide: {
      initial: { y: 14, opacity: 0 },
      animate: { y: 0, opacity: 1 },
      exit: { y: -14, opacity: 0 },
      transition: { duration, ease: 'easeOut' }
    },
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: duration * 0.6, ease: 'linear' }
    },
    bounce: {
      initial: { scale: 0.5, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      exit: { scale: 0.5, opacity: 0 },
      transition: { 
        duration,
        ease: 'backOut'
      }
    }
  };

  const config = animationVariants[variant] || animationVariants.flip;

  return (
    <span 
      className={`count-roll count-roll--${variant} ${monospace ? 'count-roll--monospace' : ''} ${className}`}
      style={{
        perspective: '1000px'
      }}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={displayValue}
          initial={config.initial}
          animate={config.animate}
          exit={config.exit}
          transition={config.transition}
          className="count-roll__value"
          style={{
            display: 'inline-block',
            transformStyle: variant === 'flip' ? 'preserve-3d' : 'flat'
          }}
        >
          {displayValue}
        </motion.span>
      </AnimatePresence>
    </span>
  );
};

export default AnimatedCount;
