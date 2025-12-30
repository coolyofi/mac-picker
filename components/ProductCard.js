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
  const formatStorage = (value) => {
    if (!value) return '--';
    if (value >= 1024) {
      const tb = value / 1024;
      return `${Number.isInteger(tb) ? tb : tb.toFixed(1)}TB`;
    }
    return `${value}GB`;
  };
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
      className={`product-card p-5 ${isNewChip ? 'product-card--new' : ''}`}
    >
      <span
        className={`status-dot status-dot--corner ${
          isNewChip ? 'status-dot--blue' : ''
        }`}
      />
      <div className="card-top">
        <div className="card-badge-row">
          {isNewChip ? <span className="badge-new">NEW</span> : null}
          <span className="badge-chip">APPLE SILICON</span>
        </div>
        <p className="card-price">{price}</p>
      </div>

      <h3 className={`card-title ${isNewChip ? 'is-highlight' : ''}`}>
        {title}
      </h3>

      <div className="live-indicator">
        <span
          className={`status-dot status-dot--inline ${
            isNewChip ? 'status-dot--blue' : ''
          }`}
        />
        <span className="live-text">In Stock</span>
      </div>

      <div className="spec-grid spec-grid--quad">
        <div className="spec-box spec-box--ram">
          <span className="spec-label">内存</span>
          <span className="spec-value">
            {data.specs?.ram ? `${data.specs.ram}GB` : '--'}
          </span>
        </div>
        <div className="spec-box spec-box--ssd">
          <span className="spec-label">存储</span>
          <span className="spec-value">{formatStorage(data.specs?.ssd_gb)}</span>
        </div>
        <div className="spec-box">
          <span className="spec-label">CPU</span>
          <span className="spec-value">
            {data.specs?.cpu ? `${data.specs.cpu}核` : '--'}
          </span>
        </div>
        <div className="spec-box">
          <span className="spec-label">GPU</span>
          <span className="spec-value">
            {data.specs?.gpu ? `${data.specs.gpu}核` : '--'}
          </span>
        </div>
      </div>

      <details className="spec-details">
        <summary>配置详情</summary>
        <div className="spec-details__body">
          <ul>
            {(details.length > 0 ? details : specLines).map((line, index) => (
              <li key={`${line}-${index}`}>{line}</li>
            ))}
          </ul>
        </div>
      </details>

      <a
        href={data.link}
        target="_blank"
        rel="noopener noreferrer"
        className={`buy-button ${isNewChip ? 'buy-button--new' : ''}`}
      >
        APPLE STORE
      </a>
    </motion.div>
  );
};

export default ProductCard;
