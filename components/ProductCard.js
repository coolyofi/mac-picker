import { motion } from 'framer-motion';

const ProductCard = ({ data }) => {
  if (!data) return null;

  const price =
    data.priceNum > 0
      ? `¥${data.priceNum.toLocaleString()}`
      : '查看价格';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="bg-[#0f0f10] border border-white/10 rounded-xl p-5"
    >
      <h3 className="text-lg font-bold mb-2">
        {data.displayTitle || 'Apple Mac'}
      </h3>

      <p className="text-xl font-black mb-4">{price}</p>

      <div className="text-xs text-gray-400 space-y-1 mb-4">
        <div>内存：{data.specs?.ram} GB</div>
        <div>存储：{data.specs?.ssd_gb} GB</div>
        <div>CPU：{data.specs?.cpu} 核</div>
        <div>GPU：{data.specs?.gpu} 核</div>
      </div>

      <a
        href={data.link}
        target="_blank"
        rel="noopener noreferrer"
        className="block text-center bg-white text-black py-2 rounded-lg font-bold"
      >
        立即购买
      </a>
    </motion.div>
  );
};

export default ProductCard;
