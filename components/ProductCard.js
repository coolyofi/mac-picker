import { motion } from 'framer-motion';

const ProductCard = ({ data }) => {
  if (!data) return null;

  const price =
    data.priceNum > 0
      ? `¥${data.priceNum.toLocaleString('zh-CN', {
          maximumFractionDigits: 0
        })}`
      : '查看价格';
  const title = data.displayTitle || 'Apple Mac';
  const isNewChip = /M[34]\b/i.test(title);
  const details = Array.isArray(data.details) ? data.details : [];
  const specLines = [
    data.specs?.cpu ? `CPU：${data.specs.cpu} 核` : null,
    data.specs?.gpu ? `GPU：${data.specs.gpu} 核` : null,
    data.specs?.screen_in ? `屏幕：${data.specs.screen_in}"` : null,
    data.modelId ? `型号：${data.modelId}` : null,
    data.specs?.has10GbE ? '10Gb 以太网：支持' : null
  ].filter(Boolean);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="product-card p-5"
    >
      <span
        className={`status-dot status-dot--corner ${
          isNewChip ? 'status-dot--blue' : ''
        }`}
      />
      <div className="card-top">
        <h3 className="card-title">{title}</h3>
        <p className="card-price">{price}</p>
      </div>

      <div className="live-indicator">
        <span
          className={`status-dot status-dot--inline ${
            isNewChip ? 'status-dot--blue' : ''
          }`}
        />
        <span className="live-text">Live</span>
      </div>

      <div className="spec-grid">
        <div className="spec-box spec-box--ram">
          <span className="spec-label">RAM</span>
          <span className="spec-value spec-mono">{data.specs?.ram} GB</span>
        </div>
        <div className="spec-box spec-box--ssd">
          <span className="spec-label">SSD</span>
          <span className="spec-value spec-mono">
            {data.specs?.ssd_gb} GB
          </span>
        </div>
      </div>

      <details className="spec-details">
        <summary>配置详情</summary>
        <div className="spec-details__body">
          {(details.length > 0 ? details : specLines).map((line, index) => (
            <p key={`${line}-${index}`}>{line}</p>
          ))}
        </div>
      </details>

      <a
        href={data.link}
        target="_blank"
        rel="noopener noreferrer"
        className="buy-button"
      >
        立即购买
      </a>
    </motion.div>
  );
};

export default ProductCard;
